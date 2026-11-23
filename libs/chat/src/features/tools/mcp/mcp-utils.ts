import type { MCPConfig } from "@semoss/shared";
import { MCP_EXECUTION_AGENT_ASK, MCP_EXECUTION_ASK } from "./mcp-execution";

/**
 * Whether a tool's execution mode means "needs an interactive decision",
 * covering both the legacy ask flow and an agent-run tool awaiting approval
 * (which carries agent-ask instead of ask, since agent-run tools are never
 * client-dispatched — see MCP_EXECUTION_AGENT_ASK).
 *
 * @param execution - The tool's `SMSS_MCP_EXECUTION`.
 * @returns Whether the call waits for the user.
 */
export const isAskExecutionMode = (execution: string | undefined): boolean =>
	execution === MCP_EXECUTION_ASK || execution === MCP_EXECUTION_AGENT_ASK;

/**
 * Whether the user can take a selection out of a room in Settings: one they
 * added, not the room's own toolbox. The agent's tools are never in the
 * room's options, so they never reach this check.
 *
 * @param item - A toolbox or knowledge selection in the room's options.
 * @returns Whether it can be removed.
 */
export const isRemovableToolbox = (
	item: Pick<MCPConfig, "fromRoom" | "type">,
): boolean => !item.fromRoom && item.type !== "ROOM";

/**
 * Every tool and knowledge source a room has, as one list, each id once, as the
 * backend reads them: its agent's first, then the room's own whose id is not
 * one of the agent's. A room tool listed twice keeps its first place and its
 * last entry.
 *
 * @param roomTools - The room's own, its `options.mcp`.
 * @param agentTools - Its agent's.
 * @returns The combined list.
 */
export const listRoomTools = <T extends Pick<MCPConfig, "id">>(
	roomTools: readonly T[],
	agentTools: readonly T[],
): T[] => {
	const agentIds = new Set(agentTools.map((tool) => tool.id));
	const roomById = new Map<string, T>();
	for (const tool of roomTools) {
		if (!agentIds.has(tool.id)) roomById.set(tool.id, tool);
	}
	return [...agentTools, ...roomById.values()];
};

/** What {@link getAgentLabel} names. */
export interface AgentLabelInput {
	/** The saved agent the room runs, if any. */
	workspace?: { workspace_id: string; name?: string } | null;
	/** Whether the room runs in agent mode, where no saved agent means Default Agent. */
	isAgentMode?: boolean;
	/** The translated name of Default Agent (`room:modes.defaultAgent`). */
	defaultAgentLabel?: string;
}

/**
 * The Default Agent rule: a chat in agent mode with no saved agent runs
 * Default Agent.
 *
 * @param input - The agent and the room's mode.
 * @returns True when the chat runs Default Agent.
 */
export const runsDefaultAgent = ({
	workspace,
	isAgentMode = false,
}: Pick<AgentLabelInput, "workspace" | "isAgentMode">): boolean =>
	isAgentMode && !workspace;

/**
 * The name of the agent a room runs: the saved agent's name, else its id, else
 * Default Agent by {@link runsDefaultAgent}.
 *
 * @param input - The agent, the room's mode, and Default Agent's name.
 * @returns The name, or an empty string for a chat that runs no agent.
 */
export const getAgentLabel = ({
	workspace,
	isAgentMode = false,
	defaultAgentLabel = "",
}: AgentLabelInput): string =>
	workspace?.name ||
	workspace?.workspace_id ||
	(runsDefaultAgent({ workspace, isAgentMode }) ? defaultAgentLabel : "");

/**
 * Reserved id the backend puts on SMSS_ENGINE_ID for room scoped tools. There is
 * no catalog entry behind it: it tells the backend to read the tools from the
 * room's own asset folder, so it must never be used as a project or engine id.
 */
export const ROOM_MCP_ID = "__room__";

/** The subset of a tool's `_meta` that carries its owning app. */
type ToolOwnerMeta = {
	SMSS_ENGINE_ID?: string;
	SMSS_PROJECT_ID?: string;
};

/**
 * Id to pass to backend pixels that resolve a tool, such as RunMCPTool.
 *
 * SMSS_ENGINE_ID is the canonical key and is set for every engine type; the
 * deprecated SMSS_PROJECT_ID is only a fallback for older tool definitions. The
 * room sentinel is kept because the backend resolves room tools by it.
 *
 * @param meta - The tool's `_meta`.
 * @returns The owning app's id, or empty when the tool names none.
 */
export const getToolEngineId = (meta: ToolOwnerMeta | undefined): string =>
	meta?.SMSS_ENGINE_ID || meta?.SMSS_PROJECT_ID || "";

/**
 * Id to use when loading a tool's UI or looking up its metadata, where the value
 * has to be a real catalog entry. Same preference as {@link getToolEngineId},
 * except the room sentinel resolves to empty so callers skip the lookup rather
 * than asking the catalog for an id that cannot exist.
 *
 * @param meta - The tool's `_meta`.
 * @returns The owning app's catalog id, or empty for none or the room.
 */
export const getToolAppId = (meta: ToolOwnerMeta | undefined): string => {
	const engineId = getToolEngineId(meta);
	return engineId === ROOM_MCP_ID ? "" : engineId;
};
