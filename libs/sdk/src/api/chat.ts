import { runPixel } from "../lib/pixel";
import type {
	AddRoomToolExecutionParams,
	AskRoomParams,
	RoomMessage,
	RoomOptions,
	RoomRecord,
} from "../types";
import { runPixelAsync } from "./base";

// -------------------------------------------------------------------------------------------------
// API FUNCTIONS
// -------------------------------------------------------------------------------------------------

/**
 * Creates a new room tied to a workspace.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param workspaceId - The ID of the workspace to create the room in.
 * @returns The newly created room.
 *
 * @deprecated Use `runPixel(buildPixel("CreateRoom", { workspaceId }), insightId)` with
 * `buildPixel` and `runPixel` from `@semoss/sdk`. Check `errors` before reading
 * `pixelReturn[0]?.output`; raw reactor output may differ from this helper's declared or
 * normalized result. The current reactor returns { roomId }, not a complete RoomRecord. Omit
 * workspaceId when absent.
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
 *
 * @deprecated Use `runPixel(buildPixel("GetRoomMessages", { roomId }), insightId)` with
 * `buildPixel` and `runPixel` from `@semoss/sdk`. Check `errors` before reading
 * `pixelReturn[0]?.output`; raw reactor output may differ from this helper's declared or
 * normalized result. Read the current reactor message shape rather than casting it to
 * RoomMessage.
 * @example
 * ```ts
 * import { buildPixel, runPixel } from "@semoss/sdk";
 * const response = await runPixel(
 *     buildPixel("GetRoomMessages", { roomId: "room-id" }),
 *     "insight-id",
 * );
 * if (response.errors.length) throw new Error(response.errors.join(", "));
 * const messages = response.pixelReturn[0]?.output;
 * ```
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
 *
 * @deprecated Use `runPixel(buildPixel("GetRoomOptions", { roomId }), insightId)` with
 * `buildPixel` and `runPixel` from `@semoss/sdk`. Check `errors` before reading
 * `pixelReturn[0]?.output`; raw reactor output may differ from this helper's declared or
 * normalized result. The current output wraps configuration in OPTIONS and ROOM_NAME; handle
 * omitted keys.
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
 *
 * @deprecated Use `runPixel(buildPixel("SetRoomForInsight", { roomId }), insightId)` with
 * `buildPixel` and `runPixel` from `@semoss/sdk`. Check `errors` before reading
 * `pixelReturn[0]?.output`; raw reactor output may differ from this helper's declared or
 * normalized result. The reactor returns a boolean; this helper discards successful output.
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
 *
 * @deprecated Use `runPixel(buildPixel("GetRoomForInsight", {}), insightId)` with `buildPixel`
 * and `runPixel` from `@semoss/sdk`. Check `errors` before reading `pixelReturn[0]?.output`;
 * raw reactor output may differ from this helper's declared or normalized result. The current
 * reactor returns a room ID or null, not a RoomRecord. Handle a missing result separately from
 * a null output.
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
 *
 * @deprecated Use `runPixel(buildPixel("UpdateRoomOptions", { roomId, roomOptions }),
 * insightId)` with `buildPixel` and `runPixel` from `@semoss/sdk`. Check `errors` before
 * reading `pixelReturn[0]?.output`; raw reactor output may differ from this helper's declared
 * or normalized result. Pass option objects directly without JSON.stringify; the reactor
 * returns a boolean. Preserve existing settings when assembling the update.
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
 *
 * @deprecated Use `buildPixel("AskRoom", { engine, roomId, command, parentMessageId, media,
 * paramValues })` from `@semoss/sdk`, then `runPixelAsync({ expression, insightId })` from
 * `@semoss/sdk/api/monolith/engine`. Use media instead of image, pass a model-parameter map
 * instead of the legacy array, and persist instructions with UpdateRoomOptions; context is not
 * a current AskRoom argument. Pass literal text without manual encode tags. Poll
 * pixelJobStreaming and read result from the same resource; submission only returns a job ID.
 * @example
 * ```ts
 * import { buildPixel } from "@semoss/sdk";
 * import { runPixelAsync } from "@semoss/sdk/api/monolith/engine";
 * const expression = buildPixel("AskRoom", {
 *     engine: "model-id", roomId: "room-id", command: "Hello",
 *     parentMessageId: "ROOT_PLACEHOLDER_ID", media: [], paramValues: {},
 * });
 * const { jobId } = await runPixelAsync({ expression, insightId: "insight-id" });
 * // Poll pixelJobStreaming({ jobId }); on success, read result({ jobId }) once.
 * ```
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
 *
 * @deprecated Use `buildPixel("AddToolExecution", { engine, roomId, parentMessageId, toolId,
 * toolName, toolExecutionResponse, mcpToolStatus, toolParameterValues, paramValues })` from
 * `@semoss/sdk`, then `runPixelAsync({ expression, insightId })` from
 * `@semoss/sdk/api/monolith/engine`. The catalog name is AddToolExecution, not
 * AddRoomToolExecution. Supply literal text and parameter maps without encode tags or
 * JSON.stringify. Poll pixelJobStreaming, then read result from the same resource; settled
 * output can be a string or room exchange.
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
 *
 * @deprecated Use `buildPixel("GetUserConversationRooms", { pinned, sort })` and `runPixel`
 * from `@semoss/sdk`. Execute `runPixel("META | " + expression, insightId)` to preserve the
 * META prefix. The catalog name has no Reactor suffix. String composition loses builder output
 * inference; validate the raw ROOM_ID/ROOM_NAME-style rows and inspect errors before adapting
 * them to RoomRecord values.
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
