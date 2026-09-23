import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SidebarProvider, useSidebar } from "@semoss/ui/next";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { SidebarAgentsList } from "./sidebar-agents-list";

const { insightActions, insightRun } = vi.hoisted(() => {
	const run = vi.fn();
	return { insightActions: { run }, insightRun: run };
});

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: insightActions }),
}));

function pixelResponse(output: unknown) {
	return {
		pixelReturn: [{ output, operationType: [] }],
	};
}

const researchAgent: Agent = {
	id: "research-agent",
	name: "Research agent",
	description: "Analyst",
	instructions: "Research the requested topic.",
	skills: [],
	mcp: [],
	members: [],
};

const writingAgent: Agent = {
	...researchAgent,
	id: "writing-agent",
	name: "Writing agent",
	description: "Editor",
};

function room(
	index: number,
	agentId = researchAgent.id,
	overrides: Partial<Session> = {},
): Session {
	return {
		id: `room-${index}`,
		agentId,
		modelId: index === 1 ? "model-2" : undefined,
		title: `Room ${index}`,
		origin: "You",
		status: index === 2 ? "In progress" : "Ready",
		updatedAt: new Date(Date.UTC(2026, 8, 22, 20 - index)).toISOString(),
		unread: index === 3,
		pinned: false,
		preview: index === 1 ? "Latest room preview" : "",
		...overrides,
	};
}

function SidebarState() {
	const { isMobile, openMobile, setOpenMobile, state } = useSidebar();
	return (
		<>
			<output aria-label="Workspace sidebar state">{state}</output>
			<output aria-label="Mobile sidebar state">
				{isMobile ? "mobile" : "desktop"}:
				{openMobile ? "open" : "closed"}
			</output>
			<button type="button" onClick={() => setOpenMobile(true)}>
				Open mobile drawer
			</button>
		</>
	);
}

function LocationState() {
	const location = useLocation();
	return (
		<output aria-label="Current location">
			{location.pathname + location.search}
		</output>
	);
}

function renderSidebar({
	sessions,
	agents = [researchAgent, writingAgent],
	activeAgentId,
	activeRoomId,
	isLoading,
	defaultOpen = true,
	onNewSession = vi.fn(),
	onRoomRename = vi.fn().mockResolvedValue(undefined),
	onRoomDelete = vi.fn().mockResolvedValue(undefined),
	onRoomVisited = vi.fn(),
}: {
	sessions: Session[];
	agents?: Agent[];
	activeAgentId?: string;
	activeRoomId?: string;
	isLoading?: boolean;
	defaultOpen?: boolean;
	onNewSession?: (agentId?: string) => void;
	onRoomRename?: (roomId: string, name: string) => Promise<void>;
	onRoomDelete?: (roomId: string) => Promise<void>;
	onRoomVisited?: (roomId: string) => void;
}) {
	return render(
		<MemoryRouter
			initialEntries={[
				activeRoomId ? `/room/${activeRoomId}` : "/agents",
			]}
		>
			<SidebarProvider defaultOpen={defaultOpen}>
				<SidebarState />
				<LocationState />
				<SidebarAgentsList
					agents={agents}
					sessions={sessions}
					activeAgentId={activeAgentId}
					activeRoomId={activeRoomId}
					isLoading={isLoading}
					onNewSession={onNewSession}
					onRoomRename={onRoomRename}
					onRoomDelete={onRoomDelete}
					onRoomVisited={onRoomVisited}
				/>
			</SidebarProvider>
		</MemoryRouter>,
	);
}

describe("SidebarAgentsList", () => {
	beforeEach(() => {
		insightRun.mockReset();
		insightRun.mockResolvedValue(pixelResponse([]));
	});

	beforeAll(() => {
		vi.stubGlobal("matchMedia", (media: string) => ({
			media,
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));
	});

	afterAll(() => vi.unstubAllGlobals());
	afterEach(() => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1024,
		});
	});

	it("shows useful loading and empty states", () => {
		const { unmount } = renderSidebar({
			agents: [],
			sessions: [],
			isLoading: true,
		});
		expect(screen.getByText("Loading agents")).toBeVisible();
		expect(screen.getByText("Loading rooms")).toBeVisible();

		unmount();
		renderSidebar({ agents: [], sessions: [] });
		expect(screen.getByText("No agents yet")).toBeVisible();
		expect(screen.getByText("No recent rooms")).toBeVisible();
	});

	it("does not show a new-session action beside the agents group", () => {
		renderSidebar({ sessions: [] });

		expect(
			screen.queryByRole("button", { name: "New session" }),
		).not.toBeInTheDocument();
	});

	it("opens a new session for an agent from its actions menu", async () => {
		const user = userEvent.setup();
		const onNewSession = vi.fn();
		renderSidebar({ sessions: [], onNewSession });
		const trigger = screen.getByRole("button", {
			name: "Actions for Research agent",
		});

		await user.click(trigger);
		expect(
			screen.getByRole("menuitem", { name: "New session" }),
		).toBeVisible();

		await user.keyboard("{Escape}");
		expect(trigger).toHaveFocus();

		await user.click(trigger);
		await user.click(screen.getByRole("menuitem", { name: "New session" }));

		expect(onNewSession).toHaveBeenCalledOnce();
		expect(onNewSession).toHaveBeenCalledWith(researchAgent.id);
		expect(
			screen.getByRole("status", { name: "Current location" }),
		).toHaveTextContent("/agents");
	});

	it("renders an agent tree and reveals rooms in five-room increments", async () => {
		const user = userEvent.setup();
		renderSidebar({
			sessions: Array.from({ length: 7 }, (_, index) => room(index + 1)),
		});

		const tree = screen.getByRole("tree", { name: "Your agents" });
		const researchAgentItem = within(tree).getByRole("treeitem", {
			name: "Research agent",
		});
		expect(researchAgentItem).toHaveAttribute("aria-expanded", "true");
		expect(
			within(tree).getByRole("treeitem", { name: "Writing agent" }),
		).not.toHaveAttribute("aria-expanded");
		expect(tree).not.toHaveTextContent(researchAgent.description);
		expect(
			within(researchAgentItem).getAllByRole("treeitem", {
				name: /Room \d+/,
			}),
		).toHaveLength(5);

		await user.click(
			within(researchAgentItem).getByRole("button", {
				name: "Show 5 more",
			}),
		);
		expect(
			within(researchAgentItem).getAllByRole("treeitem", {
				name: /Room \d+/,
			}),
		).toHaveLength(7);

		await user.click(
			within(researchAgentItem).getByRole("button", {
				name: "Show less",
			}),
		);
		expect(
			within(researchAgentItem).getAllByRole("treeitem", {
				name: /Room \d+/,
			}),
		).toHaveLength(5);

		await user.click(
			within(researchAgentItem).getByRole("button", { name: "Collapse" }),
		);
		expect(researchAgentItem).toHaveAttribute("aria-expanded", "false");
		expect(
			within(researchAgentItem).queryByRole("treeitem", {
				name: /Room \d+/,
			}),
		).toBeNull();
	});

	it("shows prioritized room statuses as leading icons with tooltips", async () => {
		const user = userEvent.setup();
		renderSidebar({
			sessions: [
				room(1, researchAgent.id, {
					status: "Ready",
					unread: false,
				}),
				room(2, researchAgent.id, {
					status: "Ready",
					unread: true,
				}),
				room(3, researchAgent.id, {
					status: "In progress",
					unread: true,
				}),
				room(4, researchAgent.id, {
					status: "Your review",
					unread: true,
				}),
				room(5, researchAgent.id, {
					status: "Stopped",
					unread: true,
				}),
			],
		});

		const cases = [
			{ roomName: "Room 2", label: "Unread", className: "text-primary" },
			{ roomName: "Room 3", label: "Working", className: "text-primary" },
			{
				roomName: "Room 4",
				label: "Needs your review",
				className: "text-warning",
			},
			{
				roomName: "Room 5",
				label: "Error",
				className: "text-destructive",
			},
		] as const;

		for (const item of cases) {
			const roomItem = screen.getByRole("treeitem", {
				name: item.roomName,
			});
			const statusTrigger = within(roomItem).getByRole("button", {
				name: item.label,
			});
			expect(statusTrigger).toHaveClass(item.className);

			await user.hover(statusTrigger);
			expect(await screen.findByRole("tooltip")).toHaveTextContent(
				item.label,
			);
			await user.unhover(statusTrigger);
			await waitFor(() =>
				expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
			);
		}
		expect(
			within(
				screen.getByRole("treeitem", { name: "Room 1" }),
			).queryByRole("button", { name: "Ready" }),
		).not.toBeInTheDocument();

		for (const roomName of ["Room 3", "Room 4", "Room 5"]) {
			expect(
				within(
					screen.getByRole("treeitem", { name: roomName }),
				).queryByRole("button", { name: "Unread" }),
			).not.toBeInTheDocument();
		}

		const unreadTrigger = within(
			screen.getByRole("treeitem", { name: "Room 2" }),
		).getByRole("button", { name: "Unread" });
		act(() => unreadTrigger.focus());
		expect(unreadTrigger).toHaveFocus();
		expect(await screen.findByRole("tooltip")).toHaveTextContent("Unread");
		act(() => unreadTrigger.blur());
		await waitFor(() =>
			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
		);

		expect(
			screen.getByRole("tree", { name: "Your agents" }),
		).not.toHaveTextContent(
			/Ready|Working|Needs your review|Unread|Stopped|Error/,
		);
	});

	it("moves the last message and timestamp into a right-side hover card", async () => {
		const user = userEvent.setup();
		renderSidebar({ sessions: [room(1)] });

		const tree = screen.getByRole("tree", { name: "Your agents" });
		const roomItem = within(tree).getByRole("treeitem", { name: "Room 1" });
		expect(within(tree).queryByText("Latest room preview")).toBeNull();
		expect(tree.querySelector("time")).toBeNull();

		await user.hover(within(roomItem).getByText("Room 1"));

		const preview = await screen.findByText("Latest room preview");
		const hoverCard = preview.closest('[data-slot="hover-card-content"]');
		expect(hoverCard).toHaveAttribute("data-side", "right");
		expect(hoverCard?.querySelector("time")).toHaveAttribute(
			"datetime",
			room(1).updatedAt,
		);

		await user.unhover(within(roomItem).getByText("Room 1"));
		await waitFor(() => expect(preview).not.toBeInTheDocument());
	});

	it("keeps a deep active room visible without marking its agent active", () => {
		renderSidebar({
			sessions: Array.from({ length: 7 }, (_, index) => room(index + 1)),
			activeRoomId: "room-7",
		});

		const researchAgentItem = screen.getByRole("treeitem", {
			name: "Research agent",
		});
		expect(
			within(researchAgentItem).getAllByRole("treeitem", {
				name: /Room \d+/,
			}),
		).toHaveLength(7);
		expect(
			within(researchAgentItem).getByRole("treeitem", { name: "Room 7" }),
		).toHaveAttribute("aria-current", "page");
		expect(researchAgentItem.className).not.toContain(
			"[&>div]:bg-sidebar-accent",
		);
	});

	it("shows 20 unassigned rooms at a time in Recent", async () => {
		const user = userEvent.setup();
		const sessions = [
			room(0, researchAgent.id, { title: "Agent room" }),
			...Array.from({ length: 45 }, (_, index) => room(index + 1, "")),
		];
		renderSidebar({ sessions });

		const recent = screen.getByRole("list", { name: "Recent rooms" });
		const recentLinks = () => within(recent).getAllByRole("link");
		expect(recentLinks()).toHaveLength(20);
		expect(recentLinks()[0]).toHaveAttribute("href", "/room/room-1");
		expect(recentLinks()[0]).toHaveTextContent("Room 1");
		expect(recent).not.toHaveTextContent("Agent room");
		expect(recent).not.toHaveTextContent("Research agent");
		expect(recent).not.toHaveTextContent("Writing agent");
		expect(recent).not.toHaveTextContent("Latest room preview");
		expect(recent).not.toHaveTextContent("Ready");
		expect(within(recent).queryByText("Room 21")).toBeNull();

		await user.click(
			screen.getByRole("button", { name: "Load more rooms" }),
		);
		expect(recentLinks()).toHaveLength(40);
		expect(within(recent).getByText("Room 40")).toBeVisible();
		expect(within(recent).queryByText("Room 41")).toBeNull();

		await user.click(
			screen.getByRole("button", { name: "Load more rooms" }),
		);
		expect(recentLinks()).toHaveLength(45);
		expect(within(recent).getByText("Room 45")).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: "Show fewer rooms" }),
		);
		expect(recentLinks()).toHaveLength(20);
	});

	it("shows display-based room action popovers without visiting rooms", async () => {
		const user = userEvent.setup();
		const onRoomVisited = vi.fn();
		renderSidebar({
			sessions: [room(1), room(2, "")],
			onRoomVisited,
		});

		const agentTrigger = within(
			screen.getByRole("treeitem", { name: "Room 1" }),
		).getByRole("button", { name: "Actions for Room 1" });
		const recentTrigger = within(
			screen.getByRole("list", { name: "Recent rooms" }),
		).getByRole("button", { name: "Actions for Room 2" });
		expect(agentTrigger).toBeInTheDocument();
		expect(recentTrigger).toBeInTheDocument();

		const visibilityWrapper = agentTrigger.closest("div.hidden");
		expect(visibilityWrapper).toHaveClass("group-hover/room:block");
		expect(visibilityWrapper?.className).not.toContain("opacity");

		await user.hover(agentTrigger);
		const actionsTooltip = await screen.findByRole("tooltip");
		expect(actionsTooltip).toHaveTextContent("Room actions");
		await user.unhover(agentTrigger);
		await waitFor(() => expect(actionsTooltip).not.toBeInTheDocument());

		await user.click(agentTrigger);
		expect(visibilityWrapper).toHaveClass("block");
		expect(visibilityWrapper?.className).not.toContain(
			"has-data-[state=open]",
		);
		const renameAction = screen.getByRole("button", { name: "Rename" });
		const deleteAction = screen.getByRole("button", { name: "Delete" });
		expect(renameAction).toHaveClass("w-full");
		expect(deleteAction).toHaveClass("w-full");
		expect(onRoomVisited).not.toHaveBeenCalled();

		await user.click(screen.getByText("Recent"));
		await waitFor(() =>
			expect(
				screen.queryByRole("button", { name: "Rename" }),
			).not.toBeInTheDocument(),
		);
		expect(onRoomVisited).not.toHaveBeenCalled();

		await user.click(agentTrigger);
		await user.keyboard("{Escape}");
		await waitFor(() => expect(agentTrigger).toHaveFocus());
		expect(onRoomVisited).not.toHaveBeenCalled();
	});

	it("renames a room with validation, retryable errors, and focus return", async () => {
		const user = userEvent.setup();
		const onRoomRename = vi
			.fn()
			.mockRejectedValueOnce(new Error("Rename unavailable"))
			.mockResolvedValueOnce(undefined);
		renderSidebar({ sessions: [room(1)], onRoomRename });
		const trigger = screen.getByRole("button", {
			name: "Actions for Room 1",
		});

		await user.click(trigger);
		await user.click(screen.getByRole("button", { name: "Rename" }));
		const dialog = screen.getByRole("dialog", { name: "Rename room" });
		const input = within(dialog).getByRole("textbox", {
			name: "Room name",
		});
		expect(input).toHaveValue("Room 1");

		await user.clear(input);
		await user.click(
			within(dialog).getByRole("button", { name: "Rename" }),
		);
		expect(
			await within(dialog).findByText("Room name is required."),
		).toBeVisible();
		expect(onRoomRename).not.toHaveBeenCalled();

		await user.type(input, "  Updated room  ");
		await user.click(
			within(dialog).getByRole("button", { name: "Rename" }),
		);
		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Rename unavailable",
		);
		expect(input).toHaveValue("  Updated room  ");

		await user.click(
			within(dialog).getByRole("button", { name: "Rename" }),
		);
		await waitFor(() =>
			expect(onRoomRename).toHaveBeenLastCalledWith(
				"room-1",
				"Updated room",
			),
		);
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", { name: "Rename room" }),
			).not.toBeInTheDocument(),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it("confirms room deletion and retains failures for retry", async () => {
		const user = userEvent.setup();
		const onRoomDelete = vi
			.fn()
			.mockRejectedValueOnce(new Error("Delete unavailable"))
			.mockResolvedValueOnce(undefined);
		renderSidebar({ sessions: [room(1)], onRoomDelete });
		const trigger = screen.getByRole("button", {
			name: "Actions for Room 1",
		});

		await user.click(trigger);
		await user.click(screen.getByRole("button", { name: "Delete" }));
		const dialog = screen.getByRole("dialog", { name: "Delete room" });
		expect(dialog).toHaveTextContent("Delete “Room 1”?");

		await user.click(
			within(dialog).getByRole("button", { name: "Delete" }),
		);
		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Delete unavailable",
		);
		expect(onRoomDelete).toHaveBeenCalledWith("room-1");

		await user.click(
			within(dialog).getByRole("button", { name: "Delete" }),
		);
		await waitFor(() => expect(onRoomDelete).toHaveBeenCalledTimes(2));
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", { name: "Delete room" }),
			).not.toBeInTheDocument(),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it("cancels room deletion without mutating the room", async () => {
		const user = userEvent.setup();
		const onRoomDelete = vi.fn().mockResolvedValue(undefined);
		renderSidebar({ sessions: [room(1)], onRoomDelete });
		const trigger = screen.getByRole("button", {
			name: "Actions for Room 1",
		});

		await user.click(trigger);
		await user.click(screen.getByRole("button", { name: "Delete" }));
		const dialog = screen.getByRole("dialog", { name: "Delete room" });
		await user.click(
			within(dialog).getByRole("button", { name: "Cancel" }),
		);

		expect(onRoomDelete).not.toHaveBeenCalled();
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it("opens one centered palette with routes without preloading rooms", async () => {
		const user = userEvent.setup();
		renderSidebar({
			sessions: Array.from({ length: 12 }, (_, index) =>
				room(
					index + 1,
					index % 2 === 0 ? researchAgent.id : writingAgent.id,
					{
						status: "Ready",
						unread: false,
						preview: index === 0 ? "Latest room preview" : "",
					},
				),
			),
		});

		const searchTrigger = screen.getByRole("button", {
			name: "Search routes and rooms",
		});
		await user.click(searchTrigger);

		let dialog = screen.getByRole("dialog", {
			name: "Search",
		});
		const routeGroup = within(dialog).getByRole("group", {
			name: "Routes",
		});
		expect(
			within(routeGroup)
				.getAllByRole("option")
				.map((option) => option.textContent),
		).toEqual([
			"Home · Open the workspace home page",
			"New Room · Start a new room",
			"Agents · Browse all agents",
			"New Agent · Create an agent",
			"Settings · Open workspace settings",
		]);
		expect(
			within(dialog).queryByRole("group", { name: "Rooms" }),
		).toBeNull();
		expect(insightRun).not.toHaveBeenCalled();

		await user.keyboard("{Escape}");
		expect(dialog).not.toBeInTheDocument();
		await waitFor(() => expect(searchTrigger).toHaveFocus());

		await user.keyboard("{Enter}");
		dialog = screen.getByRole("dialog", {
			name: "Search",
		});
		expect(
			within(dialog).getByRole("combobox", {
				name: "Search routes and rooms",
			}),
		).toHaveFocus();
	});

	it("filters routes locally and opens backend content matches", async () => {
		const user = userEvent.setup();
		insightRun.mockResolvedValue(
			pixelResponse([
				{
					room_id: "backend-room",
					room_name: "Quarterly planning",
					date_created: "2026-09-22T10:00:00Z",
				},
			]),
		);
		renderSidebar({
			sessions: [
				room(1, writingAgent.id, {
					title: "Quarterly planning",
					preview: "Buried launch notes",
					status: "In progress",
				}),
			],
		});

		const searchTrigger = screen.getByRole("button", {
			name: "Search routes and rooms",
		});
		await user.click(searchTrigger);
		let dialog = screen.getByRole("dialog", {
			name: "Search",
		});
		const input = within(dialog).getByRole("combobox", {
			name: "Search routes and rooms",
		});
		await user.type(input, "create an agent");
		await user.keyboard("{Enter}");
		expect(
			screen.getByRole("status", { name: "Current location" }),
		).toHaveTextContent("/agents/new");
		expect(
			screen.queryByRole("dialog", {
				name: "Search",
			}),
		).not.toBeInTheDocument();

		await user.click(searchTrigger);
		dialog = screen.getByRole("dialog", {
			name: "Search",
		});
		const resetInput = within(dialog).getByRole("combobox", {
			name: "Search routes and rooms",
		});
		expect(resetInput).toHaveValue("");

		await user.type(resetInput, "Buried launch");
		expect(
			await within(dialog).findByText("Quarterly planning"),
		).toBeVisible();
		await user.click(within(dialog).getByText("Quarterly planning"));
		expect(
			screen.getByRole("status", { name: "Current location" }),
		).toHaveTextContent("/room/backend-room");
		expect(
			insightRun.mock.calls.every(([statement]) =>
				String(statement).includes("SearchRoomMessages"),
			),
		).toBe(true);
		expect(
			insightRun.mock.calls.some(([statement]) =>
				/GetPlaygroundRooms|GetPlaygroundMessages/.test(
					String(statement),
				),
			),
		).toBe(false);

		insightRun.mockResolvedValue(pixelResponse([]));
		await user.click(searchTrigger);
		dialog = screen.getByRole("dialog", {
			name: "Search",
		});
		const emptyInput = within(dialog).getByRole("combobox", {
			name: "Search routes and rooms",
		});
		expect(emptyInput).toHaveValue("");
		await user.type(emptyInput, "missing destination");
		expect(
			await within(dialog).findByText("No routes or rooms found."),
		).toBeVisible();
	});

	it("shows backend loading and empty states without hiding routes", async () => {
		const user = userEvent.setup();
		let resolveSearch: ((value: unknown) => void) | undefined;
		insightRun.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveSearch = resolve;
			}),
		);
		renderSidebar({
			sessions: [],
		});

		await user.click(
			screen.getByRole("button", { name: "Search routes and rooms" }),
		);
		const dialog = screen.getByRole("dialog", {
			name: "Search",
		});
		expect(
			within(dialog).getByRole("group", { name: "Routes" }),
		).toBeVisible();
		expect(insightRun).not.toHaveBeenCalled();

		await user.type(
			within(dialog).getByRole("combobox", {
				name: "Search routes and rooms",
			}),
			"missing destination",
		);
		expect(
			await within(dialog).findByText("Searching room content…"),
		).toBeVisible();
		await act(async () => {
			resolveSearch?.(pixelResponse([]));
		});
		expect(
			await within(dialog).findByText("No routes or rooms found."),
		).toBeVisible();
	});

	it("retries failed content searches", async () => {
		const user = userEvent.setup();
		insightRun
			.mockRejectedValueOnce(new Error("Search unavailable"))
			.mockResolvedValueOnce(pixelResponse([]));
		renderSidebar({ sessions: [] });

		await user.click(
			screen.getByRole("button", { name: "Search routes and rooms" }),
		);
		const dialog = screen.getByRole("dialog", { name: "Search" });
		await user.type(
			within(dialog).getByRole("combobox", {
				name: "Search routes and rooms",
			}),
			"failed content",
		);
		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Could not search room content.",
		);

		await user.click(
			within(dialog).getByRole("button", { name: "Try again" }),
		);
		expect(
			await within(dialog).findByText("No routes or rooms found."),
		).toBeVisible();
		expect(insightRun).toHaveBeenCalledTimes(2);
	});

	it("ignores a stale content-search response", async () => {
		const user = userEvent.setup();
		let resolveFirst: ((value: unknown) => void) | undefined;
		let resolveSecond: ((value: unknown) => void) | undefined;
		insightRun
			.mockReturnValueOnce(
				new Promise((resolve) => {
					resolveFirst = resolve;
				}),
			)
			.mockReturnValueOnce(
				new Promise((resolve) => {
					resolveSecond = resolve;
				}),
			);
		renderSidebar({ sessions: [] });

		await user.click(
			screen.getByRole("button", { name: "Search routes and rooms" }),
		);
		const dialog = screen.getByRole("dialog", { name: "Search" });
		const input = within(dialog).getByRole("combobox", {
			name: "Search routes and rooms",
		});
		await user.type(input, "first query");
		await waitFor(() => expect(insightRun).toHaveBeenCalledTimes(1));
		await user.clear(input);
		await user.type(input, "second query");
		await waitFor(() => expect(insightRun).toHaveBeenCalledTimes(2));

		await act(async () => {
			resolveSecond?.(
				pixelResponse([
					{
						room_id: "second-room",
						room_name: "Second result",
						date_created: "2026-09-22T10:00:00Z",
					},
				]),
			);
		});
		expect(await within(dialog).findByText("Second result")).toBeVisible();

		await act(async () => {
			resolveFirst?.(
				pixelResponse([
					{
						room_id: "first-room",
						room_name: "Stale result",
						date_created: "2026-09-21T10:00:00Z",
					},
				]),
			);
		});
		expect(within(dialog).queryByText("Stale result")).toBeNull();
		expect(within(dialog).getByText("Second result")).toBeVisible();
	});

	it("keeps only the search action visible in the collapsed rail", async () => {
		const user = userEvent.setup();
		renderSidebar({ sessions: [room(1)], defaultOpen: false });

		expect(screen.queryByRole("tree", { name: "Your agents" })).toBeNull();
		expect(screen.queryByText("Recent")).toBeNull();
		const searchTrigger = screen.getByRole("button", {
			name: "Search routes and rooms",
		});

		await user.hover(searchTrigger);
		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"Search routes and rooms",
		);
		await user.unhover(searchTrigger);
		await waitFor(() =>
			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
		);

		act(() => searchTrigger.focus());
		await user.keyboard("{Enter}");
		expect(
			screen.getByRole("dialog", {
				name: "Search",
			}),
		).toBeVisible();
		await user.keyboard("{Escape}");
		await waitFor(() => expect(searchTrigger).toHaveFocus());
		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"Search routes and rooms",
		);
		act(() => searchTrigger.blur());
		await waitFor(() =>
			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
		);
	});

	it("visits a room without collapsing the desktop sidebar", async () => {
		const user = userEvent.setup();
		const onRoomVisited = vi.fn();
		renderSidebar({
			sessions: [room(1)],
			activeAgentId: researchAgent.id,
			onRoomVisited,
		});

		const roomItem = screen.getByRole("treeitem", { name: "Room 1" });
		await user.click(
			within(roomItem).getByRole("button", { name: "Room 1" }),
		);

		expect(onRoomVisited).toHaveBeenCalledWith("room-1");
		expect(
			screen.getByRole("status", { name: "Workspace sidebar state" }),
		).toHaveTextContent("expanded");
	});

	it("closes only the mobile drawer after a room is selected", async () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 360,
		});
		const user = userEvent.setup();
		renderSidebar({
			sessions: [room(1)],
			activeAgentId: researchAgent.id,
		});
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Mobile sidebar state" }),
			).toHaveTextContent("mobile:closed"),
		);

		await user.click(
			screen.getByRole("button", { name: "Open mobile drawer" }),
		);
		expect(
			screen.getByRole("status", { name: "Mobile sidebar state" }),
		).toHaveTextContent("mobile:open");
		const roomItem = screen.getByRole("treeitem", { name: "Room 1" });
		await user.click(
			within(roomItem).getByRole("button", { name: "Room 1" }),
		);
		expect(
			screen.getByRole("status", { name: "Mobile sidebar state" }),
		).toHaveTextContent("mobile:closed");
	});

	it("closes the mobile drawer after palette route and room selections", async () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 360,
		});
		const user = userEvent.setup();
		insightRun.mockResolvedValue(
			pixelResponse([
				{
					room_id: "room-1",
					room_name: "Room 1",
					date_created: "2026-09-22T10:00:00Z",
				},
			]),
		);
		renderSidebar({
			sessions: [room(1)],
		});
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Mobile sidebar state" }),
			).toHaveTextContent("mobile:closed"),
		);

		await user.click(
			screen.getByRole("button", { name: "Open mobile drawer" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Search routes and rooms" }),
		);
		let dialog = screen.getByRole("dialog", {
			name: "Search",
		});
		await user.click(within(dialog).getByText("New Room"));
		expect(
			screen.getByRole("status", { name: "Current location" }),
		).toHaveTextContent("/new");
		expect(
			screen.getByRole("status", { name: "Mobile sidebar state" }),
		).toHaveTextContent("mobile:closed");

		await user.click(
			screen.getByRole("button", { name: "Open mobile drawer" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Search routes and rooms" }),
		);
		dialog = screen.getByRole("dialog", {
			name: "Search",
		});
		await user.type(
			within(dialog).getByRole("combobox", {
				name: "Search routes and rooms",
			}),
			"matching content",
		);
		await user.click(await within(dialog).findByText("Room 1"));
		expect(
			screen.getByRole("status", { name: "Current location" }),
		).toHaveTextContent("/room/room-1");
		expect(
			screen.getByRole("status", { name: "Mobile sidebar state" }),
		).toHaveTextContent("mobile:closed");
	});
});
