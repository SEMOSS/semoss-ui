import type { PixelMessageToolCallPart } from "../../../types";
import {
	type ConnectorService,
	findConnectorTool,
} from "../../connectors/store/connector-catalog";
import { getToolEngineId, ROOM_MCP_ID } from "../mcp/mcp-utils";
import { type FolderToolName, isFolderToolName } from "./folder-tools";

/** A tool call as a message part holds it. */
type ToolCall = PixelMessageToolCallPart["toolCall"];

/**
 * The name of the tool a call ran, when it is one `matches` accepts. Read from
 * the name the model called, or, for a tool from the room's own toolbox,
 * whose name the model may be shown changed, from the function its metadata
 * names.
 *
 * @param call - The tool call.
 * @param matches - Which names to accept.
 * @returns The name, or undefined when none is accepted.
 */
export const findToolCallName = (
	call: ToolCall,
	matches: (name: string) => boolean,
): string | undefined =>
	[
		call.name,
		call._meta?.SMSS_FUNCTION_NAME,
		call._meta?.SMSS_ORIGINAL_TOOL_NAME,
	].find(
		(candidate): candidate is string =>
			typeof candidate === "string" && matches(candidate),
	);

/**
 * Which Room Files tool a call is.
 *
 * @param call - The tool call.
 * @returns The tool, or undefined for every other call.
 */
export const getFolderToolCallName = (
	call: ToolCall,
): FolderToolName | undefined =>
	findToolCallName(call, isFolderToolName) as FolderToolName | undefined;

/**
 * Whether the browser runs a tool call: a Room Files tool, or a client tool
 * the host runs, which the room marks with the client tool flag as it reads
 * the call.
 *
 * Room Files calls are matched by name as well: a chat turn's calls come back
 * from the model with no metadata at all.
 *
 * @param call - The tool call.
 * @returns True for the calls the browser runs.
 */
export const isBrowserToolCall = (call: ToolCall): boolean =>
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
 * @returns True for the calls the browser runs, and connector calls.
 */
export const isChatToolCall = (call: ToolCall): boolean =>
	isBrowserToolCall(call) || !!getConnectorToolService(call);
