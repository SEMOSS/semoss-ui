import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";

/** One login-provider entry in the GetUserInfo response. */
interface UserInfoProvider {
	/** Profile metadata map (e.g. "text-generation-model"). */
	meta?: Record<string, unknown>;
}

/** MCP server reference persisted on a room's options. */
export type RoomMcpEntry = {
	/** Engine id of the MCP server. */
	id: string;
	/** Display name of the MCP server. */
	name: string;
	/** MCP server type. */
	type: string;
	[key: string]: unknown;
};

/** Free-form options map persisted for a room via UpdateRoomOptions. */
export type RoomOptionsMap = {
	/** System prompt applied to the room's agent runs. */
	instructions?: string;
	/** MCP servers exposed to the room's agent runs. */
	mcp?: RoomMcpEntry[];
	/** Suggested prompts surfaced in the room's UI. */
	predefinedPrompts?: unknown[];
	/** Engine id of the model persisted for the room. */
	modelId?: string;
	/** Agent harness persisted for the room (e.g. "semoss"). */
	harnessType?: string;
	/**
	 * Provider-hosted built-in tools selected for the room, keyed by canonical
	 * tool name. Sent per turn as the `built_in_tools` model parameter.
	 */
	builtinTools?: Record<string, unknown>;
	[key: string]: unknown;
};

/** Conversation room summary returned by GetUserConversationRooms. */
export type ConversationRoom = {
	/** Durable id of the room. */
	roomId: string;
	/** Display name of the room. */
	roomName: string;
	/** When the room was created. */
	dateCreated: string;
	/** Whether the user pinned the room. */
	pinned: boolean;
};

/** One part of a persisted playground message. */
export type PlaygroundMessagePart = {
	/** Part discriminator (TEXT, MEDIA, THINKING, TOOL_CALL, TOOL_RESULT). */
	type?: string;
	/** Plain text content for TEXT parts. */
	text?: string;
	/** Display-only text variant. */
	uiText?: string;
	/** Reasoning content for THINKING parts. */
	thinking?: string;
	/** Attached file details for MEDIA parts. */
	mediaInfo?: {
		fileName: string;
		fileLocation?: string;
		base64Data?: string;
		mimeType?: string;
	};
	/** Tool invocation details for TOOL_CALL parts. */
	toolCall?: {
		id?: string;
		name?: string;
		original_name?: string;
		title?: string;
		description?: string;
		arguments?: Record<string, unknown>;
		_meta?: Record<string, unknown>;
	};
	/** Tool output details for TOOL_RESULT parts. */
	toolResult?: {
		toolCallId?: string;
		toolName?: string;
		output?: unknown;
		toolParameterValues?: Record<string, unknown>;
		toolStatus?: string;
	};
};

/** Durable room message returned by GetPlaygroundMessages. */
export type PlaygroundMessage = {
	/** Message type discriminator. */
	type?: string;
	/** Direction of the message relative to the model. */
	io?: "INPUT" | "OUTPUT" | string;
	/** Durable id of the message. */
	messageId?: string;
	/** Transaction the message was persisted under. */
	transactionId?: string;
	/** Id of the message this one branches from in the message tree. */
	parentMessageId?: string;
	/** Whether the message is rendered in the conversation. */
	visible?: boolean;
	/** Token count attributed to the message. */
	tokens?: number;
	/** Tokens served from prompt cache reads. */
	cacheReadTokens?: number;
	/** Tokens spent creating prompt cache entries. */
	cacheCreationTokens?: number;
	/** Tokens spent on extended thinking. */
	thinkingTokens?: number;
	/** When the message was persisted. */
	dateCreated?: string;
	/** Auxiliary metadata attached to the message. */
	ornaments?: {
		modelName?: string;
		agentRunId?: string;
	};
	/** Ordered content parts of the message. */
	parts?: PlaygroundMessagePart[];
};

/** Result row returned by CompactRoomMessages. */
export type CompactRoomResult = {
	/** Compaction step the row describes. */
	type: string;
	/** Whether the step succeeded. */
	success: boolean;
	/** Failure reason when the step did not succeed. */
	error?: string;
};

/** Raw room row returned by GetUserConversationRooms. */
type RawConversationRoom = {
	/** Durable id of the room. */
	ROOM_ID?: string;
	/** Display name of the room. */
	ROOM_NAME?: string;
	/** When the room was created. */
	DATE_CREATED?: string;
	/** Whether the user pinned the room. */
	PINNED?: boolean;
};

/**
 * Throw when a pixel response contains an operation error. No-op when the
 * error list is empty.
 *
 * @name assertPixelSuccess
 * @param errors - Operation errors collected from a runPixel response.
 */
const assertPixelSuccess = (errors: string[]): void => {
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}
};

/**
 * Extract a profile metadata string that may be returned as an array.
 *
 * @name getProfileMetadataValue
 * @param value - Raw metadata value: a string, an array of strings, or
 * anything else.
 * @return The string value (first array element when wrapped), or an empty
 * string when the value is not a string.
 */
export const getProfileMetadataValue = (value: unknown): string => {
	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value) && typeof value[0] === "string") {
		return value[0];
	}

	return "";
};

/**
 * Resolve a text-generation model engine by its id.
 *
 * @name resolveWorkbenchAssistantModel
 * @param insightId - Insight the pixel executes against.
 * @param modelId - Engine id of the model to resolve.
 * @return The matching engine, or null when the id is empty or no
 * text-generation model with that id is visible to the user.
 */
export const resolveWorkbenchAssistantModel = async (
	insightId: string,
	modelId: string,
): Promise<Engine | null> => {
	if (!modelId) {
		return null;
	}

	const modelResponse = await runPixel<[Engine[]]>(
		`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"], filterWord=${JSON.stringify(modelId)});`,
		insightId,
	);
	assertPixelSuccess(modelResponse.errors);

	return (
		modelResponse.pixelReturn[0]?.output.find(
			(engine) => engine.engine_id === modelId,
		) ?? null
	);
};

/**
 * The first text-generation model visible to the user, in MyEngines' default
 * order — the same order the model picker lists them in.
 *
 * @name getFirstWorkbenchAssistantModel
 * @param insightId - Insight the pixel executes against.
 * @return The first available engine, or null when the user can access no
 * text-generation models at all.
 */
export const getFirstWorkbenchAssistantModel = async (
	insightId: string,
): Promise<Engine | null> => {
	const modelsResponse = await runPixel<[Engine[]]>(
		`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
		insightId,
	);
	assertPixelSuccess(modelsResponse.errors);

	return modelsResponse.pixelReturn[0]?.output[0] ?? null;
};

/**
 * Resolve the user's configured default text-generation model by reading the
 * "text-generation-model" entry from their profile metadata. When no default
 * is configured — or the configured model no longer resolves (deleted or no
 * longer visible) — falls back to the first text-generation model available
 * to the user.
 *
 * @name getDefaultWorkbenchAssistantModel
 * @param insightId - Insight the pixels execute against.
 * @return The user's default engine, the first available engine when no
 * default resolves, or null when the user can access no text-generation
 * models at all.
 */
export const getDefaultWorkbenchAssistantModel = async (
	insightId: string,
): Promise<Engine | null> => {
	const userResponse = await runPixel<[Record<string, UserInfoProvider>]>(
		"META | GetUserInfo();",
		insightId,
	);
	assertPixelSuccess(userResponse.errors);

	const provider = Object.values(
		userResponse.pixelReturn[0]?.output ?? {},
	)[0];
	const modelId = getProfileMetadataValue(
		provider?.meta?.["text-generation-model"],
	);

	const configured = await resolveWorkbenchAssistantModel(insightId, modelId);
	if (configured) {
		return configured;
	}

	return getFirstWorkbenchAssistantModel(insightId);
};

/**
 * Bind a room to the insight so subsequent room pixels resolve against it.
 *
 * @name setRoomForInsight
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room to bind to the insight.
 * @return Resolves when the binding is persisted.
 */
export const setRoomForInsight = async (
	insightId: string,
	roomId: string,
): Promise<void> => {
	const response = await runPixel<[boolean]>(
		`SetRoomForInsight(roomId=${JSON.stringify(roomId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/**
 * Create and bind a mount-scoped room to the workbench insight.
 *
 * @name createWorkbenchRoom
 * @param insightId - Insight the room is created for and bound to.
 * @return The id of the newly created room.
 */
export const createWorkbenchRoom = async (
	insightId: string,
): Promise<string> => {
	const response = await runPixel<[{ roomId: string }]>(
		"CreatePlaygroundRoom();",
		insightId,
	);
	assertPixelSuccess(response.errors);

	const roomId = response.pixelReturn[0]?.output.roomId;
	if (!roomId) {
		throw new Error("CreatePlaygroundRoom did not return a room ID");
	}

	await setRoomForInsight(insightId, roomId);
	return roomId;
};

/**
 * Create a room in the insight's own project and bind it to the insight.
 *
 * Unlike {@link createWorkbenchRoom}, this does not force the room into the
 * playground system project. That matters for listing: `GetUserConversationRooms`
 * scopes to `insight.getContextProjectId()` when no project is passed, and
 * `CreateRoom` resolves a missing project the same way — so a room created here
 * is one the history list can actually find.
 *
 * @name createRoom
 * @param insightId - Insight the room is created for and bound to.
 * @param options - Optional room name and system prompt (`context`) to seed at
 * creation.
 * @return The id of the newly created room.
 */
export const createRoom = async (
	insightId: string,
	options: { name?: string; context?: string } = {},
): Promise<string> => {
	const args: string[] = [];
	if (options.name) {
		args.push(
			`name=[${JSON.stringify(`<encode>${options.name}</encode>`)}]`,
		);
	}
	if (options.context) {
		args.push(
			`context=[${JSON.stringify(`<encode>${options.context}</encode>`)}]`,
		);
	}

	const response = await runPixel<[{ roomId: string }]>(
		`CreateRoom(${args.join(", ")});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const roomId = response.pixelReturn[0]?.output.roomId;
	if (!roomId) {
		throw new Error("CreateRoom did not return a room ID");
	}

	await setRoomForInsight(insightId, roomId);
	return roomId;
};

/**
 * Persist the free-form options map for a room.
 *
 * @name updateRoomOptions
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room whose options to persist.
 * @param options - Options map to store (instructions, mcp, modelId, ...).
 * @return Resolves when the options are persisted.
 */
export const updateRoomOptions = async (
	insightId: string,
	roomId: string,
	options: RoomOptionsMap,
): Promise<void> => {
	const response = await runPixel<[boolean]>(
		`UpdateRoomOptions(roomId=${JSON.stringify(roomId)}, roomOptions=[${JSON.stringify(options)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/**
 * Unwrap the room options payload, which backends return as a JSON string,
 * a single-element array, or an object nested under a `roomOptions` or
 * `OPTIONS` key (the latter alongside `ROOM_NAME` on current backends).
 *
 * @name normalizeRoomOptions
 * @param value - Raw GetRoomOptions output in any of its wire shapes.
 * @return The unwrapped options map, or null when the payload is empty or
 * unparseable.
 */
const normalizeRoomOptions = (value: unknown): RoomOptionsMap | null => {
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

	return record as RoomOptionsMap;
};

/**
 * Read the persisted options map for a room.
 *
 * @name getRoomOptions
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room whose options to read.
 * @return The normalized options map, or null when none are persisted.
 */
export const getRoomOptions = async (
	insightId: string,
	roomId: string,
): Promise<RoomOptionsMap | null> => {
	const response = await runPixel<[unknown]>(
		`GetRoomOptions(roomId=${JSON.stringify(roomId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	return normalizeRoomOptions(response.pixelReturn[0]?.output);
};

/** Paging, name search, and date direction for a conversation-list query. */
export interface ConversationRoomQuery {
	/** Term matched against each room's name (LIKE). */
	nameSearch?: string;
	/**
	 * Direction for the date ordering. The backend only ever orders by
	 * `DATE_CREATED`, so there is no column to choose.
	 */
	sort?: "ASC" | "DESC";
	/** Page size. Paired with `offset`; the backend ignores one without the other. */
	limit?: number;
	/** Rows to skip. Paired with `limit`. */
	offset?: number;
}

/**
 * List the user's conversation rooms whose persisted options match the
 * search term (LIKE match against the serialized room options), optionally
 * narrowed by room name and paged.
 *
 * @name getUserConversationRooms
 * @param insightId - Insight the pixel executes against.
 * @param search - Term matched against each room's serialized options. This is
 * how a surface scopes the list to its own rooms.
 * @param query - Optional name search, date direction, and paging.
 * @return Matching rooms, newest first by default, with display defaults
 * filled in.
 */
export const getUserConversationRooms = async (
	insightId: string,
	search: string,
	query: ConversationRoomQuery = {},
): Promise<ConversationRoom[]> => {
	const args = [
		`roomOptionsSearch=${JSON.stringify(search)}`,
		`sort=[${JSON.stringify(query.sort ?? "DESC")}]`,
	];
	if (query.nameSearch) {
		args.push(
			`search=[${JSON.stringify(`<encode>${query.nameSearch}</encode>`)}]`,
		);
	}
	// The backend only applies paging when both are present.
	if (query.limit !== undefined && query.offset !== undefined) {
		args.push(`limit=[${query.limit}]`, `offset=[${query.offset}]`);
	}

	const response = await runPixel<[RawConversationRoom[]]>(
		`GetUserConversationRooms(${args.join(", ")});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const rooms = response.pixelReturn[0]?.output ?? [];
	return rooms
		.filter((room) => room.ROOM_ID)
		.map((room) => ({
			roomId: room.ROOM_ID ?? "",
			roomName: room.ROOM_NAME ?? "Untitled session",
			dateCreated: room.DATE_CREATED ?? "",
			pinned: room.PINNED ?? false,
		}));
};

/**
 * Delete a conversation room. The backend marks it inactive rather than
 * dropping its rows, so the messages survive but the room stops appearing in
 * the user's conversation list.
 *
 * @name removeUserRoom
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room to remove.
 * @return Resolves when the removal is persisted.
 */
export const removeUserRoom = async (
	insightId: string,
	roomId: string,
): Promise<void> => {
	const response = await runPixel<[boolean]>(
		`RemoveUserRoom(roomId=${JSON.stringify(roomId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/**
 * Rename a conversation room.
 *
 * @name renameRoom
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room to rename.
 * @param name - New display name for the room.
 * @return Resolves when the rename is persisted.
 */
export const renameRoom = async (
	insightId: string,
	roomId: string,
	name: string,
): Promise<void> => {
	const response = await runPixel<[boolean]>(
		`META | RenameRoom(roomId=[${JSON.stringify(roomId)}], name=[${JSON.stringify(`<encode>${name}</encode>`)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/**
 * Parse a persisted message timestamp ("YYYY-MM-DD HH:MM:SS" or ISO) into
 * epoch milliseconds for ordering.
 *
 * @name parseMessageTime
 * @param value - Raw timestamp off a persisted message.
 * @return Epoch milliseconds, or 0 when the timestamp is missing/unparseable.
 */
const parseMessageTime = (value?: string): number => {
	if (!value) return 0;
	const normalized = value.includes("T") ? value : value.replace(" ", "T");
	const time = Date.parse(normalized);
	return Number.isNaN(time) ? 0 : time;
};

/**
 * Load the durable message history for a room, oldest first. The backend
 * does not accept a sort argument, so ordering is applied client-side
 * (stable, so equal/unparseable timestamps keep their returned order).
 *
 * @name getPlaygroundMessages
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room whose messages to load.
 * @return The room's persisted messages, or an empty array when none exist.
 */
export const getPlaygroundMessages = async (
	insightId: string,
	roomId: string,
): Promise<PlaygroundMessage[]> => {
	const response = await runPixel<[PlaygroundMessage[]]>(
		`GetPlaygroundMessages(roomId=${JSON.stringify([roomId])});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const messages = response.pixelReturn[0]?.output;
	if (!Array.isArray(messages)) {
		return [];
	}

	return [...messages].sort(
		(a, b) =>
			parseMessageTime(a.dateCreated) - parseMessageTime(b.dateCreated),
	);
};

/**
 * Compact a room's history up to the given response message.
 *
 * @name compactRoomMessages
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room whose history to compact.
 * @param parentMessageId - Response message the compaction anchors to.
 * @return Per-step compaction results, or an empty array when the backend
 * returns none.
 */
export const compactRoomMessages = async (
	insightId: string,
	roomId: string,
	parentMessageId: string,
): Promise<CompactRoomResult[]> => {
	const response = await runPixel<[CompactRoomResult[]]>(
		`CompactRoomMessages(roomId=${JSON.stringify(roomId)}, parentMessageId=${JSON.stringify(parentMessageId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const results = response.pixelReturn[0]?.output;
	return Array.isArray(results) ? results : [];
};

/**
 * Generate the active engine's allowed tools in the room bound to an insight.
 *
 * @name makeEngineRoomMcp
 * @param insightId - Insight already bound to the target room.
 * @param engineId - Engine whose room-scoped tool profile should be generated.
 */
export const makeEngineRoomMcp = async (
	insightId: string,
	engineId: string,
): Promise<void> => {
	const response = await runPixel<[boolean]>(
		`MakeDefaultRoomToolsForEngine(engine=[${JSON.stringify(engineId)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/** One streaming chunk as delivered by the AskRoom poll loop. */
export type RoomStreamChunk = Awaited<
	ReturnType<typeof getPixelJobStreaming>
>["message"][number];

/** The input + response pair AskRoom returns for a committed turn. */
export interface AskRoomResult {
	/** The persisted user message, with its durable id. */
	inputMessage: PlaygroundMessage;
	/** The persisted assistant message, with its durable id and token counts. */
	responseMessage: PlaygroundMessage;
	/** Hidden message pairs the backend appended (cancel flow only). */
	extraMessages?: {
		inputMessage: PlaygroundMessage;
		responseMessage: PlaygroundMessage;
	}[];
}

/** One AskRoom turn: what the model is asked and how it should answer. */
export interface AskRoomRequest {
	/** Model engine the turn runs against. */
	engineId: string;
	/** Room the turn is persisted into. */
	roomId: string;
	/** The user's prompt. */
	command: string;
	/**
	 * Message the turn branches from. Omit to append to the room's latest
	 * message.
	 */
	parentMessageId?: string;
	/**
	 * Server-side paths of files attached to the turn, as returned by
	 * `uploadInsight`. The backend decides what the model can do with them.
	 */
	media?: string[];
	/**
	 * Model kwargs (`built_in_tools`, ...). A `built_in_tools` entry here
	 * overrides the engine's saved selection; omit the key entirely to let the
	 * engine's own selection apply.
	 */
	paramValues?: Record<string, unknown>;
}

/** Poll interval for the AskRoom streaming loop. */
const STREAM_POLL_INTERVAL_MS = 500;

/**
 * Marks the error {@link askRoom} throws when a turn is stopped rather than
 * failing. Kept as a name on a plain Error, not an exported Error subclass:
 * everything the `api/` barrel exports has to be callable, because `useAPI`
 * builds its lookup from `typeof API` under a `(...args: any) => any`
 * constraint that a class would break.
 */
const ASK_ROOM_ABORTED = "AskRoomAbortedError";

/**
 * Build the error thrown when a turn is stopped.
 *
 * @name askRoomAbortedError
 * @return An Error tagged so {@link isAskRoomAborted} recognizes it.
 */
const askRoomAbortedError = (): Error => {
	const error = new Error("The model stream was stopped");
	error.name = ASK_ROOM_ABORTED;
	return error;
};

/**
 * Whether a thrown value is {@link askRoom} reporting a stopped turn rather
 * than a failure. Callers unwind silently on this: the stop path owns
 * persisting whatever already streamed.
 *
 * @name isAskRoomAborted
 * @param error - Thrown value of any shape.
 * @return True when the turn was stopped.
 */
export const isAskRoomAborted = (error: unknown): boolean =>
	error instanceof Error && error.name === ASK_ROOM_ABORTED;

/**
 * Serialize an AskRoom turn to its pixel argument list. Shared by the live
 * call and the cancel-commit so a stopped turn replays byte-identical
 * parameters — the backend matches the two up by them.
 *
 * @name buildAskRoomParams
 * @param request - The turn to serialize.
 * @return The comma-separated pixel arguments, without the enclosing call.
 */
const buildAskRoomParams = (request: AskRoomRequest): string => {
	const params = [
		`engine=[${JSON.stringify(request.engineId)}]`,
		`roomId=[${JSON.stringify(request.roomId)}]`,
		`command=[${JSON.stringify(`<encode>${request.command}</encode>`)}]`,
	];

	// Always emitted, and ahead of parentMessageId, so the call is positionally
	// identical to the playground's AskPlayground/AskRoom — the only caller
	// known to attach files successfully. `image=[]` is how it says "none".
	params.push(`image=${JSON.stringify(request.media ?? [])}`);

	if (request.parentMessageId) {
		params.push(
			`parentMessageId=[${JSON.stringify(request.parentMessageId)}]`,
		);
	}

	params.push(`paramValues=[${JSON.stringify(request.paramValues ?? {})}]`);

	return params.join(", ");
};

/**
 * Read the input/response pair off a settled AskRoom pixel result.
 *
 * @name readAskRoomOutput
 * @param output - Raw `pixelReturn[0].output` from the AskRoom statement.
 * @return The normalized result.
 * @throws When the backend returned no response message.
 */
const readAskRoomOutput = (
	output: AskRoomResult | undefined,
): AskRoomResult => {
	if (!output?.responseMessage) {
		throw new Error("AskRoom did not return a response message");
	}

	return output;
};

/**
 * Run one streaming AskRoom turn.
 *
 * AskRoom itself is synchronous; streaming is job-scoped, so the turn is
 * submitted with `runPixelAsync` and its chunks are polled off the job until
 * it settles. The durable messages only exist once the job completes — the
 * chunks are display-only.
 *
 * @name askRoom
 * @param insightId - Insight the pixel executes against.
 * @param request - The turn to run.
 * @param handlers - `onJobStarted` receives the job id (needed to stop the
 * turn); `onChunk` receives every streamed chunk in arrival order; `signal`
 * ends the poll loop, which is how a stopped turn unwinds without waiting for
 * the backend to report the job gone.
 * @return The persisted input/response pair.
 * @throws When `signal` aborts (see {@link isAskRoomAborted}).
 * @throws When the job fails, disappears, or settles with pixel errors.
 */
export const askRoom = async (
	insightId: string,
	request: AskRoomRequest,
	handlers: {
		onJobStarted?: (jobId: string) => void;
		onChunk?: (chunk: RoomStreamChunk) => void;
		signal?: AbortSignal;
	} = {},
): Promise<AskRoomResult> => {
	const { signal } = handlers;
	if (signal?.aborted) {
		throw askRoomAbortedError();
	}

	const { jobId } = await runPixelAsync(
		`AskRoom(${buildAskRoomParams(request)});`,
		insightId,
	);
	if (!jobId) {
		throw new Error("AskRoom did not return a job ID");
	}
	handlers.onJobStarted?.(jobId);

	let isPolling = true;
	while (isPolling) {
		// Checked before the poll, not after: the caller aborts the moment the
		// user hits stop, and it owns persisting whatever already streamed.
		if (signal?.aborted) {
			throw askRoomAbortedError();
		}

		const response = await getPixelJobStreaming(jobId);

		for (const chunk of response.message) {
			handlers.onChunk?.(chunk);
		}

		if (
			response.status === "Complete" ||
			response.status === "ProgressComplete"
		) {
			isPolling = false;
		} else if (response.status === "Error") {
			throw new Error("The model stream encountered an error");
		} else if (response.status === "Canceled") {
			// Terminal: the job was stopped, so nothing further will arrive.
			// Without this the loop would poll a dead job forever.
			throw askRoomAbortedError();
		} else if (response.status === "UnknownJob") {
			throw new Error("The model stream is no longer available");
		} else {
			await new Promise((resolve) =>
				setTimeout(resolve, STREAM_POLL_INTERVAL_MS),
			);
		}
	}

	const result = await getPixelAsyncResult<[AskRoomResult]>(jobId);
	assertPixelSuccess(result.errors);

	return readAskRoomOutput(result.results[0]?.output);
};

/**
 * Abort a running pixel job. Cancelling an AskRoom job persists nothing on its
 * own — follow it with {@link commitCancelledTurn} so the turn is not lost.
 *
 * @name stopPixelJob
 * @param insightId - Insight the pixel executes against.
 * @param jobId - Job returned by {@link askRoom}'s `onJobStarted`.
 * @return Resolves once the stop request has been sent.
 */
export const stopPixelJob = async (
	insightId: string,
	jobId: string,
): Promise<void> => {
	const response = await runPixel<[string]>(
		`StopPixelExecution(id=[${JSON.stringify(jobId)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/**
 * Persist a turn the user stopped mid-stream. Replays the turn's exact
 * parameters with the parts that actually streamed, so the backend skips the
 * model call, commits the pair, and appends a hidden note telling the model
 * next turn that its answer was cut short. Without this the user message is
 * orphaned in the room.
 *
 * @name commitCancelledTurn
 * @param insightId - Insight the pixel executes against.
 * @param request - The same request that was passed to {@link askRoom}.
 * @param responseParts - The parts the user actually saw, in order.
 * @param note - The hidden message explaining the cancellation to the model.
 * @return The persisted input/response pair.
 */
export const commitCancelledTurn = async (
	insightId: string,
	request: AskRoomRequest,
	responseParts: PlaygroundMessagePart[],
	note: string,
): Promise<AskRoomResult> => {
	const response = await runPixel<[AskRoomResult]>(
		`AskRoom(${buildAskRoomParams(request)}, responseParts=${JSON.stringify(
			responseParts,
		)}, hiddenMessage=[${JSON.stringify(`<encode>${note}</encode>`)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	return readAskRoomOutput(response.pixelReturn[0]?.output);
};

/**
 * Record the user's rating of one assistant message.
 *
 * @name submitLlmFeedback
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room the message belongs to.
 * @param messageId - Durable id of the message being rated.
 * @param rating - "true" for a positive rating, "false" for a negative one.
 * @return Resolves when the rating is persisted.
 */
export const submitLlmFeedback = async (
	insightId: string,
	roomId: string,
	messageId: string,
	rating: "true" | "false",
): Promise<void> => {
	const response = await runPixel<[unknown]>(
		`SubmitLlmFeedback(messageId=${JSON.stringify(messageId)}, feedbackText="", rating=${JSON.stringify(rating)}, roomId=${JSON.stringify(roomId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};
