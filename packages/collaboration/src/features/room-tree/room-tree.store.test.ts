import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { listRoomTree } from "./api/list-room-tree";
import { createRoomTreeStore } from "./room-tree.store";
import type { RoomTreeResponse, RoomTreeRoom } from "./room-tree.types";
import { createRoomReadState } from "./room-tree-read-state";

vi.mock("./api/list-room-tree", () => ({ listRoomTree: vi.fn() }));
const actions = {} as InsightActions;
const list = vi.mocked(listRoomTree);

function rooms(start: number, count = 62): RoomTreeRoom[] {
	return Array.from({ length: count }, (_, index) => ({
		roomId: `room-${start + index}`,
		roomName: `Room ${start + index}`,
		topics: [
			{ topicId: "alpha", name: "Alpha" },
			{ topicId: "beta", name: "Beta" },
		],
	}));
}

function tree(): RoomTreeResponse {
	return { rooms: rooms(1) };
}

/** Control a pending refresh to exercise coalescing and abandoned account owners. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
	let finish: (value: T) => void = () => {
		throw new Error("Promise not initialized");
	};
	const promise = new Promise<T>((resolve) => {
		finish = resolve;
	});
	return { promise, resolve: finish };
}

beforeEach(() => {
	vi.resetAllMocks();
	localStorage.clear();
	list.mockResolvedValue(tree());
});

describe("browser-only room unread activity", () => {
	const initialActivity = "2026-10-08T12:00:00.000Z";
	const newActivity = "2026-10-08T13:00:00.000Z";
	const newestActivity = "2026-10-08T14:00:00.000Z";

	beforeEach(() => {
		const data = tree();
		for (const room of data.rooms) room.activityAt = initialActivity;
		list.mockResolvedValue(data);
	});

	it("baselines full history before pagination and keeps unread state on canonical rows", async () => {
		const store = createRoomTreeStore(
			() => actions,
			new Map(),
			createRoomReadState("unread-one"),
		);
		const release = store.retain();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		store.loadMore();
		expect(store.getSnapshot().rooms.every((room) => !room.isUnread)).toBe(
			true,
		);
		store.recordActivity("room-1", newActivity);
		expect(
			store.getSnapshot().rooms.find((room) => room.roomId === "room-1")
				?.isUnread,
		).toBe(true);
		store.recordActivity("room-62", newActivity);
		store.loadMore();
		expect(store.getSnapshot().rooms.at(-1)?.isUnread).toBe(true);
		const stopViewing = store.viewRoom("room-1");
		expect(
			store.getSnapshot().rooms.find((room) => room.roomId === "room-1")
				?.isUnread,
		).toBe(false);
		expect(store.getSnapshot().rooms).toHaveLength(62);
		expect(list).toHaveBeenCalledTimes(1);
		stopViewing();
		release();
	});

	it("only consumes new activity while a loaded room is being viewed", async () => {
		const store = createRoomTreeStore(
			() => actions,
			new Map(),
			createRoomReadState("unread-one"),
		);
		const release = store.retain();
		const firstView = store.viewRoom("room-10");
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		const secondView = store.viewRoom("room-10");
		firstView();
		firstView();
		store.recordActivity("room-10", newActivity);
		expect(store.getSnapshot().rooms[9]?.isUnread).toBe(false);
		secondView();
		store.recordActivity("room-10", newestActivity);
		expect(store.getSnapshot().rooms[9]?.isUnread).toBe(true);
		const reopened = store.viewRoom("room-10");
		expect(store.getSnapshot().rooms[9]?.isUnread).toBe(false);
		reopened();
		store.recordActivity("room-10", newActivity);
		expect(store.getSnapshot().rooms[9]?.isUnread).toBe(false);
		release();
	});

	it("preserves unread dots through failed refreshes and stale metadata", async () => {
		const store = createRoomTreeStore(
			() => actions,
			new Map(),
			createRoomReadState("unread-one"),
		);
		const release = store.retain();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		store.recordActivity("room-1", newActivity);
		list.mockRejectedValueOnce(new Error("Offline"));
		store.refresh();
		expect(store.getSnapshot().rooms[0]?.isUnread).toBe(true);
		await waitFor(() => expect(store.getSnapshot().error).toBe("Offline"));
		store.refresh();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(store.getSnapshot().rooms[0]?.isUnread).toBe(true);
		const stopViewing = store.viewRoom("room-1");
		stopViewing();
		store.refresh();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(store.getSnapshot().rooms[0]?.isUnread).toBe(false);
		release();
	});

	it("merges another tab's read markers without reloading or resetting page depth", async () => {
		const store = createRoomTreeStore(
			() => actions,
			new Map(),
			createRoomReadState("unread-one"),
		);
		const release = store.retain();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		store.loadMore();
		store.scrollTop.current = 100;
		store.recordActivity("room-1", newActivity);
		createRoomReadState("unread-one").markRead("room-1");
		store.syncReadState();
		expect(store.getSnapshot().rooms[0]?.isUnread).toBe(false);
		expect(store.getSnapshot().rooms).toHaveLength(50);
		expect(store.scrollTop.current).toBe(100);
		expect(list).toHaveBeenCalledTimes(1);
		release();
	});
});

describe("frontend room tree owner", () => {
	it("reveals 25 more canonical rooms globally without another request", async () => {
		const store = createRoomTreeStore(() => actions);
		const release = store.retain();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(store.getSnapshot().rooms).toHaveLength(25);
		expect(store.getSnapshot().hasMore).toBe(true);
		store.loadMore();
		expect(store.getSnapshot().rooms).toHaveLength(50);
		store.loadMore();
		expect(store.getSnapshot().rooms).toHaveLength(62);
		expect(store.getSnapshot().hasMore).toBe(false);
		const finished = store.getSnapshot();
		store.loadMore();
		expect(store.getSnapshot()).toBe(finished);
		expect(list).toHaveBeenCalledTimes(1);
		release();
	});

	it("retains loaded depth and scroll across reorder, rename, deletion and topic changes", async () => {
		const store = createRoomTreeStore(() => actions);
		const release = store.retain();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		store.loadMore();
		store.scrollTop.current = 137;
		const changed = {
			rooms: rooms(3, 52)
				.reverse()
				.map((room) => ({
					...room,
					roomName: `Renamed ${room.roomId}`,
					topics: [{ topicId: "gamma", name: "Gamma" }],
				})),
		};
		list.mockResolvedValueOnce(changed);
		store.refresh();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(store.getSnapshot().rooms).toEqual(changed.rooms.slice(0, 50));
		expect(store.getSnapshot().hasMore).toBe(true);
		expect(store.scrollTop.current).toBe(137);
		list.mockResolvedValueOnce({ rooms: [] });
		store.refresh();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(store.getSnapshot().rooms).toEqual([]);
		expect(store.getSnapshot().hasMore).toBe(false);
		store.refresh();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(store.getSnapshot().rooms).toHaveLength(50);
		expect(store.scrollTop.current).toBe(137);
		release();
	});

	it("preserves the visible list and loaded depth after a failed refresh, with retry", async () => {
		const store = createRoomTreeStore(() => actions);
		const release = store.retain();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		store.loadMore();
		list.mockRejectedValueOnce(new Error("Temporarily offline"));
		store.refresh();
		await waitFor(() =>
			expect(store.getSnapshot().error).toBe("Temporarily offline"),
		);
		expect(store.getSnapshot().rooms).toHaveLength(50);
		store.retry();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(store.getSnapshot().error).toBe("");
		expect(store.getSnapshot().rooms).toHaveLength(50);
		release();
	});

	it("keeps rooms with unavailable topics pageable while a partial warning offers retry", async () => {
		const partial = tree();
		partial.rooms = partial.rooms.map((room) => ({
			...room,
			topics: [],
			topicUnavailable: true,
		}));
		partial.warning = "Some topic links could not be read.";
		list.mockResolvedValueOnce(partial);
		const store = createRoomTreeStore(() => actions);
		const release = store.retain();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(store.getSnapshot().error).toBe(partial.warning);
		store.loadMore();
		expect(store.getSnapshot().rooms).toHaveLength(50);
		expect(
			store.getSnapshot().rooms.every((room) => room.topicUnavailable),
		).toBe(true);
		store.retry();
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(store.getSnapshot().error).toBe("");
		expect(store.getSnapshot().rooms).toHaveLength(50);
		release();
	});

	it("coalesces saved changes and stops an abandoned owner's background scan", async () => {
		const pending = deferred<RoomTreeResponse>();
		list.mockReturnValueOnce(pending.promise);
		const activity = new Map([["room-1", "2026-10-08T16:00:00Z"]]);
		const store = createRoomTreeStore(() => actions, activity);
		const release = store.retain();
		store.refresh();
		store.refresh();
		store.loadMore();
		pending.resolve(tree());
		await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
		expect(list.mock.calls[0]?.[1]).toBe(activity);
		const abandoned = deferred<RoomTreeResponse>();
		list.mockReturnValueOnce(abandoned.promise);
		store.refresh();
		const isActive = list.mock.calls[2]?.[2];
		expect(isActive?.()).toBe(true);
		release();
		expect(isActive?.()).toBe(false);
		abandoned.resolve({ rooms: [] });
		await abandoned.promise;
		expect(store.getSnapshot().rooms).toHaveLength(25);
	});
});
