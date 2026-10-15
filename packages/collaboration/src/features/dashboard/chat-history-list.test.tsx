import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ChatHistoryList } from "./chat-history-list";

const dashboard = vi.hoisted(() => ({
	history: {
		rooms: [
			{ roomId: "room-one", roomName: "Pricing conversation" },
			{ roomId: "room-two", roomName: "Sprint conversation" },
		],
		isLoading: false,
		error: "",
		hasMore: false,
		loadMore: vi.fn(),
		refresh: vi.fn(),
		retry: vi.fn(),
		scrollTop: { current: 0 },
	},
	openRoom: vi.fn(),
	openingRoom: null,
}));

vi.mock("./dashboard.context", () => ({
	useDashboard: () => dashboard,
}));

const populatedRooms = dashboard.history.rooms;

beforeEach(() => {
	vi.clearAllMocks();
	dashboard.history.rooms = populatedRooms;
	dashboard.history.isLoading = false;
	dashboard.history.error = "";
	dashboard.history.scrollTop.current = 0;
	dashboard.history.hasMore = false;
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

it.each(["empty", "loading", "error"])(
	"keeps the Sessions disclosure usable while %s content is hidden and restored",
	async (state) => {
		dashboard.history.rooms = [];
		dashboard.history.isLoading = state === "loading";
		dashboard.history.error =
			state === "error" ? "Sessions could not be loaded." : "";
		const user = userEvent.setup();
		const router = createMemoryRouter(
			[{ path: "/", Component: ChatHistoryList }],
			{ initialEntries: ["/"] },
		);
		render(<RouterProvider router={router} />);
		const content =
			state === "loading"
				? screen.getByRole("status", { name: "Loading sessions" })
				: state === "error"
					? screen.getByRole("alert")
					: screen.getByText(
							"Your conversations will appear here after your first message.",
						);
		expect(content).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Sessions" }));
		expect(content).not.toBeVisible();
		expect(
			screen.getByRole("button", { name: "Sessions" }),
		).toHaveAttribute("aria-expanded", "false");
		await user.click(screen.getByRole("button", { name: "Sessions" }));
		expect(content).toBeVisible();
	},
);

it("pauses automatic pagination while Sessions is collapsed and resumes on reopening", async () => {
	const observe = vi.fn();
	const disconnect = vi.fn();
	const observer = vi.fn(function observeSessions() {
		return { observe, disconnect };
	});
	vi.stubGlobal("IntersectionObserver", observer);
	dashboard.history.hasMore = true;
	const user = userEvent.setup();
	const router = createMemoryRouter(
		[{ path: "/", Component: ChatHistoryList }],
		{ initialEntries: ["/"] },
	);
	render(<RouterProvider router={router} />);
	expect(observe).toHaveBeenCalledOnce();
	await user.click(screen.getByRole("button", { name: "Sessions" }));
	expect(disconnect).toHaveBeenCalledOnce();
	expect(observer).toHaveBeenCalledOnce();
	await user.click(screen.getByRole("button", { name: "Sessions" }));
	expect(observe).toHaveBeenCalledTimes(2);
});

it("collapses by keyboard without losing the mounted sessions, selection, or scroll position", async () => {
	const user = userEvent.setup();
	const router = createMemoryRouter(
		[{ path: "/thread/:threadId", Component: ChatHistoryList }],
		{ initialEntries: ["/thread/room%3Aroom-one"] },
	);
	render(<RouterProvider router={router} />);
	const trigger = screen.getByRole("button", { name: "Sessions" });
	const session = screen.getByRole("button", {
		name: "Pricing conversation",
	});
	const list = screen.getByRole("navigation", { name: "Sessions" });
	const scroller = list.parentElement;
	if (!scroller) throw new Error("Sessions must have a scroll container");
	scroller.scrollTop = 180;
	fireEvent.scroll(scroller);
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	expect(trigger).toHaveAttribute("aria-expanded", "false");
	expect(trigger).toHaveFocus();
	expect(session).toBeInTheDocument();
	expect(session).not.toBeVisible();
	expect(
		screen.queryByRole("navigation", { name: "Sessions" }),
	).not.toBeInTheDocument();
	await user.tab();
	expect(session).not.toHaveFocus();
	// A browser may reset a hidden scroll container; retain the last visible position.
	scroller.scrollTop = 0;
	fireEvent.scroll(scroller);
	expect(dashboard.history.scrollTop.current).toBe(180);
	act(() => trigger.focus());
	await user.keyboard(" ");
	expect(trigger).toHaveAttribute("aria-expanded", "true");
	expect(screen.getByRole("button", { name: "Pricing conversation" })).toBe(
		session,
	);
	expect(screen.getByRole("navigation", { name: "Sessions" })).toBe(list);
	expect(scroller.scrollTop).toBe(180);
	expect(session).toHaveAttribute("aria-current", "page");
	expect(router.state.location.pathname).toBe("/thread/room%3Aroom-one");
	expect(dashboard.openRoom).not.toHaveBeenCalled();
});

it("marks a directly opened room from its canonical conversation URL", () => {
	const router = createMemoryRouter(
		[{ path: "/thread/:threadId", Component: ChatHistoryList }],
		{ initialEntries: ["/thread/room%3Aroom-one"] },
	);
	render(<RouterProvider router={router} />);
	expect(
		screen.getByRole("button", { name: "Pricing conversation" }),
	).toHaveAttribute("aria-current", "page");
	expect(
		screen.getByRole("button", { name: "Sprint conversation" }),
	).not.toHaveAttribute("aria-current");
});

it("marks the saved session opened into a Work thread and moves the selection to the next session", async () => {
	const router = createMemoryRouter(
		[{ path: "/thread/:threadId", Component: ChatHistoryList }],
		{
			initialEntries: [
				{
					pathname: "/thread/pricing",
					state: { openedRoomId: "room-one" },
				},
			],
		},
	);
	render(<RouterProvider router={router} />);
	expect(
		screen.getByRole("button", { name: "Pricing conversation" }),
	).toHaveAttribute("aria-current", "page");
	expect(
		screen.getByRole("button", { name: "Sprint conversation" }),
	).not.toHaveAttribute("aria-current");
	await act(() =>
		router.navigate("/thread/sprint", {
			state: { openedRoomId: "room-two" },
		}),
	);
	expect(
		screen.getByRole("button", { name: "Sprint conversation" }),
	).toHaveAttribute("aria-current", "page");
	expect(
		screen.getByRole("button", { name: "Pricing conversation" }),
	).not.toHaveAttribute("aria-current");
});
