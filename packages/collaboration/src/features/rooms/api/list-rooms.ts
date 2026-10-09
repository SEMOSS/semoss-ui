import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	mapPlaygroundRoom,
	playgroundRoomsSchema,
	type RoomRow,
} from "./room-schemas";

/** List collaboration-mode playground rooms once, newest first. */
export async function listRooms(actions: InsightActions): Promise<RoomRow[]> {
	const rows = await callPixel(
		actions,
		`META | ${pixel("GetPlaygroundRooms", { sort: ["DESC"], mode: "collaboration" })}`,
		playgroundRoomsSchema,
	);

	return rows.map(mapPlaygroundRoom);
}

export const ROOM_PAGE_SIZE = 25;
export const ROOM_HISTORY_CHANGED = "collaboration:room-history-changed";

/** Read one server page without changing the legacy all-rooms contract. */
export async function listRoomsPage(
	actions: InsightActions,
	offset = 0,
	search?: string,
	pinned?: boolean,
): Promise<{ rooms: RoomRow[]; hasMore: boolean; nextOffset: number }> {
	const rows = await callPixel(
		actions,
		`META | ${pixel("GetPlaygroundRooms", {
			mode: "collaboration",
			sort: ["DESC"],
			limit: ROOM_PAGE_SIZE,
			offset,
			search: search?.trim() || undefined,
			includeUnnamedRooms: true,
			pinned,
		})}`,
		playgroundRoomsSchema,
	);
	return {
		rooms: rows.map(mapPlaygroundRoom),
		hasMore: rows.length === ROOM_PAGE_SIZE,
		nextOffset: offset + rows.length,
	};
}
