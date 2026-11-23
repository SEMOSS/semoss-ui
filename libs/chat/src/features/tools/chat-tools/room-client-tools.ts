import { isRecord } from "@semoss/utility/object";
import { MCP_EXECUTION_ASK } from "../mcp/mcp-execution";
import { type McpTool, readMcpTools } from "./chat-tool-info";
import type { FolderToolDefinition } from "./folder-tools";

/** What the client tools in a room's tool file are stamped with. */
export const CLIENT_TOOLS_GENERATOR = "PlaygroundClientTools";

/**
 * Whether a tool in a room's file is one of the client tools.
 *
 * @param tool - A tool from the file.
 * @returns True for the client tools.
 */
const isClientTool = (tool: McpTool): boolean =>
	isRecord(tool._meta) &&
	tool._meta.SMSS_MCP_GENERATOR === CLIENT_TOOLS_GENERATOR;

/**
 * A room's tool file with its client tools replaced and every other tool kept
 * as it is.
 *
 * Client tools are the ones a host runs in the browser, such as the desktop
 * app's `desktop_*` tools. An agent run brings no tools from the browser, but
 * it offers the model the room's own toolbox, so they go there. Every one
 * asks: the server has nothing behind it, so the run always pauses and the
 * browser answers it, at once or once the user allows it, as the room's
 * settings say. `SMSS_FUNCTION_NAME` names the tool whatever the model is
 * shown, and `SMSS_CLIENT_TOOL` says the browser runs it.
 *
 * @param roomMcpJson - The room's parsed `mcp/pixel_mcp.json`, or null.
 * @param definitions - The client tools it should hold, as a chat turn sends
 * them; none removes them.
 * @returns The file to write, or null when it already holds exactly these.
 */
export const mergeRoomClientTools = (
	roomMcpJson: unknown,
	definitions: readonly FolderToolDefinition[],
): Record<string, unknown> | null => {
	const tools: McpTool[] = definitions.map((definition) => ({
		name: definition.name,
		title: definition.title,
		description: definition.description,
		inputSchema: definition.inputSchema,
		_meta: {
			SMSS_FUNCTION_NAME: definition.name,
			SMSS_MCP_GENERATOR: CLIENT_TOOLS_GENERATOR,
			SMSS_MCP_EXECUTION: MCP_EXECUTION_ASK,
			SMSS_CLIENT_TOOL: true,
		},
	}));
	const roomTools = readMcpTools(roomMcpJson);
	if (
		JSON.stringify(roomTools.filter(isClientTool)) === JSON.stringify(tools)
	) {
		return null;
	}
	const file = isRecord(roomMcpJson) ? roomMcpJson : {};
	return {
		...file,
		tools: [...roomTools.filter((tool) => !isClientTool(tool)), ...tools],
		_meta: {
			...(isRecord(file._meta) ? file._meta : {}),
			last_modified_date: new Date().toISOString().slice(0, 10),
		},
	};
};
