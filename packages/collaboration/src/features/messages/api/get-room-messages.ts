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

/** Return the latest assistant tail, including invisible cancellation notes. */
export function latestAssistantTail(messages: ValidatedRoomMessage[]): string {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		const io = message.io?.toUpperCase();
		const role = message.role?.toLowerCase();
		const type = message.type?.toUpperCase() ?? "";
		if (
			io === "OUTPUT" ||
			role === "assistant" ||
			type.startsWith("RESPONSE")
		) {
			return message.messageId;
		}
	}
	return "ROOT_PLACEHOLDER_ID";
}
