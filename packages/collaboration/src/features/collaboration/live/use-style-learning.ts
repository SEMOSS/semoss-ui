import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { useJob } from "@/features/onboarding/use-job";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { readServerStyle, startStyleLearning } from "./style-api";

/** Learning the owner's writing style in the background, and handing its proposal to the session. */
export interface StyleLearning {
	/** True from pressing Learn until the job and the read of its proposal finish. */
	isLearning: boolean;
	/** Where the running job is, for a progress label. */
	step: string;
	error: string | null;
	start: () => Promise<void>;
}

/**
 * Starts the style job and follows it. When a job this page watched finishes, the server's profile style is read
 * and placed in the session without being saved back, so the proposal appears for review.
 */
export function useStyleLearning(): StyleLearning {
	const { actions } = useInsight();
	const { dispatch } = useCollaborationSession();
	const { job, error: jobError, follow } = useJob(actions, "style");
	const [isStarting, setIsStarting] = useState(false);
	const [isReading, setIsReading] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const [readError, setReadError] = useState<string | null>(null);
	// a job finished before this page opened is not a new result to read
	const [watchedId, setWatchedId] = useState<string | null>(null);
	const handledId = useRef<string | null>(null);
	const request = useRef(0);

	useEffect(
		() => () => {
			request.current += 1;
		},
		[],
	);

	useEffect(() => {
		if (!job) return;
		if (job.status === "running") {
			setWatchedId(job.id);
			return;
		}
		if (
			job.status !== "done" ||
			watchedId !== job.id ||
			handledId.current === job.id
		)
			return;
		handledId.current = job.id;
		const ticket = ++request.current;
		setIsReading(true);
		setReadError(null);
		readServerStyle(actions)
			.then((style) => {
				if (ticket !== request.current) return;
				dispatch({ type: "profile.style.server", style });
			})
			.catch((cause: unknown) => {
				if (ticket !== request.current) return;
				setReadError(
					cause instanceof Error
						? cause.message
						: "Unable to read the learned style",
				);
			})
			.finally(() => {
				if (ticket === request.current) setIsReading(false);
			});
	}, [job, watchedId, actions, dispatch]);

	const start = useCallback(async (): Promise<void> => {
		setIsStarting(true);
		setStartError(null);
		setReadError(null);
		try {
			const started = await startStyleLearning(actions);
			setWatchedId(started.id);
			follow(started);
		} catch (cause: unknown) {
			setStartError(
				cause instanceof Error
					? cause.message
					: "Unable to start learning your style",
			);
		} finally {
			setIsStarting(false);
		}
	}, [actions, follow]);

	const failure =
		job?.status === "failed" && job.id === watchedId ? job.error : null;
	return {
		isLearning: isStarting || isReading || job?.status === "running",
		step: job?.status === "running" ? job.step : "",
		error: startError ?? readError ?? failure ?? jobError,
		start,
	};
}
