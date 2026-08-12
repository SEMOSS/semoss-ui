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

export type AgentStreamItemKind = "message" | "reasoning" | "tool" | "subagent";

export interface AgentMessageItem {
	id: string;
	kind: "message";
	role: "assistant";
	text: string;
	/** Set once persisted; absent while streaming. */
	messageId?: string;
}

export interface AgentReasoningItem {
	id: string;
	kind: "reasoning";
	summary: string;
}

export type AgentToolItemStatus =
	| "QUEUED"
	| "RUNNING"
	| "INPUT_REQUIRED"
	| "COMPLETED"
	| "FAILED"
	| "REJECTED"
	| "CANCELLED";

export interface AgentToolItem {
	/** The tool call id. */
	id: string;
	kind: "tool";
	name: string;
	arguments: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	status: AgentToolItemStatus;
	output?: string;
	error?: string;
	durationMs?: number;
}

export interface AgentSubagentItem {
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
}

export type AgentRunItem =
	| AgentMessageItem
	| AgentReasoningItem
	| AgentToolItem
	| AgentSubagentItem;

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
			kind: AgentStreamItemKind;
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

export interface AgentRunPollResponse {
	run: AgentRunSnapshot;
	events: AgentRunItemEvent[];
	/** Events evicted by the backend's bounded buffer before this drain. */
	droppedEvents: number;
}

/** The async submit handle returned by submitAgentRun — not a snapshot. */
export interface AgentRunHandle {
	runId: string;
	roomId: string;
	status: AgentRunStatusValue;
}

/** Accumulated view of every item seen so far in a run, in start order. */
export interface AgentRunItemsState {
	itemsById: Record<string, AgentRunItem>;
	itemOrder: string[];
}

/** A human decision on a paused agent tool call (RunMCPTool's HITL path). */
export type AgentToolDecision = "approve" | "edit" | "reject" | "respond";

export interface AgentRunSubscriptionHandlers {
	/** Fires per new item event (deduped, in order), with the items-state already updated. */
	onEvent: (event: AgentRunItemEvent, items: AgentRunItemsState) => void;
	/** Fires on every successful poll with the run's current durable snapshot. */
	onSnapshot: (snapshot: AgentRunSnapshot) => void;
	/**
	 * Fires once per transition into INPUT_REQUIRED or a terminal status, with
	 * persisted messages included. Polling continues after INPUT_REQUIRED;
	 * stops after a terminal status.
	 */
	onReconcile: (
		snapshot: AgentRunSnapshot & { messages?: Record<string, unknown>[] },
	) => void;
	/** A transport error on one poll. Non-fatal — polling keeps retrying with backoff. */
	onError?: (error: Error) => void;
}

export interface AgentRunSubscriptionOptions {
	/** Base delay between polls in ms. Defaults to 500. */
	pollIntervalMs?: number;
	/** Multiplier on pollIntervalMs while INPUT_REQUIRED. Defaults to 3. */
	inputRequiredIntervalMultiplier?: number;
	/** Stops polling without affecting the run itself. */
	signal?: AbortSignal;
}

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
