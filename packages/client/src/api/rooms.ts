import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk/react";
import type { Engine, MCPConfig } from "@semoss/shared";

const STREAM_POLL_INTERVAL_MS = 500;

/** Execution metadata attached to a tool call resolved from a room MCP. */
export interface WorkbenchChatToolMeta {
	SMSS_ENGINE_ID?: string;
	SMSS_PROJECT_ID?: string;
	SMSS_MCP_EXECUTION?: "auto" | "ask" | "disabled";
	SMSS_ORIGINAL_TOOL_NAME?: string;
}

/** Tool call returned by AskRoom. */
export interface WorkbenchChatToolCall {
	id: string;
	type: string;
	name: string;
	arguments: Record<string, unknown>;
	original_name?: string;
	title?: string;
	description?: string;
	server_tool?: boolean;
	_meta?: WorkbenchChatToolMeta;
}

/** Text content returned as part of a room message. */
export interface WorkbenchRoomTextPart {
	type: "TEXT";
	text: string;
	uiText: string;
}

/** Model reasoning returned as part of a room message. */
export interface WorkbenchRoomThinkingPart {
	type: "THINKING";
	thinking: string;
}

/** Uploaded file associated with a room message. */
export interface WorkbenchRoomMediaPart {
	type: "MEDIA";
	mediaInfo: {
		base64Data?: string;
		fileFormat?: string;
		fileName: string;
		fileLocation?: string;
		mediaInputType: "FILE";
		mimeType?: string;
	};
}

/** Tool invocation returned as part of a room message. */
export interface WorkbenchRoomToolCallPart {
	type: "TOOL_CALL";
	toolCall: WorkbenchChatToolCall;
}

/** Persisted result of a tool invocation. */
export interface WorkbenchRoomToolResultPart {
	type: "TOOL_RESULT";
	toolResult: {
		toolCallId: string;
		toolName: string;
		output: string;
		toolParameterValues: Record<string, unknown>;
		toolStatus: "success" | "error" | "cancelled" | "paused";
	};
}

/** Message part supported by the compact workbench chat. */
export type WorkbenchRoomMessagePart =
	| WorkbenchRoomTextPart
	| WorkbenchRoomThinkingPart
	| WorkbenchRoomMediaPart
	| WorkbenchRoomToolCallPart
	| WorkbenchRoomToolResultPart;

/** Optional model parameters forwarded to AskRoom and tool continuations. */
export interface WorkbenchChatModelOptions {
	max_tokens?: number;
	temperature?: number;
	top_p?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
	reasoning_effort?: string;
}

/** Canonical room message returned by AskRoom. */
export interface WorkbenchRoomMessage {
	io: "INPUT" | "OUTPUT";
	messageId: string;
	parentMessageId?: string;
	visible: boolean;
	platform_generated: boolean;
	modelId: string;
	modelType?: string;
	dateCreated: string;
	parts: WorkbenchRoomMessagePart[];
	tokens: number;
	ornaments?: {
		modelName?: string;
	};
	pruneToolsAbove?: boolean;
}

/** Canonical input/response pair returned after a room turn. */
export interface WorkbenchRoomTurn {
	inputMessage: WorkbenchRoomMessage;
	responseMessage: WorkbenchRoomMessage;
}

/** Options persisted for the mount-scoped workbench room. */
export interface WorkbenchRoomOptions {
	instructions: string;
	mcp: MCPConfig[];
	predefinedPrompts: [];
	modelId: string;
}

/** Generic persisted room options accepted by the assistant workbench. */
export type RoomOptionsMap = WorkbenchRoomOptions & Record<string, unknown>;

/** Conversation summary shown by the assistant's room switcher. */
export interface ConversationRoom {
	roomId: string;
	roomName: string;
	dateCreated: string;
	pinned: boolean;
}

/** Durable room message shape consumed by assistant run reconciliation. */
export interface PlaygroundMessage {
	type?: string;
	io?: "INPUT" | "OUTPUT" | string;
	messageId?: string;
	transactionId?: string;
	parentMessageId?: string;
	visible?: boolean;
	tokens?: number;
	cacheReadTokens?: number;
	cacheCreationTokens?: number;
	thinkingTokens?: number;
	dateCreated?: string;
	ornaments?: { modelName?: string; agentRunId?: string };
	parts?: Array<Record<string, unknown> & { type: string }>;
}

/** Result row returned by room message compaction. */
export interface CompactRoomResult {
	type: string;
	success: boolean;
	error?: string;
}

interface RawConversationRoom {
	ROOM_ID?: string;
	ROOM_NAME?: string;
	DATE_CREATED?: string;
	PINNED?: boolean;
}

/** Values needed to send a prompt to AskRoom. */
export interface AskWorkbenchRoomParams {
	insightId: string;
	roomId: string;
	modelId: string;
	prompt: string;
	systemPrompt: string;
	image: string[];
	paramValues: WorkbenchChatModelOptions;
	parentMessageId?: string;
}

/** Values needed to persist a workbench room tool result. */
export interface SaveWorkbenchRoomToolResultParams {
	insightId: string;
	roomId: string;
	modelId: string;
	responseMessageId: string;
	toolCall: WorkbenchChatToolCall;
	response: string;
	status: "success" | "error" | "cancelled";
	executedParameters: Record<string, unknown>;
	paramValues?: WorkbenchChatModelOptions;
}

/** One streaming chunk emitted by an asynchronous room pixel. */
export type WorkbenchRoomStreamChunk = Awaited<
	ReturnType<typeof getPixelJobStreaming>
>["message"][number];

type WorkbenchRoomToolExecutionOutput =
	| string
	| { responseMessage: string }
	| WorkbenchRoomTurn;

interface UserInfoProvider {
	meta?: Record<string, unknown>;
}

/** Throw when a pixel response contains an operation error. */
const assertPixelSuccess = (errors: string[]): void => {
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}
};

/** Return an AbortError that works in browsers and test environments. */
const createAbortError = (): Error => {
	const error = new Error("Room request was aborted");
	error.name = "AbortError";
	return error;
};

/** Wrap text with the SEMOSS pixel encoder marker. */
const encodePixelText = (value: string): string =>
	JSON.stringify(`<encode>${value}</encode>`);

/** Narrow an unknown value to the canonical room turn shape. */
const isWorkbenchRoomTurn = (value: unknown): value is WorkbenchRoomTurn => {
	if (!value || typeof value !== "object") {
		return false;
	}

	return "inputMessage" in value && "responseMessage" in value;
};

/** Extract a profile metadata string that may be returned as an array. */
export const getProfileMetadataValue = (value: unknown): string => {
	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value) && typeof value[0] === "string") {
		return value[0];
	}

	return "";
};

/** Resolve the user's configured default text-generation model. */
export const getDefaultWorkbenchChatModel = async (
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

/** Resolve a visible text-generation model by its engine id. */
export const resolveWorkbenchAssistantModel = async (
	insightId: string,
	modelId: string,
): Promise<Engine | null> => {
	if (!modelId) return null;

	const response = await runPixel<[Engine[]]>(
		`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"], filterWord=${JSON.stringify(modelId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	return (
		response.pixelReturn[0]?.output.find(
			(engine) => engine.engine_id === modelId,
		) ?? null
	);
};

/** Return the first visible text-generation model. */
export const getFirstWorkbenchAssistantModel = async (
	insightId: string,
): Promise<Engine | null> => {
	const response = await runPixel<[Engine[]]>(
		'META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);',
		insightId,
	);
	assertPixelSuccess(response.errors);
	return response.pixelReturn[0]?.output[0] ?? null;
};

/** Resolve the configured assistant model, falling back to the first model. */
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

	return (
		(await resolveWorkbenchAssistantModel(insightId, modelId)) ??
		(await getFirstWorkbenchAssistantModel(insightId))
	);
};

/** Create and bind a mount-scoped room to the workbench insight. */
export const createWorkbenchRoom = async (
	insightId: string,
): Promise<string> => {
	const response = await runPixel<[{ roomId: string }]>(
		"CreateRoom();",
		insightId,
	);
	assertPixelSuccess(response.errors);

	const roomId = response.pixelReturn[0]?.output.roomId;
	if (!roomId) {
		throw new Error("CreateRoom did not return a room ID");
	}

	const bindResponse = await runPixel<[boolean]>(
		`SetRoomForInsight(roomId=${JSON.stringify(roomId)});`,
		insightId,
	);
	assertPixelSuccess(bindResponse.errors);

	return roomId;
};

/** Persist the prompt, MCP, and model configuration used by the room. */
export const updateWorkbenchRoomOptions = async (
	insightId: string,
	roomId: string,
	options: WorkbenchRoomOptions,
): Promise<void> => {
	const persistedOptions: WorkbenchRoomOptions = {
		...options,
		mcp: options.mcp.filter((mcp) => !mcp.fromWorkspace && !mcp.fromRoom),
	};
	const response = await runPixel<[boolean]>(
		`UpdateRoomOptions(roomId=${JSON.stringify(roomId)}, roomOptions=[${JSON.stringify(persistedOptions)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/** Persist a generic room options map for the migrated assistant workbench. */
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

/** Rename a persisted workbench conversation room. */
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

/** List the user's persisted assistant conversation rooms. */
export const getUserConversationRooms = async (
	insightId: string,
	search: string,
): Promise<ConversationRoom[]> => {
	const response = await runPixel<[RawConversationRoom[]]>(
		`GetUserConversationRooms(roomOptionsSearch=${JSON.stringify(search)}, sort=["DESC"]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	return (response.pixelReturn[0]?.output ?? [])
		.filter((room) => Boolean(room.ROOM_ID))
		.map((room) => ({
			roomId: room.ROOM_ID ?? "",
			roomName: room.ROOM_NAME ?? "Untitled session",
			dateCreated: room.DATE_CREATED ?? "",
			pinned: room.PINNED ?? false,
		}));
};

/** Bind a conversation room to an insight context. */
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

const normalizeRoomOptions = (value: unknown): RoomOptionsMap | null => {
	if (typeof value === "string") {
		try {
			return normalizeRoomOptions(JSON.parse(value));
		} catch {
			return null;
		}
	}
	if (Array.isArray(value)) return normalizeRoomOptions(value[0]);
	if (!value || typeof value !== "object") return null;

	const record = value as Record<string, unknown>;
	if ("roomOptions" in record) {
		return normalizeRoomOptions(record.roomOptions);
	}
	if ("OPTIONS" in record) return normalizeRoomOptions(record.OPTIONS);
	return record as RoomOptionsMap;
};

/** Read and normalize persisted options for a workbench conversation room. */
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

/** Load durable messages for a room, oldest first. */
export const getPlaygroundMessages = async (
	insightId: string,
	roomId: string,
): Promise<PlaygroundMessage[]> => {
	const response = await runPixel<[PlaygroundMessage[]]>(
		`GetPlaygroundMessages(roomId=${JSON.stringify(roomId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);
	return response.pixelReturn[0]?.output ?? [];
};

/** Compact a conversation branch and return the backend step results. */
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

/** Generate the room tool profile for an engine. */
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

/** Build the generic AskRoom pixel for a workbench turn. */
export const buildAskWorkbenchRoomPixel = (
	params: Omit<AskWorkbenchRoomParams, "insightId">,
): string => {
	const parentMessage = params.parentMessageId
		? `parentMessageId=[${JSON.stringify(params.parentMessageId)}],\n`
		: "";

	return `AskRoom(engine=[${JSON.stringify(params.modelId)}],
roomId=[${JSON.stringify(params.roomId)}],
command=[${encodePixelText(params.prompt)}],
${params.systemPrompt ? `context=[${encodePixelText(params.systemPrompt)}],` : "context=[],"}
image=${JSON.stringify(params.image)},
${parentMessage}paramValues=[${JSON.stringify(params.paramValues)}]);`;
};

/** Poll one asynchronous room pixel and emit its streaming chunks. */
export const streamWorkbenchRoomPixel = async <O extends unknown[] | []>(
	pixel: string,
	insightId: string,
	onChunk: (chunk: WorkbenchRoomStreamChunk) => void,
	signal?: AbortSignal,
) => {
	if (signal?.aborted) {
		throw createAbortError();
	}

	const { jobId } = await runPixelAsync(pixel, insightId);
	if (!jobId) {
		throw new Error("No job ID returned from room request");
	}

	let stopRequested = false;
	const stop = () => {
		if (stopRequested) {
			return;
		}
		stopRequested = true;
		void runPixel(
			`StopPixelExecution(id=[${JSON.stringify(jobId)}]);`,
			insightId,
		);
	};
	signal?.addEventListener("abort", stop, { once: true });

	try {
		let isComplete = false;
		while (!isComplete) {
			if (signal?.aborted) {
				throw createAbortError();
			}

			const stream = await getPixelJobStreaming(jobId);
			for (const chunk of stream.message) {
				if (!signal?.aborted) {
					onChunk(chunk);
				}
			}

			if (
				stream.status === "Complete" ||
				stream.status === "ProgressComplete"
			) {
				isComplete = true;
			} else if (stream.status === "Error") {
				throw new Error("Room stream failed");
			} else if (
				stream.status === "Canceled" ||
				stream.status === "UnknownJob"
			) {
				if (signal?.aborted) {
					throw createAbortError();
				}
				throw new Error("Room stream ended before completion");
			}

			if (!isComplete) {
				await new Promise((resolve) =>
					setTimeout(resolve, STREAM_POLL_INTERVAL_MS),
				);
			}
		}

		if (signal?.aborted) {
			throw createAbortError();
		}

		const result = await getPixelAsyncResult<O>(jobId);
		assertPixelSuccess(result.errors);
		return result.results;
	} finally {
		signal?.removeEventListener("abort", stop);
	}
};

/** Send one prompt and wait for the canonical room messages. */
export const askWorkbenchRoom = async (
	params: AskWorkbenchRoomParams,
): Promise<WorkbenchRoomTurn> => {
	const response = await runPixel<[WorkbenchRoomTurn]>(
		buildAskWorkbenchRoomPixel(params),
		params.insightId,
	);
	assertPixelSuccess(response.errors);

	const output = response.pixelReturn[0]?.output;
	if (!isWorkbenchRoomTurn(output)) {
		throw new Error("AskRoom did not return a room turn");
	}

	return output;
};

/** Execute a returned MCP tool call through the backend. */
export const runWorkbenchRoomMcpTool = async (
	insightId: string,
	roomId: string,
	toolCall: WorkbenchChatToolCall,
): Promise<string> => {
	const ownerId =
		toolCall._meta?.SMSS_ENGINE_ID ?? toolCall._meta?.SMSS_PROJECT_ID ?? "";
	if (!ownerId) {
		throw new Error(`No MCP owner found for ${toolCall.name}`);
	}

	const response = await runPixel<[unknown]>(
		`RunMCPTool(project=[${JSON.stringify(ownerId)}], roomId=${JSON.stringify(roomId)}, function=[${JSON.stringify(toolCall.name)}], paramValues=[${JSON.stringify(toolCall.arguments)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const output = response.pixelReturn[0]?.output;
	if (typeof output === "string") {
		return output;
	}

	return JSON.stringify(output) ?? String(output ?? "");
};

/** Build the generic AddToolExecution pixel for one result. */
export const buildSaveWorkbenchRoomToolResultPixel = (
	params: Omit<SaveWorkbenchRoomToolResultParams, "insightId">,
): string => `AddToolExecution(engine=[${JSON.stringify(params.modelId)}],
roomId=[${JSON.stringify(params.roomId)}],
parentMessageId=[${JSON.stringify(params.responseMessageId)}],
toolId=[${JSON.stringify(params.toolCall.id)}],
toolName=[${JSON.stringify(params.toolCall.name)}],
toolExecutionResponse=[${encodePixelText(params.response)}],
paramValues=[${JSON.stringify(params.paramValues ?? {})}],
mcpToolStatus=${JSON.stringify(params.status)},
toolParameterValues=[${JSON.stringify(params.executedParameters)}]);`;

/** Save a tool result without invoking a streaming model continuation. */
export const saveWorkbenchRoomToolResult = async (
	params: SaveWorkbenchRoomToolResultParams,
): Promise<WorkbenchRoomToolExecutionOutput> => {
	const response = await runPixel<[WorkbenchRoomToolExecutionOutput]>(
		buildSaveWorkbenchRoomToolResultPixel(params),
		params.insightId,
	);
	assertPixelSuccess(response.errors);
	return response.pixelReturn[0]?.output ?? "";
};

/** Save the final tool result and stream the model continuation. */
export const continueWorkbenchRoomAfterTool = async (
	params: SaveWorkbenchRoomToolResultParams & {
		signal?: AbortSignal;
		onChunk: (chunk: WorkbenchRoomStreamChunk) => void;
	},
): Promise<WorkbenchRoomTurn> => {
	const results = await streamWorkbenchRoomPixel<
		WorkbenchRoomToolExecutionOutput[]
	>(
		buildSaveWorkbenchRoomToolResultPixel(params),
		params.insightId,
		params.onChunk,
		params.signal,
	);
	const output = results[0]?.output;
	if (!isWorkbenchRoomTurn(output)) {
		throw new Error("AddToolExecution did not return a room turn");
	}

	return output;
};
