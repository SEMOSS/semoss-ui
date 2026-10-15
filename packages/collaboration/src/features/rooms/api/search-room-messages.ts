import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { readableRoomName } from "./room-schemas";

const COLLABORATION_PROJECT_ID = "SYSTEM__COLLABORATION";
const ROOM_SEARCH_LIMIT = 50;

const roomContentMatchSchema = z
	.object({
		room_id: z.string(),
		room_name: z.string().nullish(),
		date_created: z.string().nullish(),
	})
	.catchall(z.unknown());

const roomContentMatchesSchema = z.array(roomContentMatchSchema);

/** Room metadata returned for a message-content match. */
export interface RoomContentMatch {
	roomId: string;
	roomName: string;
	dateCreated?: string;
}

/** Search message content without loading any room transcript into the client. */
export async function searchRoomMessages(
	actions: InsightActions,
	search: string,
	offset = 0,
): Promise<RoomContentMatch[]> {
	const query = search.trim();
	if (!query) return [];

	const rows = await callPixel(
		actions,
		`META | ${pixel("SearchRoomMessages", {
			search: query,
			project: COLLABORATION_PROJECT_ID,
			limit: ROOM_SEARCH_LIMIT,
			offset,
			includeUnnamedRooms: true,
		})}`,
		roomContentMatchesSchema,
	);

	return rows.map((row) => ({
		roomId: row.room_id,
		roomName: readableRoomName(row.room_name) || "Untitled room",
		dateCreated: row.date_created ?? undefined,
	}));
}
