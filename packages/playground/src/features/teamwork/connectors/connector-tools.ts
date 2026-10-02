import { runPixel } from "@semoss/sdk";
import { tryParseJson } from "@semoss/utility/json";
import type { RoomStore } from "@/stores/room/room.store";
import { parseRoomToolbox } from "../tools/chat-tool-info";
import {
	buildUserConnectorToolsPixel,
	type ConnectorServiceId,
	type McpTool,
	mergeUserConnectorTools,
	ROOM_PIXEL_TOOLS_PATH,
	readConnectorTools,
	readMcpTools,
	USER_CONNECTORS_PATH,
} from "./connector.catalog";

/** How the asset reactors answer for a file that is not there. */
const MISSING_FILE = /does not exist/i;

/**
 * A definition file as the asset reactors return it, which is its text.
 *
 * @param output - The reactor's output.
 * @return The parsed file, or null when it is not JSON.
 */
const parseMcpFile = (output: unknown): unknown => {
	if (typeof output !== "string") {
		return output ?? null;
	}
	return tryParseJson(output) ?? null;
};

/**
 * A room's tool file.
 *
 * @param room - A room bound to its insight.
 * @return The parsed file, or null when the room has none.
 * @throws Error when the file is there but cannot be read.
 */
const readRoomToolFile = async (room: RoomStore): Promise<unknown> => {
	const response = await room.runRoomPixel<[unknown]>(
		`GetInsightAssets(filePath=[${JSON.stringify(ROOM_PIXEL_TOOLS_PATH)}]);`,
		false,
		false,
		false,
	);
	if (response.errors.length > 0) {
		if (response.errors.some((error) => MISSING_FILE.test(error))) {
			return null;
		}
		throw new Error(response.errors.join(""));
	}
	return parseMcpFile(response.pixelReturn[0]?.output);
};

/**
 * Run a pixel for the user rather than for a room.
 *
 * @param pixel - The pixel.
 * @return Its first statement's output.
 * @throws Error when the pixel fails.
 */
const runUserPixel = async (pixel: string): Promise<unknown> => {
	const { errors, pixelReturn } = await runPixel<[unknown]>(pixel);
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}
	return pixelReturn[0]?.output;
};

/**
 * The user's connector tools, from their own file.
 *
 * @return The tools, or null when the user has not chosen connectors yet.
 * @throws Error when the file is there but cannot be read.
 */
export const readUserConnectorTools = async (): Promise<McpTool[] | null> => {
	try {
		return readConnectorTools(
			parseMcpFile(
				await runUserPixel(
					`GetUserAssets(filePath=${JSON.stringify([USER_CONNECTORS_PATH])});`,
				),
			),
		);
	} catch (error) {
		if (error instanceof Error && MISSING_FILE.test(error.message)) {
			return null;
		}
		throw error;
	}
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
		await runUserPixel(buildUserConnectorToolsPixel(services)),
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
	// JSON may escape the slash, so a closing encode marker in a description
	// cannot end the block early
	const text = JSON.stringify(next, null, 4).replace(
		/<\/encode>/gi,
		"<\\/encode>",
	);
	await room.runRoomPixel(
		`SaveInsightAssets(filePath=${JSON.stringify([ROOM_PIXEL_TOOLS_PATH])}, content=["<encode>${text}</encode>"]);`,
		false,
		false,
		true,
	);
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

/**
 * The tools a room's own toolbox offers the assistant, as its tool file
 * holds them.
 *
 * @param room - A room bound to its insight.
 * @return The tools; none when the room has no tool file.
 */
export const loadRoomToolbox = async (
	room: RoomStore,
): Promise<ReturnType<typeof parseRoomToolbox>> =>
	parseRoomToolbox(await readRoomToolFile(room));
