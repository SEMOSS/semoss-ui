import type { MCPConfig } from "@semoss/shared";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { createdPlaygroundRoomSchema, roomWriteSchema } from "./room-schemas";

interface CreateRoomAttempt {
	/** Reconfigure a room allocated by an earlier, partially failed attempt. */
	roomId?: string;
	/** Retain the allocated id before the remaining setup calls can fail. */
	onCreated?: (roomId: string) => void;
}

/** Create and fully configure one workspace-backed playground room in collaboration mode. */
export async function createRoom(
	actions: InsightActions,
	_insightId: string,
	options: {
		workspaceId: string;
		workspaceName: string;
		instructions?: string;
		mcp?: MCPConfig[];
		modelId?: string;
		temperature?: number | null;
		name?: string;
	},
	attempt: CreateRoomAttempt = {},
): Promise<string> {
	let roomId = attempt.roomId;
	if (!roomId) {
		const created = await callPixel(
			actions,
			pixel("CreatePlaygroundRoom", {
				workspaceId: options.workspaceId,
				mode: "collaboration",
			}),
			createdPlaygroundRoomSchema,
		);
		roomId = created.roomId;
		attempt.onCreated?.(roomId);
	}
	const roomOptions = {
		predefinedPrompts: [],
		instructions: options.instructions ?? "",
		mcp: (options.mcp ?? [])
			.filter((resource) => !resource.fromWorkspace && !resource.fromRoom)
			.map(({ id, name, type }) => ({ id, name, type })),
		workspace: {
			workspace_id: options.workspaceId,
			name: options.workspaceName,
		},
		modelId: options.modelId ?? "",
		...(options.temperature !== undefined && {
			temperature: options.temperature,
		}),
		harnessType: "semoss",
	};

	const updated = await callPixel(
		actions,
		pixel("UpdateRoomOptions", {
			roomId,
			roomOptions: [roomOptions],
		}),
		roomWriteSchema,
	);
	if (!updated) throw new Error("SEMOSS did not save the room options.");

	if (options.name) {
		const renamed = await callPixel(
			actions,
			pixel("SetRoomName", {
				roomId,
				roomName: options.name,
			}),
			roomWriteSchema,
		);
		if (!renamed) throw new Error("SEMOSS did not save the room name.");
	}

	const bound = await callPixel(
		actions,
		pixel("SetRoomForInsight", { roomId }),
		roomWriteSchema,
	);
	if (!bound)
		throw new Error("SEMOSS did not bind the room to this insight.");

	return roomId;
}
