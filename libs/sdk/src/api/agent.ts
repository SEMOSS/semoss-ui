import { Env } from "../env";
import { post } from "../utility";
import { runPixel } from "./base";

/**
 * Durable status of an agent run — mirrors the backend's AgentRunStatus enum
 * (Semoss: prerna.reactor.agent.run.AgentRunStatus).
 */
export type AgentRunStatusValue =
	| "SUBMITTED"
	| "RUNNING"
	| "INPUT_REQUIRED"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

/**
 * A paused tool call awaiting a human decision (approve/edit/reject/respond),
 * persisted as an AGENT_RUN_ACTION row. `toolArgs` / `editedArgs` / `toolMeta`
 * are stored as JSON strings on the backend; the durable-snapshot endpoint
 * normalizes them into objects (or `null` if malformed) before returning them
 * here — never JSON strings on this side.
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
	/** Always "PENDING" today — only pending actions are ever returned. */
	status: string;
}

/**
 * Durable, current state of an agent run — the source of truth for status,
 * pending actions, and final ids. Returned alongside every poll and by
 * getAgentRun; never inferred from transient stream events.
 */
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
	/** Attached once the harness has the persisted response; absent while streaming. */
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
	/** Present once COMPLETED; bounded/truncated by the backend. */
	output?: string;
	/** Present once FAILED; bounded/truncated by the backend. */
	error?: string;
	durationMs?: number;
}

export interface AgentSubagentItem {
	/** The child run id (same value as childRunId). */
	id: string;
	kind: "subagent";
	childRunId: string;
	alias?: string;
	roomId: string;
	workspaceId?: string;
	status: AgentRunStatusValue;
	error?: string;
	/** Present on some completions; bounded/truncated by the backend. */
	resultPreview?: string;
}

export type AgentRunItem =
	| AgentMessageItem
	| AgentReasoningItem
	| AgentToolItem
	| AgentSubagentItem;

/**
 * One canonical, provider-neutral stream event. `delta` (message/reasoning)
 * and `patch` (tool/subagent) are mutually exclusive on item.updated — the
 * backend never sends both on the same event.
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

/**
 * Submit a durable agent run without waiting for it to finish (RunAgent with
 * wait=false). The run continues on a backend worker; poll its progress with
 * pollAgentRun(handle.runId) or subscribeAgentRun.
 */
export const submitAgentRun = async (
	params: {
		roomId: string;
		command: string;
		engine?: string;
		harnessType?: string;
		workspaceId?: string;
		maxTurns?: number;
		maxReflections?: number;
		images?: string[];
		urls?: string[];
	},
	insightId?: string,
): Promise<AgentRunHandle> => {
	const {
		roomId,
		command,
		engine,
		harnessType,
		workspaceId,
		maxTurns,
		maxReflections,
		images,
		urls,
	} = params;

	const clauses = [
		`roomId=["${roomId}"]`,
		`command=["<encode>${command}</encode>"]`,
		engine ? `engine=["${engine}"]` : null,
		harnessType ? `harnessType="${harnessType}"` : null,
		workspaceId ? `workspaceId=["${workspaceId}"]` : null,
		maxTurns !== undefined ? `maxTurns=${maxTurns}` : null,
		maxReflections !== undefined
			? `maxReflections=${maxReflections}`
			: null,
		images && images.length > 0 ? `image=${JSON.stringify(images)}` : null,
		urls && urls.length > 0 ? `url=${JSON.stringify(urls)}` : null,
		"wait=false",
	].filter((clause): clause is string => clause !== null);

	const response = await runPixel<[AgentRunHandle]>(
		`RunAgent(${clauses.join(",\n")});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	return response.pixelReturn[0].output as AgentRunHandle;
};

/**
 * Drain buffered stream events for a run and get its current durable
 * snapshot in one call. Authenticated and scoped to the run's owner by the
 * backend — a caller polling someone else's runId gets treated as unknown.
 * Each call removes the drained events; nothing here replays past events, so
 * a caller that stops polling and comes back later only sees what's left in
 * the (bounded) buffer plus the current snapshot.
 */
export const pollAgentRun = async (
	runId: string,
): Promise<AgentRunPollResponse> => {
	if (!runId) {
		throw new Error("Missing runId");
	}

	const response = await post<AgentRunPollResponse>(
		`${Env.MODULE}/api/engine/agentRunStreaming`,
		{ runId },
	);

	return response.data;
};

/**
 * Get the durable AgentRun snapshot directly (GetAgentRun), optionally
 * including this run's persisted room messages. Used for reconciliation at
 * pause/terminal boundaries and reconnects — not for live progress, which is
 * pollAgentRun's job.
 */
export const getAgentRun = async <
	M extends Record<string, unknown> = Record<string, unknown>,
>(
	runId: string,
	options: { includeMessages?: boolean } = {},
	insightId?: string,
): Promise<AgentRunSnapshot & { messages?: M[] }> => {
	if (!runId) {
		throw new Error("Missing runId");
	}

	const clauses = [
		`runId=["${runId}"]`,
		options.includeMessages ? "includeMessages=true" : null,
	].filter((clause): clause is string => clause !== null);

	const response = await runPixel<[AgentRunSnapshot & { messages?: M[] }]>(
		`GetAgentRun(${clauses.join(",\n")});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	return response.pixelReturn[0].output;
};

/** A human decision on a paused agent tool call (RunMCPTool's HITL path). */
export type AgentToolDecision = "approve" | "edit" | "reject" | "respond";

/**
 * Decide a pending agent tool call. The AGENT_RUN_ACTION row (found via
 * actionId) is the source of truth for the tool name/arguments — paramValues
 * is only needed for "edit" (the user's replacement arguments) or "respond".
 * Resumes the run once every pending action for it has been decided.
 */
export const decideAgentRunAction = async (
	params: {
		actionId: string;
		decision: AgentToolDecision;
		paramValues?: Record<string, unknown>;
	},
	insightId?: string,
): Promise<string> => {
	const { actionId, decision, paramValues } = params;

	const clauses = [
		`actionId=["${actionId}"]`,
		`decision=["${decision}"]`,
		paramValues ? `paramValues=${JSON.stringify(paramValues)}` : null,
	].filter((clause): clause is string => clause !== null);

	const response = await runPixel<[string]>(
		`RunMCPTool(${clauses.join(",\n")});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	return response.pixelReturn[0].output;
};

/**
 * Accumulated view of every item seen so far in a run, in the order each
 * first started. The generic, provider-neutral projection of the raw event
 * stream — the piece every consumer would otherwise have to reimplement
 * itself (see applyAgentRunItemEvent).
 */
export interface AgentRunItemsState {
	itemsById: Record<string, AgentRunItem>;
	itemOrder: string[];
}

export const createAgentRunItemsState = (): AgentRunItemsState => ({
	itemsById: {},
	itemOrder: [],
});

/**
 * Apply one item event onto an items-state accumulator, returning a new
 * state (the input is never mutated). Pure and idempotent — safe to call
 * once per event already deduped/ordered by subscribeAgentRun (which does
 * this internally; call it yourself only if consuming pollAgentRun directly).
 *
 * Centralizes protocol-level knowledge every consumer would otherwise have
 * to reimplement: message/reasoning text arrives either as incremental
 * deltas (item.started with empty text, then item.updated.delta chunks) or
 * all at once (item.started already carries the full text, no
 * item.updated — e.g. a resume path where nothing streamed incrementally);
 * tool/subagent item.updated always carries a patch merged onto the last
 * known item, never a delta.
 */
export const applyAgentRunItemEvent = (
	state: AgentRunItemsState,
	event: AgentRunItemEvent,
): AgentRunItemsState => {
	if (event.type === "item.started") {
		const { item } = event;
		if (state.itemsById[item.id]) {
			return state;
		}
		return {
			itemsById: { ...state.itemsById, [item.id]: item },
			itemOrder: [...state.itemOrder, item.id],
		};
	}

	if (event.type === "item.updated") {
		const existing = state.itemsById[event.itemId];
		if (!existing) {
			return state;
		}
		let updated: AgentRunItem = existing;
		if (event.delta !== undefined) {
			if (existing.kind === "message") {
				updated = { ...existing, text: existing.text + event.delta };
			} else if (existing.kind === "reasoning") {
				updated = {
					...existing,
					summary: existing.summary + event.delta,
				};
			}
		} else if (event.patch) {
			updated = { ...existing, ...event.patch } as AgentRunItem;
		}
		return {
			...state,
			itemsById: { ...state.itemsById, [event.itemId]: updated },
		};
	}

	// item.completed
	const { item } = event;
	const alreadyKnown = Boolean(state.itemsById[item.id]);
	return {
		itemsById: { ...state.itemsById, [item.id]: item },
		itemOrder: alreadyKnown
			? state.itemOrder
			: [...state.itemOrder, item.id],
	};
};

const TERMINAL_RUN_STATUSES: ReadonlySet<AgentRunStatusValue> = new Set([
	"COMPLETED",
	"FAILED",
	"CANCELLED",
]);

export interface AgentRunSubscriptionHandlers {
	/**
	 * Fires once per new item event, deduped by eventId and delivered in
	 * sequence order, alongside the items-state freshly updated with it — so
	 * callers get both the raw event (e.g. for delta-based animation) and the
	 * already-assembled current item without running the reducer themselves.
	 */
	onEvent: (event: AgentRunItemEvent, items: AgentRunItemsState) => void;
	/** Fires on every successful poll with the run's current durable snapshot. */
	onSnapshot: (snapshot: AgentRunSnapshot) => void;
	/**
	 * Fires once per transition into INPUT_REQUIRED or into a terminal status,
	 * with persisted room messages included — the point to reconcile a live
	 * projection against durable truth. Polling continues after INPUT_REQUIRED
	 * (the run can resume); it stops after a terminal status.
	 */
	onReconcile: (
		snapshot: AgentRunSnapshot & { messages?: Record<string, unknown>[] },
	) => void;
	/** A transport error on one poll attempt. Non-fatal — polling keeps retrying with backoff. */
	onError?: (error: Error) => void;
}

export interface AgentRunSubscriptionOptions {
	/** Base delay between polls in ms. Defaults to 500. */
	pollIntervalMs?: number;
	/** Multiplier applied to pollIntervalMs while INPUT_REQUIRED, since nothing is actively happening. Defaults to 3. */
	inputRequiredIntervalMultiplier?: number;
	/** Stops polling without affecting the run itself. */
	signal?: AbortSignal;
}

export interface AgentRunSubscription {
	/** Stop polling/watching this run locally. Does not cancel the run itself. */
	stop: () => void;
	/**
	 * The current assembled items-state, for seeding a late-joining renderer
	 * without waiting for the next event (e.g. a UI element mounted mid-run).
	 */
	getItems: () => AgentRunItemsState;
}

/**
 * Poll an agent run to completion, delivering canonical item events and
 * durable snapshots as they arrive. Owns dedup (by eventId), ordering (by
 * sequence), reconciliation timing, and retry/backoff — callers only react to
 * already-clean data.
 *
 * A transport failure on one poll never concludes the run failed; it's
 * retried with capped exponential backoff until the caller calls stop() (or
 * aborts the signal) or the run itself reaches a terminal status.
 */
export const subscribeAgentRun = (
	runId: string,
	handlers: AgentRunSubscriptionHandlers,
	options: AgentRunSubscriptionOptions = {},
): AgentRunSubscription => {
	const {
		pollIntervalMs = 500,
		inputRequiredIntervalMultiplier = 3,
		signal,
	} = options;
	const { onEvent, onSnapshot, onReconcile, onError } = handlers;

	let stopped = false;
	let reconciledStatus: AgentRunStatusValue | null = null;
	const seenEventIds = new Set<string>();
	let consecutiveFailures = 0;
	let itemsState = createAgentRunItemsState();

	const stop = () => {
		if (stopped) {
			return;
		}
		stopped = true;
		signal?.removeEventListener("abort", stop);
	};

	signal?.addEventListener("abort", stop);

	const reconcile = async (status: AgentRunStatusValue) => {
		if (reconciledStatus === status) {
			return;
		}
		reconciledStatus = status;
		try {
			const full = await getAgentRun(runId, { includeMessages: true });
			onReconcile(full);
		} catch (e) {
			onError?.(e as Error);
		}
	};

	const loop = async () => {
		while (!stopped) {
			let waitMs = pollIntervalMs;
			try {
				const { run, events } = await pollAgentRun(runId);
				consecutiveFailures = 0;

				const sorted = [...events].sort(
					(a, b) => a.sequence - b.sequence,
				);
				for (const event of sorted) {
					if (seenEventIds.has(event.eventId)) {
						continue;
					}
					seenEventIds.add(event.eventId);
					itemsState = applyAgentRunItemEvent(itemsState, event);
					onEvent(event, itemsState);
				}

				onSnapshot(run);

				if (run.status === "INPUT_REQUIRED") {
					await reconcile(run.status);
					waitMs = pollIntervalMs * inputRequiredIntervalMultiplier;
				} else if (TERMINAL_RUN_STATUSES.has(run.status)) {
					await reconcile(run.status);
					stop();
					break;
				} else {
					// allow a later pause to reconcile again
					reconciledStatus = null;
				}
			} catch (e) {
				consecutiveFailures++;
				onError?.(e as Error);
				waitMs = Math.min(
					pollIntervalMs * 2 ** Math.min(consecutiveFailures, 4),
					10_000,
				);
			}

			if (stopped) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, waitMs));
		}
	};

	void loop();

	return { stop, getItems: () => itemsState };
};
