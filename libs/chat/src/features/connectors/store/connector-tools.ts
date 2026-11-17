import {
	makeUserPixelMcp,
	readUserAsset,
	type UserPixelMcpTool,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";
import { isRecord } from "@semoss/utility/object";
import type { RoomStore } from "../../room/store/room.store";
import {
	isMissingFileError,
	parseMcpFile,
	readRoomToolFile,
	updateRoomToolFile,
} from "../../room/store/room-tool-file";
import {
	type McpTool,
	readMcpTools,
} from "../../tools/chat-tools/chat-tool-info";
import {
	CONNECTOR_SERVICES,
	CONNECTORS_GENERATOR,
	type ConnectorServiceId,
	findConnectorTool,
	sanitizeConnectorServices,
	USER_CONNECTORS_PATH,
} from "./connector-catalog";

/**
 * A tool's `_meta`, where its reactor, generator, and execution are kept.
 *
 * @param tool - A tool from an MCP definition file.
 * @returns Its metadata, or null when it has none.
 */
const getToolMeta = (tool: McpTool): Record<string, unknown> | null =>
	isRecord(tool._meta) ? tool._meta : null;

/**
 * The connector tools in an MCP definition file: those stamped with
 * {@link CONNECTORS_GENERATOR}.
 *
 * @param mcpJson - The parsed file.
 * @returns The connector tools, in the file's order.
 */
export const readConnectorTools = (mcpJson: unknown): McpTool[] =>
	readMcpTools(mcpJson).filter(
		(tool) =>
			getToolMeta(tool)?.SMSS_MCP_GENERATOR === CONNECTORS_GENERATOR,
	);

/**
 * Whether a room's tool is one of the connectors': stamped with
 * {@link CONNECTORS_GENERATOR}, or, in a room written before the connectors
 * were kept for the user, a tool a connector service runs.
 *
 * @param tool - A tool from a room's file.
 * @returns True for a connector tool.
 */
const isConnectorTool = (tool: McpTool): boolean => {
	const meta = getToolMeta(tool);
	if (!meta) {
		return false;
	}
	return (
		meta.SMSS_MCP_GENERATOR === CONNECTORS_GENERATOR ||
		(typeof meta.SMSS_FUNCTION_NAME === "string" &&
			findConnectorTool(meta.SMSS_FUNCTION_NAME) !== undefined)
	);
};

/**
 * Which services some tools switch on: those with a tool present and not
 * `disabled`.
 *
 * @param tools - Tools from an MCP definition file.
 * @returns The services, in catalog order.
 */
export const getConnectorServices = (
	tools: readonly McpTool[],
): ConnectorServiceId[] => {
	const enabled = new Set<ConnectorServiceId>();
	for (const tool of tools) {
		const meta = getToolMeta(tool);
		const reactor = meta?.SMSS_FUNCTION_NAME;
		if (
			!meta ||
			typeof reactor !== "string" ||
			meta.SMSS_MCP_EXECUTION === "disabled"
		) {
			continue;
		}
		const connector = findConnectorTool(reactor);
		if (connector) {
			enabled.add(connector.service.id);
		}
	}
	return sanitizeConnectorServices([...enabled]);
};

/**
 * A room's tool file with its connector tools replaced by the user's, and every
 * other tool kept as it is.
 *
 * @param roomMcpJson - The room's parsed `mcp/pixel_mcp.json`, or null when it
 * has none.
 * @param userTools - The user's connector tools.
 * @returns The file to write, or null when the room already holds exactly the
 * user's connector tools.
 */
export const mergeUserConnectorTools = (
	roomMcpJson: unknown,
	userTools: readonly McpTool[],
): Record<string, unknown> | null => {
	const roomTools = readMcpTools(roomMcpJson);
	const current = roomTools.filter(isConnectorTool);
	if (JSON.stringify(current) === JSON.stringify(userTools)) {
		return null;
	}
	const file = isRecord(roomMcpJson) ? roomMcpJson : {};
	return {
		...file,
		tools: [
			...userTools,
			...roomTools.filter((tool) => !isConnectorTool(tool)),
		],
		_meta: {
			...(isRecord(file._meta) ? file._meta : {}),
			last_modified_date: new Date().toISOString().slice(0, 10),
		},
	};
};

/**
 * The tools the user's connector file holds for the services switched on:
 * every tool of each service, with how it runs. Nothing switched on gives no
 * tools, which empties the connectors out of the file.
 *
 * Tools that ask first are shown inline in the conversation, where their
 * approval card sits next to the message that proposed them.
 *
 * @param services - The services to switch on.
 * @returns The tools to write with `MakeUserPixelMCP`.
 */
export const buildUserConnectorTools = (
	services: readonly ConnectorServiceId[],
): UserPixelMcpTool[] =>
	CONNECTOR_SERVICES.filter((service) =>
		services.includes(service.id),
	).flatMap((service) =>
		service.tools.map((tool) => ({
			reactor: tool.reactor,
			// a reactor that names its own view keeps where it shows it; the rest show
			// a call that asks inline, where its Allow is
			metadata: tool.declaresView
				? { SMSS_MCP_EXECUTION: tool.execution }
				: {
						SMSS_MCP_EXECUTION: tool.execution,
						SMSS_MCP_UI: {
							displayLocation:
								tool.execution === "ask" ? "inline" : "sidebar",
						},
					},
		})),
	);

/**
 * The user's connector tools, from their own file.
 *
 * @returns The tools, or null when the user has not chosen connectors yet.
 * @throws Error when the file is there but cannot be read.
 */
export const readUserConnectorTools = async (): Promise<McpTool[] | null> => {
	let file: unknown;
	try {
		file = await readUserAsset(USER_CONNECTORS_PATH);
	} catch (error) {
		if (isMissingFileError(getErrorMessage(error))) {
			return null;
		}
		throw error;
	}
	return readConnectorTools(parseMcpFile(file));
};

/** Told about every save of the user's connector tools on this page. */
const userConnectorToolsListeners = new Set<
	(tools: readonly McpTool[]) => void
>();

/**
 * Hear about every save of the user's connector tools on this page, such as
 * one made on the settings page, so an open chat can take the change straight
 * away.
 *
 * @param listener - Called with the tools the user's file now holds.
 * @returns Stops listening.
 */
export const subscribeUserConnectorTools = (
	listener: (tools: readonly McpTool[]) => void,
): (() => void) => {
	userConnectorToolsListeners.add(listener);
	return () => {
		userConnectorToolsListeners.delete(listener);
	};
};

/**
 * Switch the user's connectors: write the tools of the services switched on
 * into their own file, which every chat of theirs copies.
 *
 * @param services - The services to switch on.
 * @returns The connector tools the file now holds.
 * @throws Error when the backend refuses the change.
 */
export const writeUserConnectorTools = async (
	services: readonly ConnectorServiceId[],
): Promise<McpTool[]> => {
	const tools = readConnectorTools(
		await makeUserPixelMcp({
			filePath: USER_CONNECTORS_PATH,
			generator: CONNECTORS_GENERATOR,
			tools: buildUserConnectorTools(services),
		}),
	);
	for (const listener of userConnectorToolsListeners) {
		listener(tools);
	}
	return tools;
};

/**
 * Bring a room's copy of the user's connector tools up to date, keeping every
 * other tool in its file, then refresh the room's options so its toolbox
 * reflects them. Nothing is written when the room already holds them.
 *
 * @param room - A room bound to its insight.
 * @param userTools - The user's connector tools.
 * @throws Error when the room's file cannot be read or written.
 */
export const syncRoomConnectorTools = async (
	room: RoomStore,
	userTools: readonly McpTool[],
): Promise<void> => {
	const isWritten = await updateRoomToolFile(room, (file) =>
		mergeUserConnectorTools(file, userTools),
	);
	if (isWritten) {
		await room.syncRoomOptions();
	}
};

/**
 * The tools in a room's own file, for a room whose user has not chosen
 * connectors yet and so keeps the ones it has.
 *
 * @param room - A room bound to its insight.
 * @returns The tools; none when the room has no file.
 * @throws Error when the room's file cannot be read.
 */
export const loadRoomTools = async (room: RoomStore): Promise<McpTool[]> =>
	readMcpTools(await readRoomToolFile(room));
