import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import type {
	RoomTreeResponse,
	RoomTreeRoom,
	RoomTreeTopic,
} from "./room-tree.types";

/** The lightweight fields supplied by BrainListTopics. */
export interface RoomTreeTopicMetadata {
	id: string;
	name: string;
	short?: string;
	status?: string;
}

/** Brain thread links, including the older direct room association. */
export interface RoomTreeThreadMetadata {
	id: string;
	roomId?: string | null;
	topicLinks: { topicId: string }[];
}

/** A null identity means the source metadata was read and no explicit link exists. */
export interface RoomTreeAssociation {
	threadId: string | null;
	unavailable?: boolean;
}

/** Normalize SEMOSS timestamps before comparing local and server activity. */
function activityTime(value: string | undefined): number | null {
	if (!value) return null;
	const parsed = parseTimestampWithUtcDefault(value);
	return parsed.isValid() ? parsed.valueOf() : null;
}

/** Missing dates follow known activity, including dates before the Unix epoch. */
function compareActivity(left: number | null, right: number | null): number {
	if (left === right) return 0;
	if (left === null) return 1;
	if (right === null) return -1;
	return right - left;
}

/** Resolve one row per room without loading conversations or mutating cached inputs. */
export function groupRoomTree(
	topics: RoomTreeTopicMetadata[],
	threads: RoomTreeThreadMetadata[],
	rooms: RoomRow[],
	associations: ReadonlyMap<string, RoomTreeAssociation>,
	activity: ReadonlyMap<string, string>,
): RoomTreeResponse {
	const topicsById = new Map<string, RoomTreeTopic>();
	for (const topic of topics) {
		if (topic.status === "archived") continue;
		topicsById.set(topic.id, {
			topicId: topic.id,
			name: topic.name,
			short: topic.short,
		});
	}
	const explicitTopics = new Map<string, Set<string>>();
	const legacyTopics = new Map<string, Set<string>>();
	for (const thread of threads) {
		const linkedTopics = new Set(
			thread.topicLinks
				.map((link) => link.topicId)
				.filter((topicId) => topicsById.has(topicId)),
		);
		explicitTopics.set(thread.id, linkedTopics);
		if (thread.roomId) {
			const linked = legacyTopics.get(thread.roomId) ?? new Set<string>();
			for (const topicId of linkedTopics) linked.add(topicId);
			legacyTopics.set(thread.roomId, linked);
		}
	}

	const activityById = new Map<string, number | null>();
	const orderedRooms = [
		...new Map(rooms.map((room) => [room.roomId, room])).values(),
	]
		.map((room): RoomTreeRoom => {
			const association = associations.get(room.roomId);
			const topicIds =
				!association || association.unavailable
					? undefined
					: association.threadId === null
						? legacyTopics.get(room.roomId)
						: explicitTopics.get(association.threadId);
			const roomTopics = [...(topicIds ?? [])]
				.flatMap((topicId) => {
					const topic = topicsById.get(topicId);
					return topic ? [topic] : [];
				})
				.sort(
					(left, right) =>
						left.name.localeCompare(right.name, undefined, {
							sensitivity: "base",
						}) || left.topicId.localeCompare(right.topicId),
				);
			const serverActivity = activityTime(room.dateUpdated);
			const localActivity = activityTime(activity.get(room.roomId));
			const updated =
				serverActivity === null
					? localActivity
					: localActivity === null
						? serverActivity
						: Math.max(serverActivity, localActivity);
			const latest = updated ?? activityTime(room.dateCreated);
			activityById.set(room.roomId, latest);
			return {
				roomId: room.roomId,
				topics: roomTopics,
				topicUnavailable:
					!association || association.unavailable ? true : undefined,
				roomName: room.roomName,
				dateCreated: room.dateCreated,
				dateUpdated: room.dateUpdated,
				activityAt:
					latest === null
						? undefined
						: new Date(latest).toISOString(),
			};
		})
		.sort(
			(left, right) =>
				compareActivity(
					activityById.get(left.roomId) ?? null,
					activityById.get(right.roomId) ?? null,
				) ||
				(left.roomId === right.roomId
					? 0
					: left.roomId < right.roomId
						? 1
						: -1),
		);
	return { rooms: orderedRooms };
}
