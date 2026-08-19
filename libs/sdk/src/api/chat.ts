import type {
	AddRoomToolExecutionParams,
	AskRoomParams,
	PlaygroundMessage,
	PlaygroundRoom,
	PlaygroundRoomOptions,
} from "../types";
import { runPixel, runPixelAsync } from "./base";

// -------------------------------------------------------------------------------------------------
// API FUNCTIONS
// -------------------------------------------------------------------------------------------------

/**
 * Creates a new playground room tied to a workspace.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param workspaceId - The ID of the workspace to create the room in.
 * @returns The newly created playground room.
 */
export const createPlaygroundRoom = async (
	insightId: string,
	workspaceId?: string,
): Promise<PlaygroundRoom> => {
	const pixel = workspaceId
		? `CreateRoom(workspaceId="${workspaceId}");`
		: `CreateRoom();`;
	const { errors, pixelReturn } = await runPixel<[PlaygroundRoom]>(
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
 * Retrieves all messages for a given playground room.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param roomId - The ID of the room to fetch messages for.
 * @returns The list of messages in the room.
 */
export const getRoomMessages = async (
	insightId: string,
	roomId: string,
): Promise<PlaygroundMessage[]> => {
	const pixel = `GetRoomMessages(roomId=["${roomId}"]);`;
	const { errors, pixelReturn } = await runPixel<[PlaygroundMessage[]]>(
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
 * Fetches the current configuration options for a playground room.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param roomId - The ID of the room to get options for.
 * @returns The room's configuration options.
 */
export const getRoomOptions = async (
	insightId: string,
	roomId: string,
): Promise<PlaygroundRoomOptions> => {
	const pixel = `GetRoomOptions(roomId="${roomId}");`;
	const { errors, pixelReturn } = await runPixel<[PlaygroundRoomOptions]>(
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
 * Associates a playground room with the current insight session.
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
 * Updates the configuration options for a playground room.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param roomId - The ID of the room to update.
 * @param roomOptions - Array of room option objects to apply.
 */
export const updateRoomOptions = async (
	insightId: string,
	roomId: string,
	roomOptions: PlaygroundRoomOptions[],
): Promise<void> => {
	const pixel = `UpdateRoomOptions(roomId="${roomId}", roomOptions=${JSON.stringify(roomOptions)});`;
	const { errors } = await runPixel(pixel, insightId);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}
};

/**
 * Sends a message to the playground and returns the job ID for streaming.
 * Poll with {@link getPixelJobStreaming} until a terminal status, then fetch
 * the full result with {@link getPixelAsyncResult}.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Message parameters. See {@link AskRoomParams}.
 * @returns `{ jobId }` to pass to {@link getPixelJobStreaming}.
 * @see sdk-playground skill for the full streaming loop and chat-vs-agent guide.
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
 * Submits a completed tool result back to the playground, triggering a
 * follow-up LLM turn. Returns a job ID for streaming the response.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Tool execution details. See {@link AddRoomToolExecutionParams}.
 * @returns `{ jobId }` to pass to {@link getPixelJobStreaming}.
 * @see sdk-playground skill for the full tool-execution call stack.
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
 * Retrieves a list of playground rooms, optionally filtered by pinned status and sort order.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param options - Optional query parameters.
 * @param options.pinned - When true, returns only pinned rooms.
 * @param options.sort - Sort direction for the returned rooms.
 * @returns The list of playground rooms.
 */
export const getUserRooms = async (
	insightId: string,
	options: {
		pinned?: boolean;
		sort?: "ASC" | "DESC";
	} = {},
): Promise<PlaygroundRoom[]> => {
	const parts: string[] = [];

	if (options.pinned !== undefined) {
		parts.push(`pinned=[${options.pinned}]`);
	}
	if (options.sort) {
		parts.push(`sort=["${options.sort}"]`);
	}

	const args = parts.length > 0 ? `(${parts.join(", ")})` : "()";
	const pixel = `META | GetUserConversationRoomsReactor${args};`;
	const { errors, pixelReturn } = await runPixel<[PlaygroundRoom[]]>(
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
