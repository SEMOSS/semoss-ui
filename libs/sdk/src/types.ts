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
// CHAT / PLAYGROUND TYPES
// -------------------------------------------------------------------------------------------------

/**
 * Workspace reference embedded within room options
 */
export interface PlaygroundWorkspace {
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
 * Configuration options for a playground room
 */
export interface PlaygroundRoomOptions {
	/** Predefined prompts shown as quick-start chips in the chat input */
	predefinedPrompts: PredefinedPrompt[];
	/** System-level instructions / persona injected into every conversation */
	instructions: string;
	/** MCP tool and knowledge-source entries enabled for the room */
	mcp: MCPToolConfig[];
	/** Agent workspace linked to the room, if any */
	workspace?: PlaygroundWorkspace;
	/** ID of the model (engine) to use for this room */
	modelId: string;
	/** Set to "semoss" to run messages via the server-side RunAgent harness;
	 *  omit (or leave undefined) for the standard streaming AskPlayground flow */
	harnessType?: string;
}

/**
 * A playground room
 */
export interface PlaygroundRoom {
	roomId: string;
	name: string;
	[key: string]: unknown;
}

/**
 * A single message within a playground room
 */
export interface PlaygroundMessage {
	messageId: string;
	content: string;
	role: string;
	[key: string]: unknown;
}

/**
 * Params for the AskPlayground reactor
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
 * The model response returned by AskPlayground
 */
export interface PlaygroundResponse {
	messageId: string;
	content: string;
	[key: string]: unknown;
}

/**
 * Params for the AddPlaygroundToolExecution reactor
 */
export interface AddPlaygroundToolExecutionParams {
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

/**
 * Params for the RunAgent reactor (server-side agent harness)
 */
export interface RunAgentParams {
	/** Engine (model) ID to run the agent against */
	engine: string;
	/** Room ID the agent run belongs to */
	roomId: string;
	/** The user message or command text (will be encoded) */
	command: string;
	/**
	 * Harness type — always "semoss" for the standard SEMOSS agent harness.
	 * Omit to use the default.
	 */
	harnessType?: string;
}

/**
 * Settled result returned by the RunAgent reactor once the full agentic loop
 * completes on the server. Streamed tokens arrive via {@link getPixelJobStreaming}
 * during the run; this summary is fetched once via {@link getPixelAsyncResult}.
 */
export interface RunAgentOutput {
	/** Whether the run exceeded the server wait window before finishing */
	waitTimedOut: boolean;
	/** Terminal run status, e.g. "COMPLETED" */
	status: string;
	/** The user's input text, echoed back */
	input: string;
	/** Server-assigned message ID for the persisted input message */
	inputMessageId: string;
	/** The agent's final assistant response text */
	finalText: string;
	/** Server-assigned message ID for the persisted final response message */
	finalOutputMessageId: string;
	/** Engine/model ID the agent ran against */
	modelId: string;
	/** Harness type that produced this run */
	harnessType: string;
	roomId: string;
	runId: string;
	jobId: string;
	userId: string;
	startedAt: string;
	completedAt: string;
	dateCreated: string;
	/** Files / artifacts produced by the run (e.g. generated documents) */
	artifacts: unknown[];
}
