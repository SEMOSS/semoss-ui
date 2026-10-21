import { useCallback, useEffect, useRef, useState } from "react";
import type { InsightActions } from "@/lib/pixel";
import { getJob, type Job, type JobKind } from "./onboarding-api";

const POLL_MS = 2000;
type JobMode = "sort" | "topics";

interface JobState {
	actions: InsightActions;
	kind: JobKind;
	jobId?: string;
	mode?: JobMode;
	job: Job | null;
	error: string | null;
	isLoading: boolean;
}

interface JobController {
	job: Job | null;
	error: string | null;
	isLoading: boolean;
	follow: (started: Job) => void;
	refresh: () => void;
}

type JobScope = Pick<JobState, "actions" | "kind" | "jobId" | "mode">;

function sameScope(left: JobScope, right: JobScope): boolean {
	return (
		left.actions === right.actions &&
		left.kind === right.kind &&
		left.jobId === right.jobId &&
		left.mode === right.mode
	);
}

/** Poll one job, or find the latest job of a kind/mode. An empty ID defers reading. */
export function useJob(
	actions: InsightActions,
	kind: JobKind,
	jobId?: string,
	mode?: JobMode,
): JobController {
	const [state, setState] = useState<JobState>({
		actions,
		kind,
		jobId,
		mode,
		job: null,
		error: null,
		isLoading: jobId !== "",
	});
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const epoch = useRef(0);
	const request = useRef(0);
	const trackedId = useRef(jobId);
	const active = useRef(false);
	const scope = useRef<JobScope>({ actions, kind, jobId, mode });
	scope.current = { actions, kind, jobId, mode };

	const poll = useCallback(async (): Promise<void> => {
		if (
			!active.current ||
			!sameScope(scope.current, { actions, kind, jobId, mode })
		)
			return;
		clearTimeout(timer.current);
		if (trackedId.current === "") return;
		const requestEpoch = epoch.current;
		const ticket = ++request.current;
		const exactId = trackedId.current;
		try {
			const next = await getJob(actions, kind, exactId, mode);
			if (requestEpoch !== epoch.current || ticket !== request.current)
				return;
			if (exactId && (next.id !== exactId || next.status === "none")) {
				throw new Error(
					"The requested background job could not be found. Retry to check its status.",
				);
			}
			if (
				next.status !== "none" &&
				((mode === "topics" && next.mode !== "topics") ||
					(mode === "sort" && next.mode === "topics"))
			) {
				throw new Error(
					"The background job does not match this setup step.",
				);
			}
			// Once found, follow this job even if a newer unrelated job starts.
			if (next.id) trackedId.current = next.id;
			setState({
				actions,
				kind,
				jobId,
				mode,
				job: next,
				error: null,
				isLoading: false,
			});
			if (next.status === "running")
				timer.current = setTimeout(() => {
					void poll();
				}, POLL_MS);
		} catch (cause: unknown) {
			if (requestEpoch !== epoch.current || ticket !== request.current)
				return;
			setState((previous) => ({
				...previous,
				actions,
				kind,
				jobId,
				mode,
				error: cause instanceof Error ? cause.message : String(cause),
				isLoading: false,
			}));
			timer.current = setTimeout(() => {
				void poll();
			}, POLL_MS * 2);
		}
	}, [actions, kind, jobId, mode]);

	useEffect(() => {
		active.current = true;
		epoch.current += 1;
		trackedId.current = jobId;
		setState({
			actions,
			kind,
			jobId,
			mode,
			job: null,
			error: null,
			isLoading: jobId !== "",
		});
		if (jobId !== "") void poll();
		return () => {
			active.current = false;
			epoch.current += 1;
			request.current += 1;
			clearTimeout(timer.current);
		};
	}, [actions, kind, jobId, mode, poll]);

	const follow = useCallback(
		(started: Job): void => {
			if (
				!active.current ||
				!sameScope(scope.current, { actions, kind, jobId, mode })
			)
				return;
			clearTimeout(timer.current);
			request.current += 1;
			if (
				!started.id ||
				started.status === "none" ||
				(mode === "topics" && started.mode !== "topics") ||
				(mode === "sort" && started.mode === "topics")
			) {
				throw new Error(
					"The started background job does not match this setup step.",
				);
			}
			trackedId.current = started.id;
			setState({
				actions,
				kind,
				jobId,
				mode,
				job: started,
				error: null,
				isLoading: false,
			});
			if (started.status === "running")
				timer.current = setTimeout(() => {
					void poll();
				}, POLL_MS);
		},
		[actions, kind, jobId, mode, poll],
	);

	const refresh = useCallback((): void => {
		void poll();
	}, [poll]);
	const current =
		state.actions === actions &&
		state.kind === kind &&
		state.jobId === jobId &&
		state.mode === mode;
	return {
		job: current ? state.job : null,
		error: current ? state.error : null,
		isLoading: current ? state.isLoading : jobId !== "",
		follow,
		refresh,
	};
}
