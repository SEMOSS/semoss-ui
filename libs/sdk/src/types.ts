import type { PendingAgentAction } from "./api/agent.types";

/**
 * Script object
 */
export type Script = {
	/** Content of the script */
	script: string;

	/** Alias to load the script as */
	alias: string;
};

export type Role = "OWNER" | "EDIT" | "READ_ONLY" | "DISCOVERABLE";

/**
 * User details with permission information
 */
export interface User {
	date_added?: string;
	name: string;
	permission: Role;
	id: string;
	type?: string;
	email?: string;
}

export interface PostUser {
	userid: string;
	permission: Role;
}

export interface UserAccessRequest {
	requestid: string;
	userid: string;
	permission: Role;
	/** Resource type — only read by the backend when access-request notifications are enabled. */
	type?: string;
}

export interface ColumnInterface {
	column: string;
	type: string;
}

export interface TableInterface {
	table: string;
	columns: ColumnInterface[];
}

export interface MCPToolRequest {
	type: "MCP";
	message: string;
	id: string;
	name: string;
	parameters: Record<string, unknown>;
	roomId: string;
	original_name: string;
	tool_response?: string;
	executedParameters?: Record<string, unknown>;
	_meta?: Record<string, unknown>;
}

export interface MCPToolResponse {
	type: "MCP";
	message: string;
	id: string;
	name: string;
	response: string;
	roomId: string;
	tool_status?: "success" | "error" | "cancelled" | "paused";
	executedParameters?: Record<string, unknown>;
}

// -------------------------------------------------------------------------------------------------
// CHAT / ROOM TYPES
// -------------------------------------------------------------------------------------------------

/**
 * Workspace reference embedded within room options
 */
export interface RoomWorkspace {
	workspace_id: string;
	name: string;
}

/**
 * A single MCP (Model Context Protocol) tool or knowledge-source entry
 */
export interface MCPToolConfig {
	/** Unique identifier of the MCP tool or knowledge source */
	id: string;
	/** Entry type — e.g. "MCP" for a tool server, "VECTOR" for a knowledge source */
	type: string;
	/** Display name shown in the UI */
	name: string;
	/** True when this entry originates from a workspace agent (read-only in the room) */
	fromWorkspace?: boolean;
	/** True when this entry comes from the room's own toolbox folder */
	fromRoom?: boolean;
}

/**
 * A predefined prompt entry surfaced in the chat input
 */
export interface PredefinedPrompt {
	/** Unique identifier */
	id: string;
	/** Short display title */
	title: string;
	/** Full prompt text sent to the model */
	context: string;
	/** Descriptive tags */
	tags?: string[];
	/** Schema version */
	version?: number;
	/** Intent / category label */
	intent?: string;
}

/**
 * Configuration options for a room
 */
export interface RoomOptions {
	/** Predefined prompts shown as quick-start chips in the chat input */
	predefinedPrompts: PredefinedPrompt[];
	/** System-level instructions / persona injected into every conversation */
	instructions: string;
	/** MCP tool and knowledge-source entries enabled for the room */
	mcp: MCPToolConfig[];
	/** Agent workspace linked to the room, if any */
	workspace?: RoomWorkspace;
	/** ID of the model (engine) to use for this room */
	modelId: string;
	/** Set to "semoss" to run messages via the server-side RunAgent harness;
	 *  omit (or leave undefined) for the standard streaming AskRoom flow */
	harnessType?: string;
}

/**
 * A room
 */
export interface RoomRecord {
	roomId: string;
	name: string;
	[key: string]: unknown;
}

/**
 * A single message within a room
 */
export interface RoomMessage {
	messageId: string;
	content: string;
	role: string;
	[key: string]: unknown;
}

/**
 * Params for the AskRoom reactor
 */
export interface AskRoomParams {
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
 * The model response returned by AskRoom
 */
export interface RoomResponse {
	messageId: string;
	content: string;
	[key: string]: unknown;
}

/**
 * Params for the AddRoomToolExecution reactor
 */
export interface AddRoomToolExecutionParams {
	/** Engine (model app) ID */
	engine: string;
	/** Room ID the tool execution belongs to */
	roomId: string;
	/** ID of the parent response message that triggered the tool call */
	parentMessageId?: string;
	/** ID of the tool call being responded to */
	toolId: string;
	/** Name of the tool that was executed */
	toolName: string;
	/** The tool's execution output (will be encoded) */
	toolExecutionResponse: string;
	/** Outcome status of the tool execution */
	mcpToolStatus: "success" | "error" | "cancelled" | "paused";
	/** The parameter values that were actually passed to the tool */
	toolParameterValues: Record<string, unknown>;
	/** Additional param values forwarded to the model */
	paramValues?: Record<string, unknown>[];
}

// -------------------------------------------------------------------------------------------------
// ROOM CONSTRUCT TYPES
// -------------------------------------------------------------------------------------------------

/**
 * A single streaming chunk emitted by {@link RoomStore.ask} or {@link RoomStore.askAgent}
 * as the model responds.
 */
export interface RoomStreamChunk {
	/** Chunk category */
	type: "content" | "thinking" | "tool";
	/** Plain text token — present when type is "content" */
	content?: string;
	/** Reasoning token — present when type is "thinking" (extended-thinking models) */
	thinking?: string;
	/** Raw tool-call delta — present when type is "tool" */
	toolData?: unknown;
}

/**
 * Options for {@link RoomStore.ask}
 */
export interface RoomAskOptions {
	/** Called for each streaming chunk as it arrives. */
	onChunk?: (chunk: RoomStreamChunk) => void;
	/**
	 * Parent response message ID to continue an existing thread.
	 * Defaults to `"ROOT_PLACEHOLDER_ID"` (start a new thread) if omitted
	 * and no prior message has been sent on this RoomStore instance.
	 */
	parentMessageId?: string;
	/** Base64-encoded image strings to attach to the message. */
	image?: string[];
	/**
	 * System context / instructions for this request.
	 * Defaults to the room's configured `instructions`.
	 */
	context?: string;
}

/**
 * Options for {@link RoomStore.askAgent}
 */
export interface RoomAskAgentOptions {
	/** Called for each streaming chunk as it arrives. */
	onChunk?: (chunk: RoomStreamChunk) => void;
	/**
	 * Called when the run pauses on one or more tool calls awaiting a human
	 * decision (status `"INPUT_REQUIRED"`). Resolve each one with
	 * `decideAgentRunAction` or `submitAgentToolDecision` (imported from
	 * `@semoss/sdk`, using `pendingAction.runId` — not this RoomStore's `roomId`)
	 * to let the run resume.
	 *
	 * If omitted, `askAgent` rejects as soon as the run pauses, since there
	 * would otherwise be no way to unpause it and the call would hang forever.
	 */
	onPendingActions?: (pendingActions: PendingAgentAction[]) => void;
}

/**
 * Settled result returned by {@link RoomStore.ask}
 */
export interface RoomAskResult {
	/** Server-assigned ID of the persisted user input message */
	inputMessageId: string;
	/** Server-assigned ID of the persisted model response message */
	responseMessageId: string;
	/** Full response text extracted from all TEXT parts */
	text: string;
}

/**
 * Settled result returned by {@link RoomStore.askAgent}
 */
export interface RoomAskAgentResult {
	/** Server-assigned ID of the persisted user input message */
	inputMessageId: string;
	/** Server-assigned ID of the persisted final response message */
	responseMessageId: string;
	/** The agent's full response text */
	text: string;
	/** Terminal run status — `"COMPLETED"` on success */
	status: string;
}
