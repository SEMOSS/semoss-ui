import { z } from "@semoss/ui/next";

/**
 * One row from `GetWorkspaceRooms`. Dates are formatted server-side as
 * `yyyy-MM-dd'T'HH:mm:ss'Z'`.
 */
const roomRowSchema = z.object({
	room_id: z.string(),
	room_name: z.string().nullish(),
	model_id: z.string().nullish(),
	workspace_id: z.string().nullish(),
	date_created: z.string().nullish(),
	date_updated: z.string().nullish(),
	pinned: z.boolean().nullish(),
});

/** The `GetWorkspaceRooms` envelope: a page of rooms plus the unpaged total. */
export const workspaceRoomsSchema = z.object({
	total_count: z.number().nullish(),
	rooms: z.array(roomRowSchema),
});

/** One room as the room list returns it. */
export type RoomRow = z.infer<typeof roomRowSchema>;
