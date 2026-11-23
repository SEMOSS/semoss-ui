import { describe, expect, it } from "vitest";
import {
	buildPlaygroundRoomsPixel,
	DEFAULT_ROOM_LIST_VIEW,
	groupRoomList,
	isRoomListView,
	type RoomListItem,
	type RoomListView,
} from "./room-list";

const now = new Date();
const daysAgo = (days: number) =>
	new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const room = (id: string, extra: Partial<RoomListItem> = {}): RoomListItem => ({
	ROOM_ID: id,
	ROOM_NAME: id,
	DATE_CREATED: daysAgo(30),
	DATE_UPDATED: daysAgo(0),
	...extra,
});

const view = (extra: Partial<RoomListView> = {}): RoomListView => ({
	...DEFAULT_ROOM_LIST_VIEW,
	...extra,
});

const shape = (sections: ReturnType<typeof groupRoomList>) =>
	sections.map((section) => [
		section.key,
		section.rooms.map((r) => r.ROOM_ID),
	]);

describe("buildPlaygroundRoomsPixel", () => {
	it("sends the view, paging, search, and room ids", () => {
		// date groups are drawn in the browser, so the server is not asked to group
		expect(
			buildPlaygroundRoomsPixel(
				view({ sortBy: "name", sortDir: "ASC", groupBy: "agent" }),
				{ limit: 25, offset: 50, search: "plan" },
			),
		).toBe(
			'META | GetPlaygroundRooms(sortBy=["name"], sort=["ASC"], groupBy=["agent"], search=["<encode>plan</encode>"], limit=[25], offset=[50]);',
		);
		expect(buildPlaygroundRoomsPixel(view(), { roomIds: ["a", "b"] })).toBe(
			'META | GetPlaygroundRooms(sortBy=["dateUpdated"], sort=["DESC"], groupBy=["none"], roomIds=["a","b"]);',
		);
	});
});

describe("buildPlaygroundRoomsPixel search", () => {
	it("searches messages and filters by agent in the same call", () => {
		expect(
			buildPlaygroundRoomsPixel(view(), {
				search: "q3",
				searchMessages: true,
				workspaceId: "ws-1",
				limit: 30,
			}),
		).toBe(
			'META | GetPlaygroundRooms(sortBy=["dateUpdated"], sort=["DESC"], groupBy=["none"], search=["<encode>q3</encode>"], searchMessages=[true], workspaceId=["ws-1"], limit=[30]);',
		);
		// message search needs something to search for
		expect(
			buildPlaygroundRoomsPixel(view(), { searchMessages: true }),
		).not.toContain("searchMessages");
	});
});

describe("isRoomListView", () => {
	it("accepts only a complete, known view", () => {
		expect(isRoomListView(DEFAULT_ROOM_LIST_VIEW)).toBe(true);
		expect(isRoomListView({ ...DEFAULT_ROOM_LIST_VIEW, sortBy: "x" })).toBe(
			false,
		);
		expect(isRoomListView({ sortBy: "name" })).toBe(false);
		expect(isRoomListView(null)).toBe(false);
		expect(isRoomListView("dateUpdated")).toBe(false);
	});
});

describe("groupRoomList", () => {
	it("puts favorites first, then buckets of last activity", () => {
		const rooms = [
			room("pinned", { PINNED: true, DATE_UPDATED: daysAgo(40) }),
			room("today"),
			room("old", { DATE_UPDATED: daysAgo(400) }),
		];
		expect(shape(groupRoomList(rooms, view()))).toEqual([
			["pinned", ["pinned"]],
			["date:today", ["today"]],
			["date:older", ["old"]],
		]);
		// a room never written to falls back to its creation date
		expect(
			shape(
				groupRoomList(
					[room("legacy", { DATE_UPDATED: undefined })],
					view(),
				),
			),
		).toEqual([["date:lastMonth", ["legacy"]]]);
	});

	it("lists rooms in one section when sorted by name", () => {
		const rooms = [room("a", { PINNED: true }), room("b"), room("c")];
		expect(shape(groupRoomList(rooms, view({ sortBy: "name" })))).toEqual([
			["pinned", ["a"]],
			["all", ["b", "c"]],
		]);
	});

	it("groups by agent, favorites staying in their group", () => {
		const rooms = [
			room("a1", {
				WORKSPACE_ID: "a",
				WORKSPACE_NAME: "A",
				PINNED: true,
			}),
			room("a2", { WORKSPACE_ID: "a", WORKSPACE_NAME: "A" }),
			room("none", { WORKSPACE_ID: null }),
		];
		const sections = groupRoomList(rooms, view({ groupBy: "agent" }));
		expect(shape(sections)).toEqual([
			["agent:a", ["a1", "a2"]],
			["noAgent", ["none"]],
		]);
		expect(sections[0]?.heading).toEqual({
			type: "agent",
			workspaceId: "a",
			workspaceName: "A",
		});
	});

	it("leads with unsaved rooms, after favorites when grouped by date", () => {
		const rooms = [room("pinned", { PINNED: true }), room("saved")];
		const pending = [room("new1"), room("new2")];
		expect(shape(groupRoomList(rooms, view(), pending))).toEqual([
			["pinned", ["pinned"]],
			["date:today", ["new1", "new2", "saved"]],
		]);
		// a group no saved room is in yet opens at the top
		expect(
			shape(
				groupRoomList(
					[room("a", { WORKSPACE_ID: "a" })],
					view({ groupBy: "agent" }),
					[room("new", { WORKSPACE_ID: "b" })],
				),
			),
		).toEqual([
			["agent:b", ["new"]],
			["agent:a", ["a"]],
		]);
	});

	it("keeps No agent last for an unsaved room", () => {
		const sections = groupRoomList(
			[room("a", { WORKSPACE_ID: "a" })],
			view({ groupBy: "agent" }),
			[room("new", { WORKSPACE_ID: null })],
		);
		expect(shape(sections)).toEqual([
			["agent:a", ["a"]],
			["noAgent", ["new"]],
		]);
	});

	it("does not change the rooms it is given", () => {
		const rooms = [room("b"), room("a", { PINNED: true })];
		const pending = [room("new")];
		groupRoomList(rooms, view(), pending);
		expect(rooms.map((r) => r.ROOM_ID)).toEqual(["b", "a"]);
		expect(pending.map((r) => r.ROOM_ID)).toEqual(["new"]);
	});
});
