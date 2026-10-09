import { waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { listRoomTree } from "./api/list-room-tree";
import { createRoomTreeStore } from "./room-tree.store";
import type { RoomTreeResponse } from "./room-tree.types";
import { createRoomReadState } from "./room-tree-read-state";

vi.mock("./api/list-room-tree", () => ({ listRoomTree: vi.fn() }));
const actions = {} as InsightActions;
const list = vi.mocked(listRoomTree);
const page = (offset = 0, count = 25, hasMore = true): RoomTreeResponse => ({
	rooms: Array.from({ length: count }, (_, index) => ({
		roomId: `r${offset + index}`,
		roomName: `Room ${offset + index}`,
		topics: [],
		activityAt: "2026-10-08T12:00:00Z",
		pinned: true,
	})),
	hasMore,
	nextOffset: offset + count,
});
beforeEach(() => {
	vi.resetAllMocks();
	localStorage.clear();
	list.mockImplementation(async (_actions, _activity, _active, offset = 0) =>
		page(offset, offset ? 2 : 25, !offset),
	);
});
it("requests server pages on demand and keeps pin coverage explicitly partial", async () => {
	const store = createRoomTreeStore(() => actions);
	const release = store.retain();
	await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
	expect(store.getSnapshot().rooms).toHaveLength(25);
	expect(store.getSnapshot().pinsComplete).toBe(false);
	expect(list).toHaveBeenCalledTimes(1);
	store.loadMore();
	await waitFor(() => expect(store.getSnapshot().rooms).toHaveLength(27));
	expect(list.mock.calls[1][3]).toBe(25);
	expect(store.getSnapshot().pinsComplete).toBe(true);
	release();
});
it("retains loaded rows and scroll through failure and uses explicit retry", async () => {
	const store = createRoomTreeStore(() => actions);
	const release = store.retain();
	await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
	store.scrollTop.current = 200;
	list.mockRejectedValueOnce(new Error("Offline"));
	store.loadMore();
	await waitFor(() => expect(store.getSnapshot().error).toBe("Offline"));
	expect(store.getSnapshot().rooms).toHaveLength(25);
	expect(store.scrollTop.current).toBe(200);
	store.retry();
	await waitFor(() => expect(store.getSnapshot().error).toBe(""));
	expect(store.scrollTop.current).toBe(200);
	release();
});
it("does not publish an abandoned account read", async () => {
	let finish: (value: RoomTreeResponse) => void = () => undefined;
	list.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const store = createRoomTreeStore(() => actions);
	const release = store.retain();
	release();
	finish(page());
	await Promise.resolve();
	expect(store.getSnapshot().rooms).toEqual([]);
});
it("does not restore an unpinned room from a read started before its confirmed write", async () => {
	const store = createRoomTreeStore(() => actions);
	const release = store.retain();
	await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
	let finish: (value: RoomTreeResponse) => void = () => undefined;
	list.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	store.refresh();
	store.recordPin("r0", false);
	finish(page());
	await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
	expect(store.getSnapshot().rooms.some((room) => room.roomId === "r0")).toBe(
		false,
	);
	expect(store.getSnapshot().pinStates?.r0).toBe(false);
	release();
});
it("tracks unread activity locally without another network read and consumes it while viewed", async () => {
	const store = createRoomTreeStore(
		() => actions,
		new Map(),
		createRoomReadState("read-one"),
	);
	const release = store.retain();
	await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
	store.recordActivity("r0", "2026-10-09T12:00:00Z");
	expect(store.getSnapshot().rooms[0].isUnread).toBe(true);
	const stop = store.viewRoom("r0");
	expect(store.getSnapshot().rooms[0].isUnread).toBe(false);
	expect(list).toHaveBeenCalledTimes(1);
	stop();
	release();
});
it("updates direct topic associations without a collection reload", async () => {
	const store = createRoomTreeStore(() => actions);
	const release = store.retain();
	await waitFor(() => expect(store.getSnapshot().isLoading).toBe(false));
	store.recordTopics("r0", [
		{ topicId: "direct", name: "Direct", state: "linked" },
		{ topicId: "dismissed", state: "dismissed" },
	]);
	expect(store.getSnapshot().rooms[0].topics).toEqual([
		{ topicId: "direct", name: "Direct" },
	]);
	expect(list).toHaveBeenCalledTimes(1);
	release();
});
