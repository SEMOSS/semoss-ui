import { z } from "@semoss/ui/next";
import { ROOM_TREE_CHANGED } from "@/features/room-tree/room-tree-events";
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
	threadId: z.string().nullish(),
	topics: z.array(roomTopicSchema),
});

/** One of a chat's topics: linked applies to the chat, suggested waits for the owner. */
export type RoomTopic = z.infer<typeof roomTopicSchema>;

type RoomAssociations = z.infer<typeof roomTopicsSchema>;
interface AssociationCache {
	value?: RoomAssociations;
	pending?: Promise<RoomAssociations>;
}
const associations = new WeakMap<
	InsightActions,
	Map<string, AssociationCache>
>();

/** One account's direct association read is shared by room chips, navigation, and attention. */
export function readRoomTopicAssociations(
	actions: InsightActions,
	roomId: string,
	refresh = false,
): Promise<RoomAssociations> {
	let cache = associations.get(actions);
	if (!cache) {
		cache = new Map();
		associations.set(actions, cache);
	}
	const prior = cache.get(roomId);
	if (!refresh && prior?.pending) return prior.pending;
	if (!refresh && prior?.value) return Promise.resolve(prior.value);
	const entry: AssociationCache = { value: prior?.value };
	cache.set(roomId, entry);
	const owner = cache;
	entry.pending = callPixel(
		actions,
		pixel("BrainListRoomTopics", { roomId }),
		roomTopicsSchema,
	)
		.then((result) => {
			if (result.roomId !== roomId)
				throw new Error("Received topics for a different room.");
			// A confirmed link write wins over an earlier read.
			if (owner.get(roomId) !== entry)
				return owner.get(roomId)?.value ?? result;
			entry.value = result;
			if (
				prior?.value
					? JSON.stringify(prior.value.topics) !==
						JSON.stringify(result.topics)
					: result.topics.length > 0
			) {
				window.dispatchEvent(
					new CustomEvent(ROOM_TREE_CHANGED, {
						detail: {
							actions,
							roomId,
							topics: result.topics,
							topicIds: [
								...new Set(
									[
										...(prior?.value?.topics ?? []),
										...result.topics,
									].map((topic) => topic.topicId),
								),
							],
						},
					}),
				);
			}
			return result;
		})
		.finally(() => {
			entry.pending = undefined;
		});
	return entry.pending;
}

export async function listRoomTopics(
	actions: InsightActions,
	roomId: string,
	refresh = false,
): Promise<RoomTopic[]> {
	return (await readRoomTopicAssociations(actions, roomId, refresh)).topics;
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
	if (result.roomId !== roomId)
		throw new Error("Received topics for a different room.");
	let cache = associations.get(actions);
	if (!cache) {
		cache = new Map();
		associations.set(actions, cache);
	}
	const previous = cache.get(roomId)?.value?.topics ?? [];
	cache.set(roomId, { value: result });
	window.dispatchEvent(
		new CustomEvent(ROOM_TREE_CHANGED, {
			detail: {
				actions,
				roomId,
				topicId,
				topics: result.topics,
				topicIds: [
					...new Set(
						[...previous, ...result.topics].map(
							(topic) => topic.topicId,
						),
					),
				],
			},
		}),
	);
	return result.topics;
}

const topicRoomsSchema = z.object({
	topicId: z.string().min(1),
	items: z.array(
		z.object({
			roomId: z.string().min(1),
			name: z.string().nullish(),
			lastAt: z.string().nullish(),
			linkedAt: z.string().nullish(),
			origin: z.string().nullish(),
		}),
	),
	total: z.number().int().nonnegative(),
});

/** Read saved direct associations, including rooms with no imported source thread. */
export async function listTopicRooms(
	actions: InsightActions,
	topicId: string,
	offset = 0,
) {
	const page = await callPixel(
		actions,
		pixel("BrainListTopicRooms", { topicId, limit: 25, offset }),
		topicRoomsSchema,
	);
	if (
		page.topicId !== topicId ||
		offset + page.items.length > page.total ||
		(!page.items.length && offset < page.total)
	)
		throw new Error(
			"Topic rooms changed while loading. Refresh to try again.",
		);
	return {
		rooms: page.items.map((room) => ({
			roomId: room.roomId,
			roomName: room.name ?? undefined,
			dateUpdated: room.lastAt ?? undefined,
		})),
		total: page.total,
		nextOffset: offset + page.items.length,
		hasMore: offset + page.items.length < page.total,
	};
}
