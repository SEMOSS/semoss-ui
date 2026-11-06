import { stringifyJsonWithSortedKeys } from "@semoss/utility/json";
import type { MCPToolConfig } from "../../types";
import type { RoomWorkspaceInfo } from "./room.types";

/**
 * The toolboxes the backend stores for a room. Its agent's and its own
 * folder's toolbox are reported but not stored.
 *
 * @param mcp - The room's toolboxes, as it shows them.
 * @returns Those to store.
 */
export const getStoredMcp = <M extends MCPToolConfig>(mcp: M[] = []): M[] =>
	mcp.filter((item) => !item?.fromWorkspace && !item?.fromRoom);

/**
 * A comparable key for room options as the backend stores them, so a save
 * that would change nothing is skipped.
 *
 * @param options - The options.
 * @returns The key.
 */
export const getStoredOptionsKey = (options: {
	mcp?: MCPToolConfig[];
}): string =>
	stringifyJsonWithSortedKeys({ ...options, mcp: getStoredMcp(options.mcp) });

/**
 * The room's toolboxes with its agent's merged in first, marked
 * `fromWorkspace` so they are shown but not stored.
 *
 * @param roomMcp - The room's own toolboxes.
 * @param workspace - The agent the room started from.
 * @returns The toolboxes the room shows.
 */
export const mergeWorkspaceMcp = <M extends MCPToolConfig>(
	roomMcp: M[] = [],
	workspace: RoomWorkspaceInfo,
): M[] => {
	if (!Array.isArray(workspace.mcp)) {
		return roomMcp;
	}
	const workspaceMcp = workspace.mcp.map((mcp) => ({
		...mcp,
		fromWorkspace: true,
	})) as M[];
	const existing = new Map<string, M>();
	for (const mcp of roomMcp) {
		existing.set(`${mcp.id}-${mcp.type}`, mcp);
	}
	return [
		...workspaceMcp,
		...[...existing.values()].filter(
			(a) => !workspaceMcp.some((b) => b.id === a.id),
		),
	];
};

/**
 * Instructions with the turn's context after them.
 *
 * @param instructions - The room's instructions.
 * @param turnContext - What the host adds for this turn.
 * @returns The instructions the turn runs with.
 */
export const withTurnContext = (
	instructions: string,
	turnContext: string | null | undefined,
): string => {
	const extra = turnContext?.trim();
	if (!extra) {
		return instructions;
	}
	return instructions ? `${instructions}\n\n${extra}` : extra;
};
