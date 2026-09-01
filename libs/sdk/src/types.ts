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
	 * `AgentStore.decide` (or `decideAgentRunAction` imported from
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

// -------------------------------------------------------------------------------------------------
// AGENT RUN TYPES
// -------------------------------------------------------------------------------------------------

/** Mirrors the backend's AgentRunStatus enum. */
export type AgentRunStatusValue =
	| "SUBMITTED"
	| "RUNNING"
	| "INPUT_REQUIRED"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

/**
 * A paused tool call awaiting a human decision, persisted as an
 * AGENT_RUN_ACTION row. `toolArgs` / `editedArgs` / `toolMeta` are stored as
 * JSON strings on the backend; the durable-snapshot endpoint normalizes them
 * into objects (or `null` if malformed) before they reach here.
 */
export interface PendingAgentAction {
	/** Unique id for this paused call — pass back to decideAgentRunAction. */
	actionId: string;
	/** The run this paused call belongs to. */
	runId: string;
	/** The response message the paused tool call is part of, if persisted. */
	parentMessageId: string | null;
	/** The underlying tool call id, if the model assigned one. */
	toolCallId: string | null;
	/** The tool's name, as called by the model. */
	toolName: string | null;
	/** The arguments the model originally called the tool with. */
	toolArgs: Record<string, unknown> | null;
	/** A previously-submitted edit to `toolArgs`, if any, or `null` if never edited. */
	editedArgs: Record<string, unknown> | null;
	/** The tool definition's `_meta`, if it has one. */
	toolMeta: Record<string, unknown> | null;
	/** Whether this tool has a UI to render instead of a generic argument form. */
	hasUi: boolean;
	/** Resolved UI URL for the tool's portal, if `hasUi` and one exists. */
	uiUrl: string | null;
	/** Always "PENDING" today. */
	status: string;
}

/** Durable, current state of an agent run — never inferred from stream events. */
export interface AgentRunSnapshot {
	/** The run's own id — also its jobId, the model-facing handle. */
	runId: string;
	/** The room this run's messages are written to. */
	roomId: string;
	status: AgentRunStatusValue;
	/** The persisted user message this run started from, once written. */
	inputMessageId?: string;
	/** The persisted final assistant response, once the run completes. */
	finalOutputMessageId?: string;
	/** The run's final assistant text, once it completes successfully. */
	finalText?: string;
	/** Set when status is FAILED. */
	errorMessage?: string;
	/** Non-empty only while status is INPUT_REQUIRED. */
	pendingActions: PendingAgentAction[];
}

/**
 * One item produced by a run — a model message, a reasoning summary, a tool
 * call, or a subagent. Each variant's `kind` also doubles as its discriminant
 * in AgentRunItemEvent.
 */
export type AgentRunItem =
	| {
			/** Unique within the run. */
			id: string;
			kind: "message";
			role: "assistant";
			/** Full text accumulated so far (or in full, for non-streamed items). */
			text: string;
			/** Set once persisted; absent while streaming. */
			messageId?: string;
	  }
	| {
			/** Unique within the run. */
			id: string;
			kind: "reasoning";
			/** Full reasoning summary accumulated so far. */
			summary: string;
	  }
	| {
			/** The tool call id. */
			id: string;
			kind: "tool";
			/** The tool's name, as called by the model. */
			name: string;
			/** Human-readable display name, if the backend already resolved one. Falls back to `metadata.SMSS_ORIGINAL_TOOL_NAME` or `name`. */
			title?: string;
			/** The arguments the model called it with. */
			arguments: Record<string, unknown>;
			/** The tool definition's `_meta`, if it has one. */
			metadata?: Record<string, unknown>;
			status:
				| "QUEUED"
				| "RUNNING"
				| "INPUT_REQUIRED"
				| "COMPLETED"
				| "FAILED"
				| "REJECTED"
				| "CANCELLED";
			/** Set once status is COMPLETED. */
			output?: string;
			/** Set once status is FAILED. */
			error?: string;
			/** Set once the call finishes, successfully or not. */
			durationMs?: number;
	  }
	| {
			/** Same value as childRunId. */
			id: string;
			kind: "subagent";
			/** The subagent's own run id — pass to getSubagentRuns/getAgentRun to inspect it directly. */
			childRunId: string;
			/** Set only when spawned via a named-subagent tool, not an anonymous spawn. */
			alias?: string;
			/** The subagent's own, independent room. */
			roomId: string;
			/** The workspace the subagent runs under, if spawned with one. */
			workspaceId?: string;
			status: AgentRunStatusValue;
			/** Set when status is FAILED. */
			error?: string;
			/** Set once status is COMPLETED. */
			resultPreview?: string;
	  };

/**
 * One canonical, provider-neutral stream event. `delta` (message/reasoning)
 * and `patch` (tool/subagent) are mutually exclusive on item.updated.
 */
export type AgentRunItemEvent =
	| {
			/** Event schema version — always 1 today. */
			version: 1;
			/** Unique id for this event, for client-side dedup. */
			eventId: string;
			/** Monotonic order within the run — sort by this, not arrival order. */
			sequence: number;
			/** The run this event belongs to. */
			runId: string;
			/** ISO timestamp the backend recorded this event. */
			timestamp: string;
			type: "item.started";
			/** The new item, in its initial state. */
			item: AgentRunItem;
	  }
	| {
			/** Event schema version — always 1 today. */
			version: 1;
			/** Unique id for this event, for client-side dedup. */
			eventId: string;
			/** Monotonic order within the run — sort by this, not arrival order. */
			sequence: number;
			/** The run this event belongs to. */
			runId: string;
			/** ISO timestamp the backend recorded this event. */
			timestamp: string;
			type: "item.updated";
			/** The item this update applies to. */
			itemId: string;
			/** The item's kind, so a handler can dispatch without an items-state lookup. */
			kind: AgentRunItem["kind"];
			/** Incremental text to append, for message/reasoning items. Mutually exclusive with `patch`. */
			delta?: string;
			/** Fields to merge onto the item, for tool/subagent items. Mutually exclusive with `delta`. */
			patch?: Record<string, unknown>;
	  }
	| {
			/** Event schema version — always 1 today. */
			version: 1;
			/** Unique id for this event, for client-side dedup. */
			eventId: string;
			/** Monotonic order within the run — sort by this, not arrival order. */
			sequence: number;
			/** The run this event belongs to. */
			runId: string;
			/** ISO timestamp the backend recorded this event. */
			timestamp: string;
			type: "item.completed";
			/** The item in its final state. */
			item: AgentRunItem;
	  };

/** Accumulated view of every item seen so far in a run, in start order. */
export interface AgentRunItemsState {
	/** Every item seen so far, keyed by id, with patches/deltas already merged in. */
	itemsById: Record<string, AgentRunItem>;
	/** Item ids in the order they first started, for rendering in sequence. */
	itemOrder: string[];
}

/**
 * A human decision on a paused agent tool call (RunMCPTool's HITL path).
 * Shared between decideAgentRunAction's raw signature and
 * AgentStore.decide's approve/edit resolution.
 */
export type AgentToolDecision = "approve" | "edit" | "reject" | "respond";

/**
 * A direct subagent run, as durably stored in AGENT_RUN — unlike the
 * ephemeral subagent stream items on the parent's own poll, this survives a
 * page reload (see getSubagentRuns).
 */
export interface SubagentRunSummary {
	/** The subagent's own run id. */
	runId: string;
	/** The run that spawned this subagent — null only if the row somehow lost its parent. */
	parentRunId: string | null;
	/** The subagent's own, independent room — same value as runId. */
	roomId: string;
	/** Display name of the subagent's room, if named. */
	roomName: string | null;
	/** The workspace it ran under, if spawned with one. */
	workspaceId: string | null;
	/** Model engine id it ran with. */
	modelId: string | null;
	/** Which agent harness ran it (e.g. "semoss"). */
	harnessType: string | null;
	/** Always equal to runId — the model-facing handle for this run. */
	jobId: string;
	status: AgentRunStatusValue;
	/** The prompt/task it was spawned with. */
	input: string | null;
	/** The persisted user message this run started from, once written. */
	inputMessageId: string | null;
	/** The run's final assistant text, once it completes successfully. */
	finalText: string | null;
	/** The persisted final assistant response, once the run completes. */
	finalOutputMessageId: string | null;
	/** Set when status is FAILED. */
	errorMessage: string | null;
	/** When the run row was created. */
	dateCreated: string | null;
	/** When the run actually started executing. */
	startedAt: string | null;
	/** When the run reached a terminal status. */
	completedAt: string | null;
	/** The user who owns the parent run (subagents run under the same user). */
	userId: string;
	/** Files or other artifacts the run produced, if any. */
	artifacts: unknown[];
}

/**
 * A live subscription started by {@link AgentStore.watch}.
 */
export interface AgentRunSubscription {
	/** Stop polling locally. Does not cancel the run itself. */
	stop: () => void;
	/** Current assembled items-state, for seeding a late-joining renderer. */
	getItems: () => AgentRunItemsState;
	/**
	 * Poll immediately instead of waiting out the current interval. Use after
	 * an action this client knows changed the run (e.g. deciding a paused tool
	 * call) so INPUT_REQUIRED's slower interval doesn't delay picking it up.
	 * A no-op once polling has stopped.
	 */
	pokeNow: () => void;
	/**
	 * Settles when polling ends — terminal status, stop(), signal abort, or the
	 * consecutive-failure cap — with the last snapshot observed, or null when
	 * polling never received one. Never rejects. Note this resolves when the
	 * POLL LOOP ends, not when the run does: an aborted subscription's run may
	 * still be executing on the backend.
	 */
	done: Promise<AgentRunSnapshot | null>;
}
