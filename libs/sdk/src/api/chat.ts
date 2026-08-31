import type {
	AddRoomToolExecutionParams,
	AskRoomParams,
	RoomMessage,
	RoomOptions,
	RoomRecord,
} from "../types";
import { runPixel, runPixelAsync } from "./base";

// -------------------------------------------------------------------------------------------------
// API FUNCTIONS
// -------------------------------------------------------------------------------------------------

/**
 * Creates a new room tied to a workspace.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param workspaceId - The ID of the workspace to create the room in.
 * @returns The newly created room.
 */
export const createRoomRecord = async (
	insightId: string,
	workspaceId?: string,
): Promise<RoomRecord> => {
	const pixel = workspaceId
		? `CreateRoom(workspaceId="${workspaceId}");`
		: `CreateRoom();`;
	const { errors, pixelReturn } = await runPixel<[RoomRecord]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error("CreateRoom returned no data");
	}

	return output;
};

/**
 * Retrieves all messages for a given room.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param roomId - The ID of the room to fetch messages for.
 * @returns The list of messages in the room.
 */
export const getRoomMessages = async (
	insightId: string,
	roomId: string,
): Promise<RoomMessage[]> => {
	const pixel = `GetRoomMessages(roomId=["${roomId}"]);`;
	const { errors, pixelReturn } = await runPixel<[RoomMessage[]]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error("GetRoomMessages returned no data");
	}

	return output;
};

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

/**
 * Sends a message to the room and returns the job ID for streaming.
 * Poll with {@link getPixelJobStreaming} until a terminal status, then fetch
 * the full result with {@link getPixelAsyncResult}.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Message parameters. See {@link AskRoomParams}.
 * @returns `{ jobId }` to pass to {@link getPixelJobStreaming}.
 * @see sdk-chat skill for the full streaming loop and chat-vs-agent guide.
 */
export const askRoom = async (
	insightId: string,
	params: AskRoomParams,
): Promise<{ jobId: string }> => {
	const {
		engine,
		roomId,
		command,
		context,
		image = [],
		parentMessageId,
		paramValues = [{}],
	} = params;

	const pixel = `AskRoom(engine=["${engine}"], roomId=["${roomId}"], command=["<encode>${command}</encode>"], context=["<encode>${context}</encode>"], image=${JSON.stringify(image)}, parentMessageId=["${parentMessageId}"], paramValues=${JSON.stringify(paramValues)})`;

	return runPixelAsync(pixel, insightId);
};

/**
 * Submits a completed tool result back to the room, triggering a
 * follow-up LLM turn. Returns a job ID for streaming the response.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Tool execution details. See {@link AddRoomToolExecutionParams}.
 * @returns `{ jobId }` to pass to {@link getPixelJobStreaming}.
 * @see sdk-chat skill for the full tool-execution call stack.
 */
export const addRoomToolExecution = async (
	insightId: string,
	params: AddRoomToolExecutionParams,
): Promise<{ jobId: string }> => {
	const {
		engine,
		roomId,
		parentMessageId,
		toolId,
		toolName,
		toolExecutionResponse,
		mcpToolStatus,
		toolParameterValues,
		paramValues = [{}],
	} = params;

	const lines: string[] = [
		`AddRoomToolExecution(`,
		`engine=["${engine}"],`,
		`roomId=["${roomId}"],`,
		...(parentMessageId ? [`parentMessageId=["${parentMessageId}"],`] : []),
		`toolId=["${toolId}"],`,
		`toolName=["${toolName}"],`,
		`toolExecutionResponse=["<encode>${toolExecutionResponse}</encode>"],`,
		`paramValues=${JSON.stringify(paramValues)},`,
		`mcpToolStatus=${JSON.stringify(mcpToolStatus)},`,
		`toolParameterValues=[${JSON.stringify(toolParameterValues)}]`,
		`);`,
	];

	const pixel = lines.join("\n");

	return runPixelAsync(pixel, insightId);
};

/**
 * Retrieves a list of rooms, optionally filtered by pinned status and sort order.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param options - Optional query parameters.
 * @param options.pinned - When true, returns only pinned rooms.
 * @param options.sort - Sort direction for the returned rooms.
 * @returns The list of rooms.
 */
export const getUserRooms = async (
	insightId: string,
	options: {
		pinned?: boolean;
		sort?: "ASC" | "DESC";
	} = {},
): Promise<RoomRecord[]> => {
	const parts: string[] = [];

	if (options.pinned !== undefined) {
		parts.push(`pinned=[${options.pinned}]`);
	}
	if (options.sort) {
		parts.push(`sort=["${options.sort}"]`);
	}

	const args = parts.length > 0 ? `(${parts.join(", ")})` : "()";
	const pixel = `META | GetUserConversationRoomsReactor${args};`;
	const { errors, pixelReturn } = await runPixel<[RoomRecord[]]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error("GetUserConversationRoomsReactor returned no data");
	}

	return output;
};
