import type {
	AddToolExecutionParams,
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
 * Unwrap the room options payload, which the backend returns as a JSON
 * string, a single-element array, or an object nested under a `roomOptions`
 * or `OPTIONS` key (the latter alongside `ROOM_NAME` on current backends).
 */
const normalizeRoomOptions = (value: unknown): RoomOptions | null => {
	if (!value) {
		return null;
	}

	if (typeof value === "string") {
		try {
			return normalizeRoomOptions(JSON.parse(value));
		} catch {
			return null;
		}
	}

	if (Array.isArray(value)) {
		return normalizeRoomOptions(value[0]);
	}

	if (typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	if ("roomOptions" in record) {
		return normalizeRoomOptions(record.roomOptions);
	}

	if ("OPTIONS" in record) {
		return normalizeRoomOptions(record.OPTIONS);
	}

	return record as RoomOptions;
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
	const { errors, pixelReturn } = await runPixel<[unknown]>(pixel, insightId);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = normalizeRoomOptions(pixelReturn[0]?.output);
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
 * Serialize an AskRoom turn to its pixel argument list. Shared by the live
 * call and the cancel-commit so a stopped turn replays byte-identical
 * parameters — the backend matches the two up by them.
 */
const buildAskRoomArgs = (params: AskRoomParams): string => {
	const {
		engine,
		roomId,
		command,
		media = [],
		parentMessageId,
		paramValues,
	} = params;

	return [
		`engine=["${engine}"]`,
		`roomId=["${roomId}"]`,
		`command=["<encode>${command}</encode>"]`,
		`media=${JSON.stringify(media)}`,
		`parentMessageId=["${parentMessageId}"]`,
		`paramValues=${JSON.stringify(paramValues ?? [{}])}`,
	].join(", ");
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
	const pixel = `AskRoom(${buildAskRoomArgs(params)});`;

	return runPixelAsync(pixel, insightId);
};

/** Settled input/response pair an AskRoom-family call resolves. */
export interface AskRoomSettledOutput {
	inputMessage: { messageId: string; [key: string]: unknown };
	responseMessage: {
		messageId: string;
		parts: Array<{ type: string; text?: string; [key: string]: unknown }>;
		[key: string]: unknown;
	};
}

/**
 * Aborts a running pixel job (`StopPixelExecution`). Cancelling an AskRoom
 * job persists nothing on its own — follow it with
 * {@link commitCancelledAskRoom} so the turn is not lost.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param jobId - Job returned by {@link askRoom}.
 */
export const stopRoomJob = async (
	insightId: string,
	jobId: string,
): Promise<void> => {
	const { errors } = await runPixel(
		`StopPixelExecution(id=["${jobId}"]);`,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}
};

/**
 * Persist a turn the user stopped mid-stream. Replays the same turn's exact
 * parameters with the parts that actually streamed, so the backend skips the
 * model call, commits the pair, and appends a hidden note telling the model
 * next turn that its answer was cut short. Without this the user's message is
 * orphaned in the room.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - The same params passed to the {@link askRoom} call being cancelled.
 * @param responseParts - The parts the user actually saw, in order.
 * @param note - The hidden message explaining the cancellation to the model.
 */
export const commitCancelledAskRoom = async (
	insightId: string,
	params: AskRoomParams,
	responseParts: Array<{ type: string; [key: string]: unknown }>,
	note: string,
): Promise<AskRoomSettledOutput> => {
	const pixel = `AskRoom(${buildAskRoomArgs(params)}, responseParts=${JSON.stringify(
		responseParts,
	)}, hiddenMessage=["<encode>${note}</encode>"]);`;

	const { errors, pixelReturn } = await runPixel<[AskRoomSettledOutput]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = pixelReturn[0]?.output;
	if (!output?.responseMessage) {
		throw new Error("AskRoom did not return a response message");
	}

	return output;
};

/**
 * Marks the error {@link RoomStore.ask} throws when a turn is stopped via
 * {@link RoomStore.stop} rather than failing outright.
 */
const ROOM_ASK_ABORTED = "RoomAskAbortedError";

/** Build the error thrown when a room turn is stopped. */
export const roomAskAbortedError = (): Error => {
	const error = new Error("The room turn was stopped");
	error.name = ROOM_ASK_ABORTED;
	return error;
};

/**
 * Whether a thrown value is a {@link RoomStore.ask} call reporting a stopped
 * turn rather than a genuine failure. Callers unwind silently on this — the
 * {@link RoomStore.stop} caller owns persisting whatever already streamed.
 *
 * @param error - Thrown value of any shape.
 */
export const isRoomAskAborted = (error: unknown): boolean =>
	error instanceof Error && error.name === ROOM_ASK_ABORTED;

/**
 * Submits a completed tool result back to the room, triggering a
 * follow-up LLM turn. Returns a job ID for streaming the response.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Tool execution details. See {@link AddToolExecutionParams}.
 * @returns `{ jobId }` to pass to {@link getPixelJobStreaming}.
 * @see sdk-chat skill for the full tool-execution call stack.
 */
export const addToolExecution = async (
	insightId: string,
	params: AddToolExecutionParams,
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
		`AddToolExecution(`,
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
	const pixel = `GetUserConversationRooms${args};`;
	const { errors, pixelReturn } = await runPixel<[RoomRecord[]]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error("GetUserConversationRooms returned no data");
	}

	return output;
};
