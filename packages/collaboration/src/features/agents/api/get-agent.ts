import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	toWorkspaceAgent,
	type WorkspaceAgent,
	workspacePayloadSchema,
} from "./agent-schemas";

/**
 * Fetch one agent's full configuration.
 *
 * An agent is a workspace: the backend's agent record IS its workspace, so the
 * route's `agentId` is the reactor's `workspaceId`.
 *
 * @param actions - `actions` from `useInsight()`.
 * @param workspaceId - The agent to load.
 */
export async function getAgent(
	actions: InsightActions,
	workspaceId: string,
): Promise<WorkspaceAgent> {
	const payload = await callPixel(
		actions,
		pixel("GetWorkspace", { workspaceId }),
		workspacePayloadSchema,
	);

	return toWorkspaceAgent(payload);
}
