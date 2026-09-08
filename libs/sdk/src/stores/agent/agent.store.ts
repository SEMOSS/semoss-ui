import {
	decideAgentRunAction,
	getAgentRun,
	pollAgentRun,
	runAgent,
	stopAgentRun,
} from "../../api/agent";
import type {
	AgentRunItem,
	AgentRunItemEvent,
	AgentRunItemsState,
	AgentRunSnapshot,
	AgentRunStatusValue,
	AgentRunSubscription,
	AgentToolDecision,
	PendingAgentAction,
} from "../../types";

/** Handlers passed to {@link AgentStore.watch}. */
export interface AgentWatchHandlers {
	/** Fires per new item event (deduped, in order), with the items-state already updated. */
	onEvent: (event: AgentRunItemEvent, items: AgentRunItemsState) => void;
	/** Fires on every successful poll with the run's current durable snapshot and the count of events the backend evicted before this drain (`meta.droppedEvents`) — nonzero means the feed has gaps a durable reconcile would fill. */
	onSnapshot: (
		snapshot: AgentRunSnapshot,
		meta: { droppedEvents: number },
	) => void;
	/** Fires once per transition into INPUT_REQUIRED or a terminal status, with persisted messages included. Polling continues after INPUT_REQUIRED; stops after a terminal status. */
	onReconcile: (
		snapshot: AgentRunSnapshot & { messages?: Record<string, unknown>[] },
	) => void;
	/** A transport error on one poll. Non-fatal — polling keeps retrying with backoff until the consecutive-failure cap. */
	onError?: (error: Error) => void;
}

/** Options passed to {@link AgentStore.watch}. */
export interface AgentWatchOptions {
	/** Base delay between polls in ms. Defaults to 500. */
	pollIntervalMs?: number;
	/** Multiplier on pollIntervalMs while INPUT_REQUIRED. Defaults to 3. */
	inputRequiredIntervalMultiplier?: number;
	/** Stops polling without affecting the run itself. */
	signal?: AbortSignal;
	/** Consecutive poll failures tolerated before the subscription attempts one durable reconcile and stops. Defaults to 8. */
	maxConsecutiveFailures?: number;
}

const TERMINAL_RUN_STATUSES: ReadonlySet<AgentRunStatusValue> = new Set([
	"COMPLETED",
	"FAILED",
	"CANCELLED",
]);

/**
 * @returns A fresh, empty items-state to seed a poll loop.
 *
 * Exported only for this file's own spec — not part of the public API
 * surface (not re-exported from the stores or package barrel).
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
 * Exported only for this file's own spec — not part of the public API
 * surface (not re-exported from the stores or package barrel).
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

/**
 * A single agent-harness run bound to a room, owning its own poll
 * subscription so callers never need a runId-keyed registry to poke it after
 * a tool decision — this instance IS that registry entry.
 *
 * Create a new run via {@link AgentStore.start}, or attach to one already in
 * progress (e.g. reconnecting after a page reload) via
 * `new AgentStore(roomId, insightId, runId)`.
 *
 * @see sdk-chat skill for the chat-vs-agent-harness guide.
 */
export class AgentStore {
	readonly roomId: string;
	readonly insightId: string;
	readonly runId: string;

	private _subscription: AgentRunSubscription | null = null;

	constructor(roomId: string, insightId: string, runId: string) {
		this.roomId = roomId;
		this.insightId = insightId;
		this.runId = runId;
	}

	/** True while this instance has a live poll subscription. */
	get isWatching(): boolean {
		return this._subscription !== null;
	}

	/**
	 * Settles when polling ends (terminal status, `stop()`, signal abort, or
	 * the consecutive-failure cap) with the last snapshot observed, or
	 * `null` if `watch()` was never called. Never rejects.
	 */
	get done(): Promise<AgentRunSnapshot | null> {
		return this._subscription?.done ?? Promise.resolve(null);
	}

	/**
	 * Start polling this run to completion, delivering item events and
	 * durable snapshots to `handlers` until a terminal status or `stop()`.
	 * Owns ordering, reconciliation timing, and retry/backoff — a transport
	 * failure never concludes the run failed.
	 *
	 * The underlying drain is destructive (two pollers would steal each
	 * other's events), so this is safe to call more than once on the SAME
	 * instance — later calls return the already-live subscription instead of
	 * starting a second poller — but never watch the same runId from two
	 * different `AgentStore` instances at once.
	 *
	 * @returns A handle to stop polling early, read the current items-state,
	 * force an immediate poll, or await the poll loop's end (`done`).
	 */
	watch(
		handlers: AgentWatchHandlers,
		options: AgentWatchOptions = {},
	): AgentRunSubscription {
		if (this._subscription) {
			return this._subscription;
		}

		const { runId } = this;
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
		// Set while the loop is between polls, so pokeNow can cut the current
		// wait short instead of leaving the caller stuck behind
		// INPUT_REQUIRED's slower interval for a change it already knows just
		// happened.
		let wake: (() => void) | null = null;

		const stop = () => {
			if (stopped) {
				return;
			}
			stopped = true;
			signal?.removeEventListener("abort", stop);
			wake?.();
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
				const full = await getAgentRun(runId, {
					includeMessages: true,
				});
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
						waitMs =
							pollIntervalMs * inputRequiredIntervalMultiplier;
					} else if (TERMINAL_RUN_STATUSES.has(run.status)) {
						if (deliveredEvents > 0) {
							// The backend can still be flushing final item
							// events when the status first reads terminal —
							// keep draining on a short interval until a drain
							// comes back empty.
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
						// Transport is persistently failing — fall back to
						// one durable reconcile so the caller gets the
						// truth, then stop.
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

		this._subscription = {
			stop,
			getItems: () => itemsState,
			pokeNow,
			done,
		};
		return this._subscription;
	}

	/** Stop polling locally. Does not cancel the run itself. */
	stop(): void {
		this._subscription?.stop();
	}

	/** Poll immediately instead of waiting out the current interval. */
	pokeNow(): void {
		this._subscription?.pokeNow();
	}

	/** Fetch the durable snapshot directly (GetAgentRun), bypassing the poll loop. */
	async getSnapshot(
		options: { includeMessages?: boolean } = {},
	): Promise<AgentRunSnapshot> {
		return getAgentRun(this.runId, options, this.insightId);
	}

	/** Cancel the run on the backend (StopAgentRun). */
	async cancel(): Promise<AgentRunSnapshot> {
		return stopAgentRun(this.runId, this.insightId);
	}

	/**
	 * Decide a tool call paused on this run, resolving "submit" to "approve"
	 * (paramValues omitted or unchanged from pendingAction.toolArgs) or
	 * "edit" (paramValues differs) — the two decisions the backend treats
	 * identically except for which arguments the tool actually runs with.
	 * "respond" JSON-stringifies paramValues and sends it as mcpToolResult -
	 * the string a tool like RequestUserInput never actually executes to
	 * produce, so the answer stands in for it. Then wakes this instance's own
	 * poll loop immediately — no registry lookup needed, since this instance
	 * already owns the one subscription for its run.
	 *
	 * @param pendingAction - The paused call being decided.
	 * @param decision - "submit" auto-resolves to approve/edit as above; "reject"/"respond" pass through directly.
	 * @param paramValues - The (possibly edited) arguments for "submit", or the answer to encode for "respond". Ignored for "reject".
	 */
	async decide(
		pendingAction: PendingAgentAction,
		decision: "submit" | "reject" | "respond",
		paramValues?: Record<string, unknown>,
	): Promise<string> {
		// No paramValues means "run it as called" — approve, never a
		// paramValues-less edit (which the backend cannot execute).
		const resolvedDecision: AgentToolDecision =
			decision === "reject"
				? "reject"
				: decision === "respond"
					? "respond"
					: paramValues === undefined ||
							JSON.stringify(paramValues) ===
								JSON.stringify(pendingAction.toolArgs ?? {})
						? "approve"
						: "edit";

		const result = await decideAgentRunAction(
			{
				actionId: pendingAction.actionId,
				decision: resolvedDecision,
				paramValues:
					resolvedDecision === "edit" ? paramValues : undefined,
				mcpToolResult:
					resolvedDecision === "respond"
						? JSON.stringify(paramValues ?? {})
						: undefined,
			},
			this.insightId,
		);

		this.pokeNow();
		return result;
	}

	/**
	 * Submit a new agent-harness run and return an `AgentStore` bound to it,
	 * ready to {@link watch}.
	 *
	 * @param params - See {@link runAgent}.
	 * @param insightId - The active SEMOSS insight ID.
	 */
	static async start(
		params: Parameters<typeof runAgent>[0],
		insightId: string,
	): Promise<AgentStore> {
		const { runId, roomId } = await runAgent(params, insightId);
		return new AgentStore(roomId, insightId, runId);
	}
}
