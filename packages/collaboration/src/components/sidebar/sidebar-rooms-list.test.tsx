import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SidebarProvider, useSidebar } from "@semoss/ui/next";
import type { Session } from "@/types/session";
import { SidebarRoomsList } from "./sidebar-rooms-list";

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

function room(index: number, overrides: Partial<Session> = {}): Session {
	return {
		id: `room-${index}`,
		agentId: index % 2 === 0 ? "writing-agent" : "research-agent",
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
	activeRoomId,
	isLoading,
	defaultOpen = true,
	onRoomPin = vi.fn().mockResolvedValue(undefined),
	onRoomRename = vi.fn().mockResolvedValue(undefined),
	onRoomDelete = vi.fn().mockResolvedValue(undefined),
	onRoomVisited = vi.fn(),
}: {
	sessions: Session[];
	activeRoomId?: string;
	isLoading?: boolean;
	defaultOpen?: boolean;
	onRoomPin?: (roomId: string, pinned: boolean) => Promise<void>;
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
				<SidebarRoomsList
					sessions={sessions}
					activeRoomId={activeRoomId}
					isLoading={isLoading}
					onRoomPin={onRoomPin}
					onRoomRename={onRoomRename}
					onRoomDelete={onRoomDelete}
					onRoomVisited={onRoomVisited}
				/>
			</SidebarProvider>
		</MemoryRouter>,
	);
}

describe("SidebarRoomsList", () => {
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

	it("shows room-specific loading and empty states", () => {
		const { unmount } = renderSidebar({ sessions: [], isLoading: true });
		expect(screen.getByText("Loading rooms")).toBeVisible();

		unmount();
		renderSidebar({ sessions: [] });
		expect(screen.getByText("No rooms yet")).toBeVisible();
		expect(screen.queryByText("Your agents")).not.toBeInTheDocument();
	});

	it("shows every pinned room before newest-first unpinned rooms", () => {
		renderSidebar({
			sessions: [
				room(4),
				room(3, { pinned: true }),
				room(2),
				room(1, { pinned: true }),
			],
			activeRoomId: "room-2",
		});

		const pinned = screen.getByRole("list", { name: "Pinned rooms" });
		expect(
			within(pinned)
				.getAllByRole("link")
				.map((link) => link.textContent),
		).toEqual(["Room 1", "Room 3"]);
		const rooms = screen.getByRole("list", { name: "Rooms" });
		expect(
			within(rooms)
				.getAllByRole("link")
				.map((link) => link.textContent),
		).toEqual(["Room 2", "Room 4"]);
		expect(
			within(rooms).getByRole("link", { name: "Room 2" }),
		).toHaveAttribute("aria-current", "page");
		expect(screen.getAllByRole("link", { name: /Room \d/ })).toHaveLength(
			4,
		);
	});

	it("reveals unpinned rooms in twenty-room increments", async () => {
		const user = userEvent.setup();
		renderSidebar({
			sessions: [
				room(100, { pinned: true, title: "Pinned room" }),
				...Array.from({ length: 45 }, (_, index) => room(index + 1)),
			],
		});

		const rooms = screen.getByRole("list", { name: "Rooms" });
		const roomLinks = () => within(rooms).getAllByRole("link");
		expect(roomLinks()).toHaveLength(20);
		expect(
			screen.getByRole("list", { name: "Pinned rooms" }),
		).toHaveTextContent("Pinned room");

		await user.click(
			screen.getByRole("button", { name: "Load more rooms" }),
		);
		expect(roomLinks()).toHaveLength(40);
		await user.click(
			screen.getByRole("button", { name: "Load more rooms" }),
		);
		expect(roomLinks()).toHaveLength(45);
		await user.click(
			screen.getByRole("button", { name: "Show fewer rooms" }),
		);
		expect(roomLinks()).toHaveLength(20);
	});

	it("keeps a deep active room visible without duplicating it", () => {
		renderSidebar({
			sessions: Array.from({ length: 45 }, (_, index) => room(index + 1)),
			activeRoomId: "room-45",
		});

		const rooms = screen.getByRole("list", { name: "Rooms" });
		expect(within(rooms).getAllByRole("link")).toHaveLength(45);
		expect(
			within(rooms).getByRole("link", { name: "Room 45" }),
		).toHaveAttribute("aria-current", "page");
		expect(
			within(rooms).getAllByRole("link", { name: "Room 45" }),
		).toHaveLength(1);
		expect(
			screen.queryByRole("button", { name: "Show fewer rooms" }),
		).not.toBeInTheDocument();
	});

	it("preserves status tooltips and room previews", async () => {
		const user = userEvent.setup();
		renderSidebar({ sessions: [room(1), room(2)] });

		const status = screen.getByRole("button", { name: "Working" });
		await user.hover(status);
		expect(await screen.findByRole("tooltip")).toHaveTextContent("Working");
		await user.unhover(status);
		await waitFor(() =>
			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
		);

		await user.hover(screen.getByText("Room 1"));
		expect(await screen.findByText("Latest room preview")).toBeVisible();
	});

	it("pins and unpins rooms from their action menus", async () => {
		const user = userEvent.setup();
		const onRoomPin = vi.fn().mockResolvedValue(undefined);
		renderSidebar({
			sessions: [room(1), room(2, { pinned: true })],
			onRoomPin,
		});

		await user.click(
			screen.getByRole("button", { name: "Actions for Room 1" }),
		);
		await user.click(screen.getByRole("button", { name: "Pin" }));
		expect(onRoomPin).toHaveBeenCalledWith("room-1", true);

		await user.click(
			screen.getByRole("button", { name: "Actions for Room 2" }),
		);
		await user.click(screen.getByRole("button", { name: "Unpin" }));
		expect(onRoomPin).toHaveBeenCalledWith("room-2", false);
	});

	it("renames rooms with validation and returns focus", async () => {
		const user = userEvent.setup();
		const onRoomRename = vi.fn().mockResolvedValue(undefined);
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
		await user.clear(input);
		await user.click(
			within(dialog).getByRole("button", { name: "Rename" }),
		);
		expect(
			await within(dialog).findByText("Room name is required."),
		).toBeVisible();
		await user.type(input, "Updated room");
		await user.click(
			within(dialog).getByRole("button", { name: "Rename" }),
		);
		await waitFor(() =>
			expect(onRoomRename).toHaveBeenCalledWith("room-1", "Updated room"),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it("confirms room deletion without visiting the room", async () => {
		const user = userEvent.setup();
		const onRoomDelete = vi.fn().mockResolvedValue(undefined);
		const onRoomVisited = vi.fn();
		renderSidebar({ sessions: [room(1)], onRoomDelete, onRoomVisited });

		await user.click(
			screen.getByRole("button", { name: "Actions for Room 1" }),
		);
		await user.click(screen.getByRole("button", { name: "Delete" }));
		const dialog = screen.getByRole("dialog", { name: "Delete room" });
		await user.click(
			within(dialog).getByRole("button", { name: "Delete" }),
		);
		await waitFor(() =>
			expect(onRoomDelete).toHaveBeenCalledWith("room-1"),
		);
		expect(onRoomVisited).not.toHaveBeenCalled();
	});

	it("opens the search palette without preloading room content", async () => {
		const user = userEvent.setup();
		renderSidebar({ sessions: [room(1)] });
		const searchTrigger = screen.getByRole("button", {
			name: "Search routes and rooms",
		});

		await user.click(searchTrigger);
		const dialog = screen.getByRole("dialog", { name: "Search" });
		expect(
			within(dialog).getByRole("group", { name: "Routes" }),
		).toBeVisible();
		expect(insightRun).not.toHaveBeenCalled();
		await user.keyboard("{Escape}");
		await waitFor(() => expect(searchTrigger).toHaveFocus());
	});

	it("opens backend room-content matches from search", async () => {
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
		renderSidebar({ sessions: [] });

		await user.click(
			screen.getByRole("button", { name: "Search routes and rooms" }),
		);
		const dialog = screen.getByRole("dialog", { name: "Search" });
		await user.type(
			within(dialog).getByRole("combobox", {
				name: "Search routes and rooms",
			}),
			"Buried launch",
		);
		await user.click(await within(dialog).findByText("Quarterly planning"));
		expect(
			screen.getByRole("status", { name: "Current location" }),
		).toHaveTextContent("/room/backend-room");
	});

	it("surfaces and retries room-content search failures", async () => {
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

	it("ignores stale room-content search responses", async () => {
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

	it("keeps only search visible in the collapsed room rail", async () => {
		const user = userEvent.setup();
		renderSidebar({ sessions: [room(1)], defaultOpen: false });

		expect(screen.queryByRole("list", { name: "Rooms" })).toBeNull();
		const searchTrigger = screen.getByRole("button", {
			name: "Search routes and rooms",
		});
		act(() => searchTrigger.focus());
		await user.keyboard("{Enter}");
		expect(screen.getByRole("dialog", { name: "Search" })).toBeVisible();
	});

	it("visits a room without collapsing the desktop sidebar", async () => {
		const user = userEvent.setup();
		const onRoomVisited = vi.fn();
		renderSidebar({ sessions: [room(1)], onRoomVisited });

		await user.click(screen.getByRole("link", { name: "Room 1" }));
		expect(onRoomVisited).toHaveBeenCalledWith("room-1");
		expect(
			screen.getByRole("status", { name: "Workspace sidebar state" }),
		).toHaveTextContent("expanded");
	});

	it("closes the mobile drawer after a room is selected", async () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 360,
		});
		const user = userEvent.setup();
		renderSidebar({ sessions: [room(1)] });
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Mobile sidebar state" }),
			).toHaveTextContent("mobile:closed"),
		);

		await user.click(
			screen.getByRole("button", { name: "Open mobile drawer" }),
		);
		await user.click(screen.getByRole("link", { name: "Room 1" }));
		expect(
			screen.getByRole("status", { name: "Mobile sidebar state" }),
		).toHaveTextContent("mobile:closed");
	});
});
