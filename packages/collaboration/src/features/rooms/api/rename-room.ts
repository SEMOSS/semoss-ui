import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { ROOM_HISTORY_CHANGED } from "./list-rooms";
import { roomWriteSchema } from "./room-schemas";

/** Persist a user-authored room name for the current user. */
export async function renameRoom(
	actions: InsightActions,
	roomId: string,
	name: string,
): Promise<void> {
	const renamed = await callPixel(
		actions,
		pixel("SetRoomName", { roomId, roomName: name }),
		roomWriteSchema,
	);
	if (!renamed) throw new Error("SEMOSS did not rename the room.");
	window.dispatchEvent(new Event(ROOM_HISTORY_CHANGED));
}
