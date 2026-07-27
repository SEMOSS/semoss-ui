import type {
	App,
	Engine,
	MCP,
	MCPConfig,
	ProjectDependency,
} from "@semoss/shared";

// Re-export shared types for backward compatibility
export type { Engine, App, MCP, MCPConfig, ProjectDependency };

export type ChatRole = "user" | "assistant";

/**
 * "streaming" while tokens are actively arriving for this message (see
 * ChatSession) — lets UI show a distinct in-progress state instead of
 * only complete/error.
 */
export type ChatMessageStatus = "streaming" | "complete" | "error";

/**
 * Every part carries its own stable `id` — not just tool_call/tool_result
 * — so components can key React lists by part identity rather than array
 * index, even though parts are only ever appended/mutated in place, never
 * reordered.
 */
export interface ChatTextPart {
	type: "text";
	id: string;
	text: string;
}

export interface ChatThinkingPart {
	type: "thinking";
	id: string;
	text: string;
}

export interface ChatMediaPart {
	type: "media";
	id: string;
	mediaInfo: {
		fileName: string;
		fileLocation?: string;
		base64Data?: string;
		mimeType?: string;
		fileFormat?: string;
		mediaInputType?: string;
	};
}

export interface ChatToolCallPart {
	type: "tool_call";
	id: string;
	name: string;
	arguments: Record<string, unknown>;
	originalName?: string;
	title?: string;
	_meta?: {
		SMSS_PROJECT_ID?: string;
		SMSS_ENGINE_TYPE?: string;
		SMSS_MCP_UI?: { resourceURI?: string; [key: string]: unknown };
		[key: string]: unknown;
	};
}

export interface ChatToolResultPart {
	type: "tool_result";
	id: string;
	toolCallId: string;
	output: string;
	status: "success" | "error";
}

export type ChatMessagePart =
	| ChatTextPart
	| ChatThinkingPart
	| ChatMediaPart
	| ChatToolCallPart
	| ChatToolResultPart;

/**
 * A message is a sequence of typed parts, not flat text — matching
 * playground's real structure (a single assistant turn can think, call a
 * tool, and answer, all as one message). This is what lets a tool call
 * render inline, with a real running/done/error state, instead of a
 * separate floating indicator with nothing behind it.
 *
 * Deliberately flat/linear (no parent/child tree, no branching) — this is
 * a scope cut for Phase 1, matching what provider-portal-hpp's HomeChatBot
 * already needs. See docs/chat-components/PLAN.md, Phase 1.
 */
export interface ChatMessage {
	id: string;
	role: ChatRole;
	parts: ChatMessagePart[];
	status: ChatMessageStatus;
	timestamp: Date;
	/** Thumbs up/down on an assistant response — undefined until rated. Matches the wire's real `ResponsePixelMessage.feedback` field (only ever present on OUTPUT messages). */
	feedback?: { rating: boolean };
}

/**
 * One chunk from getPixelJobStreaming's polling response — a trimmed
 * subset of the real backend contract (see libs/sdk/src/api/base.ts).
 */
export interface StreamChunk {
	stream_type: "content" | "tool" | "thinking";
	data: {
		content?: string;
		thinking?: string;
		index?: number;
		id?: string;
		type?: string;
		function?: { name?: string; arguments?: string };
		finish_reason?: string;
	};
}

/**
 * A trimmed subset of the real backend response-part contract (see
 * playground's `types.d.ts`) — only the parts this transport layer
 * actually reads. Unrecognized part types fall through to
 * PixelMessageOtherPart rather than erroring.
 */
export interface PixelMessageTextPart {
	type: "TEXT";
	text?: string;
	uiText?: string;
}

export interface PixelMessageToolCallPart {
	type: "TOOL_CALL";
	toolCall: {
		id: string;
		name: string;
		/**
		 * Clean, human-readable name the backend sends once the call is
		 * fully resolved — real playground renders this verbatim rather
		 * than deriving a display name from `name` (which can be a raw
		 * project-id-prefixed reactor identifier). Absent while a call is
		 * still streaming, same as real playground.
		 */
		title?: string;
		original_name?: string;
		arguments: Record<string, unknown>;
		_meta?: {
			SMSS_PROJECT_ID?: string;
			SMSS_ENGINE_TYPE?: string;
			SMSS_MCP_UI?: { resourceURI?: string; [key: string]: unknown };
			[key: string]: unknown;
		};
	};
}

export interface PixelMessageOtherPart {
	type: string;
}

export type ResponsePart =
	| PixelMessageTextPart
	| PixelMessageThinkingPart
	| PixelMessageMediaPart
	| PixelMessageToolCallPart
	| PixelMessageToolResultPart
	| PixelMessageOtherPart;

export interface ResponseMessage {
	messageId?: string;
	type?: string;
	parts?: ResponsePart[];
	ornaments?: { processedResponsed?: string };
	content?: string;
	error?: string;
}

/**
 * The RunAgent reactor's durable run record (its async job's
 * `getPixelAsyncResult` output). Unlike AskPlayground — which returns a
 * paired input/response pixel message — RunAgent runs the full agentic
 * loop server-side (tool calls included) and returns one flat summary once
 * the run finishes. Matches playground's own `RunAgentOutput`
 * (`packages/playground/src/stores/message/agent-harness.ts`).
 */
export interface RunAgentResult {
	/** Terminal run status — only "COMPLETED" is a success. */
	status: string;
	/** Whether the run exceeded the server's wait window before finishing. */
	waitTimedOut: boolean;
	/** The agent's final assistant text. */
	finalText: string;
	/** Server message id for the persisted input message. */
	inputMessageId?: string;
	/** Server message id for the persisted final response message. */
	finalOutputMessageId?: string;
	runId?: string;
	jobId?: string;
}

/**
 * Room-history wire shapes — trimmed subsets of playground's real
 * `types.d.ts`/`GlobalNav` contracts (only the fields normalizeRoomHistory
 * and the room-list transport calls actually read).
 */
export interface PixelMessageThinkingPart {
	type: "THINKING";
	thinking: string;
}

export interface PixelMessageToolResultPart {
	type: "TOOL_RESULT";
	toolResult: {
		toolCallId: string;
		toolName: string;
		output: string;
		toolStatus: "success" | "error" | "cancelled" | "paused";
	};
}

export interface PixelMessageMediaPart {
	type: "MEDIA";
	mediaInfo: {
		fileName: string;
		fileLocation?: string;
		base64Data?: string;
		mimeType?: string;
		fileFormat?: string;
		mediaInputType?: string;
	};
}

export type RawMessagePart =
	| PixelMessageTextPart
	| PixelMessageThinkingPart
	| PixelMessageMediaPart
	| PixelMessageToolCallPart
	| PixelMessageToolResultPart
	| PixelMessageOtherPart;

/** One message as returned by GetPlaygroundMessages, before normalizeRoomHistory flattens the branching tree. */
export interface RawPixelMessage {
	io: "INPUT" | "OUTPUT";
	/**
	 * Distinguishes a real user message ("INPUT_TEXT") from a tool-result
	 * continuation the backend recorded as its own INPUT message
	 * ("INPUT_TOOL_EXEC") — normalizeRoomHistory folds the latter into the
	 * preceding assistant turn rather than rendering it as a second user
	 * bubble. OUTPUT messages don't narrow this field the same way.
	 */
	type?: string;
	messageId: string;
	parentMessageId?: string;
	summaryLeafMessageId?: string;
	modelId?: string;
	dateCreated: string;
	parts: RawMessagePart[];
	/** Only ever present on an OUTPUT message — matches the wire's real `ResponsePixelMessage.feedback`. */
	feedback?: { rating: boolean };
}

/** One room as returned by GetPlaygroundRooms. */
export interface RawPlaygroundRoom {
	ROOM_ID: string;
	ROOM_NAME: string;
	DATE_CREATED: string;
	WORKSPACE_ID?: string;
	PINNED?: boolean;
}

export interface RoomSummary {
	roomId: string;
	/** Raw ROOM_NAME, may be "" — the "Untitled" fallback is a RoomSidebar render concern, not baked in here. */
	name: string;
	dateCreated: Date;
	pinned: boolean;
	workspaceId?: string;
}
