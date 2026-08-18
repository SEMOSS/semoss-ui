import { useEffect, useReducer, useRef } from "react";
import { uploadInsight, useInsight } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import {
	askWorkbenchRoom,
	continueWorkbenchRoomAfterTool,
	createWorkbenchRoom,
	getDefaultWorkbenchChatModel,
	runWorkbenchRoomMcpTool,
	saveWorkbenchRoomToolResult,
	updateWorkbenchRoomOptions,
	type WorkbenchChatModelOptions,
	type WorkbenchRoomMessage,
	type WorkbenchRoomMessagePart,
	type WorkbenchRoomStreamChunk,
	type WorkbenchRoomTurn,
} from "@/api/rooms";
import {
	INITIAL_WORKBENCH_CHAT_STATE,
	type WorkbenchChatMessage,
	type WorkbenchChatState,
	type WorkbenchChatToolStatus,
	workbenchChatReducer,
} from "./workbench-chat.reducer";
import type {
	WorkbenchChatConfig,
	WorkbenchChatToolCall,
	WorkbenchChatToolHandler,
} from "./workbench-chat.types";

interface ToolPhaseEntry {
	call: WorkbenchChatToolCall;
	status: WorkbenchChatToolStatus;
}

interface ToolPhase {
	responseMessageId: string;
	entries: Map<string, ToolPhaseEntry>;
}

interface InitializationResult {
	insightId: string;
	roomId: string;
	model: Engine | null;
}

/** Operations and state exposed by the generic workbench chat hook. */
export interface UseWorkbenchChatResult {
	state: WorkbenchChatState;
	hasPendingTools: boolean;
	submit: (
		prompt: string,
		files: File[],
		options: WorkbenchChatModelOptions,
	) => Promise<boolean>;
	newRoom: () => Promise<void>;
	setModel: (model: Engine) => void;
	runTool: (toolId: string) => Promise<void>;
	cancelTool: (toolId: string) => Promise<void>;
	clearError: () => void;
}

let localMessageCounter = 0;

/** Create a stable local ID for an optimistic room message. */
const createLocalMessageId = (kind: string): string => {
	localMessageCounter += 1;
	return `${kind}-${Date.now()}-${localMessageCounter}`;
};

/** Build the compact room title shown in the workbench header. */
const createRoomName = (prompt: string): string => {
	const normalized = prompt.replace(/\s+/g, " ").trim();
	return normalized.length > 48
		? `${normalized.slice(0, 45).trimEnd()}...`
		: normalized;
};

/** Normalize an unknown tool result for AddRoomToolExecution. */
const serializeToolResult = (value: unknown): string => {
	if (typeof value === "string") {
		return value;
	}
	return JSON.stringify(value) ?? String(value ?? "");
};

/** Return a displayable message for an unknown thrown value. */
const getErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : "Unexpected chat error";

/** Create an optimistic room message used while a request is pending. */
const createOptimisticMessage = (
	messageId: string,
	io: "INPUT" | "OUTPUT",
	model: Engine,
	text?: string,
	files: File[] = [],
): WorkbenchChatMessage => {
	const parts: WorkbenchRoomMessagePart[] = [];
	if (text) {
		parts.push({ type: "TEXT", text, uiText: text });
	}
	for (const file of files) {
		parts.push({
			type: "MEDIA",
			mediaInfo: {
				fileName: file.name,
				mediaInputType: "FILE",
				mimeType: file.type,
			},
		});
	}
	if (parts.length === 0) {
		parts.push({ type: "THINKING", thinking: "" });
	}

	return {
		io,
		messageId,
		visible: true,
		platform_generated: true,
		modelId: model.engine_id,
		modelType: model.engine_type,
		dateCreated: new Date().toISOString(),
		parts,
		tokens: 0,
		ornaments: {
			modelName: model.engine_display_name || model.engine_name,
		},
		isStreaming: io === "OUTPUT",
	};
};

/** Find a local override using the tool's declared name before its wire name. */
const findToolHandler = (
	config: WorkbenchChatConfig,
	call: WorkbenchChatToolCall,
): WorkbenchChatToolHandler | undefined => {
	const names = [
		call._meta?.SMSS_ORIGINAL_TOOL_NAME,
		call.original_name,
		call.name,
	];

	for (const name of names) {
		if (name && config.toolHandlers?.[name]) {
			return config.toolHandlers[name];
		}
	}
	return undefined;
};

/** Extract executable tool calls from one canonical assistant response. */
const createToolPhase = (response: WorkbenchRoomMessage): ToolPhase | null => {
	const completed = new Set<string>();
	for (const part of response.parts) {
		if (part.type === "TOOL_RESULT") {
			completed.add(part.toolResult.toolCallId);
		}
	}

	const entries = new Map<string, ToolPhaseEntry>();
	for (const part of response.parts) {
		if (part.type !== "TOOL_CALL" || completed.has(part.toolCall.id)) {
			continue;
		}
		const execution = part.toolCall._meta?.SMSS_MCP_EXECUTION;
		if (
			part.toolCall.server_tool ||
			(execution !== "auto" && execution !== "ask")
		) {
			continue;
		}
		entries.set(part.toolCall.id, {
			call: part.toolCall,
			status: "initial",
		});
	}

	return entries.size > 0
		? { responseMessageId: response.messageId, entries }
		: null;
};

/** Own a mount-scoped generic room without introducing a MobX store. */
export const useWorkbenchChat = (
	config: WorkbenchChatConfig,
): UseWorkbenchChatResult => {
	const insight = useInsight();
	const [state, dispatch] = useReducer(
		workbenchChatReducer,
		INITIAL_WORKBENCH_CHAT_STATE,
	);
	const configRef = useRef(config);
	const initializationRef = useRef<Promise<InitializationResult> | null>(
		null,
	);
	const initializationInsightRef = useRef("");
	const requestControllerRef = useRef<AbortController | null>(null);
	const latestResponseIdRef = useRef("");
	const toolPhaseRef = useRef<ToolPhase | null>(null);
	const toolQueueRef = useRef<Promise<void>>(Promise.resolve());
	const modelOptionsRef = useRef<WorkbenchChatModelOptions>({});

	configRef.current = config;

	useEffect(() => {
		if (!insight.isReady || !insight.insightId) {
			return;
		}

		let isActive = true;
		dispatch({ type: "initialize-start" });

		if (
			!initializationRef.current ||
			initializationInsightRef.current !== insight.insightId
		) {
			initializationInsightRef.current = insight.insightId;
			initializationRef.current = (async () => {
				const [roomId, model] = await Promise.all([
					createWorkbenchRoom(insight.insightId),
					getDefaultWorkbenchChatModel(insight.insightId).catch(
						() => null,
					),
				]);

				if (model) {
					await updateWorkbenchRoomOptions(
						insight.insightId,
						roomId,
						{
							instructions: configRef.current.systemPrompt,
							mcp: configRef.current.mcp,
							predefinedPrompts: [],
							modelId: model.engine_id,
						},
					);
				}

				return { insightId: insight.insightId, roomId, model };
			})();
		}

		initializationRef.current
			.then((result) => {
				if (isActive && result.insightId === insight.insightId) {
					dispatch({
						type: "initialize-success",
						roomId: result.roomId,
						model: result.model,
					});
				}
			})
			.catch((error: unknown) => {
				if (isActive) {
					dispatch({
						type: "set-error",
						error: getErrorMessage(error),
					});
				}
			});

		return () => {
			isActive = false;
		};
	}, [insight.insightId, insight.isReady]);

	useEffect(
		() => () => {
			requestControllerRef.current?.abort();
		},
		[],
	);

	const dispatchStreamChunk = (
		responsePlaceholderId: string,
		chunk: WorkbenchRoomStreamChunk,
	) => {
		if (chunk.stream_type === "content" && chunk.data.content) {
			dispatch({
				type: "stream-text",
				messageId: responsePlaceholderId,
				text: chunk.data.content,
			});
		} else if (chunk.stream_type === "thinking" && chunk.data.thinking) {
			dispatch({
				type: "stream-thinking",
				messageId: responsePlaceholderId,
				thinking: chunk.data.thinking,
			});
		}
	};

	const scheduleAutomaticTools = (phase: ToolPhase | null) => {
		if (!phase) {
			return;
		}

		for (const entry of phase.entries.values()) {
			if (entry.call._meta?.SMSS_MCP_EXECUTION === "auto") {
				void enqueueTool(entry.call.id, false);
			}
		}
	};

	const acceptTurn = (
		turn: WorkbenchRoomTurn,
		responsePlaceholderId: string,
		inputPlaceholderId?: string,
	) => {
		latestResponseIdRef.current = turn.responseMessage.messageId;
		dispatch({
			type: "turn-success",
			inputPlaceholderId,
			responsePlaceholderId,
			turn,
		});

		const phase = createToolPhase(turn.responseMessage);
		toolPhaseRef.current = phase;
		scheduleAutomaticTools(phase);
	};

	const executeTool = async (toolId: string, cancel: boolean) => {
		const phase = toolPhaseRef.current;
		const entry = phase?.entries.get(toolId);
		const model = state.model;
		if (
			!phase ||
			!entry ||
			entry.status !== "initial" ||
			!model ||
			!state.roomId
		) {
			return;
		}

		entry.status = cancel ? "cancelled" : "running";
		dispatch({
			type: "tool-status",
			toolId,
			status: entry.status,
		});

		let response = "Tool execution cancelled by the user.";
		let status: "success" | "error" | "cancelled" = "cancelled";

		if (!cancel) {
			try {
				const handler = findToolHandler(configRef.current, entry.call);
				const output = handler
					? await handler(entry.call.arguments, {
							insightId: insight.insightId,
							roomId: state.roomId,
							responseMessageId: phase.responseMessageId,
							toolCall: entry.call,
						})
					: await runWorkbenchRoomMcpTool(
							insight.insightId,
							state.roomId,
							entry.call,
						);
				response = serializeToolResult(output);
				status = "success";
			} catch (error: unknown) {
				response = getErrorMessage(error);
				status = "error";
			}
		}

		entry.status = status;
		dispatch({ type: "tool-status", toolId, status, response });

		const isFinal = Array.from(phase.entries.values()).every(
			(candidate) =>
				candidate.status === "success" ||
				candidate.status === "error" ||
				candidate.status === "cancelled",
		);
		const resultParams = {
			insightId: insight.insightId,
			roomId: state.roomId,
			modelId: model.engine_id,
			responseMessageId: phase.responseMessageId,
			toolCall: entry.call,
			response,
			status,
			executedParameters: entry.call.arguments,
			paramValues: modelOptionsRef.current,
		};

		try {
			if (!isFinal) {
				await saveWorkbenchRoomToolResult(resultParams);
				return;
			}

			toolPhaseRef.current = null;
			const responsePlaceholderId = createLocalMessageId("tool-response");
			dispatch({
				type: "follow-up-start",
				responseMessage: createOptimisticMessage(
					responsePlaceholderId,
					"OUTPUT",
					model,
				),
			});
			const controller = new AbortController();
			requestControllerRef.current = controller;
			const turn = await continueWorkbenchRoomAfterTool({
				...resultParams,
				signal: controller.signal,
				onChunk: (chunk) =>
					dispatchStreamChunk(responsePlaceholderId, chunk),
			});
			acceptTurn(turn, responsePlaceholderId);
		} catch (error: unknown) {
			if (!(error instanceof Error) || error.name !== "AbortError") {
				dispatch({
					type: "set-error",
					error: getErrorMessage(error),
				});
			}
		} finally {
			requestControllerRef.current = null;
		}
	};

	function enqueueTool(toolId: string, cancel: boolean): Promise<void> {
		const queued = toolQueueRef.current.then(() =>
			executeTool(toolId, cancel),
		);
		toolQueueRef.current = queued.catch(() => undefined);
		return queued;
	}

	const newRoom = async (): Promise<void> => {
		if (
			!insight.isReady ||
			!insight.insightId ||
			state.isInitializing ||
			state.isStreaming ||
			toolPhaseRef.current
		) {
			return;
		}

		const model = state.model;
		dispatch({ type: "new-room-start" });
		latestResponseIdRef.current = "";
		toolPhaseRef.current = null;
		toolQueueRef.current = Promise.resolve();

		try {
			const roomId = await createWorkbenchRoom(insight.insightId);
			if (model) {
				await updateWorkbenchRoomOptions(insight.insightId, roomId, {
					instructions: configRef.current.systemPrompt,
					mcp: configRef.current.mcp,
					predefinedPrompts: [],
					modelId: model.engine_id,
				});
			}

			initializationRef.current = Promise.resolve({
				insightId: insight.insightId,
				roomId,
				model,
			});
			dispatch({ type: "new-room-success", roomId, model });
		} catch (error: unknown) {
			dispatch({
				type: "set-error",
				error: getErrorMessage(error),
			});
		}
	};

	const submit = async (
		prompt: string,
		files: File[],
		options: WorkbenchChatModelOptions,
	): Promise<boolean> => {
		const trimmed = prompt.trim();
		const command =
			trimmed || (files.length > 0 ? "Review the attached files." : "");
		const model = state.model;
		if (
			!command ||
			!model ||
			!state.roomId ||
			state.isStreaming ||
			toolPhaseRef.current
		) {
			return false;
		}
		modelOptionsRef.current = options;

		const inputPlaceholderId = createLocalMessageId("user");
		const responsePlaceholderId = createLocalMessageId("assistant");
		dispatch({
			type: "turn-start",
			roomName: createRoomName(trimmed || files[0]?.name || "Attachment"),
			inputMessage: createOptimisticMessage(
				inputPlaceholderId,
				"INPUT",
				model,
				command,
				files,
			),
			responseMessage: createOptimisticMessage(
				responsePlaceholderId,
				"OUTPUT",
				model,
			),
		});

		try {
			const uploadedFiles =
				files.length > 0
					? (await uploadInsight(insight.insightId, "", files)).data
					: [];
			await updateWorkbenchRoomOptions(insight.insightId, state.roomId, {
				instructions: configRef.current.systemPrompt,
				mcp: configRef.current.mcp,
				predefinedPrompts: [],
				modelId: model.engine_id,
			});
			const turn = await askWorkbenchRoom({
				insightId: insight.insightId,
				roomId: state.roomId,
				modelId: model.engine_id,
				prompt: command,
				systemPrompt: configRef.current.systemPrompt,
				image: uploadedFiles.map((file) => file.fileLocation),
				paramValues: options,
				parentMessageId: latestResponseIdRef.current || undefined,
			});
			acceptTurn(turn, responsePlaceholderId, inputPlaceholderId);
			return true;
		} catch (error: unknown) {
			if (!(error instanceof Error) || error.name !== "AbortError") {
				dispatch({
					type: "turn-error",
					inputPlaceholderId,
					responsePlaceholderId,
					error: getErrorMessage(error),
				});
			}
			return false;
		}
	};

	const setModel = (model: Engine) => {
		if (!state.isStreaming && !toolPhaseRef.current) {
			dispatch({ type: "set-model", model });
		}
	};

	const hasPendingTools = Object.values(state.tools).some(
		(tool) => tool.status === "initial" || tool.status === "running",
	);

	return {
		state,
		hasPendingTools,
		submit,
		newRoom,
		setModel,
		runTool: (toolId) => enqueueTool(toolId, false),
		cancelTool: (toolId) => enqueueTool(toolId, true),
		clearError: () => dispatch({ type: "clear-error" }),
	};
};
