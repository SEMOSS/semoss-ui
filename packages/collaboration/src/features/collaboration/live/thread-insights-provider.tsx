import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { InsightActions } from "@/lib/pixel";
import type { WorkspaceStep } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import {
	readThreadInsights,
	summarizeThread,
	type ThreadInsightsResult,
} from "./live-state";
import type { LiveSync } from "./live-sync";
import {
	ThreadInsightsContext,
	type ThreadInsightsRun,
} from "./thread-insights.context";
import { changedSince } from "./work-updates-provider";

const POLL_MS = 2000;
const TIMEOUT_MS = 5 * 60_000;
const FAILED = "Could not summarize this thread. Try again.";
const pause = (ms: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, ms));

/** One owner for summary runs: starts or joins them on the server, polls them, and applies what they wrote. */
export function ThreadInsightsProvider({
	actions,
	sync,
	children,
	wait = pause,
}: {
	actions: InsightActions;
	sync?: LiveSync;
	children: ReactNode;
	wait?: (ms: number) => Promise<void>;
}) {
	const { state, dispatch } = useCollaborationSession();
	const latest = useRef(state);
	latest.current = state;
	const [runs, setRuns] = useState<Record<string, ThreadInsightsRun>>({});
	const active = useRef(new Set<string>());
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const setRun = useCallback((threadId: string, run: ThreadInsightsRun) => {
		if (mounted.current)
			setRuns((current) => ({ ...current, [threadId]: run }));
	}, []);
	const summarize = useCallback(
		(threadId: string, force: boolean) => {
			if (active.current.has(threadId)) return;
			active.current.add(threadId);
			setRun(threadId, { isRunning: true, error: "" });
			// the thread's steps when the last read went out, after earlier saves landed
			let sent: WorkspaceStep[] = [];
			const read = async (start: boolean) => {
				await sync?.settled();
				sent = latest.current.workspaces[threadId]?.steps ?? [];
				return start
					? summarizeThread(actions, threadId, force)
					: readThreadInsights(actions, threadId);
			};
			void (async (): Promise<ThreadInsightsResult | null> => {
				let result = await read(true);
				const deadline = Date.now() + TIMEOUT_MS;
				while (result.status === "running") {
					if (Date.now() > deadline)
						throw new Error(
							"Summarizing is taking too long. Try again in a moment.",
						);
					await wait(POLL_MS);
					if (!mounted.current) return null;
					result = await read(false);
				}
				return result;
			})()
				.then(async (result) => {
					if (!result || !mounted.current) return;
					await sync?.settled();
					const localId = sync?.localId ?? ((id: string) => id);
					const known = new Set(sent.map((step) => step.id));
					const steps =
						latest.current.workspaces[threadId]?.steps ?? [];
					const current = new Set(steps.map((step) => step.id));
					dispatch({
						type: "thread.insights",
						threadId,
						summary: result.summary,
						summaryAt: result.summaryAt,
						summaryCurrent: result.summaryCurrent,
						steps: result.steps
							.map((step) => ({
								...step,
								id: localId(step.id),
								...(step.itemId
									? { itemId: localId(step.itemId) }
									: {}),
							}))
							// one deleted here since the read went out does not come back from it
							.filter(
								(step) =>
									!known.has(step.id) || current.has(step.id),
							),
						keepStepIds: changedSince(sent, steps),
					});
					setRun(threadId, {
						isRunning: false,
						error:
							result.status === "failed"
								? result.error || FAILED
								: "",
					});
				})
				.catch((cause: unknown) =>
					setRun(threadId, {
						isRunning: false,
						error: cause instanceof Error ? cause.message : FAILED,
					}),
				)
				.finally(() => active.current.delete(threadId));
		},
		[actions, dispatch, setRun, sync, wait],
	);
	return (
		<ThreadInsightsContext.Provider value={{ runs, summarize }}>
			{children}
		</ThreadInsightsContext.Provider>
	);
}
