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
 * Poll with {@link getPixelJobStreaming} until a terminal status, then fetch
 * the full result with {@link getPixelAsyncResult}.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Message parameters. See {@link AskPlaygroundParams}.
 * @returns `{ jobId }` to pass to {@link getPixelJobStreaming}.
 * @see sdk-playground skill for the full streaming loop and chat-vs-agent guide.
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
 * Submits a completed tool result back to the playground, triggering a
 * follow-up LLM turn. Returns a job ID for streaming the response.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Tool execution details. See {@link AddPlaygroundToolExecutionParams}.
 * @returns `{ jobId }` to pass to {@link getPixelJobStreaming}.
 * @see sdk-playground skill for the full tool-execution call stack.
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
 * Sends a message to the server-side agent harness (RunAgent). The backend
 * drives the entire agentic loop autonomously; the client streams tokens and
 * receives a single {@link RunAgentOutput} summary once complete.
 *
 * Use instead of {@link askPlayground} when the room has `harnessType: "semoss"`
 * in its options.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param params - Agent run parameters. See {@link RunAgentParams}.
 * @returns `{ jobId }` to pass to {@link getPixelJobStreaming}.
 * @see sdk-playground skill for the chat-vs-agent-harness comparison and full example.
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
