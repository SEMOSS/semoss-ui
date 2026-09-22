import type { RoomStore } from "@semoss/sdk";
import {
	roomMessageSchema,
	type ValidatedRoomMessage,
} from "./message-schemas";

/**
 * Load a room's persisted message history.
 *
 * The SDK types messages loosely (`[key: string]: unknown`), so each row is
 * validated here and rows that do not match are dropped rather than rendered.
 * Rich message parts are validated separately while building the transcript,
 * so one unsupported part cannot discard the rest of an otherwise valid row.
 *
 * @param room - The store for the room whose history to load.
 */
export async function getRoomMessages(
	room: RoomStore,
): Promise<ValidatedRoomMessage[]> {
	const messages = await room.getMessages();

	return messages.flatMap((message) => {
		const parsed = roomMessageSchema.safeParse(message);
		return parsed.success ? [parsed.data] : [];
	});
}
