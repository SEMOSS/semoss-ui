import { expect, it } from "vitest";
import { groupRoomTree } from "./room-tree-grouping";

it("shows only saved linked topics, independent of source threads", () => {
	const result = groupRoomTree(
		[{ roomId: "one" }],
		new Map([
			[
				"one",
				{
					topics: [
						{ topicId: "beta", name: "Beta", state: "linked" },
						{ topicId: "alpha", name: "Alpha", state: "linked" },
						{ topicId: "dismissed", state: "dismissed" },
						{ topicId: "suggested", state: "suggested" },
					],
				},
			],
		]),
		new Map(),
	);
	expect(result.rooms[0].topics.map((topic) => topic.topicId)).toEqual([
		"alpha",
		"beta",
	]);
});
it("keeps unknown associations visible without inventing links", () => {
	expect(
		groupRoomTree([{ roomId: "unknown" }], new Map(), new Map()).rooms[0],
	).toMatchObject({ topics: [], topicUnavailable: true });
});
it("orders known activity before missing dates, uses UTC and preserves confirmed local activity", () => {
	const rooms = [
		{ roomId: "unknown" },
		{ roomId: "old", dateUpdated: "2026-10-08 12:00:00" },
		{ roomId: "new", dateUpdated: "2026-10-09T12:00:00Z" },
	];
	const result = groupRoomTree(
		rooms,
		new Map(),
		new Map([["old", "2026-10-10T12:00:00Z"]]),
	);
	expect(result.rooms.map((room) => room.roomId)).toEqual([
		"old",
		"new",
		"unknown",
	]);
	expect(rooms[0].roomId).toBe("unknown");
});
