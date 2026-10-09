import { describe, expect, it } from "vitest";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import {
	groupRoomTree,
	type RoomTreeAssociation,
	type RoomTreeThreadMetadata,
	type RoomTreeTopicMetadata,
} from "./room-tree-grouping";

const topics: RoomTreeTopicMetadata[] = [
	{ id: "alpha", name: "Alpha", short: "A", status: "active" },
	{ id: "beta", name: "Beta", status: "dormant" },
	{ id: "gamma", name: "Gamma", status: "suggested" },
	{ id: "archived", name: "Archived", status: "archived" },
];

/** Keep fixtures focused on the metadata returned by the existing Brain reader. */
function thread(
	id: string,
	topicIds: string[],
	roomId?: string,
): RoomTreeThreadMetadata {
	return { id, roomId, topicLinks: topicIds.map((topicId) => ({ topicId })) };
}

describe("frontend room topic grouping", () => {
	it("lets an explicit source override legacy links and includes every available topic once", () => {
		const result = groupRoomTree(
			topics,
			[
				thread("source", [
					"alpha",
					"beta",
					"alpha",
					"archived",
					"missing",
				]),
				thread("legacy", ["gamma"], "room"),
			],
			[
				{
					roomId: "room",
					roomName: "Project discussion",
					dateCreated: "2026-10-08T10:00:00Z",
				},
			],
			new Map([["room", { threadId: "source" }]]),
			new Map(),
		);
		expect(result.rooms).toHaveLength(1);
		expect(result.rooms[0]).toMatchObject({
			roomId: "room",
			activityAt: "2026-10-08T10:00:00.000Z",
			topics: [
				{ topicId: "alpha", name: "Alpha", short: "A" },
				{ topicId: "beta", name: "Beta" },
			],
		});
	});

	it("uses all legacy links only when the source is verified absent", () => {
		const rooms = ["legacy", "broken", "unknown", "unchecked", "plain"].map(
			(roomId) => ({ roomId }),
		);
		const links = rooms.flatMap((room) => [
			thread(`${room.roomId}-source`, ["gamma"], room.roomId),
		]);
		links.push(thread("legacy-second", ["alpha"], "legacy"));
		const associations = new Map<string, RoomTreeAssociation>([
			["legacy", { threadId: null }],
			["broken", { threadId: null, unavailable: true }],
			["unknown", { threadId: "missing-thread" }],
			["plain", { threadId: "unfiled-thread" }],
		]);
		links.push(thread("unfiled-thread", []));
		const result = groupRoomTree(
			topics,
			links,
			rooms,
			associations,
			new Map(),
		);
		expect(
			result.rooms
				.find((room) => room.roomId === "legacy")
				?.topics.map((topic) => topic.topicId),
		).toEqual(["alpha", "gamma"]);
		expect(
			result.rooms
				.filter((room) => room.topics.length === 0)
				.map((room) => room.roomId),
		).toEqual(["unknown", "unchecked", "plain", "broken"]);
		expect(
			result.rooms
				.filter((room) => room.topicUnavailable)
				.map((room) => room.roomId),
		).toEqual(["unchecked", "broken"]);
	});

	it("keeps rooms with archived, unknown, or absent topics in the same list", () => {
		const result = groupRoomTree(
			topics,
			[
				thread("archived-source", ["archived"]),
				thread("missing-source", ["missing"]),
			],
			[
				{ roomId: "archived-room" },
				{ roomId: "missing-room" },
				{ roomId: "no-topic" },
			],
			new Map([
				["archived-room", { threadId: "archived-source" }],
				["missing-room", { threadId: "missing-source" }],
				["no-topic", { threadId: null }],
			]),
			new Map(),
		);
		expect(result.rooms.every((room) => room.topics.length === 0)).toBe(
			true,
		);
		expect(result.rooms.map((room) => room.roomId)).toEqual([
			"no-topic",
			"missing-room",
			"archived-room",
		]);
		expect(result.rooms.some((room) => room.topicUnavailable)).toBe(false);
	});

	it("sorts by the latest server or local saved activity, falling back to creation with UTC defaults", () => {
		const rooms: RoomRow[] = [
			{
				roomId: "local-new",
				dateCreated: "2025-01-01T00:00:00Z",
				dateUpdated: "2026-01-01T00:00:00Z",
			},
			{
				roomId: "server-new",
				dateCreated: "2025-01-01T00:00:00Z",
				dateUpdated: "2026-05-01T00:00:00Z",
			},
			{
				roomId: "fallback",
				dateCreated: "2026-03-01 00:00:00",
				dateUpdated: "not-a-date",
			},
			{ roomId: "tie-a", dateCreated: "2026-04-01T06:00:00-04:00" },
			{ roomId: "tie-z", dateCreated: "2026-04-01 10:00:00" },
			{
				roomId: "invalid",
				dateCreated: "invalid",
				dateUpdated: "invalid",
			},
			{ roomId: "missing" },
		];
		const result = groupRoomTree(
			[],
			[],
			rooms,
			new Map(rooms.map((room) => [room.roomId, { threadId: null }])),
			new Map([
				["local-new", "2026-04-02T00:00:00Z"],
				["server-new", "2026-02-01T00:00:00Z"],
				["fallback", "also-invalid"],
			]),
		);
		expect(result.rooms.map((room) => room.roomId)).toEqual([
			"server-new",
			"local-new",
			"tie-z",
			"tie-a",
			"fallback",
			"missing",
			"invalid",
		]);
		expect(result.rooms[1]).toMatchObject({
			dateCreated: "2025-01-01T00:00:00Z",
			dateUpdated: "2026-01-01T00:00:00Z",
			activityAt: "2026-04-02T00:00:00.000Z",
		});
		expect(result.rooms[2]?.activityAt).toBe("2026-04-01T10:00:00.000Z");
		expect(result.rooms.at(-1)?.activityAt).toBeUndefined();
	});

	it("orders each room's topics alphabetically by name then identity", () => {
		const result = groupRoomTree(
			[
				{ id: "z", name: "Alpha" },
				{ id: "a", name: "alpha" },
				{ id: "beta", name: "Beta" },
				{ id: "unused", name: "Unused" },
			],
			[thread("source", ["beta", "z", "a"])],
			[{ roomId: "room" }],
			new Map([["room", { threadId: "source" }]]),
			new Map(),
		);
		expect(result.rooms[0]?.topics.map((topic) => topic.topicId)).toEqual([
			"a",
			"z",
			"beta",
		]);
	});

	it("orders rooms across topics and places missing activity after pre-epoch timestamps", () => {
		const result = groupRoomTree(
			topics,
			[thread("a", ["alpha"]), thread("b", ["beta"])],
			[
				{ roomId: "new", dateCreated: "2026-01-01T00:00:00Z" },
				{ roomId: "old", dateCreated: "1960-01-01T00:00:00Z" },
				{ roomId: "unknown", dateCreated: "invalid" },
			],
			new Map([
				["new", { threadId: "b" }],
				["old", { threadId: "a" }],
				["unknown", { threadId: null }],
			]),
			new Map(),
		);
		expect(result.rooms.map((room) => room.roomId)).toEqual([
			"new",
			"old",
			"unknown",
		]);
	});

	it("returns full unique room lists for local pagination without mutating any input", () => {
		const rooms = Array.from({ length: 62 }, (_, index) => ({
			roomId: `room-${index}`,
			dateCreated: "2026-01-01T00:00:00Z",
		}));
		rooms.push({ ...rooms[0] });
		const threads = [thread("source", ["alpha", "beta"])];
		const associations = new Map(
			rooms.map((room) => [room.roomId, { threadId: "source" }]),
		);
		const before = JSON.stringify([
			topics,
			threads,
			rooms,
			[...associations],
		]);
		const result = groupRoomTree(
			topics,
			threads,
			rooms,
			associations,
			new Map(),
		);
		expect(result.rooms).toHaveLength(62);
		expect(result.rooms.every((room) => room.topics.length === 2)).toBe(
			true,
		);
		expect(
			JSON.stringify([topics, threads, rooms, [...associations]]),
		).toBe(before);
	});
});
