import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { createdPlaygroundRoomSchema, roomWriteSchema } from "./room-schemas";

/** Create and fully configure one workspace-backed playground room. */
export async function createRoom(
	actions: InsightActions,
	_insightId: string,
	options: {
		workspaceId: string;
		workspaceName: string;
		instructions?: string;
		modelId?: string;
		name?: string;
	},
): Promise<string> {
	const created = await callPixel(
		actions,
		pixel("CreatePlaygroundRoom", { workspaceId: options.workspaceId }),
		createdPlaygroundRoomSchema,
	);
	const roomOptions = {
		predefinedPrompts: [],
		instructions: options.instructions ?? "",
		mcp: [],
		workspace: {
			workspace_id: options.workspaceId,
			name: options.workspaceName,
		},
		modelId: options.modelId ?? "",
	};

	const updated = await callPixel(
		actions,
		pixel("UpdateRoomOptions", {
			roomId: created.roomId,
			roomOptions: [roomOptions],
		}),
		roomWriteSchema,
	);
	if (!updated) throw new Error("SEMOSS did not save the room options.");

	if (options.name) {
		const renamed = await callPixel(
			actions,
			pixel("SetRoomName", {
				roomId: created.roomId,
				roomName: options.name,
			}),
			roomWriteSchema,
		);
		if (!renamed) throw new Error("SEMOSS did not save the room name.");
	}

	const bound = await callPixel(
		actions,
		pixel("SetRoomForInsight", { roomId: created.roomId }),
		roomWriteSchema,
	);
	if (!bound)
		throw new Error("SEMOSS did not bind the room to this insight.");

	return created.roomId;
}
