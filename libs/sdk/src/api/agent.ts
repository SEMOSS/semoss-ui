import { Env } from "../env";
import { post } from "../utility";
import type {
	AgentRunHandle,
	AgentRunItem,
	AgentRunItemEvent,
	AgentRunItemsState,
	AgentRunPollResponse,
	AgentRunSnapshot,
	AgentRunStatusValue,
	AgentRunSubscription,
	AgentRunSubscriptionHandlers,
	AgentRunSubscriptionOptions,
	AgentToolDecision,
} from "./agent.types";
import { runPixel } from "./base";

export type * from "./agent.types";

/**
 * Submit a durable agent run without waiting for it to finish (RunAgent with
 * wait=false). Poll progress with pollAgentRun(handle.runId) or subscribeAgentRun.
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
		`roomId=${JSON.stringify([roomId])}`,
		`command=${JSON.stringify([command])}`,
		engine ? `engine=${JSON.stringify([engine])}` : null,
		harnessType ? `harnessType=${JSON.stringify(harnessType)}` : null,
		workspaceId ? `workspaceId=${JSON.stringify([workspaceId])}` : null,
		maxTurns !== undefined ? `maxTurns=${JSON.stringify(maxTurns)}` : null,
		maxReflections !== undefined
			? `maxReflections=${JSON.stringify(maxReflections)}`
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
 * snapshot in one call. Scoped to the run's owner by the backend. Each call
 * removes the drained events — there's no replay.
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
 * Get the durable AgentRun snapshot directly (GetAgentRun), optionally with
 * this run's persisted room messages. For reconciliation, not live progress.
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
		`runId=${JSON.stringify([runId])}`,
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

/**
 * Decide a pending agent tool call. paramValues is only needed for "edit" or
 * "respond". Resumes the run once every pending action has been decided.
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
		`actionId=${JSON.stringify([actionId])}`,
		`decision=${JSON.stringify([decision])}`,
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

export const createAgentRunItemsState = (): AgentRunItemsState => ({
	itemsById: {},
	itemOrder: [],
});

/**
 * Apply one item event onto an items-state accumulator, returning a new
 * state. Pure and idempotent. Handles the two ways item text arrives:
 * incremental deltas, or all at once on item.started with no item.updated.
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

/**
 * Poll an agent run to completion, delivering item events and durable
 * snapshots as they arrive. Owns dedup, ordering, reconciliation timing, and
 * retry/backoff — a transport failure never concludes the run failed.
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
