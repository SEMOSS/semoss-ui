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
