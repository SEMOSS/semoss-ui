import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import type { InsightActions } from "@/lib/pixel";
import { listRoomTree } from "./api/list-room-tree";
import { useRoomTree } from "./room-tree.context";
import { ROOM_TREE_CHANGED } from "./room-tree-events";
import { RoomTreeProvider } from "./room-tree-provider";

vi.mock("./api/list-room-tree", () => ({ listRoomTree: vi.fn() }));
const actions = {} as InsightActions;
const list = vi.mocked(listRoomTree);
function Probe() {
	const tree = useRoomTree();
	return (
		<output>
			{tree.rooms
				.map(
					(room) =>
						`${room.roomName}:${room.topics.map((topic) => topic.name).join(",")}`,
				)
				.join(";")}
		</output>
	);
}
const content = (scope = "one") => (
	<RoomTreeProvider
		key={scope}
		actions={actions}
		activityScope={scope}
		activityStorageKey={scope}
	>
		<Probe />
	</RoomTreeProvider>
);
beforeEach(() => {
	localStorage.clear();
	vi.resetAllMocks();
	list.mockResolvedValue({
		rooms: [{ roomId: "r", roomName: "Saved", topics: [] }],
		hasMore: false,
		nextOffset: 1,
	});
});
afterEach(cleanup);
it("shares loaded pages through navigation and ignores ordinary timer and focus events", async () => {
	const view = render(content());
	await screen.findByText("Saved:");
	view.rerender(content());
	act(() => {
		window.dispatchEvent(new Event("focus"));
		document.dispatchEvent(new Event("visibilitychange"));
	});
	expect(list).toHaveBeenCalledTimes(1);
});
it("applies confirmed names and direct topic changes without reloading the directory", async () => {
	render(content());
	await screen.findByText("Saved:");
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: { actions, roomId: "r", roomName: "Renamed" },
			}),
		),
	);
	await screen.findByText("Renamed:");
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_TREE_CHANGED, {
				detail: {
					roomId: "r",
					topics: [
						{ topicId: "direct", name: "Direct", state: "linked" },
					],
				},
			}),
		),
	);
	await screen.findByText("Renamed:Direct");
	expect(list).toHaveBeenCalledTimes(1);
});
it("isolates another account and ignores its late room notifications", async () => {
	const view = render(content());
	await screen.findByText("Saved:");
	list.mockImplementationOnce(() => new Promise(() => {}));
	view.rerender(content("two"));
	expect(screen.queryByText("Saved:")).not.toBeInTheDocument();
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "one",
					roomId: "private",
					roomName: "Private",
					pinned: true,
				},
			}),
		),
	);
	expect(screen.queryByText(/Private/)).not.toBeInTheDocument();
});
it("records only activity metadata and removes confirmed deletions locally", async () => {
	render(content());
	await screen.findByText("Saved:");
	const activity = list.mock.calls[0][1];
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "one",
					roomId: "r",
					dateUpdated: "2026-10-09T12:00:00Z",
					content: "private",
				},
			}),
		),
	);
	expect(activity?.get("r")).toBe("2026-10-09T12:00:00.000Z");
	expect(localStorage.getItem("one")).not.toContain("private");
	expect(list).toHaveBeenCalledTimes(1);
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: { actions, roomId: "r", deleted: true },
			}),
		),
	);
	await waitFor(() =>
		expect(screen.queryByText("Saved:")).not.toBeInTheDocument(),
	);
});
