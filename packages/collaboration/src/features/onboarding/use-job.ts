import { useCallback, useEffect, useRef, useState } from "react";
import type { InsightActions } from "@/lib/pixel";
import { getJob, type Job, type JobKind } from "./onboarding-api";

const POLL_MS = 2000;

/** The newest job of a kind, polled while it runs. */
export function useJob(actions: InsightActions, kind: JobKind) {
	const [job, setJob] = useState<Job | null>(null);
	const [error, setError] = useState<string | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const alive = useRef(true);

	const poll = useCallback(() => {
		clearTimeout(timer.current);
		getJob(actions, kind)
			.then((next) => {
				if (!alive.current) return;
				setError(null);
				setJob(next);
				if (next.status === "running")
					timer.current = setTimeout(poll, POLL_MS);
			})
			.catch((cause: unknown) => {
				if (!alive.current) return;
				setError(
					cause instanceof Error ? cause.message : String(cause),
				);
				// keep trying while a job may still be running
				timer.current = setTimeout(poll, POLL_MS * 2);
			});
	}, [actions, kind]);

	useEffect(() => {
		alive.current = true;
		poll();
		return () => {
			alive.current = false;
			clearTimeout(timer.current);
		};
	}, [poll]);

	/** Show a job just started and follow it. */
	const follow = useCallback(
		(started: Job) => {
			setJob(started);
			timer.current = setTimeout(poll, POLL_MS);
		},
		[poll],
	);

	return { job, error, follow, refresh: poll };
}
