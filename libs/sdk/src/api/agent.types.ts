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
	actionId: string;
	runId: string;
	parentMessageId: string | null;
	toolCallId: string | null;
	toolName: string | null;
	toolArgs: Record<string, unknown> | null;
	editedArgs: Record<string, unknown> | null;
	toolMeta: Record<string, unknown> | null;
	hasUi: boolean;
	uiUrl: string | null;
	/** Always "PENDING" today. */
	status: string;
}

/** Durable, current state of an agent run — never inferred from stream events. */
export interface AgentRunSnapshot {
	runId: string;
	roomId: string;
	status: AgentRunStatusValue;
	inputMessageId?: string;
	finalOutputMessageId?: string;
	finalText?: string;
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
			id: string;
			kind: "message";
			role: "assistant";
			text: string;
			/** Set once persisted; absent while streaming. */
			messageId?: string;
	  }
	| {
			id: string;
			kind: "reasoning";
			summary: string;
	  }
	| {
			/** The tool call id. */
			id: string;
			kind: "tool";
			name: string;
			arguments: Record<string, unknown>;
			metadata?: Record<string, unknown>;
			status:
				| "QUEUED"
				| "RUNNING"
				| "INPUT_REQUIRED"
				| "COMPLETED"
				| "FAILED"
				| "REJECTED"
				| "CANCELLED";
			output?: string;
			error?: string;
			durationMs?: number;
	  }
	| {
			/** Same value as childRunId. */
			id: string;
			kind: "subagent";
			childRunId: string;
			alias?: string;
			roomId: string;
			workspaceId?: string;
			status: AgentRunStatusValue;
			error?: string;
			resultPreview?: string;
	  };

/**
 * One canonical, provider-neutral stream event. `delta` (message/reasoning)
 * and `patch` (tool/subagent) are mutually exclusive on item.updated.
 */
export type AgentRunItemEvent =
	| {
			version: 1;
			eventId: string;
			sequence: number;
			runId: string;
			timestamp: string;
			type: "item.started";
			item: AgentRunItem;
	  }
	| {
			version: 1;
			eventId: string;
			sequence: number;
			runId: string;
			timestamp: string;
			type: "item.updated";
			itemId: string;
			kind: AgentRunItem["kind"];
			delta?: string;
			patch?: Record<string, unknown>;
	  }
	| {
			version: 1;
			eventId: string;
			sequence: number;
			runId: string;
			timestamp: string;
			type: "item.completed";
			item: AgentRunItem;
	  };

/** Accumulated view of every item seen so far in a run, in start order. */
export interface AgentRunItemsState {
	itemsById: Record<string, AgentRunItem>;
	itemOrder: string[];
}

/**
 * A human decision on a paused agent tool call (RunMCPTool's HITL path).
 * Shared between decideAgentRunAction's raw signature and
 * submitAgentToolDecision's approve/edit resolution.
 */
export type AgentToolDecision = "approve" | "edit" | "reject" | "respond";

/**
 * A direct subagent run, as durably stored in AGENT_RUN — unlike the
 * ephemeral subagent stream items on the parent's own poll, this survives a
 * page reload (see getSubagentRuns).
 */
export interface SubagentRunSummary {
	runId: string;
	parentRunId: string | null;
	roomId: string;
	roomName: string | null;
	workspaceId: string | null;
	modelId: string | null;
	harnessType: string | null;
	/** Always equal to runId — the model-facing handle for this run. */
	jobId: string;
	status: AgentRunStatusValue;
	input: string | null;
	inputMessageId: string | null;
	finalText: string | null;
	finalOutputMessageId: string | null;
	errorMessage: string | null;
	dateCreated: string | null;
	startedAt: string | null;
	completedAt: string | null;
	userId: string;
	artifacts: unknown[];
}

/**
 * A live subscription started by subscribeAgentRun/submitAgentRun's
 * subscription helpers.
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
}
