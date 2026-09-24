import { Env } from "@semoss/sdk";
import type { ConversationTool } from "@/features/messages/types/message";

const SYSTEM_APP_URI = /^system:\/\/([a-zA-Z0-9._-]+)(\/.*)?$/;
const ROOM_MCP_ID = "__room__";

interface ToolUiMetadata {
	loadingMessage?: unknown;
	displayLocation?: unknown;
	resourceURI?: unknown;
	autoOpen?: unknown;
}

function uiMetadata(tool: ConversationTool): ToolUiMetadata | undefined {
	const value = tool.metadata?.SMSS_MCP_UI;
	return typeof value === "object" && value !== null
		? (value as ToolUiMetadata)
		: undefined;
}

export type ToolDisplayLocation = "inline" | "sidebar" | "hidden";

/** Resolve the tool's declared display location with Playground defaults. */
export function getToolDisplayLocation(
	tool: ConversationTool,
): ToolDisplayLocation {
	const display = uiMetadata(tool)?.displayLocation;
	return display === "inline" || display === "sidebar" || display === "hidden"
		? display
		: "sidebar";
}

export function shouldAutoOpenTool(tool: ConversationTool): boolean {
	return uiMetadata(tool)?.autoOpen === true;
}

export function getToolLoadingMessage(tool: ConversationTool): string {
	const message = uiMetadata(tool)?.loadingMessage;
	return typeof message === "string" && message.trim()
		? message
		: "Tool is running…";
}

/** Resolve a declared MCP UI resource, falling back to the JSON tool view. */
export function resolveToolUiUrl(
	tool: ConversationTool,
	isBlocks = false,
): string | undefined {
	const resource = uiMetadata(tool)?.resourceURI;
	if (typeof resource !== "string" || !resource) return undefined;

	const system = SYSTEM_APP_URI.exec(resource);
	if (system) return `../../${system[1]}/dist${system[2] ?? "/"}`;
	if (
		resource.startsWith("system://") ||
		(/^[a-z][a-z0-9+.-]*:/i.test(resource) && !/^https?:/i.test(resource))
	)
		return undefined;
	if (/^https?:\/\//.test(resource)) return resource;

	const engineId = tool.metadata?.SMSS_ENGINE_ID;
	const projectId = tool.metadata?.SMSS_PROJECT_ID;
	const ownerId =
		typeof engineId === "string" && engineId
			? engineId
			: typeof projectId === "string"
				? projectId
				: "";
	if (!ownerId || ownerId === ROOM_MCP_ID) return undefined;

	const path = resource.startsWith("/") ? resource : `/${resource}`;
	if (isBlocks)
		return `${import.meta.env.VITE_PLATFORM_URL || "../../client/dist"}/#/s/${ownerId}${path}`;
	return `${Env.MODULE}/public_home/${ownerId}/portals${path}`;
}
