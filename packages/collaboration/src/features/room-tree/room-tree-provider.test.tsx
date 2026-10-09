import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import type { InsightActions } from "@/lib/pixel";
import { listRoomTree } from "./api/list-room-tree";
import { useRoomTree } from "./room-tree.context";
import { roomTreeActivityStorageKey } from "./room-tree-activity";
import { ROOM_TREE_CHANGED } from "./room-tree-events";
import { RoomTreeProvider } from "./room-tree-provider";
import { useRoomRead } from "./use-room-read";

vi.mock("./api/list-room-tree", () => ({
	listRoomTree: vi.fn(),
}));
const actions = {} as InsightActions;
const list = vi.mocked(listRoomTree);
const activityStorageKey = roomTreeActivityStorageKey("one", "deployment-a");
const secondStorageKey = roomTreeActivityStorageKey("two", "deployment-a");
const savedAt = "2026-10-08T12:00:00.000Z";

function Consumer({ route }: { route: string }) {
	const tree = useRoomTree();
	return (
		<div>
			{route}
			<span>{tree.rooms.map((room) => room.roomName).join(",")}</span>
		</div>
	);
}

/** Read the real owner state while simulating a loaded conversation pane. */
function UnreadConsumer({ viewedRoom = "" }: { viewedRoom?: string }) {
	const tree = useRoomTree();
	useRoomRead(viewedRoom, Boolean(viewedRoom));
	return (
		<div>
			{tree.rooms.map((room) => (
				<span key={room.roomId}>
					{room.roomId}: {room.isUnread ? "unread" : "read"}
				</span>
			))}
		</div>
	);
}

beforeEach(() => {
	localStorage.clear();
	list.mockReset();
	list.mockResolvedValue({
		rooms: [{ roomId: "one", roomName: "One", topics: [] }],
	});
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	localStorage.clear();
});

it("shares one read and refreshes on saved changes, without reading again for navigation", async () => {
	const view = render(
		<RoomTreeProvider
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<Consumer route="Work" />
			<Consumer route="mobile" />
		</RoomTreeProvider>,
	);
	await screen.findAllByText("One");
	expect(list).toHaveBeenCalledTimes(1);
	view.rerender(
		<RoomTreeProvider
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<Consumer route="Brain" />
			<Consumer route="mobile" />
		</RoomTreeProvider>,
	);
	expect(list).toHaveBeenCalledTimes(1);
	act(() => {
		window.dispatchEvent(new Event(ROOM_HISTORY_CHANGED));
	});
	await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
	act(() => {
		window.dispatchEvent(new Event(ROOM_TREE_CHANGED));
	});
	await waitFor(() => expect(list).toHaveBeenCalledTimes(3));
	view.unmount();
	act(() => {
		window.dispatchEvent(new Event(ROOM_TREE_CHANGED));
	});
	expect(list).toHaveBeenCalledTimes(3);
});

it("never shows the prior account's cached rooms after its provider key changes", async () => {
	const view = render(
		<RoomTreeProvider
			key="one"
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<Consumer route="Work" />
		</RoomTreeProvider>,
	);
	await screen.findByText("One");
	list.mockImplementationOnce(() => new Promise(() => {}));
	view.rerender(
		<RoomTreeProvider
			key="two"
			actions={actions}
			activityScope="insight-two"
			activityStorageKey={secondStorageKey}
		>
			<Consumer route="Work" />
		</RoomTreeProvider>,
	);
	expect(screen.queryByText("One")).not.toBeInTheDocument();
	expect(list).toHaveBeenCalledTimes(2);
});

it("updates the same recency map on transcript saves and persists no room content", async () => {
	render(
		<RoomTreeProvider
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<Consumer route="Work" />
		</RoomTreeProvider>,
	);
	await screen.findByText("One");
	const activity = list.mock.calls[0]?.[1];
	expect(activity?.size).toBe(0);
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "insight-one",
					roomId: "saved-room",
					dateUpdated: savedAt,
					roomName: "Private name",
					content: "Private content",
				},
			}),
		),
	);
	await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
	expect(list.mock.calls[1]?.[1]).toBe(activity);
	expect(activity?.get("saved-room")).toBe(savedAt);
	expect(
		JSON.parse(localStorage.getItem(activityStorageKey) ?? "null"),
	).toEqual({ "saved-room": savedAt });
});

it("refreshes after renames, deletion, and topic changes without changing recency", async () => {
	localStorage.setItem(
		activityStorageKey,
		JSON.stringify({ "saved-room": savedAt }),
	);
	render(
		<RoomTreeProvider
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<Consumer route="Work" />
		</RoomTreeProvider>,
	);
	await screen.findByText("One");
	const activity = list.mock.calls[0]?.[1];
	const write = vi.spyOn(Storage.prototype, "setItem");
	const events = [
		new Event(ROOM_HISTORY_CHANGED),
		new CustomEvent(ROOM_HISTORY_CHANGED, {
			detail: { roomId: "saved-room", roomName: "Renamed" },
		}),
		new CustomEvent(ROOM_HISTORY_CHANGED, {
			detail: { roomId: "saved-room", dateUpdated: "invalid" },
		}),
		new CustomEvent(ROOM_TREE_CHANGED, {
			detail: {
				roomId: "saved-room",
				dateUpdated: "2026-10-09T12:00:00Z",
			},
		}),
	];
	for (const [index, event] of events.entries()) {
		act(() => window.dispatchEvent(event));
		await waitFor(() => expect(list).toHaveBeenCalledTimes(index + 2));
	}
	expect(activity?.get("saved-room")).toBe(savedAt);
	expect(write).not.toHaveBeenCalled();
});

it("restores recency after remounting and loads a separate map for the next account", async () => {
	localStorage.setItem(
		activityStorageKey,
		JSON.stringify({ "one-room": savedAt }),
	);
	localStorage.setItem(
		secondStorageKey,
		JSON.stringify({ "two-room": savedAt }),
	);
	const view = render(
		<RoomTreeProvider
			key="one"
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<Consumer route="Work" />
		</RoomTreeProvider>,
	);
	await screen.findByText("One");
	const first = list.mock.calls[0]?.[1];
	expect(first?.get("one-room")).toBe(savedAt);
	view.rerender(
		<RoomTreeProvider
			key="two"
			actions={actions}
			activityScope="insight-two"
			activityStorageKey={secondStorageKey}
		>
			<Consumer route="Work" />
		</RoomTreeProvider>,
	);
	await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
	const second = list.mock.calls[1]?.[1];
	expect(second).not.toBe(first);
	expect(second?.get("two-room")).toBe(savedAt);
	expect(second?.has("one-room")).toBe(false);
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "insight-one",
					roomId: "late-one-room",
					dateUpdated: savedAt,
				},
			}),
		),
	);
	await waitFor(() => expect(list).toHaveBeenCalledTimes(3));
	expect(second?.has("late-one-room")).toBe(false);
	expect(
		JSON.parse(localStorage.getItem(secondStorageKey) ?? "null"),
	).toEqual({ "two-room": savedAt });
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "insight-two",
					roomId: "new-two-room",
					dateUpdated: savedAt,
				},
			}),
		),
	);
	await waitFor(() => expect(list).toHaveBeenCalledTimes(4));
	expect(first?.has("new-two-room")).toBe(false);
	expect(
		JSON.parse(localStorage.getItem(activityStorageKey) ?? "null"),
	).toEqual({ "one-room": savedAt });
	view.unmount();
	const write = vi.spyOn(Storage.prototype, "setItem");
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "insight-two",
					roomId: "ignored-after-unmount",
					dateUpdated: savedAt,
				},
			}),
		),
	);
	expect(write).not.toHaveBeenCalled();
});

it("refreshes unscoped or malformed save notifications without recording activity", async () => {
	render(
		<RoomTreeProvider
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<Consumer route="Work" />
		</RoomTreeProvider>,
	);
	await screen.findByText("One");
	const details = [
		null,
		{ roomId: "saved-room", dateUpdated: savedAt },
		{ scope: null, roomId: "saved-room", dateUpdated: savedAt },
		{ scope: "insight-one", roomId: "saved-room", dateUpdated: "invalid" },
	];
	for (const [index, detail] of details.entries()) {
		act(() =>
			window.dispatchEvent(
				new CustomEvent(ROOM_HISTORY_CHANGED, { detail }),
			),
		);
		await waitFor(() => expect(list).toHaveBeenCalledTimes(index + 2));
	}
	expect(list.mock.calls[0]?.[1]?.size).toBe(0);
	expect(localStorage.getItem(activityStorageKey)).toBeNull();
});

it("still refreshes saved activity when browser storage is blocked", async () => {
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("Storage blocked");
	});
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("Storage blocked");
	});
	render(
		<RoomTreeProvider
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<Consumer route="Work" />
		</RoomTreeProvider>,
	);
	await screen.findByText("One");
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "insight-one",
					roomId: "saved-room",
					dateUpdated: savedAt,
				},
			}),
		),
	);
	await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
	expect(list.mock.calls[1]?.[1]?.get("saved-room")).toBe(savedAt);
});

it("keeps saved activity unread through a failed refresh until the conversation is viewed", async () => {
	vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
	list.mockResolvedValue({
		rooms: [
			{
				roomId: "saved-room",
				topics: [],
				activityAt: "2026-10-07T12:00:00.000Z",
			},
		],
	});
	const view = render(
		<RoomTreeProvider
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<UnreadConsumer />
		</RoomTreeProvider>,
	);
	await screen.findByText("saved-room: read");
	list.mockRejectedValueOnce(new Error("Offline"));
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "insight-one",
					roomId: "saved-room",
					dateUpdated: savedAt,
				},
			}),
		),
	);
	expect(screen.getByText("saved-room: unread")).toBeVisible();
	await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
	view.rerender(
		<RoomTreeProvider
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<UnreadConsumer viewedRoom="saved-room" />
		</RoomTreeProvider>,
	);
	await screen.findByText("saved-room: read");
	expect(list).toHaveBeenCalledTimes(2);
});

it("does not create unread state from rename, malformed, or another account's events", async () => {
	list.mockResolvedValue({
		rooms: [{ roomId: "saved-room", topics: [], activityAt: savedAt }],
	});
	render(
		<RoomTreeProvider
			actions={actions}
			activityScope="insight-one"
			activityStorageKey={activityStorageKey}
		>
			<UnreadConsumer />
		</RoomTreeProvider>,
	);
	await screen.findByText("saved-room: read");
	for (const detail of [
		{
			scope: "insight-two",
			roomId: "saved-room",
			dateUpdated: "2026-10-09T12:00:00Z",
		},
		{ scope: "insight-one", roomId: "saved-room", dateUpdated: "invalid" },
		{ scope: "insight-one", roomId: "saved-room", roomName: "Renamed" },
	]) {
		act(() =>
			window.dispatchEvent(
				new CustomEvent(ROOM_HISTORY_CHANGED, { detail }),
			),
		);
		await waitFor(() =>
			expect(screen.getByText("saved-room: read")).toBeVisible(),
		);
	}
	expect(screen.queryByText("saved-room: unread")).not.toBeInTheDocument();
});
