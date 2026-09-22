import { callPixel, type InsightActions } from "@/lib/pixel";
import {
	mapPlaygroundRoom,
	playgroundRoomsSchema,
	type RoomRow,
} from "./room-schemas";

/** List all playground rooms once, newest first. */
export async function listRooms(actions: InsightActions): Promise<RoomRow[]> {
	const rows = await callPixel(
		actions,
		'META | GetPlaygroundRooms(sort=["DESC"]);',
		playgroundRoomsSchema,
	);

	return rows.map(mapPlaygroundRoom);
}
