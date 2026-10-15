import { makeUserPixelMcp, runPixel } from "@semoss/sdk";
import { getFileExplorerAdapter } from "@semoss/shared";
import type { RoomStore } from "@/stores/room/room.store";
import {
	isMissingFileError,
	parseMcpFile,
	readRoomToolFile,
	saveRoomToolFile,
} from "@/stores/room/room-tool-file";
import {
	buildUserConnectorTools,
	CONNECTORS_GENERATOR,
	type ConnectorServiceId,
	type McpTool,
	mergeUserConnectorTools,
	readConnectorTools,
	readMcpTools,
	USER_CONNECTORS_PATH,
} from "./connector.catalog";

/** Builds the user asset pixels, as the file explorer does. */
const USER_ASSETS = getFileExplorerAdapter({ type: "USER" });

/**
 * The user's connector tools, from their own file.
 *
 * @return The tools, or null when the user has not chosen connectors yet.
 * @throws Error when the file is there but cannot be read.
 */
export const readUserConnectorTools = async (): Promise<McpTool[] | null> => {
	const { errors, pixelReturn } = await runPixel<[unknown]>(
		USER_ASSETS.read(USER_CONNECTORS_PATH),
	);
	if (errors.length > 0) {
		const message = errors.join("");
		if (isMissingFileError(message)) {
			return null;
		}
		throw new Error(message);
	}
	return readConnectorTools(parseMcpFile(pixelReturn[0]?.output));
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
 * @return Stops listening.
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
 * @return The connector tools the file now holds.
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
	const next = mergeUserConnectorTools(
		await readRoomToolFile(room),
		userTools,
	);
	if (!next) {
		return;
	}
	await saveRoomToolFile(room, next);
	await room.syncRoomOptions();
};

/**
 * The tools in a room's own file, for a room whose user has not chosen
 * connectors yet and so keeps the ones it has.
 *
 * @param room - A room bound to its insight.
 * @return The tools; none when the room has no file.
 * @throws Error when the room's file cannot be read.
 */
export const loadRoomTools = async (room: RoomStore): Promise<McpTool[]> =>
	readMcpTools(await readRoomToolFile(room));
