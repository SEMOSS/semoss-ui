import { z } from "@semoss/ui/next";

const roomRowSchema = z
	.object({
		ROOM_ID: z.string(),
		ROOM_NAME: z.string().nullish(),
		MODEL_ID: z.string().nullish(),
		WORKSPACE_ID: z.string().nullish(),
		DATE_CREATED: z.string().nullish(),
		DATE_UPDATED: z.string().nullish(),
		PINNED: z.boolean().nullish(),
	})
	.catchall(z.unknown());

/** The uppercase row returned by `GetPlaygroundRooms`. */
export type PlaygroundRoomRow = z.infer<typeof roomRowSchema>;

/** A normalized room record used by collaboration. */
export interface RoomRow {
	roomId: string;
	roomName?: string;
	modelId?: string;
	workspaceId?: string;
	dateCreated?: string;
	dateUpdated?: string;
	pinned?: boolean;
}

export const playgroundRoomsSchema = z.array(roomRowSchema);

/** Normalize the reactor's uppercase columns at the API boundary. */
export function mapPlaygroundRoom(row: PlaygroundRoomRow): RoomRow {
	return {
		roomId: row.ROOM_ID,
		roomName: row.ROOM_NAME ?? undefined,
		modelId: row.MODEL_ID ?? undefined,
		workspaceId: row.WORKSPACE_ID ?? undefined,
		dateCreated: row.DATE_CREATED ?? undefined,
		dateUpdated: row.DATE_UPDATED ?? undefined,
		pinned: row.PINNED ?? undefined,
	};
}

const predefinedPromptSchema = z
	.object({
		id: z.string(),
		title: z.string(),
		context: z.string(),
	})
	.catchall(z.unknown());

const mcpTypeSchema = z.enum([
	"PROJECT",
	"STORAGE",
	"DATABASE",
	"FUNCTION",
	"MODEL",
	"VECTOR",
	"GUARDRAIL",
	"ROOM",
]);

const mcpToolSchema = z
	.object({
		id: z.string(),
		type: mcpTypeSchema,
		name: z.string(),
		fromWorkspace: z.boolean().optional(),
		fromRoom: z.boolean().optional(),
	})
	.catchall(z.unknown());

const roomWorkspaceSchema = z
	.object({
		workspace_id: z.string(),
		name: z.string(),
	})
	.catchall(z.unknown());

const playgroundRoomOptionsSchema = z
	.object({
		predefinedPrompts: z.array(predefinedPromptSchema).default([]),
		instructions: z.string().default(""),
		mcp: z.array(mcpToolSchema).default([]),
		modelId: z.string().default(""),
		temperature: z.number().min(0).max(1).nullish(),
		workspace: roomWorkspaceSchema.optional(),
	})
	.catchall(z.unknown());

/** Persisted options owned by a playground collaboration room. */
export type PlaygroundRoomOptions = z.infer<typeof playgroundRoomOptionsSchema>;

/** `GetRoomOptions` returns an envelope, not a raw options object. */
export const roomOptionsEnvelopeSchema = z.object({
	OPTIONS: playgroundRoomOptionsSchema,
	ROOM_NAME: z.string().nullish(),
});

export const createdPlaygroundRoomSchema = z.object({ roomId: z.string() });
export const roomWriteSchema = z.boolean();
