import {
	type DateBucket,
	getDateBucket,
	parseTimestampWithUtcDefault,
} from "@semoss/utility/date";

/** Column the room list is sorted by; `GetPlaygroundRooms`' `sortBy` key. */
export type RoomSortBy = "dateUpdated" | "name";

/** Direction of the sort; `GetPlaygroundRooms`' `sort` key. */
export type RoomSortDirection = "ASC" | "DESC";

/**
 * How the room list is grouped: by date of last activity, or by agent. Date
 * groups are drawn in the browser, so the server gets `groupBy=none` for them.
 */
export type RoomGroupBy = "date" | "agent";

/** The user's choice of order and grouping for the room list. */
export interface RoomListView {
	sortBy: RoomSortBy;
	sortDir: RoomSortDirection;
	groupBy: RoomGroupBy;
}

/** Most recently active first, grouped by date. */
export const DEFAULT_ROOM_LIST_VIEW: RoomListView = {
	sortBy: "dateUpdated",
	sortDir: "DESC",
	groupBy: "date",
};

/** One room as `GetPlaygroundRooms` lists it with `sortBy`/`groupBy`. */
export interface RoomListItem {
	ROOM_ID: string;
	ROOM_NAME: string;
	DATE_CREATED: string;
	/** Last activity; the creation date for a room never written to since. */
	DATE_UPDATED?: string;
	PINNED?: boolean | null;
	/** The agent the room was started with, if any. */
	WORKSPACE_ID?: string | null;
	WORKSPACE_NAME?: string | null;
	/** With a search: whether the name matched, rather than only a message. */
	NAME_MATCH?: boolean;
}

const SORT_BY_VALUES: readonly RoomSortBy[] = ["dateUpdated", "name"];
const GROUP_BY_VALUES: readonly RoomGroupBy[] = ["date", "agent"];

/** Whether a stored value is a complete, known room list view. */
export const isRoomListView = (value: unknown): value is RoomListView => {
	if (!value || typeof value !== "object") {
		return false;
	}
	const view = value as Record<string, unknown>;
	return (
		SORT_BY_VALUES.includes(view.sortBy as RoomSortBy) &&
		(view.sortDir === "ASC" || view.sortDir === "DESC") &&
		GROUP_BY_VALUES.includes(view.groupBy as RoomGroupBy)
	);
};

/** Paging, search, and room filters for one `GetPlaygroundRooms` call. */
export interface PlaygroundRoomsQuery {
	limit?: number;
	offset?: number;
	/** Matches room names, case-insensitively. */
	search?: string;
	/** Whether `search` also matches message text; name matches come first. */
	searchMessages?: boolean;
	/** Only rooms started with this agent. */
	workspaceId?: string;
	/** Only these rooms. */
	roomIds?: readonly string[];
}

/**
 * The `GetPlaygroundRooms` pixel for a view: grouped, pinned rooms first, then
 * sorted, each room with its last activity, agent, and pending actions.
 */
export const buildPlaygroundRoomsPixel = (
	view: RoomListView,
	{
		limit,
		offset,
		search,
		searchMessages,
		workspaceId,
		roomIds,
	}: PlaygroundRoomsQuery = {},
): string => {
	const keys = [
		`sortBy=["${view.sortBy}"]`,
		`sort=["${view.sortDir}"]`,
		`groupBy=["${view.groupBy === "agent" ? "agent" : "none"}"]`,
	];
	if (search) {
		keys.push(`search=["<encode>${search}</encode>"]`);
		if (searchMessages) {
			keys.push("searchMessages=[true]");
		}
	}
	if (workspaceId) {
		keys.push(`workspaceId=${JSON.stringify([workspaceId])}`);
	}
	if (roomIds) {
		keys.push(`roomIds=${JSON.stringify(roomIds)}`);
	}
	if (limit !== undefined) {
		keys.push(`limit=[${limit}]`);
	}
	if (offset !== undefined) {
		keys.push(`offset=[${offset}]`);
	}
	return `META | GetPlaygroundRooms(${keys.join(", ")});`;
};

/** A room's last activity, which date groups and the date sort use. */
export const getRoomDate = (room: RoomListItem): string =>
	room.DATE_UPDATED ?? room.DATE_CREATED;

/** What heads one section of the room list. */
export type RoomListHeading =
	| { type: "pinned" }
	| { type: "date"; bucket: DateBucket }
	| { type: "all" }
	| { type: "agent"; workspaceId: string; workspaceName: string }
	| { type: "noAgent" };

/** One headed run of rooms. */
export interface RoomListSection {
	key: string;
	heading: RoomListHeading;
	rooms: RoomListItem[];
}

const headingOf = (
	room: RoomListItem,
	view: RoomListView,
): { key: string; heading: RoomListHeading } => {
	if (view.groupBy === "agent") {
		return room.WORKSPACE_ID
			? {
					key: `agent:${room.WORKSPACE_ID}`,
					heading: {
						type: "agent",
						workspaceId: room.WORKSPACE_ID,
						workspaceName: room.WORKSPACE_NAME ?? "",
					},
				}
			: { key: "noAgent", heading: { type: "noAgent" } };
	}
	if (room.PINNED) {
		return { key: "pinned", heading: { type: "pinned" } };
	}
	if (view.sortBy === "name") {
		return { key: "all", heading: { type: "all" } };
	}
	const bucket = getDateBucket(
		parseTimestampWithUtcDefault(getRoomDate(room)),
	);
	return { key: `date:${bucket}`, heading: { type: "date", bucket } };
};

/**
 * Where a section for an unsaved room goes: by date, after the favorites; by
 * agent, at the top, except "No agent", which always ends the list.
 */
const insertAt = (
	sections: readonly RoomListSection[],
	key: string,
	view: RoomListView,
): number => {
	if (view.groupBy === "date") {
		return sections[0]?.key === "pinned" ? 1 : 0;
	}
	return key === "noAgent" ? sections.length : 0;
};

/**
 * Split the list into headed sections, keeping the server's order: the server
 * orders by group, then pinned rooms, then the sort, so each section is one
 * run. By date, pinned rooms head the list, then date buckets (or one
 * section when sorted by name, since name order splits the dates up); by
 * agent, pinned rooms lead their agent's group.
 *
 * Rooms not saved yet (`pending`) lead the list: by agent, at the top of their
 * group; by date, right after the pinned rooms.
 */
export const groupRoomList = (
	rooms: readonly RoomListItem[],
	view: RoomListView,
	pending: readonly RoomListItem[] = [],
): RoomListSection[] => {
	const sections: RoomListSection[] = [];
	const byKey = new Map<string, RoomListSection>();
	for (const room of rooms) {
		const { key, heading } = headingOf(room, view);
		let section = byKey.get(key);
		if (!section) {
			section = { key, heading, rooms: [] };
			byKey.set(key, section);
			sections.push(section);
		}
		section.rooms.push(room);
	}

	// walk backwards so the first pending room ends up first
	for (const room of [...pending].reverse()) {
		const { key, heading } = headingOf(room, view);
		const section = byKey.get(key);
		if (section) {
			section.rooms.unshift(room);
			continue;
		}
		const created = { key, heading, rooms: [room] };
		byKey.set(key, created);
		sections.splice(insertAt(sections, key, view), 0, created);
	}
	return sections;
};
