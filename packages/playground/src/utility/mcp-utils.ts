import { createMcpPlatformUrl, createPromptPlatformUrl } from "@semoss/shared";
import { toSiblingAppHref } from "./router";

export { isKnowledgeMcp, splitMcpByType } from "@semoss/shared";

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
 */
export const getToolEngineId = (meta: ToolOwnerMeta | undefined): string =>
	meta?.SMSS_ENGINE_ID || meta?.SMSS_PROJECT_ID || "";

/**
 * Id to use when loading a tool's UI or looking up its metadata, where the value
 * has to be a real catalog entry. Same preference as {@link getToolEngineId},
 * except the room sentinel resolves to empty so callers skip the lookup rather
 * than asking the catalog for an id that cannot exist.
 */
export const getToolAppId = (meta: ToolOwnerMeta | undefined): string => {
	const engineId = getToolEngineId(meta);
	return engineId === ROOM_MCP_ID ? "" : engineId;
};

// The client app is a sibling package, so its base is derived from this app's
// own basename rather than duplicated as a second per deployment env var.
const PLATFORM_URL = toSiblingAppHref("client").replace(/\/$/, "");

export const mcpToPlatformUrl = createMcpPlatformUrl(PLATFORM_URL);
export const promptToPlatformUrl = createPromptPlatformUrl(PLATFORM_URL);
