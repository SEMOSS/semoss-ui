import type { PixelMessageToolCallPart } from "../../../types";
import {
	type ConnectorService,
	findConnectorTool,
} from "../../connectors/store/connector-catalog";
import { getToolEngineId, ROOM_MCP_ID } from "../mcp/mcp-utils";
import {
	type DesktopToolName,
	type FolderToolName,
	isDesktopToolName,
	isFolderToolName,
} from "./folder-tools";

/** A tool call as a message part holds it. */
type ToolCall = PixelMessageToolCallPart["toolCall"];

/**
 * Which of the browser's file tools a call is: a Room Files tool or a client
 * (desktop) tool. Read from the name the model called, or, for a tool from
 * the room's own toolbox, whose name the model may be shown changed, from the
 * function its metadata names.
 *
 * @param call - The tool call.
 * @returns The tool, or undefined for every other call.
 */
export const getFolderToolCallName = (
	call: ToolCall,
): FolderToolName | DesktopToolName | undefined =>
	[
		call.name,
		call._meta?.SMSS_FUNCTION_NAME,
		call._meta?.SMSS_ORIGINAL_TOOL_NAME,
	].find(
		(candidate): candidate is FolderToolName | DesktopToolName =>
			typeof candidate === "string" &&
			(isFolderToolName(candidate) || isDesktopToolName(candidate)),
	);

/**
 * Whether a tool call is one of the work folder tools the browser runs: Room
 * Files' or the client tools.
 *
 * Matched by name as well as by the client tool flag: a chat turn's calls come
 * back from the model with no metadata at all, while an agent run's carry the
 * metadata the harness was given.
 *
 * @param call - The tool call.
 * @returns True for work folder calls.
 */
export const isFolderToolCall = (call: ToolCall): boolean =>
	getFolderToolCallName(call) !== undefined ||
	call._meta?.SMSS_CLIENT_TOOL === true;

/**
 * The connector service behind a tool call, when the call is one of the
 * connector tools written into the room's own toolbox.
 *
 * @param call - The tool call.
 * @returns The service, or undefined for every other tool.
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
 * @returns True for folder and connector calls.
 */
export const isChatToolCall = (call: ToolCall): boolean =>
	isFolderToolCall(call) || !!getConnectorToolService(call);
