import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import type { RoomTopic } from "@/features/rooms/api/room-topics";
import type { RoomTreeResponse, RoomTreeRoom } from "./room-tree.types";

export interface RoomTreeAssociation {
	topics: RoomTopic[];
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
	rooms: RoomRow[],
	associations: ReadonlyMap<string, RoomTreeAssociation>,
	activity: ReadonlyMap<string, string>,
): RoomTreeResponse {
	const activityById = new Map<string, number | null>();
	const orderedRooms = [
		...new Map(rooms.map((room) => [room.roomId, room])).values(),
	]
		.map((room): RoomTreeRoom => {
			const association = associations.get(room.roomId);
			const roomTopics = (association?.topics ?? [])
				.filter((topic) => topic.state === "linked")
				.map((topic) => ({
					topicId: topic.topicId,
					name: topic.name || "Topic",
				}))
				.sort(
					(left, right) =>
						left.name.localeCompare(right.name) ||
						left.topicId.localeCompare(right.topicId),
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
				pinned: room.pinned,
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
