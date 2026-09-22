import { RoomStore } from "@semoss/sdk";
import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** Runs the message through the server-side RunAgent harness. */
const SEMOSS_HARNESS = "semoss";

/**
 * Create a room for an agent and configure it for the agent harness.
 *
 * The room is bound to the workspace at creation so the backend associates the
 * two, and `harnessType` is persisted so every later turn runs through RunAgent
 * rather than the client-driven AskRoom flow.
 *
 * @param actions - `actions` from `useInsight()`, used only for the optional rename.
 * @param insightId - The active insight.
 * @param options.workspaceId - The agent the room belongs to.
 * @param options.workspaceName - Display name stored in the room's options.
 * @param options.instructions - System prompt for the room; defaults to the agent's.
 * @param options.modelId - Engine id; omit to let the server pick the default.
 * @param options.name - Optional room title.
 * @returns The new room's id.
 */
export async function createRoom(
	actions: InsightActions,
	insightId: string,
	options: {
		workspaceId: string;
		workspaceName: string;
		instructions?: string;
		modelId?: string;
		name?: string;
	},
): Promise<string> {
	const room = await RoomStore.create(insightId, options.workspaceId);

	await room.updateOptions({
		predefinedPrompts: [],
		instructions: options.instructions ?? "",
		mcp: [],
		workspace: {
			workspace_id: options.workspaceId,
			name: options.workspaceName,
		},
		modelId: options.modelId ?? "",
		harnessType: SEMOSS_HARNESS,
	});

	if (options.name) {
		await callPixel(
			actions,
			pixel("SetRoomName", {
				roomId: room.roomId,
				roomName: options.name,
			}),
			z.unknown(),
		);
	}

	return room.roomId;
}
