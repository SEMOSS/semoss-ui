import type { PixelMessage } from "../stores/room/room.types";
import type { RoomOptions, RoomRecord } from "../types";
import { runPixel, runPixelAsync } from "./base";
import {
	chatPixels,
	type ExportMarkdownParams,
	type PlaygroundCommit,
	type PlaygroundRoomRow,
	type PlaygroundRoomsQuery,
	type PlaygroundToolExecutionParams,
	type PlaygroundTurnParams,
} from "./chat-pixels";

// -------------------------------------------------------------------------------------------------
// API FUNCTIONS
// -------------------------------------------------------------------------------------------------

/**
 * Fetches the current configuration options for a room.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param roomId - The ID of the room to get options for.
 * @returns The room's configuration options.
 */
export const getRoomOptions = async (
	insightId: string,
	roomId: string,
): Promise<RoomOptions> => {
	const pixel = `GetRoomOptions(roomId="${roomId}");`;
	const { errors, pixelReturn } = await runPixel<[RoomOptions]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error("GetRoomOptions returned no data");
	}

	return output;
};

/**
 * Associates a room with the current insight session.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param roomId - The ID of the room to bind to the insight.
 */
export const setRoomForInsight = async (
	insightId: string,
	roomId: string,
): Promise<void> => {
	const pixel = `SetRoomForInsight(roomId="${roomId}");`;
	const { errors } = await runPixel(pixel, insightId);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}
};

/**
 * Retrieves the room currently bound to the given insight, if any.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @returns The bound room, or `null` if the insight has no bound room.
 */
export const getRoomForInsight = async (
	insightId: string,
): Promise<RoomRecord | null> => {
	const pixel = `GetRoomForInsight();`;
	const { errors, pixelReturn } = await runPixel<[RoomRecord | null]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	return pixelReturn[0]?.output ?? null;
};

/**
 * Updates the configuration options for a room.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param roomId - The ID of the room to update.
 * @param roomOptions - Array of room option objects to apply.
 */
export const updateRoomOptions = async (
	insightId: string,
	roomId: string,
	roomOptions: RoomOptions[],
): Promise<void> => {
	const pixel = `UpdateRoomOptions(roomId="${roomId}", roomOptions=${JSON.stringify(roomOptions)});`;
	const { errors } = await runPixel(pixel, insightId);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}
};

// -------------------------------------------------------------------------------------------------
// PLAYGROUND ROOMS
// -------------------------------------------------------------------------------------------------

/**
 * Throw the statements' errors, when there are any, the way every room
 * wrapper reports a failed pixel.
 */
const throwOnErrors = (errors: string[]): void => {
	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}
};

/**
 * Create a room through `CreatePlaygroundRoom`, the reactor every surface
 * creates rooms with. Without an insight id the backend makes a fresh insight
 * for the room, which is how 1 room = 1 insight starts.
 *
 * @param options.workspaceId - The agent (workspace) the room starts from.
 * @param options.mode - The room's mode; `collaboration` turns on the
 * collaboration tools. Omit for a normal room.
 * @param insightId - The insight to run in; defaults to a new one.
 * @returns The room's id and the insight the pixel ran in.
 */
export const createPlaygroundRoom = async (
	options: { workspaceId?: string; mode?: string } = {},
	insightId = "new",
): Promise<{ roomId: string; insightId: string }> => {
	const response = await runPixel<[{ roomId: string }]>(
		chatPixels.createRoom(options),
		insightId,
	);
	throwOnErrors(response.errors);

	const roomId = response.pixelReturn[0]?.output?.roomId;
	if (!roomId) {
		throw new Error("CreatePlaygroundRoom returned no room");
	}
	return { roomId: roomId, insightId: response.insightId };
};

/**
 * Send a chat turn through `AskPlayground` and return its job id. Watch the
 * job with {@link getPixelJobStreaming} and read the turn with
 * {@link getPixelAsyncResult}. With `commit`, the backend skips the model and
 * persists `responseParts` as the turn (a stopped turn's commit).
 *
 * @param insightId - The room's insight.
 * @param params - The turn. Client tools go in `paramValues.tools`.
 * @param commit - Persist these parts and hidden note instead of asking.
 * @returns The job id.
 */
export const askPlayground = (
	insightId: string,
	params: PlaygroundTurnParams,
	commit?: PlaygroundCommit,
): Promise<{ jobId: string }> =>
	runPixelAsync(chatPixels.ask(params, commit), insightId);

/**
 * Save a tool call's result through `AddPlaygroundToolExecution`, which hands
 * it to the model once every call of the response has one. Returns the job
 * that streams the model's follow up. Client tools must ride along again in
 * `paramValues.tools`: the follow up only re-adds the room's own tools.
 *
 * @param insightId - The room's insight.
 * @param params - The result.
 * @param commit - Persist these parts and hidden note instead of asking.
 * @returns The job id.
 */
export const addPlaygroundToolExecution = (
	insightId: string,
	params: PlaygroundToolExecutionParams,
	commit?: PlaygroundCommit,
): Promise<{ jobId: string }> =>
	runPixelAsync(chatPixels.addToolExecution(params, commit), insightId);

/**
 * Read a room's messages through `GetPlaygroundMessages`.
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 * @returns The messages, as the backend stores them.
 */
export const getPlaygroundMessages = async <M = PixelMessage>(
	insightId: string,
	roomId: string,
): Promise<M[]> => {
	const response = await runPixel<[M[]]>(
		chatPixels.getMessages(roomId),
		insightId,
	);
	throwOnErrors(response.errors);
	return response.pixelReturn[0]?.output ?? [];
};

/**
 * List the user's rooms through `GetPlaygroundRooms`. A room is listed once
 * its first message has data.
 *
 * @param insightId - The insight to run in, such as the session's.
 * @param query - Search, paging, pinned filter, sort, mode and room scope.
 * @returns The rooms, newest first unless `sort` says otherwise.
 */
export const getPlaygroundRooms = async (
	insightId: string,
	query: PlaygroundRoomsQuery = {},
): Promise<PlaygroundRoomRow[]> => {
	const response = await runPixel<[PlaygroundRoomRow[]]>(
		chatPixels.getRooms(query),
		insightId,
	);
	throwOnErrors(response.errors);
	return response.pixelReturn[0]?.output ?? [];
};

/**
 * Forget a room for the user (`RemoveUserRoom`).
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 */
export const removeUserRoom = async (
	insightId: string,
	roomId: string,
): Promise<void> => {
	const { errors } = await runPixel(chatPixels.removeRoom(roomId), insightId);
	throwOnErrors(errors);
};

/**
 * Rename a room (`RenameRoom`).
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 * @param name - The new name; trimmed by the caller.
 */
export const renameRoom = async (
	insightId: string,
	roomId: string,
	name: string,
): Promise<void> => {
	const { errors } = await runPixel(
		chatPixels.renameRoom(roomId, name),
		insightId,
	);
	throwOnErrors(errors);
};

/**
 * Pin or unpin a room (`PinRoom`).
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 * @param pinned - Whether it is pinned.
 */
export const pinRoom = async (
	insightId: string,
	roomId: string,
	pinned: boolean,
): Promise<void> => {
	const { errors } = await runPixel(
		chatPixels.pinRoom(roomId, pinned),
		insightId,
	);
	throwOnErrors(errors);
};

/**
 * Ask the backend to name a room from its conversation (`GenerateRoomName`).
 *
 * @param insightId - The room's insight.
 * @param params.roomId - The room.
 * @param params.prompt - Text to name it from; defaults to its messages.
 * @param params.engine - The model to name it with.
 * @returns The name the backend chose, or null when it gave none.
 */
export const generateRoomName = async (
	insightId: string,
	params: { roomId: string; prompt?: string; engine?: string },
): Promise<string | null> => {
	const response = await runPixel<[unknown]>(
		chatPixels.generateRoomName(params),
		insightId,
	);
	throwOnErrors(response.errors);
	const output = response.pixelReturn[0]?.output;
	if (typeof output === "string") {
		return output || null;
	}
	if (output && typeof output === "object" && "name" in output) {
		const name = (output as { name?: unknown }).name;
		return typeof name === "string" && name ? name : null;
	}
	return null;
};

/**
 * Stop a running pixel job (`StopPixelExecution`). Stopping a job does not
 * prove its backend work was cancelled.
 *
 * @param insightId - The job's insight.
 * @param jobId - The job.
 */
export const stopPixelExecution = async (
	insightId: string,
	jobId: string,
): Promise<void> => {
	const { errors } = await runPixel(chatPixels.stopJob(jobId), insightId);
	throwOnErrors(errors);
};

/**
 * Rate a response (`SubmitLlmFeedback`).
 *
 * @param insightId - The room's insight.
 * @param params - The response, the rating and an optional note.
 */
export const submitLlmFeedback = async (
	insightId: string,
	params: {
		roomId: string;
		messageId: string;
		/** Thumbs up (true) or down (false); null clears the rating. */
		rating: boolean | null;
		feedbackText?: string;
	},
): Promise<void> => {
	const { errors } = await runPixel(
		chatPixels.submitFeedback(params),
		insightId,
	);
	throwOnErrors(errors);
};

/**
 * Render markdown as a Word or PDF file the insight can download
 * (`ToDocx` / `ToPdf`). Download it from the same insight.
 *
 * @param insightId - The insight to make the file in.
 * @param params - The markdown, file name and format.
 * @returns The file's download key.
 */
export const exportMarkdown = async (
	insightId: string,
	params: ExportMarkdownParams,
): Promise<string> => {
	const response = await runPixel<[string]>(
		chatPixels.exportMarkdown(params),
		insightId,
	);
	throwOnErrors(response.errors);
	const first = response.pixelReturn[0];
	if (!first?.operationType?.includes("FILE_DOWNLOAD")) {
		throw new Error(
			`Failed to generate ${params.format.toUpperCase()} file. Operation type: ${first?.operationType}`,
		);
	}
	return first.output;
};
