import { z } from "@semoss/ui/next";
import { createRoom } from "@/features/rooms/api/create-room";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import {
	type PlaygroundRoomOptions,
	playgroundRoomsSchema,
	roomOptionsEnvelopeSchema,
	roomWriteSchema,
} from "@/features/rooms/api/room-schemas";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { threadInstructions } from "../thread-context";
import { type ThreadChatSettings, workInstructions } from "../thread-settings";

export const associationSchema = z.object({
	version: z.literal(1),
	threadId: z.string().min(1),
	contextRevision: z.string(),
	modelId: z.string().min(1),
	agentId: z.string().min(1).optional(),
});

export type ThreadRoomMetadata = z.infer<typeof associationSchema>;

export interface ThreadRoomAssociation {
	roomId: string;
	metadata: ThreadRoomMetadata;
	options: PlaygroundRoomOptions;
}

/** Work owns this configuration, even if a room was edited from a legacy link. */
export function canContinueThreadRoom(room: ThreadRoomAssociation): boolean {
	return room.options.modelId === room.metadata.modelId;
}

/** Discover only rooms returned by the current user's collaboration room list. */
export async function findThreadRoom(
	actions: InsightActions,
	threadId: string,
): Promise<ThreadRoomAssociation | null> {
	const rows = await callPixel(
		actions,
		pixel("GetPlaygroundRooms", {
			mode: "collaboration",
			roomOptionsSearch: threadId,
			includeUnnamedRooms: true,
			sort: ["DESC"],
		}),
		playgroundRoomsSchema,
	);
	const rooms = rows.map((row) => ({ roomId: row.ROOM_ID }));
	for (let index = 0; index < rooms.length; index += 4) {
		const candidates = await Promise.all(
			rooms.slice(index, index + 4).map(async (room) => {
				const { OPTIONS: options } = await callPixel(
					actions,
					pixel("GetRoomOptions", { roomId: room.roomId }),
					roomOptionsEnvelopeSchema,
				);
				const association = associationSchema.safeParse(
					options.workThread,
				);
				if (
					!association.success ||
					association.data.threadId !== threadId ||
					association.data.modelId !== options.modelId
				)
					return null;
				return {
					roomId: room.roomId,
					metadata: association.data,
					options,
				};
			}),
		);
		const match = candidates.find((candidate) => candidate !== null);
		if (match) return match;
	}
	return null;
}

export async function bindThreadRoom(
	actions: InsightActions,
	roomId: string,
): Promise<void> {
	const bound = await callPixel(
		actions,
		pixel("SetRoomForInsight", { roomId }),
		roomWriteSchema,
	);
	if (!bound) throw new Error("Could not open this conversation.");
}

/**
 * Preserve unrelated options while saving the non-content Work association.
 * Keep the selected agent's display name without copying its authored settings.
 */
export async function prepareThreadRoom(
	actions: InsightActions,
	insightId: string,
	title: string,
	metadata: ThreadRoomMetadata,
	attempt: { roomId?: string; onCreated: (roomId: string) => void },
	settings?: ThreadChatSettings,
	agentName?: string,
): Promise<ThreadRoomAssociation> {
	const roomId =
		attempt.roomId ??
		(await createRoom(
			actions,
			insightId,
			{
				name: title,
				workspaceId: metadata.agentId || null,
				workspaceName: agentName,
				instructions: settings
					? workInstructions(settings.instructions)
					: threadInstructions(metadata.agentId),
				modelId: metadata.modelId,
				mcp: settings?.mcp ?? [],
				...(settings && { temperature: settings.temperature }),
			},
			attempt,
		));
	const envelope = await callPixel(
		actions,
		pixel("GetRoomOptions", { roomId }),
		roomOptionsEnvelopeSchema,
	);
	const options: PlaygroundRoomOptions = {
		...envelope.OPTIONS,
		modelId: metadata.modelId,
		overrideSystemPrompt: false,
		instructions: workInstructions(
			settings?.instructions ?? envelope.OPTIONS.instructions,
		),
		...(settings && {
			temperature: settings.temperature,
			mcp: settings.mcp,
		}),
		workThread: metadata,
	};
	if (metadata.agentId)
		options.workspace = {
			workspace_id: metadata.agentId,
			name:
				agentName ??
				(envelope.OPTIONS.workspace?.workspace_id === metadata.agentId
					? envelope.OPTIONS.workspace.name
					: "Assistant"),
		};
	else delete options.workspace;
	const saved = await callPixel(
		actions,
		pixel("UpdateRoomOptions", { roomId, roomOptions: [options] }),
		roomWriteSchema,
	);
	if (!saved)
		throw new Error("Could not link this conversation to your work.");
	await bindThreadRoom(actions, roomId);
	window.dispatchEvent(
		new CustomEvent(ROOM_HISTORY_CHANGED, {
			detail: {
				roomId,
				roomName: title,
				modelId: metadata.modelId,
				dateCreated: new Date().toISOString(),
			},
		}),
	);
	return { roomId, metadata, options };
}
