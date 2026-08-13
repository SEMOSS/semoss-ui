import type {
	AddPlaygroundToolExecutionParams,
	AskPlaygroundParams,
	PlaygroundMessage,
	PlaygroundRoom,
	PlaygroundRoomOptions,
	RunAgentOutput,
	RunAgentParams,
} from "../types";
import { runPixel, runPixelAsync } from "./base";

/** The harness type value the SEMOSS backend recognises for agent runs. */
const AGENT_HARNESS_TYPE = "semoss";

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
		? `CreatePlaygroundRoom(workspaceId="${workspaceId}");`
		: `CreatePlaygroundRoom();`;
	const { errors, pixelReturn } = await runPixel<[PlaygroundRoom]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error("CreatePlaygroundRoom returned no data");
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
export const getPlaygroundMessages = async (
	insightId: string,
	roomId: string,
): Promise<PlaygroundMessage[]> => {
	const pixel = `GetPlaygroundMessages(roomId=["${roomId}"]);`;
	const { errors, pixelReturn } = await runPixel<[PlaygroundMessage[]]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error("GetPlaygroundMessages returned no data");
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
 * Poll the job using {@link getPixelJobStreaming} until the status reaches a
 * terminal state ("Complete", "ProgressComplete", "Canceled", "Error", "UnknownJob").
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Parameters for the playground request.
 * @returns The async job ID to pass to {@link getPixelJobStreaming}.
 *
 * @example
 * ```ts
 * const { jobId } = await askPlayground(insightId, params);
 *
 * while (true) {
 *   const { message, status } = await getPixelJobStreaming(jobId);
 *   for (const chunk of message) {
 *     if (chunk.stream_type === "content" && chunk.data.content) {
 *       setMessage(prev => prev + chunk.data.content);
 *     }
 *   }
 *   if (["Complete", "ProgressComplete", "Canceled", "Error", "UnknownJob"].includes(status)) break;
 * }
 * ```
 */
export const askPlayground = async (
	insightId: string,
	params: AskPlaygroundParams,
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

	const pixel = `AskPlayground(engine=["${engine}"], roomId=["${roomId}"], command=["<encode>${command}</encode>"], context=["<encode>${context}</encode>"], image=${JSON.stringify(image)}, parentMessageId=["${parentMessageId}"], paramValues=${JSON.stringify(paramValues)})`;

	return runPixelAsync(pixel, insightId);
};

/**
 * Submits a tool execution result to the playground and returns the job ID for
 * streaming the model's follow-up response. The reactor feeds the tool output
 * back into the conversation and triggers a new LLM completion turn.
 *
 * Poll the job using {@link getPixelJobStreaming} until the status reaches a
 * terminal state ("Complete", "ProgressComplete", "Canceled", "Error",
 * "UnknownJob"), then call {@link getPixelAsyncResult} for the full structured
 * response. The settled output is either:
 * - `{ responseMessage: string }` — more tool calls are still pending; the
 *   caller should continue executing the next queued tool without yet creating
 *   a new response bubble.
 * - `{ inputMessage: InputPixelMessage; responseMessage: ResponsePixelMessage }`
 *   — all tools for the turn are done; sync the messages and start the next
 *   tool-execution cycle on the new `responseMessage`.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Parameters for the tool execution submission.
 * @returns The async job ID to pass to {@link getPixelJobStreaming}.
 *
 * @example
 * ```ts
 * const { jobId } = await addPlaygroundToolExecution(insightId, {
 *     engine: room.model.app_id,
 *     roomId: room.roomId,
 *     parentMessageId: responseMessage.id,
 *     toolId: tool.id,
 *     toolName: tool.json.name,
 *     toolExecutionResponse: toolOutput,
 *     mcpToolStatus: "success",
 *     toolParameterValues: tool.parameters,
 * });
 *
 * // Stream tokens from the follow-up LLM turn
 * const TERMINAL: PixelJobStreamingStatus[] = [
 *     "Complete", "ProgressComplete", "Canceled", "Error", "UnknownJob",
 * ];
 * while (true) {
 *     const { message, status } = await getPixelJobStreaming(jobId);
 *     for (const chunk of message) {
 *         if (chunk.stream_type === "content" && chunk.data.content) {
 *             setContent(prev => prev + chunk.data.content);
 *         }
 *     }
 *     if (TERMINAL.includes(status)) break;
 * }
 *
 * const { errors, results } = await getPixelAsyncResult(jobId);
 * const output = results[0].output;
 * if (typeof output.responseMessage === "string") {
 *     // More tools pending — continue executing next tool
 * } else {
 *     // Final response — sync messages and run continueToolExecution()
 * }
 * ```
 */
export const addPlaygroundToolExecution = async (
	insightId: string,
	params: AddPlaygroundToolExecutionParams,
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
		`AddPlaygroundToolExecution(`,
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
export const getPlaygroundRooms = async (
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
	const pixel = `META | GetPlaygroundRooms${args};`;
	const { errors, pixelReturn } = await runPixel<[PlaygroundRoom[]]>(
		pixel,
		insightId,
	);

	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error("GetPlaygroundRooms returned no data");
	}

	return output;
};

/**
 * Sends a message to the server-side agent harness and returns the job ID for
 * streaming. The backend runs the entire agentic loop (model completions, tool
 * calls, re-prompting) autonomously — the client streams tokens as they arrive
 * and receives a single settled summary once the run completes.
 *
 * Use this instead of {@link askPlayground} when the room was created with
 * `harnessType: "semoss"` in its options.
 *
 * Poll the job using {@link getPixelJobStreaming} until a terminal status is
 * reached, then call {@link getPixelAsyncResult} to get the {@link RunAgentOutput}.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Parameters for the agent run.
 * @returns The async job ID to pass to {@link getPixelJobStreaming}.
 *
 * @example
 * ```ts
 * const { jobId } = await runAgent(insightId, {
 *     engine: room.model.engine_id,
 *     roomId: room.roomId,
 *     command: "Analyze this dataset and produce a summary report.",
 * });
 *
 * const TERMINAL: PixelJobStreamingStatus[] = [
 *     "Complete", "ProgressComplete", "Canceled", "Error", "UnknownJob",
 * ];
 * while (true) {
 *     const { message, status } = await getPixelJobStreaming(jobId);
 *     for (const chunk of message) {
 *         if (chunk.stream_type === "content" && chunk.data.content) {
 *             setContent(prev => prev + chunk.data.content);
 *         }
 *     }
 *     if (TERMINAL.includes(status)) break;
 * }
 *
 * const { errors, results } = await getPixelAsyncResult<[RunAgentOutput]>(jobId);
 * const output = results[0].output;
 *
 * if (output.waitTimedOut || output.status !== "COMPLETED") {
 *     throw new Error(`Agent run did not complete: ${output.status}`);
 * }
 *
 * // output.inputMessageId  — server ID for the persisted user message
 * // output.finalOutputMessageId — server ID for the persisted response
 * // output.finalText        — full response text (fallback if nothing streamed)
 * // output.artifacts        — any files the agent produced
 * ```
 */
export const runAgent = async (
	insightId: string,
	params: RunAgentParams,
): Promise<{ jobId: string }> => {
	const {
		engine,
		roomId,
		command,
		harnessType = AGENT_HARNESS_TYPE,
	} = params;

	const pixel = `RunAgent(
roomId=["${roomId}"],
engine=["${engine}"],
command=["<encode>${command}</encode>"],
harnessType="${harnessType}",
wait=true
);`;

	return runPixelAsync(pixel, insightId);
};
