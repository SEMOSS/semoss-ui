import type { Engine } from "@semoss/shared";
import type {
	WorkbenchRoomMessage,
	WorkbenchRoomToolResultPart,
	WorkbenchRoomTurn,
} from "@/api/rooms";
import type { WorkbenchChatToolCall } from "./workbench-chat.types";

/** Client-side execution status for a room tool call. */
export type WorkbenchChatToolStatus =
	| "initial"
	| "running"
	| "success"
	| "error"
	| "cancelled"
	| "disabled";

/** Local rendering state associated with one canonical tool call. */
export interface WorkbenchChatToolState {
	call: WorkbenchChatToolCall;
	responseMessageId: string;
	status: WorkbenchChatToolStatus;
	response: string;
}

/** Room message plus transient streaming state. */
export interface WorkbenchChatMessage extends WorkbenchRoomMessage {
	isStreaming?: boolean;
}

/** Complete local state for the compact workbench chat. */
export interface WorkbenchChatState {
	roomId: string;
	roomName: string;
	model: Engine | null;
	messages: WorkbenchChatMessage[];
	tools: Record<string, WorkbenchChatToolState>;
	isInitializing: boolean;
	isStreaming: boolean;
	error: string;
}

/** Initial state for a newly mounted workbench chat. */
export const INITIAL_WORKBENCH_CHAT_STATE: WorkbenchChatState = {
	roomId: "",
	roomName: "",
	model: null,
	messages: [],
	tools: {},
	isInitializing: true,
	isStreaming: false,
	error: "",
};

export type WorkbenchChatAction =
	| { type: "initialize-start" }
	| { type: "initialize-success"; roomId: string; model: Engine | null }
	| { type: "new-room-start" }
	| { type: "new-room-success"; roomId: string; model: Engine | null }
	| { type: "set-model"; model: Engine }
	| { type: "clear-error" }
	| { type: "set-error"; error: string }
	| {
			type: "turn-start";
			roomName: string;
			inputMessage: WorkbenchChatMessage;
			responseMessage: WorkbenchChatMessage;
	  }
	| {
			type: "follow-up-start";
			responseMessage: WorkbenchChatMessage;
	  }
	| { type: "stream-text"; messageId: string; text: string }
	| { type: "stream-thinking"; messageId: string; thinking: string }
	| {
			type: "turn-success";
			inputPlaceholderId?: string;
			responsePlaceholderId: string;
			turn: WorkbenchRoomTurn;
	  }
	| {
			type: "turn-error";
			inputPlaceholderId: string;
			responsePlaceholderId: string;
			error: string;
	  }
	| {
			type: "tool-status";
			toolId: string;
			status: WorkbenchChatToolStatus;
			response?: string;
	  };

/** Map a persisted tool result to its local status. */
const getToolResultStatus = (
	result: WorkbenchRoomToolResultPart | undefined,
): WorkbenchChatToolStatus | null => {
	if (!result) {
		return null;
	}

	if (result.toolResult.toolStatus === "error") {
		return "error";
	}
	if (
		result.toolResult.toolStatus === "cancelled" ||
		result.toolResult.toolStatus === "paused"
	) {
		return "cancelled";
	}
	return "success";
};

/** Merge canonical tool calls from a response into the local tool map. */
const syncResponseTools = (
	tools: WorkbenchChatState["tools"],
	response: WorkbenchRoomMessage,
): WorkbenchChatState["tools"] => {
	const next = { ...tools };
	const results = new Map<string, WorkbenchRoomToolResultPart>();

	for (const part of response.parts) {
		if (part.type === "TOOL_RESULT") {
			results.set(part.toolResult.toolCallId, part);
		}
	}

	for (const part of response.parts) {
		if (part.type !== "TOOL_CALL") {
			continue;
		}

		const result = results.get(part.toolCall.id);
		const execution = part.toolCall._meta?.SMSS_MCP_EXECUTION;
		const persistedStatus = getToolResultStatus(result);
		next[part.toolCall.id] = {
			call: part.toolCall,
			responseMessageId: response.messageId,
			status:
				persistedStatus ??
				(part.toolCall.server_tool ||
				(execution !== "auto" && execution !== "ask")
					? "disabled"
					: "initial"),
			response: result?.toolResult.output ?? "",
		};
	}

	return next;
};

/** Append streamed text or thinking content to one message part. */
const appendStreamPart = (
	messages: WorkbenchChatMessage[],
	messageId: string,
	type: "TEXT" | "THINKING",
	value: string,
): WorkbenchChatMessage[] =>
	messages.map((message) => {
		if (message.messageId !== messageId || !value) {
			return message;
		}

		const parts = [...message.parts];
		const last = parts[parts.length - 1];
		if (type === "TEXT" && last?.type === "TEXT") {
			parts[parts.length - 1] = {
				...last,
				text: last.text + value,
				uiText: last.uiText + value,
			};
		} else if (type === "THINKING" && last?.type === "THINKING") {
			parts[parts.length - 1] = {
				...last,
				thinking: last.thinking + value,
			};
		} else if (type === "TEXT") {
			parts.push({ type: "TEXT", text: value, uiText: value });
		} else {
			parts.push({ type: "THINKING", thinking: value });
		}

		return { ...message, parts };
	});

/** Replace optimistic placeholders with one canonical backend turn. */
const replaceTurn = (
	messages: WorkbenchChatMessage[],
	action: Extract<WorkbenchChatAction, { type: "turn-success" }>,
): WorkbenchChatMessage[] => {
	const next: WorkbenchChatMessage[] = [];
	let insertedInput = false;

	for (const message of messages) {
		if (
			action.inputPlaceholderId &&
			message.messageId === action.inputPlaceholderId
		) {
			next.push(action.turn.inputMessage);
			insertedInput = true;
			continue;
		}

		if (message.messageId === action.responsePlaceholderId) {
			if (!insertedInput && !action.inputPlaceholderId) {
				next.push(action.turn.inputMessage);
			}
			next.push(action.turn.responseMessage);
			continue;
		}

		next.push(message);
	}

	return next;
};

/** Reduce one local chat action into the next immutable state. */
export const workbenchChatReducer = (
	state: WorkbenchChatState,
	action: WorkbenchChatAction,
): WorkbenchChatState => {
	switch (action.type) {
		case "initialize-start":
			return { ...state, isInitializing: true, error: "" };
		case "initialize-success":
			return {
				...state,
				roomId: action.roomId,
				model: action.model,
				isInitializing: false,
				error: "",
			};
		case "new-room-start":
			return {
				...state,
				roomId: "",
				roomName: "",
				messages: [],
				tools: {},
				isInitializing: true,
				isStreaming: false,
				error: "",
			};
		case "new-room-success":
			return {
				...state,
				roomId: action.roomId,
				model: action.model,
				isInitializing: false,
				error: "",
			};
		case "set-model":
			return { ...state, model: action.model, error: "" };
		case "clear-error":
			return { ...state, error: "" };
		case "set-error":
			return {
				...state,
				isInitializing: false,
				isStreaming: false,
				error: action.error,
			};
		case "turn-start":
			return {
				...state,
				roomName: state.roomName || action.roomName,
				messages: [
					...state.messages,
					action.inputMessage,
					action.responseMessage,
				],
				isStreaming: true,
				error: "",
			};
		case "follow-up-start":
			return {
				...state,
				messages: [...state.messages, action.responseMessage],
				isStreaming: true,
				error: "",
			};
		case "stream-text":
			return {
				...state,
				messages: appendStreamPart(
					state.messages,
					action.messageId,
					"TEXT",
					action.text,
				),
			};
		case "stream-thinking":
			return {
				...state,
				messages: appendStreamPart(
					state.messages,
					action.messageId,
					"THINKING",
					action.thinking,
				),
			};
		case "turn-success":
			return {
				...state,
				messages: replaceTurn(state.messages, action),
				tools: syncResponseTools(
					state.tools,
					action.turn.responseMessage,
				),
				isStreaming: false,
				error: "",
			};
		case "turn-error":
			return {
				...state,
				messages: state.messages.filter(
					(message) =>
						message.messageId !== action.inputPlaceholderId &&
						message.messageId !== action.responsePlaceholderId,
				),
				isStreaming: false,
				error: action.error,
			};
		case "tool-status": {
			const tool = state.tools[action.toolId];
			if (!tool) {
				return state;
			}
			return {
				...state,
				tools: {
					...state.tools,
					[action.toolId]: {
						...tool,
						status: action.status,
						response: action.response ?? tool.response,
					},
				},
			};
		}
	}
};
