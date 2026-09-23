import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SidebarProvider, useSidebar } from "@semoss/ui/next";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { SidebarAgentsList } from "./sidebar-agents-list";

const researchAgent: Agent = {
	id: "research-agent",
	name: "Research agent",
	description: "Analyst",
	icon: "compass",
	tone: "blue",
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
	icon: "pen",
	tone: "amber",
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
		thread: [],
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
	onAgentVisited = vi.fn(),
	onRoomVisited = vi.fn(),
}: {
	sessions: Session[];
	agents?: Agent[];
	activeAgentId?: string;
	activeRoomId?: string;
	isLoading?: boolean;
	defaultOpen?: boolean;
	onNewSession?: (agentId?: string) => void;
	onAgentVisited?: (agentId: string) => void;
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
					onAgentVisited={onAgentVisited}
					onRoomVisited={onRoomVisited}
				/>
			</SidebarProvider>
		</MemoryRouter>,
	);
}

describe("SidebarAgentsList", () => {
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

	it("opens an unscoped new session from the agents group action", async () => {
		const user = userEvent.setup();
		const onNewSession = vi.fn();
		renderSidebar({ sessions: [], onNewSession });

		await user.click(screen.getByRole("button", { name: "New session" }));

		expect(onNewSession).toHaveBeenCalledOnce();
		expect(onNewSession).toHaveBeenCalledWith();
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

	it("opens one centered palette with notifications, agents, and ready rooms", async () => {
		const user = userEvent.setup();
		renderSidebar({
			sessions: [
				room(1, researchAgent.id, {
					title: "Stopped room",
					status: "Stopped",
					unread: true,
				}),
				room(2, researchAgent.id, {
					title: "Review room",
					status: "Your review",
					unread: true,
				}),
				room(3, writingAgent.id, {
					title: "Working room",
					status: "In progress",
					unread: true,
				}),
				room(4, writingAgent.id, {
					title: "Unread room",
					status: "Ready",
					unread: true,
				}),
				room(5, researchAgent.id, {
					title: "Ready room",
					status: "Ready",
					unread: false,
				}),
			],
		});

		const searchTrigger = screen.getByRole("button", {
			name: "Search rooms and agents",
		});
		await user.click(searchTrigger);

		let dialog = screen.getByRole("dialog", {
			name: "Search rooms and agents",
		});
		expect(within(dialog).getByText("Notifications")).toBeVisible();
		expect(within(dialog).getByText("Agents")).toBeVisible();
		expect(within(dialog).getByText("Recent rooms")).toBeVisible();
		const notificationGroup = within(dialog).getByRole("group", {
			name: "Notifications",
		});
		expect(
			within(notificationGroup)
				.getAllByRole("option")
				.map((option) => option.textContent),
		).toEqual([
			"Stopped roomResearch agentError",
			"Review roomResearch agentNeeds your review",
			"Working roomWriting agentWorking",
			"Unread roomWriting agentUnread",
		]);
		for (const label of [
			"Error",
			"Needs your review",
			"Working",
			"Unread",
		]) {
			expect(within(dialog).getByText(label)).toBeVisible();
		}
		const readyItem = within(dialog)
			.getByText("Ready room")
			.closest('[data-slot="command-item"]');
		expect(readyItem).not.toBeNull();
		expect(readyItem?.querySelector("svg")).toBeNull();

		await user.keyboard("{Escape}");
		expect(dialog).not.toBeInTheDocument();
		await waitFor(() => expect(searchTrigger).toHaveFocus());

		await user.keyboard("{Enter}");
		dialog = screen.getByRole("dialog", {
			name: "Search rooms and agents",
		});
		expect(
			within(dialog).getByRole("combobox", {
				name: "Search rooms and agents",
			}),
		).toHaveFocus();
	});

	it("shows palette loading and no-results states without an Agents group", async () => {
		const user = userEvent.setup();
		const loadingView = renderSidebar({
			agents: [],
			sessions: [],
			isLoading: true,
		});

		await user.click(
			screen.getByRole("button", { name: "Search rooms and agents" }),
		);
		let dialog = screen.getByRole("dialog", {
			name: "Search rooms and agents",
		});
		expect(
			within(dialog).getByText("Loading rooms and agents…"),
		).toBeVisible();
		expect(
			within(dialog).queryByRole("group", { name: "Agents" }),
		).toBeNull();

		loadingView.unmount();
		renderSidebar({ agents: [], sessions: [] });
		await user.click(
			screen.getByRole("button", { name: "Search rooms and agents" }),
		);
		dialog = screen.getByRole("dialog", {
			name: "Search rooms and agents",
		});
		expect(
			within(dialog).getByText("No rooms or agents found."),
		).toBeVisible();
	});

	it("searches every room and resets after agent and room selection", async () => {
		const user = userEvent.setup();
		const onAgentVisited = vi.fn();
		const onRoomVisited = vi.fn();
		const sessions = Array.from({ length: 12 }, (_, index) =>
			room(index + 1, researchAgent.id, {
				status: "Ready",
				unread: false,
				preview: index === 11 ? "Buried launch notes" : "",
			}),
		);
		renderSidebar({ sessions, onAgentVisited, onRoomVisited });

		const searchTrigger = screen.getByRole("button", {
			name: "Search rooms and agents",
		});
		await user.click(searchTrigger);
		let dialog = screen.getByRole("dialog", {
			name: "Search rooms and agents",
		});
		expect(
			within(
				within(dialog).getByRole("group", { name: "Recent rooms" }),
			).getAllByRole("option"),
		).toHaveLength(10);
		expect(within(dialog).queryByText("Room 12")).not.toBeInTheDocument();

		const input = within(dialog).getByRole("combobox", {
			name: "Search rooms and agents",
		});
		await user.type(input, "Buried launch");
		expect(within(dialog).getByText("Room 12")).toBeVisible();

		await user.clear(input);
		await user.type(input, "Editor");
		await user.click(within(dialog).getByText("Writing agent"));
		expect(onAgentVisited).toHaveBeenCalledWith(writingAgent.id);
		expect(
			screen.queryByRole("dialog", { name: "Search rooms and agents" }),
		).not.toBeInTheDocument();

		await user.click(searchTrigger);
		dialog = screen.getByRole("dialog", {
			name: "Search rooms and agents",
		});
		expect(
			within(dialog).getByRole("combobox", {
				name: "Search rooms and agents",
			}),
		).toHaveValue("");
		await user.click(within(dialog).getByText("Room 1"));
		expect(onRoomVisited).toHaveBeenCalledWith("room-1");
	});

	it("keeps only the search action visible in the collapsed rail", async () => {
		const user = userEvent.setup();
		renderSidebar({ sessions: [room(1)], defaultOpen: false });

		expect(screen.queryByRole("tree", { name: "Your agents" })).toBeNull();
		expect(screen.queryByText("Recent")).toBeNull();
		const searchTrigger = screen.getByRole("button", {
			name: "Search rooms and agents",
		});

		await user.hover(searchTrigger);
		expect(await screen.findByRole("tooltip")).toHaveTextContent("Search");
		await user.unhover(searchTrigger);
		await waitFor(() =>
			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
		);

		act(() => searchTrigger.focus());
		await user.keyboard("{Enter}");
		expect(
			screen.getByRole("dialog", { name: "Search rooms and agents" }),
		).toBeVisible();
		await user.keyboard("{Escape}");
		await waitFor(() => expect(searchTrigger).toHaveFocus());
		expect(await screen.findByRole("tooltip")).toHaveTextContent("Search");
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
			within(roomItem).getByRole("button", { name: /Room 1/ }),
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
			within(roomItem).getByRole("button", { name: /Room 1/ }),
		);
		expect(
			screen.getByRole("status", { name: "Mobile sidebar state" }),
		).toHaveTextContent("mobile:closed");
	});

	it("closes the mobile drawer when a new session is started", async () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 360,
		});
		const user = userEvent.setup();
		const onNewSession = vi.fn();
		renderSidebar({ sessions: [], onNewSession });
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Mobile sidebar state" }),
			).toHaveTextContent("mobile:closed"),
		);

		await user.click(
			screen.getByRole("button", { name: "Open mobile drawer" }),
		);
		await user.click(screen.getByRole("button", { name: "New session" }));

		expect(onNewSession).toHaveBeenCalledWith();
		expect(
			screen.getByRole("status", { name: "Mobile sidebar state" }),
		).toHaveTextContent("mobile:closed");
	});
});
