import {
	type ConnectorService,
	findConnectorTool,
} from "@/features/connectors/connector.catalog";
import type { PixelMessageToolCallPart } from "@/types";
import { getToolEngineId, ROOM_MCP_ID } from "@/utility/mcp-utils";
import { isFolderToolName } from "./folder-tools";

type ToolCall = PixelMessageToolCallPart["toolCall"];

/**
 * Whether a tool call is one of the work folder tools the browser runs.
 *
 * Matched by name as well as by the client tool flag: a chat turn's calls come
 * back from the model with no metadata at all, while an agent run's carry the
 * metadata the harness was given.
 *
 * @param call - The tool call.
 * @return True for work folder calls.
 */
export const isFolderToolCall = (call: ToolCall): boolean =>
	isFolderToolName(call.name) || call._meta?.SMSS_CLIENT_TOOL === true;

/**
 * The connector service behind a tool call, when the call is one of the
 * connector tools written into the room's own toolbox.
 *
 * @param call - The tool call.
 * @return The service, or undefined for every other tool.
 */
export const getConnectorToolService = (
	call: ToolCall,
): ConnectorService | undefined =>
	getToolEngineId(call._meta) === ROOM_MCP_ID
		? findConnectorTool(call._meta?.SMSS_FUNCTION_NAME)?.service
		: undefined;

/**
 * Whether a tool call gets the chat tool card (`ChatToolCard`) instead of the
 * generic tool view.
 *
 * @param call - The tool call.
 * @return True for folder and connector calls.
 */
export const isChatToolCall = (call: ToolCall): boolean =>
	isFolderToolCall(call) || !!getConnectorToolService(call);
