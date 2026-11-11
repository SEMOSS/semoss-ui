import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { type RoomRow, readableRoomName } from "./room-schemas";

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

const topicRoomsSchema = z.object({
	items: z.array(
		z.object({
			roomId: z.string(),
			name: z.string().nullish(),
			origin: z.string().nullish(),
			lastAt: z.string().nullish(),
		}),
	),
});

/** A chat linked to a topic. Origin says who linked it: you, thread (its source thread), brain or agent. */
export interface TopicRoom extends RoomRow {
	origin?: string;
}

/** The open chats linked to a topic, most recently active first. */
export async function listTopicRooms(
	actions: InsightActions,
	topicId: string,
): Promise<TopicRoom[]> {
	const result = await callPixel(
		actions,
		// shortcut: reads at most 500 chats per topic, page with offset if a topic outgrows it
		pixel("BrainListTopicRooms", { topicId, limit: 500 }),
		topicRoomsSchema,
	);
	return result.items.map((room) => ({
		roomId: room.roomId,
		roomName: readableRoomName(room.name),
		dateUpdated: room.lastAt ?? undefined,
		origin: room.origin ?? undefined,
	}));
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
