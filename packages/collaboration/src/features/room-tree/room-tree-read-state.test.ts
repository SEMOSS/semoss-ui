import { afterEach, describe, expect, it, vi } from "vitest";
import type { RoomTreeRoom } from "./room-tree.types";
import { createRoomReadState } from "./room-tree-read-state";

const key = "room-read:deployment-a:account-one";
const first = "2026-10-08T12:00:00.000Z";
const second = "2026-10-08T13:00:00.000Z";
const third = "2026-10-08T14:00:00.000Z";

function room(roomId: string, activityAt = first): RoomTreeRoom {
	return { roomId, activityAt, topics: [] };
}

afterEach(() => {
	vi.restoreAllMocks();
	localStorage.clear();
});

describe("room read state", () => {
	it("baselines complete history, including rooms beyond visible pagination", () => {
		const state = createRoomReadState(key);
		const rooms = Array.from({ length: 12 }, (_, index) =>
			room(`room-${index}`),
		);
		expect(state.observeRooms(rooms)).toBe(true);
		for (const savedRoom of rooms)
			expect(state.isUnread(savedRoom.roomId)).toBe(false);
		expect(state.observeRooms(rooms)).toBe(false);
		expect(state.observeRooms([...rooms, room("new")])).toBe(true);
		expect(state.isUnread("new")).toBe(true);
		expect(state.observeRooms([...rooms, room("new")])).toBe(false);
		expect(state.isUnread("new")).toBe(true);
	});

	it("treats a successful empty history as a baseline", () => {
		const state = createRoomReadState(key);
		expect(state.observeRooms([])).toBe(true);
		expect(state.observeRooms([])).toBe(false);
		state.observeRooms([room("new")]);
		expect(state.isUnread("new")).toBe(true);
	});

	it("does not clear live activity observed before the first history snapshot", () => {
		const state = createRoomReadState(key);
		expect(state.observeActivity("live", second)).toBe(true);
		state.observeRooms([room("live", first), room("existing")]);
		expect(state.isUnread("live")).toBe(true);
		expect(state.isUnread("existing")).toBe(false);
		expect(createRoomReadState(key).isUnread("live")).toBe(true);
	});

	it("retains pre-baseline live activity across reloads and duplicate summaries", () => {
		createRoomReadState(key).observeActivity("live", second);
		const state = createRoomReadState(key);
		state.observeRooms([
			room("live", third),
			room("existing", second),
			room("existing"),
		]);
		expect(state.isUnread("live")).toBe(true);
		expect(state.isUnread("existing")).toBe(false);
	});

	it("consumes saved activity rather than wall time and ignores duplicate or older events", () => {
		const state = createRoomReadState(key);
		state.observeRooms([room("one")]);
		expect(state.observeActivity("one", second)).toBe(true);
		expect(state.isUnread("one")).toBe(true);
		expect(state.markRead("one")).toBe(true);
		expect(state.isUnread("one")).toBe(false);
		expect(state.markRead("one")).toBe(false);
		expect(state.observeActivity("one", first)).toBe(false);
		expect(state.observeActivity("one", second)).toBe(false);
		expect(state.observeRooms([room("one", first)])).toBe(false);
		expect(state.isUnread("one")).toBe(false);
		expect(state.observeActivity("one", third)).toBe(true);
		expect(state.isUnread("one")).toBe(true);
		expect(state.markRead("unknown")).toBe(false);
	});

	it("normalizes timestamps and persists only versioned IDs and timestamps", () => {
		const state = createRoomReadState(key);
		state.observeRooms([
			{
				roomId: "one",
				topics: [],
				roomName: "Private title",
				dateCreated: first,
			},
		]);
		state.observeActivity("one", "2026-10-08T09:00:00-04:00");
		expect(JSON.parse(localStorage.getItem(key) ?? "null")).toEqual({
			version: 1,
			initialized: true,
			rooms: { one: { latestActivityAt: second, readActivityAt: first } },
		});
		expect(state.observeActivity("one", second)).toBe(false);
	});

	it("uses valid summary timestamp fallbacks and never marks undated rooms unread", () => {
		const state = createRoomReadState(key);
		state.observeRooms([]);
		state.observeRooms([
			{
				roomId: "updated",
				topics: [],
				activityAt: "invalid",
				dateUpdated: second,
				dateCreated: first,
			},
			{ roomId: "created", topics: [], dateCreated: first },
			{ roomId: "missing", topics: [] },
			{
				roomId: "invalid",
				topics: [],
				activityAt: "2026-02-30T12:00:00Z",
			},
		]);
		expect(state.isUnread("updated")).toBe(true);
		expect(state.isUnread("created")).toBe(true);
		expect(state.isUnread("missing")).toBe(false);
		expect(state.isUnread("invalid")).toBe(false);
		expect(state.markRead("missing")).toBe(false);
	});

	it.each([
		"",
		"yesterday",
		"5",
		"2026-02-30T12:00:00Z",
		"2026-10-08T12:00:00",
	])("ignores invalid or ambiguous activity %s", (activityAt) => {
		const state = createRoomReadState(key);
		expect(state.observeActivity("one", activityAt)).toBe(false);
		expect(state.isUnread("one")).toBe(false);
		expect(localStorage.getItem(key)).toBeNull();
	});

	it("ignores blank room IDs", () => {
		const state = createRoomReadState(key);
		expect(state.observeActivity("  ", first)).toBe(false);
		state.observeRooms([room("")]);
		expect(state.isUnread("")).toBe(false);
		expect(JSON.parse(localStorage.getItem(key) ?? "null").rooms).toEqual(
			{},
		);
	});

	it("restores read and unread rooms without repeating the initial baseline", () => {
		const state = createRoomReadState(key);
		state.observeRooms([room("read")]);
		state.observeActivity("unread", second);
		const restored = createRoomReadState(key);
		expect(restored.isUnread("read")).toBe(false);
		expect(restored.isUnread("unread")).toBe(true);
		restored.observeRooms([
			room("read"),
			room("unread", second),
			room("new"),
		]);
		expect(restored.isUnread("unread")).toBe(true);
		expect(restored.isUnread("new")).toBe(true);
	});

	it("keeps account and deployment keys independent", () => {
		createRoomReadState(key).observeActivity("one", second);
		for (const otherKey of [
			"room-read:deployment-b:account-one",
			"room-read:deployment-a:account-two",
		]) {
			const state = createRoomReadState(otherKey);
			expect(state.isUnread("one")).toBe(false);
			state.observeRooms([room("one")]);
			expect(state.isUnread("one")).toBe(false);
		}
		expect(createRoomReadState(key).isUnread("one")).toBe(true);
	});

	it.each([
		"{",
		"null",
		"[]",
		'{"version":2,"initialized":true,"rooms":{}}',
		'{"version":1,"initialized":"yes","rooms":{}}',
	])("recovers from corrupt or unsupported stored data %s", (saved) => {
		localStorage.setItem(key, saved);
		const state = createRoomReadState(key);
		expect(state.sync()).toBe(false);
		expect(state.observeRooms([room("one")])).toBe(true);
		expect(state.isUnread("one")).toBe(false);
		state.observeActivity("one", second);
		expect(state.isUnread("one")).toBe(true);
	});

	it("restores valid entries independently of malformed saved entries", () => {
		localStorage.setItem(
			key,
			JSON.stringify({
				version: 1,
				initialized: true,
				rooms: {
					valid: {
						latestActivityAt: "2026-10-08T09:00:00-04:00",
						readActivityAt: first,
					},
					invalid: { latestActivityAt: "tomorrow" },
					badRead: {
						latestActivityAt: second,
						readActivityAt: false,
					},
					"": { latestActivityAt: second },
				},
			}),
		);
		const state = createRoomReadState(key);
		expect(state.isUnread("valid")).toBe(true);
		expect(state.isUnread("invalid")).toBe(false);
		expect(state.isUnread("badRead")).toBe(false);
		expect(state.isUnread("")).toBe(false);
		expect(state.observeActivity("valid", second)).toBe(false);
	});

	it("continues in memory when storage reads and writes fail", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("Blocked");
		});
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("Quota exceeded");
		});
		const state = createRoomReadState(key);
		expect(state.observeRooms([room("one")])).toBe(true);
		expect(state.observeActivity("one", second)).toBe(true);
		expect(state.isUnread("one")).toBe(true);
		expect(state.markRead("one")).toBe(true);
		expect(state.isUnread("one")).toBe(false);
		expect(state.sync()).toBe(false);
	});

	it("continues in memory when localStorage itself is unavailable", () => {
		vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
			throw new Error("Unavailable");
		});
		const state = createRoomReadState(key);
		state.observeRooms([]);
		state.observeActivity("one", first);
		expect(state.isUnread("one")).toBe(true);
		state.markRead("one");
		expect(state.isUnread("one")).toBe(false);
	});

	it("merges activity and reads across tabs without write echoes", () => {
		const one = createRoomReadState(key);
		const two = createRoomReadState(key);
		one.observeRooms([room("one")]);
		const write = vi.spyOn(Storage.prototype, "setItem");
		expect(two.sync()).toBe(true);
		expect(two.sync()).toBe(false);
		expect(write).not.toHaveBeenCalled();
		two.observeActivity("one", second);
		expect(one.sync()).toBe(true);
		expect(one.isUnread("one")).toBe(true);
		one.markRead("one");
		expect(two.sync()).toBe(true);
		expect(two.isUnread("one")).toBe(false);
		expect(two.observeActivity("one", first)).toBe(false);
	});

	it("merges the initialized flag before a stale tab receives its first snapshot", () => {
		const one = createRoomReadState(key);
		const two = createRoomReadState(key);
		one.observeRooms([room("old")]);
		two.observeRooms([room("old"), room("new")]);
		expect(two.isUnread("new")).toBe(true);
		expect(two.isUnread("old")).toBe(false);
	});

	it("merges stored records before writes and never moves read markers backward", () => {
		const one = createRoomReadState(key);
		one.observeRooms([room("shared")]);
		const stale = createRoomReadState(key);
		one.observeActivity("shared", third);
		one.markRead("shared");
		one.observeActivity("remote", second);
		stale.observeActivity("local", second);
		const restored = createRoomReadState(key);
		expect(restored.isUnread("shared")).toBe(false);
		expect(restored.isUnread("remote")).toBe(true);
		expect(restored.isUnread("local")).toBe(true);
		expect(stale.observeActivity("shared", second)).toBe(false);
	});

	it("markRead cannot consume newer activity that was unknown before its storage merge", () => {
		const active = createRoomReadState(key);
		active.observeRooms([]);
		active.observeActivity("one", first);
		const stale = createRoomReadState(key);
		active.observeActivity("one", second);
		expect(stale.markRead("one")).toBe(true);
		expect(stale.isUnread("one")).toBe(true);
		expect(createRoomReadState(key).isUnread("one")).toBe(true);
		expect(stale.markRead("one")).toBe(true);
		expect(stale.isUnread("one")).toBe(false);
	});

	it("does not regress in-memory markers if storage is cleared or replaced by stale values", () => {
		const state = createRoomReadState(key);
		state.observeRooms([room("one")]);
		const older = localStorage.getItem(key) ?? "";
		state.observeActivity("one", third);
		state.markRead("one");
		localStorage.setItem(key, older);
		expect(state.sync()).toBe(false);
		expect(state.observeActivity("one", second)).toBe(false);
		localStorage.removeItem(key);
		expect(state.sync()).toBe(false);
		expect(state.isUnread("one")).toBe(false);
		state.observeRooms([room("new")]);
		expect(state.isUnread("new")).toBe(true);
	});
});
