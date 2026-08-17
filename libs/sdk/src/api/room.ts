import { runPixel } from "./base";

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

/** MCP server reference persisted on a room's options. */
export interface RoomMcpEntry {
	/** Engine id of the MCP server. */
	id: string;
	/** Display name of the MCP server. */
	name: string;
	/** MCP server type. */
	type: string;
	[key: string]: unknown;
}

/** Free-form options map persisted for a room via UpdateRoomOptions. */
export interface RoomOptionsMap {
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
	[key: string]: unknown;
}

/** Conversation room summary returned by GetUserConversationRooms. */
export interface ConversationRoom {
	/** Durable id of the room. */
	roomId: string;
	/** Display name of the room. */
	roomName: string;
	/** When the room was created. */
	dateCreated: string;
	/** Whether the user pinned the room. */
	pinned: boolean;
}

/** One part of a persisted playground message. */
export interface PlaygroundMessagePart {
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
}

/** Durable room message returned by GetPlaygroundMessages. */
export interface PlaygroundMessage {
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
		agentRunRole?: string;
	};
	/** Ordered content parts of the message. */
	parts?: PlaygroundMessagePart[];
}

/** Result row returned by CompactRoomMessages. */
export interface CompactRoomResult {
	/** Compaction step the row describes. */
	type: string;
	/** Whether the step succeeded. */
	success: boolean;
	/** Failure reason when the step did not succeed. */
	error?: string;
}

/** Raw room row returned by GetUserConversationRooms. */
interface RawConversationRoom {
	/** Durable id of the room. */
	ROOM_ID?: string;
	/** Display name of the room. */
	ROOM_NAME?: string;
	/** When the room was created. */
	DATE_CREATED?: string;
	/** Whether the user pinned the room. */
	PINNED?: boolean;
}

/**
 * Create a new conversation room and return its id. Throws when the backend
 * does not return a room id.
 *
 * @name createRoom
 * @param insightId - Insight the pixel executes against.
 * @return The id of the newly created room.
 */
export const createRoom = async (insightId: string): Promise<string> => {
	const response = await runPixel<[{ roomId: string }]>(
		"CreateRoom();",
		insightId,
	);
	assertPixelSuccess(response.errors);

	const roomId = response.pixelReturn[0]?.output.roomId;
	if (!roomId) {
		throw new Error("CreateRoom did not return a room ID");
	}

	return roomId;
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
 * a single-element array, or an object nested under a `roomOptions` key.
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

/**
 * List the user's conversation rooms whose persisted options match the
 * search term (LIKE match against the serialized room options).
 *
 * @name getUserConversationRooms
 * @param insightId - Insight the pixel executes against.
 * @param search - Term matched against each room's serialized options.
 * @return Matching rooms, newest first, with display defaults filled in.
 */
export const getUserConversationRooms = async (
	insightId: string,
	search: string,
): Promise<ConversationRoom[]> => {
	const response = await runPixel<[RawConversationRoom[]]>(
		`GetUserConversationRooms(roomOptionsSearch=${JSON.stringify(search)}, sort=["DESC"]);`,
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
		`RenameRoom(roomId=[${JSON.stringify(roomId)}], name=[${JSON.stringify(name)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/**
 * Generate and persist a display name for a room from its first prompt.
 *
 * @name generateRoomName
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room to name.
 * @param prompt - User prompt the name is derived from.
 * @param engineId - Model engine used to generate the name.
 * @return The generated name, trimmed; empty string when generation fails to
 * return text.
 */
export const generateRoomName = async (
	insightId: string,
	roomId: string,
	prompt: string,
	engineId: string,
): Promise<string> => {
	const response = await runPixel<[string]>(
		`GenerateRoomName(roomId=${JSON.stringify(roomId)}, prompt=[${JSON.stringify(`<encode>${prompt}</encode>`)}], engine=${JSON.stringify(engineId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const name = response.pixelReturn[0]?.output;
	return typeof name === "string" ? name.trim() : "";
};

/**
 * Load the durable message history for a room, oldest first.
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
		`GetPlaygroundMessages(roomId=${JSON.stringify(roomId)}, sort=["ASC"]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const messages = response.pixelReturn[0]?.output;
	return Array.isArray(messages) ? messages : [];
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
