import { runPixel, runPixelAsync } from "./base";

// -------------------------------------------------------------------------------------------------
// INTERFACES
// -------------------------------------------------------------------------------------------------

/**
 * @description Workspace reference embedded within room options
 */
export interface PlaygroundWorkspace {
	workspace_id: string;
	name: string;
}

/**
 * @description Configuration options for a playground room
 */
export interface PlaygroundRoomOptions {
	predefinedPrompts: string[];
	instructions: string;
	mcp: string[];
	workspace: PlaygroundWorkspace;
	modelId: string;
}

/**
 * @description A playground room
 */
export interface PlaygroundRoom {
	roomId: string;
	name: string;
	[key: string]: unknown;
}

/**
 * @description A single message within a playground room
 */
export interface PlaygroundMessage {
	messageId: string;
	content: string;
	role: string;
	[key: string]: unknown;
}

/**
 * @description Params for the AskPlayground reactor
 */
export interface AskPlaygroundParams {
	/** Engine (model) ID to route the request to */
	engine: string;
	/** Room ID the message belongs to */
	roomId: string;
	/** The user message or command text (will be encoded) */
	command: string;
	/** System context / instructions (will be encoded) */
	context: string;
	/** Optional base64 image strings */
	image?: string[];
	/** Parent message ID; use "ROOT_PLACEHOLDER_ID" for new threads */
	parentMessageId: string;
	/** Additional param values passed to the model */
	paramValues?: Record<string, unknown>[];
}

/**
 * @description The model response returned by AskPlayground
 */
export interface PlaygroundResponse {
	messageId: string;
	content: string;
	[key: string]: unknown;
}

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
