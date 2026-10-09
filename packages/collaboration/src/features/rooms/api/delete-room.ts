import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { ROOM_HISTORY_CHANGED } from "./list-rooms";
import { roomWriteSchema } from "./room-schemas";

/** Mark a room inactive so it no longer appears in the current user's lists. */
export async function deleteRoom(
	actions: InsightActions,
	roomId: string,
): Promise<void> {
	const deleted = await callPixel(
		actions,
		pixel("RemoveUserRoom", { roomId }),
		roomWriteSchema,
	);
	if (!deleted) throw new Error("SEMOSS did not delete the room.");
	window.dispatchEvent(new Event(ROOM_HISTORY_CHANGED));
}
