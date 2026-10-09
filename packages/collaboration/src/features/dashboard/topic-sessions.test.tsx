import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ROOM_TREE_CHANGED } from "@/features/room-tree/room-tree-events";
import { TopicSessions } from "./topic-sessions";
import { useTopicSessionEvents } from "./use-topic-sessions";

const mocks = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	insightId: "one",
	openRoom: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => mocks }));
vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({ openRoom: mocks.openRoom, openingRoom: null }),
}));
const page = (start = 0, count = 25, total = 27) => ({
	pixelReturn: [
		{
			output: {
				topicId: "topic",
				items: Array.from({ length: count }, (_, index) => ({
					roomId: `r${start + index}`,
					name: `Chat ${start + index}`,
					lastAt: "2026-10-09 12:00:00",
				})),
				total,
			},
			operationType: [],
		},
	],
});
const content = () => (
	<MemoryRouter>
		<TopicSessions topicId="topic" />
	</MemoryRouter>
);
beforeEach(() => {
	mocks.actions = { run: vi.fn().mockResolvedValue(page()) };
	mocks.insightId = "one";
	mocks.openRoom.mockClear();
});
afterEach(cleanup);
it("uses direct topic rooms without source threads or history scans, with unknown pin state disabled", async () => {
	render(content());
	await screen.findByRole("link", { name: /Chat 0/ });
	expect(mocks.actions.run).toHaveBeenCalledExactlyOnceWith(
		'BrainListTopicRooms(topicId=["topic"], limit=[25], offset=[0]);',
	);
	expect(
		screen.getAllByRole("button", { name: "Pin status unavailable" })[0],
	).toBeDisabled();
	expect(screen.getByText(/Showing 25 of 27/)).toBeInTheDocument();
});
it("loads the next server page only on request", async () => {
	render(content());
	await screen.findByRole("link", { name: /Chat 0/ });
	mocks.actions.run.mockResolvedValueOnce(page(25, 2));
	await userEvent.click(
		screen.getByRole("button", { name: "Load more sessions" }),
	);
	await screen.findByRole("link", { name: /Chat 26/ });
	expect(mocks.actions.run).toHaveBeenLastCalledWith(
		'BrainListTopicRooms(topicId=["topic"], limit=[25], offset=[25]);',
	);
	expect(
		screen.queryByRole("button", { name: "Load more sessions" }),
	).not.toBeInTheDocument();
});
it("retains saved rows after refresh failure and distinguishes failure from empty", async () => {
	render(content());
	await screen.findByRole("link", { name: /Chat 0/ });
	mocks.actions.run.mockRejectedValueOnce(new Error("Offline"));
	await userEvent.click(
		screen.getByRole("button", { name: "Refresh rooms" }),
	);
	await screen.findByText(/Offline/);
	expect(screen.getByRole("link", { name: /Chat 0/ })).toBeInTheDocument();
	mocks.actions.run.mockResolvedValueOnce(page(0, 0, 0));
	await userEvent.click(
		screen.getByRole("button", { name: "Retry session links" }),
	);
	await screen.findByText("No rooms are linked to this topic yet.");
});
it("reuses topic pages on cached revisits and isolates another insight", async () => {
	const first = render(content());
	await screen.findByRole("link", { name: /Chat 0/ });
	first.unmount();
	const second = render(content());
	await screen.findByRole("link", { name: /Chat 0/ });
	expect(mocks.actions.run).toHaveBeenCalledTimes(1);
	second.unmount();
	mocks.insightId = "two";
	mocks.actions.run.mockImplementationOnce(() => new Promise(() => {}));
	render(content());
	expect(
		screen.queryByRole("link", { name: /Chat 0/ }),
	).not.toBeInTheDocument();
});
it("keeps a late response in its own account cache", async () => {
	let finish: (value: ReturnType<typeof page>) => void = () => undefined;
	mocks.actions.run.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const first = render(content());
	await waitFor(() => expect(mocks.actions.run).toHaveBeenCalledTimes(1));
	first.unmount();
	mocks.insightId = "two";
	mocks.actions.run.mockResolvedValueOnce(page(0, 0, 0));
	render(content());
	await screen.findByText("No rooms are linked to this topic yet.");
	await act(async () => finish(page()));
	expect(
		screen.queryByRole("link", { name: /Chat 0/ }),
	).not.toBeInTheDocument();
});
it("opens a direct room by keyboard", async () => {
	render(content());
	const link = await screen.findByRole("link", { name: /Chat 0/ });
	link.focus();
	await userEvent.keyboard("{Enter}");
	expect(mocks.openRoom).toHaveBeenCalledWith("r0");
});

it("invalidates a cached topic after an owner link change while its tab is closed", async () => {
	function Shell({ show }: { show: boolean }) {
		useTopicSessionEvents();
		return (
			<MemoryRouter>
				{show && <TopicSessions topicId="topic" />}
			</MemoryRouter>
		);
	}
	const { rerender } = render(<Shell show />);
	await screen.findByRole("link", { name: /Chat 0/ });
	rerender(<Shell show={false} />);
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_TREE_CHANGED, {
				detail: {
					actions: mocks.actions,
					roomId: "new-room",
					topicId: "topic",
					topics: [],
				},
			}),
		),
	);
	expect(mocks.actions.run).toHaveBeenCalledOnce();
	mocks.actions.run.mockResolvedValueOnce(page(0, 1, 1));
	rerender(<Shell show />);
	await waitFor(() => expect(mocks.actions.run).toHaveBeenCalledTimes(2));
	await waitFor(() =>
		expect(
			screen.queryByRole("link", { name: /Chat 24/ }),
		).not.toBeInTheDocument(),
	);
});
