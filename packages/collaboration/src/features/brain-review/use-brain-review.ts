import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { loadLiveState } from "@/features/collaboration/live/live-state";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useJob } from "@/features/onboarding/use-job";
import {
	answerReview,
	type ReviewAnswer,
	type ReviewDecisionPage,
	type ReviewOverview,
	type ReviewQuestion,
	readReviewDecisions,
	readReviewOverview,
	requestFilingCorrection,
	startBrainOptimization,
	undoReviewDecision,
} from "./brain-review-api";

const message = (error: unknown): string =>
	error instanceof Error
		? error.message
		: "Review is unavailable. Try again.";
export interface BrainReviewController {
	overview: ReviewOverview | null;
	decisions: ReviewDecisionPage;
	isLoading: boolean;
	pendingId: string | null;
	error: string;
	job: ReturnType<typeof useJob>["job"];
	jobError: string | null;
	refresh: () => Promise<void>;
	optimize: () => Promise<void>;
	answer: (
		id: string,
		action: ReviewAnswer,
		topicId?: string,
	) => Promise<boolean>;
	undo: (id: string) => Promise<boolean>;
	requestCorrection: (threadId: string) => Promise<boolean>;
	moreQuestions: () => Promise<void>;
	moreDecisions: () => Promise<void>;
}

/** Owns server reads, exact-job polling and serialized answers; failed refreshes never retry a mutation. */
export function useBrainReview(): BrainReviewController {
	const { actions } = useInsight();
	const { state, dispatch } = useCollaborationSession();
	const updates = useWorkUpdates();
	const settled = updates?.settled;
	const refreshWork = updates?.refresh;
	const latest = useRef(state);
	latest.current = state;
	const epoch = useRef(0);
	const locked = useRef(false);
	const [overview, setOverview] = useState<ReviewOverview | null>(null);
	const [decisions, setDecisions] = useState<ReviewDecisionPage>({
		items: [],
		total: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const job = useJob(actions, "optimize", "");
	const follow = job.follow;
	const refresh = useCallback(async (): Promise<void> => {
		const token = epoch.current;
		setIsLoading(true);
		setError("");
		try {
			const [next, recent] = await Promise.all([
				readReviewOverview(actions),
				readReviewDecisions(actions),
			]);
			if (token !== epoch.current) return;
			setOverview(next);
			setDecisions(recent);
			if (next.job) follow(next.job);
		} catch (cause) {
			if (token === epoch.current) setError(message(cause));
		} finally {
			if (token === epoch.current) setIsLoading(false);
		}
	}, [actions, follow]);
	useEffect(() => {
		locked.current = false;
		setPendingId(null);
		setOverview(null);
		setDecisions({ items: [], total: 0 });
		void refresh();
		return () => {
			++epoch.current;
		};
	}, [refresh]);
	const reloadRecords = useCallback(
		async (removedTopicIds: string[] = []): Promise<void> => {
			await settled?.();
			const token = epoch.current;
			const before = latest.current;
			const next = await loadLiveState(actions);
			if (token === epoch.current) {
				dispatch({
					type: "review.refresh",
					before,
					next,
					removedTopicIds,
				});
				refreshWork?.();
			}
		},
		[actions, settled, dispatch, refreshWork],
	);
	const finished = useRef("");
	useEffect(() => {
		const current = job.job;
		if (
			!current ||
			current.status !== "done" ||
			finished.current === current.id
		)
			return;
		finished.current = current.id;
		void refresh()
			.then(() => reloadRecords())
			.catch((cause: unknown) =>
				setError(
					`Optimization finished, but refreshing Brain failed: ${message(cause)}`,
				),
			);
	}, [job.job, refresh, reloadRecords]);
	const optimize = async (): Promise<void> => {
		if (locked.current || job.job?.status === "running") return;
		locked.current = true;
		setPendingId("optimize");
		setError("");
		const token = epoch.current;
		try {
			await settled?.();
			if (token !== epoch.current) return;
			const next = await startBrainOptimization(actions);
			if (token === epoch.current) follow(next);
		} catch (cause) {
			if (token === epoch.current) setError(message(cause));
		} finally {
			if (token === epoch.current) {
				locked.current = false;
				setPendingId(null);
			}
		}
	};
	const mutate = async (
		id: string,
		work: () => Promise<ReviewQuestion>,
		undo: boolean,
	): Promise<boolean> => {
		if (locked.current) return false;
		locked.current = true;
		setPendingId(id);
		setError("");
		const token = epoch.current;
		let saved = false;
		try {
			await settled?.();
			if (token !== epoch.current) return false;
			const result = await work();
			saved = true;
			if (token !== epoch.current) return false;
			// Remove an acknowledged answer immediately; a refresh failure cannot leave an actionable stale card.
			if (!undo && result.status !== "open")
				setOverview((current) =>
					current
						? {
								...current,
								pending: {
									items: current.pending.items.filter(
										(row) => row.id !== id,
									),
									total: Math.max(
										0,
										current.pending.total - 1,
									),
								},
							}
						: current,
				);
			else if (undo)
				setDecisions((current) => ({
					items: current.items.filter((row) => row.id !== id),
					total: Math.max(0, current.total - 1),
				}));
			await refresh();
			await reloadRecords(result.removedTopicIds);
			return true;
		} catch (cause) {
			if (token === epoch.current)
				setError(
					`${saved ? "Your change was saved, but refreshing Brain failed." : "Could not confirm the change. Refresh Review before trying again."} ${message(cause)}`,
				);
			return saved;
		} finally {
			if (token === epoch.current) {
				locked.current = false;
				setPendingId(null);
			}
		}
	};
	const moreQuestions = async (): Promise<void> => {
		if (!overview || locked.current) return;
		locked.current = true;
		setPendingId("questions");
		setError("");
		const token = epoch.current;
		try {
			const next = await readReviewOverview(
				actions,
				overview.pending.items.length,
			);
			if (token === epoch.current)
				setOverview((current) =>
					current
						? {
								...next,
								pending: {
									total: next.pending.total,
									items: [
										...new Map(
											[
												...current.pending.items,
												...next.pending.items,
											].map((row) => [row.id, row]),
										).values(),
									],
								},
							}
						: next,
				);
		} catch (cause) {
			if (token === epoch.current) setError(message(cause));
		} finally {
			if (token === epoch.current) {
				locked.current = false;
				setPendingId(null);
			}
		}
	};
	const moreDecisions = async (): Promise<void> => {
		if (locked.current) return;
		locked.current = true;
		setPendingId("decisions");
		setError("");
		const token = epoch.current;
		try {
			const next = await readReviewDecisions(
				actions,
				decisions.items.length,
			);
			if (token === epoch.current)
				setDecisions((current) => ({
					total: next.total,
					items: [
						...new Map(
							[...current.items, ...next.items].map((row) => [
								row.id,
								row,
							]),
						).values(),
					],
				}));
		} catch (cause) {
			if (token === epoch.current) setError(message(cause));
		} finally {
			if (token === epoch.current) {
				locked.current = false;
				setPendingId(null);
			}
		}
	};
	return {
		requestCorrection: (threadId) =>
			mutate(
				"correction",
				() => requestFilingCorrection(actions, threadId),
				false,
			),
		overview,
		decisions,
		isLoading,
		pendingId,
		error,
		job: job.job,
		jobError: job.error,
		refresh,
		optimize,
		answer: (id, action, topicId) =>
			mutate(id, () => answerReview(actions, id, action, topicId), false),
		undo: (id) => mutate(id, () => undoReviewDecision(actions, id), true),
		moreQuestions,
		moreDecisions,
	};
}
