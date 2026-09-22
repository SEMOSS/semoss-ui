import { useCallback, useEffect, useRef, useState } from "react";
import type {
	AgentRunItemEvent,
	AgentRunItemsState,
	AgentRunProgress,
	AgentRunSnapshot,
	AgentRunStatusValue,
	PendingAgentAction,
	RoomStore,
} from "@semoss/sdk";
import { AgentStore } from "@semoss/sdk";
import type { ConversationPartStates } from "@/features/messages/types/message";
import type { ComposerSubmission } from "@/features/rooms/types/room";
import { applyRunItemPhase } from "../utils/run-stream-state";
import { uploadRoomFiles } from "./upload-room-files";

const TERMINAL: AgentRunStatusValue[] = ["COMPLETED", "FAILED", "CANCELLED"];

/** True once a run has settled and will produce no further events. */
function isTerminalStatus(status: AgentRunStatusValue | null) {
	return status !== null && TERMINAL.includes(status);
}

const EMPTY_ITEMS: AgentRunItemsState = { itemsById: {}, itemOrder: [] };

/** Everything {@link useAgentRun} needs to submit and follow a run. */
export interface UseAgentRunOptions {
	/** The active insight. */
	insightId: string;
	/** Room the run's messages are written to. */
	roomId: string;
	/** Fixed agent whose tools and configuration every run uses. */
	agentId: string;
	/** The store backing `roomId`; runs cannot start until this is ready. */
	room: RoomStore | null;
	/** Engine (model) id; omit to use the room's configured model. */
	engine?: string;
	/**
	 * Called once the run reaches a terminal status. Receives the room the run
	 * belonged to so the caller can ignore a run that finished after the user
	 * moved on.
	 */
	onSettled?: (snapshot: AgentRunSnapshot, roomId: string) => void;
}

/**
 * Drive one agent run per user input.
 *
 * Every input goes through `RunAgent`: the run is submitted non-blocking and
 * polled to completion, surfacing typed item events (message / reasoning / tool
 * / subagent) as they arrive.
 *
 * The hook is bound to one room and resets itself when `roomId` changes, because
 * react-router keeps the room page mounted across `:roomId`.
 *
 * @returns the live run's `items` and `status`, any `pendingActions` awaiting a
 * decision, `runError` (the run failed server-side) and `transportError` (the
 * client could not reach the server) kept separate, `isSubmitting` /
 * `isRunning`, and the `send` / `cancel` / `decide` / `reattach` / `reset`
 * operations.
 *
 * Runs are started through `AgentStore.start` so uploaded media, the fixed
 * agent, persisted harness, and selected model are forwarded together.
 */
export function useAgentRun(options: UseAgentRunOptions) {
	const { insightId, roomId, agentId, room, engine, onSettled } = options;

	const [items, setItems] = useState<AgentRunItemsState>(EMPTY_ITEMS);
	const [itemPhases, setItemPhases] = useState<ConversationPartStates>({});
	const [status, setStatus] = useState<AgentRunStatusValue | null>(null);
	const [progress, setProgress] = useState<AgentRunProgress | null>(null);
	const [hasStreamGap, setHasStreamGap] = useState(false);
	const [pendingActions, setPendingActions] = useState<PendingAgentAction[]>(
		[],
	);
	const [transportError, setTransportError] = useState<Error | null>(null);
	/** The run itself failed server-side — distinct from a poll blip. */
	const [runError, setRunError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);

	const storeRef = useRef<AgentStore | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const isReconcilingGapRef = useRef(false);
	/** Synchronous latch: state set during render is not a re-entry guard. */
	const submittingRef = useRef(false);
	/** True from submit until the run reaches a terminal status. */
	const activeRef = useRef(false);
	/** Set when the user hits Stop before the store exists. */
	const cancelRequestedRef = useRef(false);
	/** Synchronous duplicate-cancel guard. */
	const cancellingRef = useRef(false);
	/** The room the hook is currently bound to, readable from callbacks. */
	const roomRef = useRef(roomId);
	// Read inside the watch callbacks so a changing handler never forces a rewatch.
	const onSettledRef = useRef(onSettled);
	onSettledRef.current = onSettled;

	/** Stop polling locally. Does not cancel the run, which continues server-side. */
	const detach = useCallback(() => {
		abortRef.current?.abort();
		storeRef.current?.stop();
		abortRef.current = null;
		storeRef.current = null;
	}, []);

	// React-router keeps this component mounted across :roomId changes, so reset
	// the previous room's observer and state after the new room commits.
	useEffect(() => {
		roomRef.current = roomId;
		detach();
		submittingRef.current = false;
		activeRef.current = false;
		cancelRequestedRef.current = false;
		cancellingRef.current = false;
		isReconcilingGapRef.current = false;
		setItems(EMPTY_ITEMS);
		setItemPhases({});
		setStatus(null);
		setProgress(null);
		setHasStreamGap(false);
		setPendingActions([]);
		setTransportError(null);
		setRunError(null);
		setIsSubmitting(false);
		setIsCancelling(false);
	}, [detach, roomId]);

	// Tear the subscription down after the room change has committed.
	useEffect(() => {
		return () => detach();
	}, [detach]);

	/**
	 * Attach the poll loop to a store. The SDK's drain is destructive, so exactly
	 * one subscription may exist per run - any previous watch is dropped first.
	 * Every callback is scoped to the room the run was started for, so a late
	 * poll cannot write into whatever room the user is looking at now.
	 */
	const watchStore = useCallback(
		(store: AgentStore, watchRoomId: string) => {
			detach();
			storeRef.current = store;

			const controller = new AbortController();
			abortRef.current = controller;

			const isCurrent = () => roomRef.current === watchRoomId;
			const applySnapshot = (snapshot: AgentRunSnapshot) => {
				if (!isCurrent()) return;
				setStatus(snapshot.status);
				if (TERMINAL.includes(snapshot.status)) {
					cancellingRef.current = false;
					setIsCancelling(false);
				}
				setProgress(snapshot.progress ?? null);
				setPendingActions(
					snapshot.status === "INPUT_REQUIRED"
						? (snapshot.pendingActions ?? [])
						: [],
				);
			};

			const captureProgress = (
				event: AgentRunItemEvent,
				nextItems: AgentRunItemsState,
			) => {
				const itemId =
					event.type === "item.updated"
						? event.itemId
						: event.item.id;
				const item = nextItems.itemsById[itemId];
				if (item?.kind === "progress") setProgress(item);
			};

			store.watch(
				{
					onEvent: (event, nextItems) => {
						if (!isCurrent()) return;
						setItems(nextItems);
						setItemPhases((current) =>
							applyRunItemPhase(current, event),
						);
						captureProgress(event, nextItems);
					},
					onSnapshot: (snapshot, meta) => {
						if (!isCurrent()) return;
						applySnapshot(snapshot);
						// This poll succeeded, so any earlier blip has recovered.
						setTransportError(null);

						if (
							meta.droppedEvents > 0 &&
							!isReconcilingGapRef.current
						) {
							setHasStreamGap(true);
							isReconcilingGapRef.current = true;
							void store
								.getSnapshot({ includeMessages: true })
								.then((durableSnapshot) => {
									applySnapshot(durableSnapshot);
									if (isCurrent()) setHasStreamGap(false);
								})
								.catch((error: unknown) => {
									if (isCurrent()) {
										setTransportError(
											error instanceof Error
												? error
												: new Error(
														"Could not reconcile the live run.",
													),
										);
									}
								})
								.finally(() => {
									isReconcilingGapRef.current = false;
								});
						}
					},
					onReconcile: (snapshot) => {
						if (!isCurrent()) return;
						if (TERMINAL.includes(snapshot.status)) {
							activeRef.current = false;
						}
						applySnapshot(snapshot);
						if (snapshot.status === "FAILED") {
							setRunError(
								snapshot.errorMessage ??
									"The agent stopped without finishing.",
							);
						}
						if (TERMINAL.includes(snapshot.status)) {
							onSettledRef.current?.(snapshot, watchRoomId);
						}
					},
					// A poll failure is a transport blip the SDK retries with backoff. It
					// is not a failed run, and must not be rendered as one.
					onError: (error) => {
						if (isCurrent()) setTransportError(error);
					},
				},
				{ signal: controller.signal },
			);

			// The user pressed Stop while the run was still being submitted.
			if (cancelRequestedRef.current) {
				cancelRequestedRef.current = false;
				void store.cancel().catch((error: unknown) => {
					if (!isCurrent()) return;
					cancellingRef.current = false;
					setIsCancelling(false);
					setTransportError(
						error instanceof Error
							? error
							: new Error(String(error)),
					);
				});
			}
		},
		[detach],
	);

	/** Upload and submit one user message as a new agent run. */
	const send = useCallback(
		async ({ text, files }: ComposerSubmission) => {
			const trimmed = text.trim();
			// Both latches are refs: a second Enter can arrive before React commits.
			if (!trimmed || !room || submittingRef.current || activeRef.current)
				return;

			const submitRoomId = roomId;
			submittingRef.current = true;
			activeRef.current = true;
			cancelRequestedRef.current = false;

			// Drop the settled run's subscription now, so cancel()/decide() can never
			// address it while this one is being submitted.
			detach();

			setIsSubmitting(true);
			setTransportError(null);
			setRunError(null);
			setPendingActions([]);
			setItems(EMPTY_ITEMS);
			setItemPhases({});
			setProgress(null);
			setHasStreamGap(false);
			setStatus("SUBMITTED");

			try {
				const uploaded = await uploadRoomFiles(insightId, files);
				const store = await AgentStore.start(
					{
						roomId: submitRoomId,
						command: trimmed,
						engine: engine || room.options.modelId || undefined,
						harnessType: room.options.harnessType,
						agentId,
						media: uploaded.map((file) => file.fileLocation),
					},
					insightId,
				);

				// The user navigated away while RunAgent was in flight.
				if (roomRef.current !== submitRoomId) {
					store.stop();
					return;
				}
				watchStore(store, submitRoomId);
			} catch (error) {
				activeRef.current = false;
				cancelRequestedRef.current = false;
				cancellingRef.current = false;
				setIsCancelling(false);
				if (roomRef.current === submitRoomId) setStatus("FAILED");
				throw error;
			} finally {
				submittingRef.current = false;
				setIsSubmitting(false);
			}
		},
		[agentId, detach, engine, insightId, room, roomId, watchStore],
	);

	/** Cancel the run on the server. */
	const cancel = useCallback(async () => {
		if (cancellingRef.current) return;
		cancellingRef.current = true;
		setIsCancelling(true);
		const store = storeRef.current;
		if (!store) {
			// Submitted but not yet watched — cancel as soon as the store exists.
			if (submittingRef.current) {
				cancelRequestedRef.current = true;
				return;
			}
			cancellingRef.current = false;
			setIsCancelling(false);
			return;
		}
		try {
			const snapshot = await store.cancel();
			activeRef.current = false;
			setStatus(snapshot.status);
		} finally {
			cancellingRef.current = false;
			setIsCancelling(false);
		}
	}, []);

	/** Resolve a tool call paused for a human decision. */
	const decide = useCallback(
		async (
			action: PendingAgentAction,
			decision: "submit" | "reject" | "respond",
			paramValues?: Record<string, unknown>,
		) => {
			const store = storeRef.current;
			if (!store) return;
			await store.decide(action, decision, paramValues);
			setPendingActions((current) =>
				current.filter(
					(pending) => pending.actionId !== action.actionId,
				),
			);
		},
		[],
	);

	/**
	 * Clear the finished run's items once its messages have been reloaded from
	 * the server, so the same turn is not rendered twice.
	 */
	const reset = useCallback(() => {
		detach();
		activeRef.current = false;
		cancellingRef.current = false;
		setItems(EMPTY_ITEMS);
		setItemPhases({});
		setStatus(null);
		setProgress(null);
		setHasStreamGap(false);
		setPendingActions([]);
		setTransportError(null);
		setIsCancelling(false);
		// runError is deliberately kept: it explains a turn that produced no
		// answer, and is cleared when the next run starts or the room changes.
	}, [detach]);

	/** Rejoin a run that was already in flight, e.g. after a page reload. */
	const reattach = useCallback(
		(runId: string) => {
			if (storeRef.current?.runId === runId) return;
			activeRef.current = true;
			setItems(EMPTY_ITEMS);
			setItemPhases({});
			setStatus("SUBMITTED");
			setProgress(null);
			setHasStreamGap(false);
			setPendingActions([]);
			setTransportError(null);
			setRunError(null);
			watchStore(new AgentStore(roomId, insightId, runId), roomId);
		},
		[insightId, roomId, watchStore],
	);

	return {
		/** Every item the run has produced so far, in start order. */
		items,
		itemPhases,
		/** The run's durable status, or null when no run is in flight. */
		status,
		progress,
		hasStreamGap,
		pendingActions,
		transportError,
		runError,
		/** True only for the RunAgent round-trip, not for the whole run. */
		isSubmitting,
		isCancelling,
		/** True for the whole run, which is what should close the composer. */
		isRunning: status !== null && !isTerminalStatus(status),
		send,
		cancel,
		decide,
		reattach,
		reset,
	};
}
