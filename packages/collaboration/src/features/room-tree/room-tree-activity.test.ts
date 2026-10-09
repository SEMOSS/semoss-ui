import { afterEach, expect, it, vi } from "vitest";
import {
	readRoomTreeActivity,
	recordRoomTreeActivity,
	roomTreeActivityStorageKey,
} from "./room-tree-activity";

const firstSaved = "2026-10-08T12:00:00.000Z";
const lastSaved = "2026-10-08T15:00:00.000Z";
const key = roomTreeActivityStorageKey("one", "deployment-a");

afterEach(() => {
	vi.restoreAllMocks();
	localStorage.clear();
});

it("persists only room IDs and saved timestamps, normalizing timezones", () => {
	const activity = readRoomTreeActivity(key);
	expect(
		recordRoomTreeActivity(key, activity, {
			roomId: "room/one",
			dateUpdated: "2026-10-08T11:00:00-04:00",
			roomName: "A private title",
			content: "Private conversation content",
		}),
	).toBe(true);
	expect(activity.get("room/one")).toBe(lastSaved);
	expect(JSON.parse(localStorage.getItem(key) ?? "null")).toEqual({
		"room/one": lastSaved,
	});
	expect(readRoomTreeActivity(key)).toEqual(activity);
});

it("keeps the latest save when older or duplicate events arrive", () => {
	const activity = new Map<string, string>();
	const write = vi.spyOn(Storage.prototype, "setItem");
	recordRoomTreeActivity(key, activity, {
		roomId: "one",
		dateUpdated: lastSaved,
	});
	expect(
		recordRoomTreeActivity(key, activity, {
			roomId: "one",
			dateUpdated: firstSaved,
		}),
	).toBe(false);
	expect(
		recordRoomTreeActivity(key, activity, {
			roomId: "one",
			dateUpdated: lastSaved,
		}),
	).toBe(false);
	expect(activity.get("one")).toBe(lastSaved);
	expect(write).toHaveBeenCalledOnce();
});

it.each([
	null,
	{},
	{ roomId: "one", roomName: "Renamed room" },
	{ roomId: "one", dateCreated: firstSaved },
	{ roomId: "", dateUpdated: firstSaved },
	{ roomId: "  ", dateUpdated: firstSaved },
	{ roomId: 1, dateUpdated: firstSaved },
	{ roomId: "one", dateUpdated: 1 },
	{ roomId: "one", dateUpdated: "5" },
	{ roomId: "one", dateUpdated: "yesterday" },
	{ roomId: "one", dateUpdated: "2026-02-30T12:00:00Z" },
])("ignores malformed or non-save details %j", (detail) => {
	const activity = new Map<string, string>();
	expect(recordRoomTreeActivity(key, activity, detail)).toBe(false);
	expect(activity.size).toBe(0);
	expect(localStorage.getItem(key)).toBeNull();
});

it.each(["{", "null", "[]", "true", '"room-one"'])(
	"ignores malformed storage %s",
	(stored) => {
		localStorage.setItem(key, stored);
		expect(readRoomTreeActivity(key).size).toBe(0);
	},
);

it("restores valid stored entries independently of malformed entries", () => {
	localStorage.setItem(
		key,
		JSON.stringify({
			valid: firstSaved,
			invalid: "not a timestamp",
			"": lastSaved,
			nested: { roomName: "Not recency data" },
		}),
	);
	expect(readRoomTreeActivity(key)).toEqual(new Map([["valid", firstSaved]]));
});

it("isolates recency by account, deployment, and storage version", () => {
	const activity = new Map<string, string>();
	recordRoomTreeActivity(key, activity, {
		roomId: "one",
		dateUpdated: firstSaved,
	});
	expect(
		readRoomTreeActivity(roomTreeActivityStorageKey("two", "deployment-a"))
			.size,
	).toBe(0);
	expect(
		readRoomTreeActivity(roomTreeActivityStorageKey("one", "deployment-b"))
			.size,
	).toBe(0);
	expect(readRoomTreeActivity(key.replace(":v1:", ":v2:")).size).toBe(0);
	expect(roomTreeActivityStorageKey("one:two", "three")).not.toBe(
		roomTreeActivityStorageKey("two", "three:one"),
	);
});

it("continues tracking live recency when storage reads or writes fail", () => {
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("Storage blocked");
	});
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("Storage blocked");
	});
	const activity = readRoomTreeActivity(key);
	expect(activity.size).toBe(0);
	expect(
		recordRoomTreeActivity(key, activity, {
			roomId: "one",
			dateUpdated: firstSaved,
		}),
	).toBe(true);
	expect(activity.get("one")).toBe(firstSaved);
});

it("handles an unavailable localStorage property", () => {
	vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
		throw new Error("Storage unavailable");
	});
	const activity = readRoomTreeActivity(key);
	expect(
		recordRoomTreeActivity(key, activity, {
			roomId: "one",
			dateUpdated: firstSaved,
		}),
	).toBe(true);
	expect(activity.get("one")).toBe(firstSaved);
});
