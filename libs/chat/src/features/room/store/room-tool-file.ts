import { getFileExplorerAdapter } from "@semoss/shared";
import { tryParseJson } from "@semoss/utility/json";
import type { RoomStore } from "./room.store";

/** Where a room keeps its own toolbox, in its insight's assets. */
const ROOM_TOOL_FILE_PATH = "/mcp/pixel_mcp.json";

/** How the asset reactors answer for a file that is not there. */
const MISSING_FILE = /does not exist/i;

/** Builds the insight asset pixels, as the file explorer does. */
const INSIGHT_ASSETS = getFileExplorerAdapter({ type: "INSIGHT" });

/**
 * Whether an asset read failed because the file is not there.
 *
 * @param message - The read's error text.
 * @returns True for a missing file.
 */
export const isMissingFileError = (message: string): boolean =>
	MISSING_FILE.test(message);

/**
 * A pixel MCP file as the asset reactors return it, which is its text.
 *
 * @param output - The reactor's output.
 * @returns The parsed file, or null when it is not JSON.
 */
export const parseMcpFile = (output: unknown): unknown => {
	if (typeof output !== "string") {
		return output ?? null;
	}
	return tryParseJson(output) ?? null;
};

/**
 * A room's own tool file, which holds its toolbox.
 *
 * @param room - A room bound to its insight.
 * @returns The parsed file, or null when the room has none.
 * @throws Error when the file is there but cannot be read.
 */
export const readRoomToolFile = async (room: RoomStore): Promise<unknown> => {
	const response = await room.runRoomPixel<[unknown]>(
		INSIGHT_ASSETS.read(ROOM_TOOL_FILE_PATH),
		{ showLoading: false, setErrorOnFail: false, throwOnError: false },
	);
	if (response.errors.length > 0) {
		if (response.errors.some(isMissingFileError)) {
			return null;
		}
		throw new Error(response.errors.join(""));
	}
	return parseMcpFile(response.pixelReturn[0]?.output);
};

/**
 * Replace a room's own tool file.
 *
 * @param room - A room bound to its insight.
 * @param file - The file to write.
 * @throws Error when the backend refuses the write.
 */
export const saveRoomToolFile = async (
	room: RoomStore,
	file: unknown,
): Promise<void> => {
	// JSON may escape the slash, so a closing encode marker in a description
	// cannot end the block early
	const text = JSON.stringify(file, null, 4).replace(
		/<\/encode>/gi,
		"<\\/encode>",
	);
	await room.runRoomPixel(INSIGHT_ASSETS.save(ROOM_TOOL_FILE_PATH, text), {
		showLoading: false,
		setErrorOnFail: false,
	});
};

/** Each room's tool file update in flight, so updates run one at a time. */
const pendingUpdates = new WeakMap<RoomStore, Promise<unknown>>();

/**
 * Change a room's own tool file: read it, let `change` build the next one, and
 * write that. Updates to one room run one after another, so two writers (the
 * connectors and the desktop folders) never read the same file and each
 * write over the other's change.
 *
 * @param room - A room bound to its insight.
 * @param change - Builds the next file from the current one (null when the
 * room has none), or returns null to leave it as it is.
 * @returns Whether a file was written.
 * @throws Error when the file cannot be read or written.
 */
export const updateRoomToolFile = (
	room: RoomStore,
	change: (file: unknown) => Record<string, unknown> | null,
): Promise<boolean> => {
	const previous = pendingUpdates.get(room) ?? Promise.resolve();
	const update = previous
		.catch(() => undefined)
		.then(async () => {
			const next = change(await readRoomToolFile(room));
			if (!next) {
				return false;
			}
			await saveRoomToolFile(room, next);
			return true;
		});
	pendingUpdates.set(room, update);
	return update;
};
