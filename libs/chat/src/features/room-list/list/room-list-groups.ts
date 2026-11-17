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
	/** The column rooms are sorted by. */
	sortBy: RoomSortBy;
	/** The direction of the sort. */
	sortDir: RoomSortDirection;
	/** How rooms are split into sections. */
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
	/** The room's id. */
	ROOM_ID: string;
	/** The room's name; blank until it is named. */
	ROOM_NAME: string;
	/** When the room was created. */
	DATE_CREATED: string;
	/** Last activity; the creation date for a room never written to since. */
	DATE_UPDATED?: string;
	/** Whether the user made the room a favorite. */
	PINNED?: boolean | null;
	/** The agent the room was started with, if any. */
	WORKSPACE_ID?: string | null;
	/** That agent's name. */
	WORKSPACE_NAME?: string | null;
	/** With a search: whether the name matched, rather than only a message. */
	NAME_MATCH?: boolean;
}

/** Every sort column, to check a stored view against. */
const SORT_BY_VALUES: readonly RoomSortBy[] = ["dateUpdated", "name"];
/** Every grouping, to check a stored view against. */
const GROUP_BY_VALUES: readonly RoomGroupBy[] = ["date", "agent"];

/**
 * Whether a stored value is a complete, known room list view.
 *
 * @param value - What was read from storage.
 * @returns Whether every field holds a value the list knows.
 */
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
	/** How many rooms to return. */
	limit?: number;
	/** How many rooms to skip, for the next page. */
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
 *
 * @param view - The order and grouping to ask for.
 * @param query - Paging, search, and filters; all optional.
 * @returns The pixel to run.
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
		// encoded, so quotes and brackets in the text cannot break the pixel
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
export interface RoomListGroup {
	/** Names the section, stable across pages; kept when the user collapses it. */
	key: string;
	/** What heads the section. */
	heading: RoomListHeading;
	/** The section's rooms, in the server's order. */
	rooms: RoomListItem[];
}

/**
 * The section a room belongs in for a view.
 *
 * @param room - The room to place.
 * @param view - The list's order and grouping.
 * @returns The section's key and heading.
 */
const getRoomSection = (
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
 *
 * @param sections - The sections so far.
 * @param key - The new section's key.
 * @param view - The list's order and grouping.
 * @returns The index to insert the new section at.
 */
const getNewSectionIndex = (
	sections: readonly RoomListGroup[],
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
 *
 * @param rooms - The rooms the server returned, in its order.
 * @param view - The list's order and grouping.
 * @param pending - Rooms shown before the server has them.
 * @returns The list's sections, in order.
 */
export const groupRoomList = (
	rooms: readonly RoomListItem[],
	view: RoomListView,
	pending: readonly RoomListItem[] = [],
): RoomListGroup[] => {
	const sections: RoomListGroup[] = [];
	const byKey = new Map<string, RoomListGroup>();
	for (const room of rooms) {
		const { key, heading } = getRoomSection(room, view);
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
		const { key, heading } = getRoomSection(room, view);
		const section = byKey.get(key);
		if (section) {
			section.rooms.unshift(room);
			continue;
		}
		const created = { key, heading, rooms: [room] };
		byKey.set(key, created);
		sections.splice(getNewSectionIndex(sections, key, view), 0, created);
	}
	return sections;
};
