import { MCP_EXECUTION_AGENT_ASK, MCP_EXECUTION_ASK } from "./room.constants";

/**
 * Whether a tool's execution mode means "needs an interactive decision",
 * covering both a chat call that asks and an agent-run tool awaiting approval
 * (which carries agent-ask instead of ask, since agent-run tools are never
 * client-dispatched — see MCP_EXECUTION_AGENT_ASK).
 *
 * @param execution - The call's `SMSS_MCP_EXECUTION`.
 * @returns True when the call waits for the user.
 */
export const isAskExecutionMode = (execution: string | undefined): boolean =>
	execution === MCP_EXECUTION_ASK || execution === MCP_EXECUTION_AGENT_ASK;

/**
 * Reserved id the backend puts on SMSS_ENGINE_ID for room scoped tools. There
 * is no catalog entry behind it: it tells the backend to read the tools from
 * the room's own asset folder, so it must never be used as a project or engine
 * id.
 */
export const ROOM_MCP_ID = "__room__";

/** The subset of a tool's `_meta` that carries its owning app. */
interface ToolOwnerMeta {
	SMSS_ENGINE_ID?: string;
	SMSS_PROJECT_ID?: string;
}

/**
 * Id to pass to backend pixels that resolve a tool, such as RunMCPTool.
 *
 * SMSS_ENGINE_ID is the canonical key and is set for every engine type; the
 * deprecated SMSS_PROJECT_ID is only a fallback for older tool definitions.
 * The room sentinel is kept because the backend resolves room tools by it.
 *
 * @param meta - The tool call's `_meta`.
 * @returns The id, or empty when there is none.
 */
export const getToolEngineId = (meta: ToolOwnerMeta | undefined): string =>
	meta?.SMSS_ENGINE_ID || meta?.SMSS_PROJECT_ID || "";

/**
 * Id to use when loading a tool's UI or looking up its metadata, where the
 * value has to be a real catalog entry. Same preference as
 * {@link getToolEngineId}, except the room sentinel resolves to empty so
 * callers skip the lookup.
 *
 * @param meta - The tool call's `_meta`.
 * @returns The id, or empty for none and for the room's own toolbox.
 */
export const getToolAppId = (meta: ToolOwnerMeta | undefined): string => {
	const engineId = getToolEngineId(meta);
	return engineId === ROOM_MCP_ID ? "" : engineId;
};
