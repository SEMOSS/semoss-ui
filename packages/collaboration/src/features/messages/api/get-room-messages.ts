import { callPixel, type InsightActions } from "@/lib/pixel";
import {
	playgroundMessagesSchema,
	type ValidatedRoomMessage,
} from "./message-schemas";

/** Load and validate a playground room's complete durable history. */
export async function getRoomMessages(
	actions: InsightActions,
	roomId: string,
): Promise<ValidatedRoomMessage[]> {
	return callPixel(
		actions,
		`GetPlaygroundMessages(roomId=${JSON.stringify([roomId])});`,
		playgroundMessagesSchema,
	);
}
