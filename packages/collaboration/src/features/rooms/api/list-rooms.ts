import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { type RoomRow, workspaceRoomsSchema } from "./room-schemas";

/**
 * List an agent's rooms, newest first.
 *
 * TODO:: GetWorkspaceRooms inner-joins on MESSAGE, so a room with no messages
 * yet is omitted entirely. A freshly created room stays invisible until its
 * first run writes a message - callers must hold it in local state until then.
 *
 * @param actions - `actions` from `useInsight()`.
 * @param workspaceId - The agent whose rooms to list.
 * @param options.limit - Page size; omit for the server default.
 * @param options.offset - Page offset.
 */
export async function listRooms(
	actions: InsightActions,
	workspaceId: string,
	options: { limit?: number; offset?: number } = {},
): Promise<{ rooms: RoomRow[]; totalCount: number }> {
	const payload = await callPixel(
		actions,
		pixel("GetWorkspaceRooms", {
			workspaceId,
			limit: options.limit,
			offset: options.offset,
		}),
		workspaceRoomsSchema,
	);

	return {
		rooms: payload.rooms,
		totalCount: payload.total_count ?? payload.rooms.length,
	};
}
