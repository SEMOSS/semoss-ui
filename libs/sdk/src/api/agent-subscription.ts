import { decideAgentRunAction, getAgentRun, pollAgentRun } from "./agent";
import type {
	AgentRunItem,
	AgentRunItemEvent,
	AgentRunItemsState,
	AgentRunSnapshot,
	AgentRunStatusValue,
	AgentRunSubscription,
	AgentToolDecision,
	PendingAgentAction,
} from "./agent.types";

/**
 * Live subscriptions started by subscribeRunAgent, keyed by runId. Lets
 * submitAgentToolDecision poke a run's poll loop the instant its own decision
 * resumes the run, rather than that caller waiting out INPUT_REQUIRED's
 * slower interval for a change it already knows just happened.
 */
const activeSubscriptions = new Map<string, AgentRunSubscription>();

/**
 * @returns A fresh, empty items-state to seed subscribeRunAgent's caller or a
 * standalone reducer loop.
 */
export const createAgentRunItemsState = (): AgentRunItemsState => ({
	itemsById: {},
	itemOrder: [],
});

/**
 * Apply one item event onto an items-state accumulator, returning a new
 * state. Pure and idempotent. Handles the two ways item text arrives:
 * incremental deltas, or all at once on item.started with no item.updated.
 *
 * @param state - The accumulator to apply `event` onto.
 * @param event - The new event.
 * @returns The next items-state. Returns `state` unchanged if `event`
 * references an item not yet known (an out-of-order item.updated).
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
 *
 * The underlying drain is destructive (two pollers would steal each other's
 * events), so subscriptions are deduped per runId: when a live subscription
 * for the run already exists, that existing handle is returned and the new
 * handlers are NOT registered. Once a subscription ends (terminal status,
 * stop(), abort, or the failure cap) a fresh call creates a new one.
 *
 * @param runId - The run to subscribe to.
 * @param handlers.onEvent - Fires per new item event (deduped, in order), with the items-state already updated.
 * @param handlers.onSnapshot - Fires on every successful poll with the run's current durable snapshot and the count of events the backend evicted before this drain (`meta.droppedEvents`) — nonzero means the feed has gaps a durable reconcile would fill.
 * @param handlers.onReconcile - Fires once per transition into INPUT_REQUIRED or a terminal status, with persisted messages included. Polling continues after INPUT_REQUIRED; stops after a terminal status.
 * @param handlers.onError - A transport error on one poll. Non-fatal — polling keeps retrying with backoff until the consecutive-failure cap.
 * @param options.pollIntervalMs - Base delay between polls in ms. Defaults to 500.
 * @param options.inputRequiredIntervalMultiplier - Multiplier on pollIntervalMs while INPUT_REQUIRED. Defaults to 3.
 * @param options.signal - Stops polling without affecting the run itself.
 * @param options.maxConsecutiveFailures - Consecutive poll failures tolerated before the subscription attempts one durable reconcile and stops. Defaults to 8.
 * @returns A handle to stop polling early, read the current items-state,
 * force an immediate poll, or await the poll loop's end (`done`).
 */
export const subscribeRunAgent = (
	runId: string,
	handlers: {
		onEvent: (event: AgentRunItemEvent, items: AgentRunItemsState) => void;
		onSnapshot: (
			snapshot: AgentRunSnapshot,
			meta: { droppedEvents: number },
		) => void;
		onReconcile: (
			snapshot: AgentRunSnapshot & {
				messages?: Record<string, unknown>[];
			},
		) => void;
		onError?: (error: Error) => void;
	},
	options: {
		pollIntervalMs?: number;
		inputRequiredIntervalMultiplier?: number;
		signal?: AbortSignal;
		maxConsecutiveFailures?: number;
	} = {},
): AgentRunSubscription => {
	// The drain is destructive — never mount a second poll loop on a run that
	// already has a live one.
	const existing = activeSubscriptions.get(runId);
	if (existing) {
		return existing;
	}

	const {
		pollIntervalMs = 500,
		inputRequiredIntervalMultiplier = 3,
		signal,
		maxConsecutiveFailures = 8,
	} = options;
	const { onEvent, onSnapshot, onReconcile, onError } = handlers;

	let stopped = false;
	let lastSnapshot: AgentRunSnapshot | null = null;
	let reconciledStatus: AgentRunStatusValue | null = null;
	const seenEventIds = new Set<string>();
	let consecutiveFailures = 0;
	let itemsState = createAgentRunItemsState();
	// Set while the loop is between polls, so pokeNow can cut the current wait
	// short instead of leaving the caller stuck behind INPUT_REQUIRED's slower
	// interval for a change it already knows just happened.
	let wake: (() => void) | null = null;
	// Assigned once, right before returning — referenced here only inside
	// callbacks that run later, once it's long since been set.
	let subscription: AgentRunSubscription;

	const stop = () => {
		if (stopped) {
			return;
		}
		stopped = true;
		signal?.removeEventListener("abort", stop);
		wake?.();
		// Guard against deleting a newer subscription for the same runId that
		// superseded this one (e.g. reconnecting after this one already
		// finished) — only remove the registry entry if it's still this one.
		if (activeSubscriptions.get(runId) === subscription) {
			activeSubscriptions.delete(runId);
		}
	};

	const pokeNow = () => wake?.();

	const sleep = (ms: number) =>
		new Promise<void>((resolve) => {
			const timer = setTimeout(() => {
				wake = null;
				resolve();
			}, ms);
			wake = () => {
				clearTimeout(timer);
				wake = null;
				resolve();
			};
		});

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
				const { run, events, droppedEvents } =
					await pollAgentRun(runId);
				consecutiveFailures = 0;
				lastSnapshot = run;

				const sorted = [...events].sort(
					(a, b) => a.sequence - b.sequence,
				);
				let deliveredEvents = 0;
				for (const event of sorted) {
					if (seenEventIds.has(event.eventId)) {
						continue;
					}
					seenEventIds.add(event.eventId);
					itemsState = applyAgentRunItemEvent(itemsState, event);
					onEvent(event, itemsState);
					deliveredEvents++;
				}

				onSnapshot(run, { droppedEvents });

				if (run.status === "INPUT_REQUIRED") {
					await reconcile(run.status);
					waitMs = pollIntervalMs * inputRequiredIntervalMultiplier;
				} else if (TERMINAL_RUN_STATUSES.has(run.status)) {
					if (deliveredEvents > 0) {
						// The backend can still be flushing final item events
						// when the status first reads terminal — keep draining
						// on a short interval until a drain comes back empty.
						waitMs = Math.min(pollIntervalMs, 100);
					} else {
						await reconcile(run.status);
						stop();
						break;
					}
				} else {
					// allow a later pause to reconcile again
					reconciledStatus = null;
				}
			} catch (e) {
				consecutiveFailures++;
				onError?.(e as Error);
				if (consecutiveFailures >= maxConsecutiveFailures) {
					// Transport is persistently failing — fall back to one
					// durable reconcile so the caller gets the truth, then stop.
					try {
						const full = await getAgentRun(runId, {
							includeMessages: true,
						});
						lastSnapshot = full;
						reconciledStatus = full.status;
						onReconcile(full);
					} catch (reconcileError) {
						onError?.(reconcileError as Error);
					}
					stop();
					break;
				}
				waitMs = Math.min(
					pollIntervalMs * 2 ** Math.min(consecutiveFailures, 4),
					10_000,
				);
			}

			if (stopped) {
				break;
			}
			await sleep(waitMs);
		}
	};

	const done = loop().then(
		() => lastSnapshot,
		() => lastSnapshot,
	);

	subscription = { stop, getItems: () => itemsState, pokeNow, done };
	activeSubscriptions.set(runId, subscription);
	return subscription;
};

/**
 * Decide a tool call paused on a human decision, resolving "submit" to
 * "approve" (paramValues omitted or unchanged from pendingAction.toolArgs) or
 * "edit" (paramValues differs) — the two decisions the backend treats
 * identically except for which arguments the tool actually runs with. Then
 * pokes the run's live subscription (if any) so its poll loop notices the
 * resumed run immediately rather than on its next scheduled interval.
 *
 * @param pendingAction - The paused call being decided.
 * @param decision - "submit" auto-resolves to approve/edit as above; "reject" passes through directly.
 * @param paramValues - The (possibly edited) arguments to run the tool with. Ignored for "reject".
 * @param insightId - Insight to run the pixel against.
 * @returns The tool-result string the decision produced.
 */
export const submitAgentToolDecision = async (
	pendingAction: PendingAgentAction,
	decision: "submit" | "reject",
	paramValues?: Record<string, unknown>,
	insightId?: string,
): Promise<string> => {
	// No paramValues means "run it as called" — approve, never a
	// paramValues-less edit (which the backend cannot execute).
	const resolvedDecision: AgentToolDecision =
		decision === "reject"
			? "reject"
			: paramValues === undefined ||
					JSON.stringify(paramValues) ===
						JSON.stringify(pendingAction.toolArgs ?? {})
				? "approve"
				: "edit";

	const result = await decideAgentRunAction(
		{
			actionId: pendingAction.actionId,
			decision: resolvedDecision,
			paramValues: resolvedDecision === "edit" ? paramValues : undefined,
		},
		insightId,
	);

	// The run resumed the instant the backend applied this decision — poll
	// now rather than waiting out INPUT_REQUIRED's slower interval to notice.
	activeSubscriptions.get(pendingAction.runId)?.pokeNow();

	return result;
};
