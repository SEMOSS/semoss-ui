import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const threadRoomsSchema = z.object({
	threadId: z.string(),
	items: z.array(
		z.object({
			roomId: z.string(),
			name: z.string().nullish(),
			origin: z.string().nullish(),
			lastAt: z.string().nullish(),
		}),
	),
});

/** The chats that include a thread, most recently active first; origin "thread" was opened from it. */
export async function listThreadRooms(
	actions: InsightActions,
	threadId: string,
) {
	const result = await callPixel(
		actions,
		pixel("BrainListThreadRooms", { threadId }),
		threadRoomsSchema,
	);
	return result.items;
}

/** Record that a chat includes a thread, so reopening the thread finds the chat. */
export async function linkRoomThread(
	actions: InsightActions,
	roomId: string,
	threadId: string,
): Promise<void> {
	await callPixel(
		actions,
		pixel("BrainLinkRoomThread", { roomId, threadId }),
		z.object({ roomId: z.string() }),
	);
}
