import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const roomTopicSchema = z.object({
	topicId: z.string(),
	name: z.string().nullish(),
	state: z.enum(["linked", "suggested", "dismissed"]),
	origin: z.string().nullish(),
	changedAt: z.string().nullish(),
});

const roomTopicsSchema = z.object({
	roomId: z.string(),
	topics: z.array(roomTopicSchema),
});

/** One of a chat's topics: linked applies to the chat, suggested waits for the owner. */
export type RoomTopic = z.infer<typeof roomTopicSchema>;

/** The chat's topics, as Brain and the owner left them. */
export async function listRoomTopics(
	actions: InsightActions,
	roomId: string,
): Promise<RoomTopic[]> {
	const result = await callPixel(
		actions,
		pixel("BrainListRoomTopics", { roomId }),
		roomTopicsSchema,
	);
	return result.topics;
}

/** Set or accept a topic on the chat, or remove it (it stays dismissed). */
export async function linkRoomTopic(
	actions: InsightActions,
	roomId: string,
	topicId: string,
	remove = false,
): Promise<RoomTopic[]> {
	const result = await callPixel(
		actions,
		pixel("BrainLinkRoomTopic", { roomId, topicId, remove }),
		roomTopicsSchema,
	);
	return result.topics;
}
