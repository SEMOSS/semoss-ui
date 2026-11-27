import { runPixel } from "./base";

// -------------------------------------------------------------------------------------------------
// The playground's chat rooms (CreatePlaygroundRoom and its kin), as the SEMOSS chat apps manage
// them. Each runs in the insight it is given, normally the session's
// (`Session.insight.withInsight`).
// -------------------------------------------------------------------------------------------------

/**
 * Throw when a pixel run reported errors. `runPixel` and `Session.insight.run` return a pixel's
 * errors rather than throwing; this keeps a caller that expects a throw working.
 *
 * @param result - What the run returned.
 * @returns The same result, when it has no errors.
 * @throws An error naming every pixel error.
 */
export const throwOnPixelErrors = <R extends { errors: string[] }>(
	result: R,
): R => {
	if (result.errors.length > 0) {
		throw new Error(result.errors.join(""));
	}
	return result;
};

/**
 * Delete one of the user's rooms.
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 */
export const removeUserRoom = async (
	insightId: string,
	roomId: string,
): Promise<void> => {
	throwOnPixelErrors(
		await runPixel<[boolean]>(
			`RemoveUserRoom(roomId=["${roomId}"]);`,
			insightId,
		),
	);
};

/**
 * Rename one of the user's rooms.
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 * @param name - The new name, already trimmed.
 */
export const renameUserRoom = async (
	insightId: string,
	roomId: string,
	name: string,
): Promise<void> => {
	throwOnPixelErrors(
		await runPixel<[boolean]>(
			`META | RenameRoom(roomId=["${roomId}"], name=["<encode>${name}</encode>"]);`,
			insightId,
		),
	);
};

/**
 * Pin a room (the room list's favorites) or unpin it.
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 * @param pinned - Whether it is pinned.
 */
export const pinUserRoom = async (
	insightId: string,
	roomId: string,
	pinned: boolean,
): Promise<void> => {
	throwOnPixelErrors(
		await runPixel<[boolean]>(
			`PinRoom(roomId=["${roomId}"], pinned=[${pinned}]);`,
			insightId,
		),
	);
};

/**
 * How many tokens a model takes in one request.
 *
 * @param insightId - The insight to run in.
 * @param engineId - The model's engine.
 * @returns Its context window, or undefined when the backend does not know it.
 */
export const getModelContextWindow = async (
	insightId: string,
	engineId: string,
): Promise<number | undefined> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[number | undefined]>(
			`META | GetContextWindow(${JSON.stringify(engineId)});`,
			insightId,
		),
	);
	return pixelReturn[0]?.output;
};

/** What `GetRoomOptions` returns for a playground room. */
interface StoredPlaygroundRoomOptions<Options> {
	/** The room's options; missing for rooms older than options. */
	OPTIONS?: Options;
	/** The room's name. */
	ROOM_NAME?: string;
}

/** A playground room's saved options and name. */
export interface PlaygroundRoomOptions<Options> {
	/** The room's options; missing for rooms older than options. */
	options?: Options;
	/** The room's name, when it has one. */
	name?: string;
}

/** A playground room as {@link loadPlaygroundRoom} reads it. */
export interface PlaygroundRoomLoad<Message, Options>
	extends PlaygroundRoomOptions<Options> {
	/** The insight the room is bound to now. */
	insightId: string;
	/** Every message in the room, in the order the backend keeps them. */
	messages: Message[];
}

/**
 * The pixel that reads a playground room's messages.
 *
 * @param roomId - The room.
 * @returns The pixel.
 */
const getPlaygroundMessagesPixel = (roomId: string): string =>
	`GetPlaygroundMessages(roomId=["${roomId}"]);`;

/**
 * The pixel that reads a room's options.
 *
 * @param roomId - The room.
 * @returns The pixel.
 */
const getRoomOptionsPixel = (roomId: string): string =>
	`GetRoomOptions(roomId=${JSON.stringify(roomId)});`;

/**
 * Read what `GetRoomOptions` returned.
 *
 * @param output - Its output.
 * @returns The options and the name.
 */
const readPlaygroundRoomOptions = <Options>(
	output: StoredPlaygroundRoomOptions<Options> | undefined,
): PlaygroundRoomOptions<Options> => ({
	options: output?.OPTIONS,
	name: output?.ROOM_NAME,
});

/**
 * Open a playground room in an insight: read its messages and its options,
 * and bind it to the insight (`GetPlaygroundMessages`, `GetRoomOptions` and
 * `SetRoomForInsight`, as one pixel).
 *
 * @param insightId - The insight to bind the room to, or "new" for a new one.
 * @param roomId - The room.
 * @returns The room's messages, options and name, and the insight it is bound to.
 * @throws When the backend reports an error.
 */
export const loadPlaygroundRoom = async <
	Message = Record<string, unknown>,
	Options = Record<string, unknown>,
>(
	insightId: string,
	roomId: string,
): Promise<PlaygroundRoomLoad<Message, Options>> => {
	const response = throwOnPixelErrors(
		await runPixel<
			[Message[], StoredPlaygroundRoomOptions<Options>, unknown]
		>(
			`${getPlaygroundMessagesPixel(roomId)} ${getRoomOptionsPixel(roomId)} SetRoomForInsight(roomId=${JSON.stringify(roomId)});`,
			insightId,
		),
	);
	const [messages, options] = response.pixelReturn;
	return {
		insightId: response.insightId,
		messages: (messages?.output as Message[] | undefined) ?? [],
		...readPlaygroundRoomOptions(
			options?.output as StoredPlaygroundRoomOptions<Options> | undefined,
		),
	};
};

/**
 * Read a playground room's saved options and name (`GetRoomOptions`).
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 * @returns The options and the name; either is missing when the room has none.
 * @throws When the backend reports an error.
 */
export const getPlaygroundRoomOptions = async <
	Options = Record<string, unknown>,
>(
	insightId: string,
	roomId: string,
): Promise<PlaygroundRoomOptions<Options>> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[StoredPlaygroundRoomOptions<Options>]>(
			getRoomOptionsPixel(roomId),
			insightId,
		),
	);
	return readPlaygroundRoomOptions(pixelReturn[0]?.output);
};

/**
 * Read a playground room's messages (`GetPlaygroundMessages`).
 *
 * @param insightId - The insight to run in, or "new" for a new one.
 * @param roomId - The room.
 * @returns The messages, none when the backend returns none, and the insight
 * they were read in.
 * @throws When the backend reports an error.
 */
export const getPlaygroundMessages = async <Message = Record<string, unknown>>(
	insightId: string,
	roomId: string,
): Promise<{ insightId: string; messages: Message[] }> => {
	const response = throwOnPixelErrors(
		await runPixel<[Message[]]>(
			getPlaygroundMessagesPixel(roomId),
			insightId,
		),
	);
	return {
		insightId: response.insightId,
		messages: response.pixelReturn[0]?.output ?? [],
	};
};

/**
 * Create a playground room (`CreatePlaygroundRoom`), for an agent or for none.
 *
 * @param insightId - The insight to run in, or "new" for a new one.
 * @param workspaceId - The agent the room runs, if any.
 * @returns The room's id and the insight it was created in.
 * @throws When the backend reports an error or names no room.
 */
export const createPlaygroundRoom = async (
	insightId: string,
	workspaceId?: string,
): Promise<{ roomId: string; insightId: string }> => {
	const response = throwOnPixelErrors(
		await runPixel<[{ roomId: string }]>(
			`CreatePlaygroundRoom(${workspaceId ? `workspaceId=${JSON.stringify(workspaceId)}` : ""})`,
			insightId,
		),
	);
	const roomId = response.pixelReturn[0]?.output?.roomId;
	if (!roomId) {
		throw new Error("CreatePlaygroundRoom returned no room.");
	}
	return { roomId: roomId, insightId: response.insightId };
};

/** How {@link compactPlaygroundRoom} compacts a conversation. */
export type PlaygroundRoomCompaction = "TOOL_PRUNE" | "SUMMARY";

/** What one compaction method did, as `CompactRoomMessages` returns it. */
export interface PlaygroundRoomCompactionResult<Message> {
	/** The method. */
	type: PlaygroundRoomCompaction;
	/** Whether it worked. */
	success: boolean;
	/** Why it did not. */
	error?: string;
	/** The summary turn's input. */
	inputMessage: Message;
	/** The summary turn's response. */
	responseMessage: Message;
}

/**
 * Compact a playground room's conversation into one of its responses
 * (`CompactRoomMessages`): each method that works adds a summary turn below it.
 *
 * @param insightId - The insight to run in.
 * @param params.roomId - The room.
 * @param params.parentMessageId - The response to compact into.
 * @param params.strategy - The one method to run; without it the backend picks.
 * @returns What each method did, none when there was nothing to compact, or
 * undefined when the backend returned nothing.
 * @throws When the backend reports an error.
 */
export const compactPlaygroundRoom = async <Message = Record<string, unknown>>(
	insightId: string,
	params: {
		roomId: string;
		parentMessageId: string;
		strategy?: PlaygroundRoomCompaction;
	},
): Promise<PlaygroundRoomCompactionResult<Message>[] | undefined> => {
	const { roomId, parentMessageId, strategy } = params;
	const strategyClause = strategy
		? `, compactionTypes=${JSON.stringify([strategy])}`
		: "";
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[PlaygroundRoomCompactionResult<Message>[]]>(
			`CompactRoomMessages(roomId=${JSON.stringify(roomId)}, parentMessageId=${JSON.stringify(parentMessageId)}${strategyClause});`,
			insightId,
		),
	);
	return pixelReturn[0]?.output;
};

/**
 * Rate one of a room's responses (`SubmitLlmFeedback`).
 *
 * @param insightId - The insight to run in.
 * @param params.roomId - The room.
 * @param params.messageId - The response.
 * @param params.rating - True for good, false for bad, null to clear it.
 * @param params.feedbackText - A comment.
 * @throws When the backend reports an error.
 */
export const submitLlmFeedback = async (
	insightId: string,
	params: {
		roomId: string;
		messageId: string;
		rating: boolean | null;
		feedbackText: string;
	},
): Promise<void> => {
	const { roomId, messageId, rating, feedbackText } = params;
	throwOnPixelErrors(
		await runPixel<[boolean]>(
			`SubmitLlmFeedback(messageId=${JSON.stringify(messageId)}, feedbackText=${JSON.stringify(feedbackText)}, rating=${JSON.stringify(rating)}, roomId=${JSON.stringify(roomId)});`,
			insightId,
		),
	);
};

/** Which rooms a `GetPlaygroundRooms` call lists, and how. Every key is optional. */
export interface PlaygroundRoomsQuery {
	/** Only pinned rooms. */
	pinned?: boolean;
	/** The column to sort by, such as `dateUpdated` or `name`. */
	sortBy?: string;
	/** The sort's direction. */
	sort?: "ASC" | "DESC";
	/** How the backend groups the rooms, such as `agent` or `none`. */
	groupBy?: string;
	/** Matches room names, case-insensitively. */
	search?: string;
	/** Whether `search` also matches message text; name matches come first. */
	searchMessages?: boolean;
	/** Only rooms started with this agent. */
	workspaceId?: string;
	/** Only these rooms. */
	roomIds?: readonly string[];
	/** How many rooms to return. */
	limit?: number;
	/** How many rooms to skip, for the next page. */
	offset?: number;
}

/**
 * The `GetPlaygroundRooms` pixel that lists the user's rooms, for a caller
 * that runs it itself, such as a paging hook. Each room comes with its name,
 * its date, its agent and whether it is pinned.
 *
 * @param query - Which rooms, in what order, and which page.
 * @returns The pixel.
 */
export const getPlaygroundRoomsPixel = (
	query: PlaygroundRoomsQuery = {},
): string => {
	const {
		pinned,
		sortBy,
		sort,
		groupBy,
		search,
		searchMessages,
		workspaceId,
		roomIds,
		limit,
		offset,
	} = query;
	const keys: string[] = [];
	if (pinned !== undefined) {
		keys.push(`pinned=[${pinned}]`);
	}
	if (sortBy) {
		keys.push(`sortBy=["${sortBy}"]`);
	}
	if (sort) {
		keys.push(`sort=["${sort}"]`);
	}
	if (groupBy) {
		keys.push(`groupBy=["${groupBy}"]`);
	}
	if (search) {
		// encoded, so quotes and brackets in the text cannot break the pixel
		keys.push(`search=["<encode>${search}</encode>"]`);
		if (searchMessages) {
			keys.push("searchMessages=[true]");
		}
	}
	if (workspaceId) {
		keys.push(`workspaceId=${JSON.stringify([workspaceId])}`);
	}
	if (roomIds) {
		keys.push(`roomIds=${JSON.stringify(roomIds)}`);
	}
	if (limit !== undefined) {
		keys.push(`limit=[${limit}]`);
	}
	if (offset !== undefined) {
		keys.push(`offset=[${offset}]`);
	}
	return `META | GetPlaygroundRooms(${keys.join(", ")});`;
};

/**
 * The `GenerateFollowUpQuestions` pixel that suggests what the user might ask
 * next in a room, for a caller that runs it itself, such as a React read.
 *
 * @param params.engineId - The model to ask.
 * @param params.roomId - The room.
 * @param params.parentMessageId - The response to follow.
 * @param params.suggestionContext - What the room can do, such as its tools,
 * as the backend reads it.
 * @returns The pixel.
 */
export const getFollowUpQuestionsPixel = (params: {
	engineId: string;
	roomId: string;
	parentMessageId: string;
	suggestionContext: Record<string, unknown>;
}): string => {
	const { engineId, roomId, parentMessageId, suggestionContext } = params;
	return `GenerateFollowUpQuestions(engine=${JSON.stringify([engineId])}, roomId=${JSON.stringify([roomId])}, parentMessageId=${JSON.stringify([parentMessageId])}, suggestionContext=[${JSON.stringify(suggestionContext)}]);`;
};

/** What one chat turn sends `AskPlayground`. */
export interface AskPlaygroundParams {
	/** The model to ask. */
	engineId: string;
	/** The room. */
	roomId: string;
	/** What the user wrote. */
	command: string;
	/** The room's instructions; empty for none. */
	context: string;
	/** Where the turn's attachments were uploaded in the room's insight. */
	media: readonly string[];
	/** The response the turn follows; empty for none. */
	parentMessageId: string;
	/** The turn's extra values, such as its tools and temperature. */
	paramValues: Record<string, unknown>;
}

/** What one tool result sends `AddPlaygroundToolExecution`. */
export interface AddPlaygroundToolExecutionParams {
	/** The model that called the tool. */
	engineId: string;
	/** The room. */
	roomId: string;
	/** The response holding the call; empty for none. */
	parentMessageId: string;
	/** The call's id. */
	toolId: string;
	/** The tool's name. */
	toolName: string;
	/** What the tool returned, as the model reads it. */
	toolExecutionResponse: string;
	/** The turn's extra values, such as its tools. */
	paramValues: Record<string, unknown>;
	/** How the call ended. */
	mcpToolStatus: "success" | "error" | "cancelled" | "paused";
	/** The arguments the tool ran with. */
	toolParameterValues: Record<string, unknown>;
}

/**
 * How a stopped turn is committed: the call is sent once more with what the user saw, and the
 * backend saves it without asking the model, adding a hidden note for the model's next turn.
 */
export interface PlaygroundStopCommit {
	/** The reply's parts as they streamed; none when nothing did. */
	responseParts: readonly unknown[];
	/** The note the model reads next turn. */
	hiddenMessage: string;
}

/**
 * The keys a stop commit adds to a turn's call.
 *
 * @param commit - The commit, or undefined for a live call.
 * @returns The keys, with their leading comma, or an empty string.
 */
const stopCommitKeys = (commit: PlaygroundStopCommit | undefined): string =>
	commit
		? `, responseParts=${JSON.stringify(commit.responseParts)}, hiddenMessage=["<encode>${commit.hiddenMessage}</encode>"]`
		: "";

/**
 * The `AskPlayground` pixel that runs one chat turn, for the caller that streams it. With a
 * `commit`, the same turn is saved as stopped instead: the params must be the live call's.
 *
 * @param params - The turn.
 * @param commit - What streamed before the user stopped it.
 * @returns The pixel.
 */
export const askPlaygroundPixel = (
	params: AskPlaygroundParams,
	commit?: PlaygroundStopCommit,
): string => {
	const {
		engineId,
		roomId,
		command,
		context,
		media,
		parentMessageId,
		paramValues,
	} = params;
	return `AskPlayground(engine=["${engineId}"],
roomId=["${roomId}"],
command=["<encode>${command}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : "context=[],"}
${media.length ? `media=${JSON.stringify(media)},` : "media=[],"}
${parentMessageId ? `parentMessageId=["${parentMessageId}"],` : ""}
paramValues=[${JSON.stringify(paramValues)}]${stopCommitKeys(commit)});`;
};

/**
 * The `AddPlaygroundToolExecution` pixel that saves one tool result; the result that completes a
 * response's calls also asks the model to reply. With a `commit`, the result is saved with the
 * reply stopped: the params must be the live call's.
 *
 * @param params - The result.
 * @param commit - What the reply streamed before the user stopped it.
 * @returns The pixel.
 */
export const addPlaygroundToolExecutionPixel = (
	params: AddPlaygroundToolExecutionParams,
	commit?: PlaygroundStopCommit,
): string => {
	const {
		engineId,
		roomId,
		parentMessageId,
		toolId,
		toolName,
		toolExecutionResponse,
		paramValues,
		mcpToolStatus,
		toolParameterValues,
	} = params;
	return `AddPlaygroundToolExecution(engine=["${engineId}"],
roomId=["${roomId}"],
${parentMessageId ? `parentMessageId=["${parentMessageId}"],` : ""}
toolId=["${toolId}"],
toolName=["${toolName}"],
toolExecutionResponse=["<encode>${toolExecutionResponse}</encode>"],
paramValues=[${JSON.stringify(paramValues)}],
mcpToolStatus=${JSON.stringify(mcpToolStatus)},
toolParameterValues=[${JSON.stringify(toolParameterValues)}]${stopCommitKeys(commit)});`;
};
