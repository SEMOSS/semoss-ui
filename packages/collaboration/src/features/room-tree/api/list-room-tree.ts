import { listRoomsPage } from "@/features/rooms/api/list-rooms";
import { listRoomTopics } from "@/features/rooms/api/room-topics";
import type { InsightActions } from "@/lib/pixel";
import type { RoomTreeResponse } from "../room-tree.types";
import { groupRoomTree, type RoomTreeAssociation } from "../room-tree-grouping";

/** One server page of pinned rooms; inspect associations only for those rows. */
export async function listRoomTree(
	actions: InsightActions,
	activity: ReadonlyMap<string, string> = new Map(),
	isActive: () => boolean = () => true,
	offset = 0,
): Promise<RoomTreeResponse> {
	if (!isActive()) throw new Error("Room refresh was superseded.");
	const page = await listRoomsPage(actions, offset, undefined, true);
	if (page.hasMore && (!page.rooms.length || page.nextOffset <= offset))
		throw new Error("Room page made no progress. Try again.");
	if (
		new Set(page.rooms.map((room) => room.roomId)).size !==
		page.rooms.length
	)
		throw new Error("Room page contains duplicate rooms. Try again.");
	const associations = new Map<string, RoomTreeAssociation>();
	let unavailable = false;
	for (let index = 0; index < page.rooms.length; index += 4) {
		if (!isActive()) throw new Error("Room refresh was superseded.");
		await Promise.all(
			page.rooms.slice(index, index + 4).map(async (room) => {
				try {
					associations.set(room.roomId, {
						topics: await listRoomTopics(
							actions,
							room.roomId,
							true,
						),
					});
				} catch {
					unavailable = true;
					associations.set(room.roomId, {
						topics: [],
						unavailable: true,
					});
				}
			}),
		);
	}
	if (!isActive()) throw new Error("Room refresh was superseded.");
	return {
		...groupRoomTree(
			page.rooms.map((room) => ({ ...room, pinned: true })),
			associations,
			activity,
		),
		hasMore: page.hasMore,
		nextOffset: page.nextOffset,
		warning: unavailable
			? "Some room topics could not be loaded. Retry to check their topics."
			: undefined,
	};
}
