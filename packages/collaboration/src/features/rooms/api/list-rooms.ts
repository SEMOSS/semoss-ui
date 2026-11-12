import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	mapPlaygroundRoom,
	playgroundRoomsSchema,
	type RoomRow,
} from "./room-schemas";

export const ROOM_PAGE_SIZE = 25;
export const ROOM_HISTORY_CHANGED = "collaboration:room-history-changed";

/** Read one server page of collaboration-mode playground rooms, newest first. */
export async function listRoomsPage(
	actions: InsightActions,
	offset = 0,
	search?: string,
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
		})}`,
		playgroundRoomsSchema,
	);
	return {
		rooms: rows.map(mapPlaygroundRoom),
		hasMore: rows.length === ROOM_PAGE_SIZE,
		nextOffset: offset + rows.length,
	};
}
