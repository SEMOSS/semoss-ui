import type { AgentRunItemEvent, AgentRunSnapshot } from "@semoss/sdk/react";
import { getAgentRun, pollAgentRun } from "@semoss/sdk/react";
import type { PlaygroundMessage } from "@/api/rooms";
import type {
	BuildMessage,
	BuildRun,
	BuildTool,
	WorkbenchRunRecord,
} from "./workbench-chat.runs";
import {
	attachDurableMessages,
	createBuildRunFromRecord,
	isTerminalAgentRunStatus,
} from "./workbench-chat.runs";

/** Delay between streaming polls while a run is in flight. */
const POLL_INTERVAL_MS = 300;
/** Poll failures tolerated in a row before the watcher gives up. */
const MAX_CONSECUTIVE_POLL_FAILURES = 8;

/** Callbacks and context the watcher needs from the owning slice. */
export interface WatchAgentRunArgs {
	/** Durable id of the run to watch. */
	runId: string;
	/** Insight the streaming and reconcile pixels execute against. */
	insightId: string;
	/** Aborts the poll loop (new room, resume, unmount). */
	signal: AbortSignal;
	/** Per-store dedup registry so each run has exactly one drain consumer. */
	activeWatchers: Map<string, Promise<AgentRunSnapshot>>;
	/** Merge one streaming poll into the run store. */
	applyBatch: (payload: {
		runId: string;
		snapshot: AgentRunSnapshot;
		events: AgentRunItemEvent[];
		droppedEvents?: number;
	}) => void;
	/** Merge a durable reconcile into the run store. */
	mergeDurable: (payload: {
		record: WorkbenchRunRecord;
		messages?: BuildMessage[];
		tools?: BuildTool[];
		reconciled: boolean;
	}) => void;
	/** Read the current projection of a run from the store. */
	getRun: (runId: string) => BuildRun | undefined;
	/** Child run ids already known (e.g. from resume) to watch immediately. */
	knownChildRunIds?: string[];
}

/**
 * Sleep for the given duration.
 *
 * @name wait
 * @param durationMs - Milliseconds to wait.
 * @return Resolves after the duration elapses.
 */
const wait = (durationMs: number) =>
	new Promise((resolve) => setTimeout(resolve, durationMs));

/**
 * Fetch the durable record (with messages) for the watched run, project its
 * activity, and merge it into the store. Failures are logged and swallowed
 * so the poll loop can decide how to proceed.
 *
 * @name reconcileDurableRun
 * @param args - Watcher context identifying the run and store callbacks.
 * @return The durable record, or null when the fetch failed or the run does
 * not exist.
 */
const reconcileDurableRun = async (
	args: WatchAgentRunArgs,
): Promise<(AgentRunSnapshot & { messages?: PlaygroundMessage[] }) | null> => {
	try {
		const record = await getAgentRun<PlaygroundMessage>(
			args.runId,
			{ includeMessages: true },
			args.insightId,
		);
		if (!record) return null;

		const projected = createBuildRunFromRecord(record);
		attachDurableMessages(
			{ [args.runId]: projected },
			record.messages ?? [],
		);
		args.mergeDurable({
			record,
			messages: projected.messages,
			tools: projected.tools,
			reconciled: true,
		});
		return record;
	} catch (error) {
		console.warn(
			`Unable to reconcile durable agent run ${args.runId}:`,
			error,
		);
		return null;
	}
};

/**
 * The watcher's poll loop: streams events into the store until the run goes
 * terminal or INPUT_REQUIRED, backing off (and reconciling durably) on poll
 * failures, spawning child watchers for discovered subagents, and finishing
 * with a durable reconcile plus a wait for every child watcher.
 *
 * @name watchInternal
 * @param args - Watcher context: run id, abort signal, dedup registry, and
 * store callbacks.
 * @return The last run snapshot observed when the loop ends.
 */
const watchInternal = async (
	args: WatchAgentRunArgs,
): Promise<AgentRunSnapshot> => {
	const childPromises = new Map<string, Promise<AgentRunSnapshot>>();
	let latestSnapshot: AgentRunSnapshot = {
		runId: args.runId,
		roomId: "",
		status: "SUBMITTED",
		pendingActions: [],
	};
	let sawTerminalWithEvents = false;
	let consecutivePollFailures = 0;

	/**
	 * Mount a watcher for a discovered subagent run unless one already
	 * exists or the child is terminal and reconciled.
	 *
	 * @name startChildWatcher
	 * @param childRunId - Durable id of the child run to watch.
	 */
	const startChildWatcher = (childRunId: string) => {
		if (!childRunId || childPromises.has(childRunId)) return;
		const child = args.getRun(childRunId);
		if (
			child &&
			isTerminalAgentRunStatus(child.status) &&
			child.reconciled
		) {
			return;
		}
		const promise = watchAgentRun({
			...args,
			runId: childRunId,
			knownChildRunIds: child?.childRunIds,
		});
		childPromises.set(childRunId, promise);
	};

	(args.knownChildRunIds ?? []).forEach(startChildWatcher);

	while (!args.signal.aborted) {
		let response: Awaited<ReturnType<typeof pollAgentRun>>;
		try {
			response = await pollAgentRun(args.runId);
			consecutivePollFailures = 0;
		} catch (error) {
			if (args.signal.aborted) break;
			consecutivePollFailures += 1;
			const durable = await reconcileDurableRun(args);
			if (
				durable &&
				(durable.status === "INPUT_REQUIRED" ||
					isTerminalAgentRunStatus(durable.status))
			) {
				latestSnapshot = {
					...latestSnapshot,
					...durable,
					roomId: durable.roomId ?? latestSnapshot.roomId,
					status: durable.status ?? latestSnapshot.status,
				};
				break;
			}
			if (consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
				throw error;
			}
			await wait(
				Math.min(
					POLL_INTERVAL_MS * 2 ** consecutivePollFailures,
					3_000,
				),
			);
			continue;
		}
		if (args.signal.aborted) break;

		latestSnapshot = response.run;
		// Drains are unordered on the wire; deltas must apply in sequence order.
		const events = [...(response.events ?? [])].sort(
			(a, b) => a.sequence - b.sequence,
		);
		args.applyBatch({
			runId: args.runId,
			snapshot: response.run,
			events,
			droppedEvents: response.droppedEvents,
		});

		for (const event of events) {
			if (
				event.type !== "item.updated" &&
				event.item.kind === "subagent"
			) {
				startChildWatcher(event.item.childRunId);
			}
		}
		args.getRun(args.runId)?.childRunIds.forEach(startChildWatcher);

		const terminal = isTerminalAgentRunStatus(response.run.status);
		if (response.run.status === "INPUT_REQUIRED") break;
		if (terminal && events.length === 0) break;
		if (terminal) sawTerminalWithEvents = true;

		await wait(sawTerminalWithEvents ? 100 : POLL_INTERVAL_MS);
	}

	if (!args.signal.aborted) {
		const durable = await reconcileDurableRun(args);
		if (durable) {
			latestSnapshot = {
				...latestSnapshot,
				...durable,
				roomId: durable.roomId ?? latestSnapshot.roomId,
				status: durable.status ?? latestSnapshot.status,
			};
		}
	}

	// The parent can become terminal before the last child stream is drained.
	// Wait for every watcher mounted from parent events before declaring the
	// tree complete.
	await Promise.allSettled(childPromises.values());
	return latestSnapshot;
};

/**
 * Poll a run's activity stream into the store until it goes terminal or
 * needs input. Deduped per run via the caller's registry so a run discovered
 * through both resume and a parent's live stream drains exactly once.
 *
 * @name watchAgentRun
 * @param args - Watcher context: run id, insight, abort signal, dedup
 * registry, store callbacks, and any already-known child run ids.
 * @return The last run snapshot observed; the shared promise when a watcher
 * for the run is already registered.
 */
export const watchAgentRun = (
	args: WatchAgentRunArgs,
): Promise<AgentRunSnapshot> => {
	const existing = args.activeWatchers.get(args.runId);
	if (existing) return existing;

	const watcher = watchInternal(args).finally(() => {
		args.activeWatchers.delete(args.runId);
	});
	args.activeWatchers.set(args.runId, watcher);
	return watcher;
};
