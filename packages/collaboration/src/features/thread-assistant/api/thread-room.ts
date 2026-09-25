import { z } from "@semoss/ui/next";
import { createRoom } from "@/features/rooms/api/create-room";
import { listRooms } from "@/features/rooms/api/list-rooms";
import {
	type PlaygroundRoomOptions,
	roomOptionsEnvelopeSchema,
	roomWriteSchema,
} from "@/features/rooms/api/room-schemas";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { THREAD_ASSISTANT_INSTRUCTIONS } from "../thread-context";

const associationSchema = z.object({
	version: z.literal(1),
	threadId: z.string().min(1),
	contextRevision: z.string(),
	modelId: z.string().min(1),
});

export type ThreadRoomMetadata = z.infer<typeof associationSchema>;

export interface ThreadRoomAssociation {
	roomId: string;
	metadata: ThreadRoomMetadata;
	options: PlaygroundRoomOptions;
}

/** Work owns this configuration, even if a room was edited from a legacy link. */
export function canContinueThreadRoom(room: ThreadRoomAssociation): boolean {
	return (
		room.options.instructions === THREAD_ASSISTANT_INSTRUCTIONS &&
		room.options.mcp.length === 0 &&
		!room.options.workspace
	);
}

/** Discover only rooms returned by the current user's collaboration room list. */
export async function findThreadRoom(
	actions: InsightActions,
	threadId: string,
): Promise<ThreadRoomAssociation | null> {
	const rooms = await listRooms(actions);
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
					association.data.modelId !== options.modelId ||
					options.workspace
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

/** Preserve unrelated options while saving the non-content Work association. */
export async function prepareThreadRoom(
	actions: InsightActions,
	insightId: string,
	title: string,
	metadata: ThreadRoomMetadata,
	attempt: { roomId?: string; onCreated: (roomId: string) => void },
): Promise<ThreadRoomAssociation> {
	const roomId = await createRoom(
		actions,
		insightId,
		{
			name: title,
			workspaceId: null,
			instructions: THREAD_ASSISTANT_INSTRUCTIONS,
			modelId: metadata.modelId,
			mcp: [],
		},
		attempt,
	);
	const envelope = await callPixel(
		actions,
		pixel("GetRoomOptions", { roomId }),
		roomOptionsEnvelopeSchema,
	);
	const options = {
		...envelope.OPTIONS,
		mcp: envelope.OPTIONS.mcp.filter(
			(resource) => !resource.fromWorkspace && !resource.fromRoom,
		),
		workThread: metadata,
	};
	const saved = await callPixel(
		actions,
		pixel("UpdateRoomOptions", { roomId, roomOptions: [options] }),
		roomWriteSchema,
	);
	if (!saved)
		throw new Error("Could not link this conversation to your work.");
	return { roomId, metadata, options };
}
