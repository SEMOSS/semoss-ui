import { act, cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ChatHistoryList } from "./chat-history-list";

vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({
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
	}),
}));

afterEach(cleanup);

it("marks the saved session opened into a Work thread and moves the selection to the next session", async () => {
	const router = createMemoryRouter(
		[{ path: "/work/thread/:threadId", Component: ChatHistoryList }],
		{
			initialEntries: [
				{
					pathname: "/work/thread/pricing",
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
		router.navigate("/work/thread/sprint", {
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
