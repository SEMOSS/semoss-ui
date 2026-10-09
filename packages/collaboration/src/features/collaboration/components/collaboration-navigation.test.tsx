import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "@semoss/ui/next";
import { useRoomTree } from "@/features/room-tree/room-tree.context";
import type { RoomTreeRoom } from "@/features/room-tree/room-tree.types";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { CollaborationAccountContext } from "./collaboration-account.context";
import { CollaborationNavigation } from "./collaboration-navigation";
import { useCollaborationAccount } from "./use-collaboration-account";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { logout: vi.fn() } }),
}));

const roomTree = vi.hoisted(() => ({
	rooms: [] as RoomTreeRoom[],
	hasMore: false,
	isLoading: false,
	error: "",
	loadMore: vi.fn(),
	refresh: vi.fn(),
	retry: vi.fn(),
	scrollTop: { current: 0 },
}));
vi.mock("@/features/room-tree/room-tree.context", () => ({
	useRoomTree: vi.fn(),
}));

/** Exercise the controlled navigation contract without involving persistence. */
function NavigationFixture({ onNavigate }: { onNavigate?: () => void }) {
	const account = useCollaborationAccount();
	const [isCollapsed, setIsCollapsed] = useState(false);
	return (
		<CollaborationAccountContext.Provider value={account}>
			<Button
				type="button"
				onClick={() => setIsCollapsed((current) => !current)}
			>
				Toggle navigation fixture
			</Button>
			<CollaborationNavigation
				isCollapsed={isCollapsed}
				onNavigate={onNavigate}
			/>
		</CollaborationAccountContext.Provider>
	);
}

/** Render the real header and room list on a persistent route. */
function renderNavigation(
	path = "/",
	state = createInitialCollaborationState(),
) {
	const onNavigate = vi.fn();
	const router = createMemoryRouter(
		[
			{
				path: "*",
				element: <NavigationFixture onNavigate={onNavigate} />,
			},
		],
		{ initialEntries: [path] },
	);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return { router, onNavigate, user: userEvent.setup() };
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(useRoomTree).mockReturnValue(roomTree);
	roomTree.scrollTop.current = 0;
	roomTree.error = "";
	roomTree.isLoading = false;
	roomTree.hasMore = false;
	roomTree.rooms = [
		{
			roomId: "room-one",
			roomName: "Pricing conversation",
			topics: [
				{
					topicId: "t-geng",
					name: "Northwind Engineering",
					short: "Northwind Eng",
				},
				{ topicId: "t-platform", name: "Platform" },
			],
		},
		{ roomId: "room-two", roomName: "Sprint conversation", topics: [] },
	];
});
afterEach(cleanup);

describe("CollaborationNavigation", () => {
	it("shows topic navigation, creation, and one pinned room list", () => {
		renderNavigation();
		const main = screen.getByRole("navigation", { name: "Main" });
		expect(
			within(main).getByRole("link", { name: "My topics" }),
		).toHaveAttribute("href", "/tasks/topics");
		expect(
			within(main).getByRole("link", { name: "Brain" }),
		).toHaveAttribute("href", "/brain");
		expect(
			screen.queryByRole("link", { name: "For you" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "New topic" })).toBeVisible();
		const rooms = screen.getByRole("navigation", { name: "Pinned rooms" });
		expect(within(rooms).getAllByRole("listitem")).toHaveLength(2);
	});

	it("shows suggested, active and dormant topics alphabetically, including topics without work", () => {
		const state = createInitialCollaborationState();
		const base = state.topics[0];
		if (!base) throw new Error("Missing topic fixture");
		state.topics = [
			{ ...base, id: "z", name: "Zulu", status: "active" },
			{
				...base,
				id: "empty",
				name: "Alpha",
				status: "dormant",
				goals: [],
				people: [],
			},
			{ ...base, id: "archive", name: "Archived", status: "archived" },
			{
				...base,
				id: "suggested",
				name: "Suggested",
				status: "suggested",
			},
		];
		state.items = [];
		state.threads = [];
		renderNavigation("/tasks/topic/empty", state);
		const topics = screen.getByRole("navigation", { name: "Topics" });
		expect(
			within(topics)
				.getAllByRole("link")
				.map((link) => link.textContent),
		).toEqual(["Alpha", "Suggested", "Zulu"]);
		expect(
			within(topics).getByRole("link", { name: "Alpha" }),
		).toHaveAttribute("aria-current", "page");
	});

	it("opens creation from an empty topic list", async () => {
		const state = createInitialCollaborationState();
		state.topics = [];
		const { user } = renderNavigation("/", state);
		await user.click(
			screen.getByRole("button", { name: "Create your first topic" }),
		);
		expect(
			screen.getByRole("dialog", { name: "Create topic" }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(
			screen.getByRole("button", { name: "Create your first topic" }),
		).toHaveFocus();
	});

	it.each([
		["/", null],
		["/for-you", null],
		["/for-you/", null],
		["/tasks", null],
		["/tasks/topics", "My topics"],
		["/tasks/waiting", null],
		["/tasks/done", null],
		["/work", null],
		["/work/all", null],
		["/work/topic/t-geng", null],
		["/tasks/all", null],
		["/tasks/topic/t-geng", null],
		["/brain", "Brain"],
		["/brain/people/p-ava", "Brain"],
		["/brain/threads/th-geng-review", "Brain"],
		["/brain/topics/t-geng", "Brain"],
	])("selects the correct main destination on %s", (path, expected) => {
		renderNavigation(path);
		for (const label of ["My topics", "Brain"]) {
			const link = screen.getByRole("link", { name: label });
			if (label === expected)
				expect(link).toHaveAttribute("aria-current", "page");
			else expect(link).not.toHaveAttribute("aria-current");
		}
	});

	it("shows 25 rooms in supplied activity order and offers one global load-more action", async () => {
		roomTree.rooms = Array.from({ length: 25 }, (_, index) => ({
			roomId: `room-${index}`,
			roomName: `Recent conversation ${25 - index}`,
			topics: [],
		}));
		roomTree.hasMore = true;
		const { user } = renderNavigation();
		const list = within(
			screen.getByRole("navigation", { name: "Pinned rooms" }),
		).getByRole("list");
		expect(
			within(list)
				.getAllByRole("link")
				.map((link) => link.getAttribute("aria-label")),
		).toEqual(
			Array.from(
				{ length: 25 },
				(_, index) => `Recent conversation ${25 - index}`,
			),
		);
		const more = screen.getByRole("button", { name: "Show 25 more rooms" });
		expect(more).toHaveTextContent("Show 25 more");
		await user.click(more);
		expect(roomTree.loadMore).toHaveBeenCalledExactlyOnceWith();
	});

	it.each(["{Enter}", " ", "mouse"])(
		"keeps final-page pagination focus appropriate for %s activation",
		async (activation) => {
			const rooms = Array.from({ length: 27 }, (_, index) => ({
				roomId: `room-${index}`,
				roomName: `Conversation ${index + 1}`,
				topics: [],
			}));
			vi.mocked(useRoomTree).mockImplementation(function usePagedRooms() {
				const [isLastPage, setIsLastPage] = useState(false);
				return {
					...roomTree,
					rooms: isLastPage ? rooms : rooms.slice(0, 25),
					hasMore: !isLastPage,
					loadMore: () => {
						roomTree.loadMore();
						setIsLastPage(true);
					},
				};
			});
			const { user } = renderNavigation();
			const more = screen.getByRole("button", {
				name: "Show 25 more rooms",
			});
			if (activation === "mouse") await user.click(more);
			else {
				act(() => more.focus());
				await user.keyboard(activation);
			}
			expect(roomTree.loadMore).toHaveBeenCalledOnce();
			expect(more).not.toBeInTheDocument();
			const firstNewRoom = screen.getByRole("link", {
				name: "Conversation 26",
			});
			expect(firstNewRoom).toBeVisible();
			if (activation === "mouse") expect(firstNewRoom).not.toHaveFocus();
			else expect(firstNewRoom).toHaveFocus();
			const brain = screen.getByRole("link", { name: "Brain" });
			await user.click(brain);
			expect(brain).toHaveFocus();
		},
	);

	it("shows each multi-topic room once and keeps exact room destinations on Brain", async () => {
		const { user, router, onNavigate } = renderNavigation(
			"/tasks/topic/t-geng",
		);
		const room = screen.getByRole("link", { name: "Pricing conversation" });
		expect(room).toHaveAttribute("href", "/thread/room%3Aroom-one");
		await act(() => router.navigate("/brain/topics/t-geng"));
		expect(screen.getByRole("link", { name: "Pricing conversation" })).toBe(
			room,
		);
		expect(roomTree.refresh).not.toHaveBeenCalled();
		await user.click(room);
		expect(router.state.location.pathname).toBe("/thread/room%3Aroom-one");
		expect(onNavigate).toHaveBeenCalledOnce();
		expect(room).toHaveAttribute("aria-current", "page");
	});

	it("retains visible rooms on refresh failure and offers a local retry", async () => {
		roomTree.error = "Could not refresh rooms.";
		const { user } = renderNavigation();
		expect(
			screen.getByRole("link", { name: "Pricing conversation" }),
		).toBeVisible();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Could not refresh rooms.",
		);
		await user.click(screen.getByRole("button", { name: "Retry rooms" }));
		expect(roomTree.retry).toHaveBeenCalledExactlyOnceWith();
	});

	it("keeps rooms with unavailable topics in the same list", () => {
		roomTree.rooms[1].topicUnavailable = true;
		renderNavigation();
		const rooms = screen.getByRole("navigation", { name: "Pinned rooms" });
		const room = within(rooms).getByRole("link", {
			name: "Sprint conversation",
		});
		expect(room).toBeVisible();
		expect(room).toHaveAccessibleDescription("Topic unavailable");
		expect(within(rooms).getAllByRole("list")).toHaveLength(1);
	});

	it("keeps rooms visible and disables global pagination during refresh", () => {
		roomTree.isLoading = true;
		roomTree.hasMore = true;
		renderNavigation();
		expect(
			screen.getByRole("link", { name: "Pricing conversation" }),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Show 25 more rooms" }),
		).toBeDisabled();
		expect(screen.queryByText("Loading rooms…")).not.toBeInTheDocument();
	});

	it("announces initial loading and offers recovery when rooms fail to load", async () => {
		roomTree.rooms = [];
		roomTree.isLoading = true;
		const { router, user } = renderNavigation();
		expect(screen.getByRole("status")).toHaveTextContent("Loading rooms…");
		roomTree.isLoading = false;
		roomTree.error = "Could not load rooms.";
		await act(() => router.navigate("/brain"));
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Could not load rooms.",
		);
		await user.click(screen.getByRole("button", { name: "Retry rooms" }));
		expect(roomTree.retry).toHaveBeenCalledOnce();
	});

	it("shows one empty state without empty topic groups or pagination", () => {
		roomTree.rooms = [];
		renderNavigation();
		expect(
			screen.getByText(
				"Pin a room from its chat header or the Rooms tab to keep it here.",
			),
		).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "Show 25 more rooms" }),
		).not.toBeInTheDocument();
		expect(screen.queryByText("No rooms yet.")).not.toBeInTheDocument();
	});

	it("shows the complete long title on keyboard focus", async () => {
		const title =
			"A very long saved conversation title that extends beyond the available sidebar width";
		roomTree.rooms[0].roomName = title;
		renderNavigation();
		act(() => screen.getByRole("link", { name: title }).focus());
		expect(await screen.findByRole("tooltip")).toHaveTextContent(title);
	});

	it("opens an unassigned room directly from the shared list", async () => {
		const { user, router, onNavigate } = renderNavigation("/brain");
		const room = within(
			screen.getByRole("navigation", { name: "Pinned rooms" }),
		).getByRole("link", { name: "Sprint conversation" });
		expect(room).toBeVisible();
		expect(room).toHaveAttribute("href", "/thread/room%3Aroom-two");
		await user.click(room);
		expect(router.state.location.pathname).toBe("/thread/room%3Aroom-two");
		expect(onNavigate).toHaveBeenCalledOnce();
		expect(room).toHaveAttribute("aria-current", "page");
	});

	it("preserves one scroller, its position, and room selection through rail and Brain navigation", async () => {
		const { user, router } = renderNavigation("/thread/room%3Aroom-one");
		const room = screen.getByRole("link", { name: "Pricing conversation" });
		const tree = screen.getByRole("navigation", { name: "Pinned rooms" });
		const scroller = tree.parentElement;
		if (!scroller)
			throw new Error("The room list must have a scroll container");
		scroller.scrollTop = 180;
		fireEvent.scroll(scroller);
		expect(roomTree.scrollTop.current).toBe(180);
		expect(room).toHaveAttribute("aria-current", "page");
		const collapse = screen.getByRole("button", {
			name: "Toggle navigation fixture",
		});
		await user.click(collapse);
		expect(room).toBeInTheDocument();
		expect(room).not.toBeVisible();
		await user.click(collapse);
		expect(screen.getByRole("navigation", { name: "Pinned rooms" })).toBe(
			tree,
		);
		expect(scroller.scrollTop).toBe(180);
		await act(() => router.navigate("/brain"));
		expect(scroller.scrollTop).toBe(180);
		expect(roomTree.refresh).not.toHaveBeenCalled();
	});

	it("keeps rail actions named with discoverable tooltips and Settings in the account menu", async () => {
		const { user, onNavigate, router } = renderNavigation();
		await user.click(
			screen.getByRole("button", { name: "Toggle navigation fixture" }),
		);
		for (const label of ["My topics", "Brain"]) {
			const control = screen.getByRole("link", { name: label });
			expect(control).toBeVisible();
			await user.hover(control);
			expect(await screen.findByRole("tooltip")).toHaveTextContent(label);
			await user.keyboard("{Escape}");
			await user.unhover(control);
		}
		expect(
			screen.queryByRole("button", { name: "Search your workspace" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Settings" }),
		).not.toBeInTheDocument();
		const account = screen.getByRole("button", {
			name: "Account menu for Robin Hale",
		});
		act(() => account.focus());
		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"Account menu for Robin Hale",
		);
		await user.keyboard("{Escape}");
		await user.click(account);
		await user.click(screen.getByRole("menuitem", { name: "Settings" }));
		expect(onNavigate).toHaveBeenCalledOnce();
		expect(router.state.location.pathname).toBe("/settings");
	});

	it("keeps one account row mounted while its name is hidden and restored with sidebar collapse", async () => {
		const { user } = renderNavigation();
		const account = screen.getByRole("button", {
			name: "Account menu for Robin Hale",
		});
		expect(account).toBeVisible();
		expect(within(account).getByText("Robin Hale")).toBeVisible();
		expect(
			screen.queryByText("robin.hale@contoso.example"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Settings" }),
		).not.toBeInTheDocument();
		const collapse = screen.getByRole("button", {
			name: "Toggle navigation fixture",
		});
		await user.click(collapse);
		expect(screen.getByRole("button", { name: /Account menu/ })).toBe(
			account,
		);
		expect(account).toBeVisible();
		expect(account).not.toHaveTextContent("Robin Hale");
		await user.click(collapse);
		expect(screen.getByRole("button", { name: /Account menu/ })).toBe(
			account,
		);
		expect(within(account).getByText("Robin Hale")).toBeVisible();
		await user.click(account);
		const menu = screen.getByRole("menu");
		expect(
			within(menu).getByText("robin.hale@contoso.example"),
		).toBeVisible();
		expect(
			within(menu)
				.getAllByRole("menuitem")
				.map((item) => item.textContent),
		).toEqual(["Settings", "Log out"]);
	});
});
