import { useCallback, useEffect, useRef, useState } from "react";
import type { InsightActions } from "@/lib/pixel";
import { message } from "./onboarding-ui";
import { getTopicReview } from "./topic-review-api";

interface ProgressState {
	actions: InsightActions;
	step: number;
	status: "welcome" | "resuming" | "ready" | "error";
	error: string | null;
}

interface OnboardingProgress {
	step: number;
	started: boolean;
	isResuming: boolean;
	error: string | null;
	start: () => Promise<void>;
	next: () => void;
	back: () => void;
}

/** Check for a saved review only after Start setup, so reload can resume without reimporting. */
export function useOnboardingProgress(
	actions: InsightActions,
	initialStep: number,
	lastStep: number,
): OnboardingProgress {
	const [state, setState] = useState<ProgressState>({
		actions,
		step: initialStep,
		status: initialStep > 0 ? "ready" : "welcome",
		error: null,
	});
	const request = useRef(0);
	const inFlight = useRef<InsightActions | null>(null);
	useEffect(() => {
		const scopedActions = actions;
		return () => {
			request.current += 1;
			if (inFlight.current === scopedActions) inFlight.current = null;
		};
	}, [actions]);
	const current = state.actions === actions;
	const start = useCallback(async (): Promise<void> => {
		if (inFlight.current === actions) return;
		inFlight.current = actions;
		const ticket = ++request.current;
		setState({ actions, step: 0, status: "resuming", error: null });
		try {
			const review = await getTopicReview(actions);
			if (ticket !== request.current) return;
			const step = review
				? review.appliedRevision === review.revision
					? lastStep
					: lastStep - 1
				: 0;
			setState({ actions, step, status: "ready", error: null });
		} catch (cause: unknown) {
			if (ticket !== request.current) return;
			setState({
				actions,
				step: 0,
				status: "error",
				error: message(cause),
			});
		} finally {
			if (ticket === request.current) inFlight.current = null;
		}
	}, [actions, lastStep]);
	const next = useCallback((): void => {
		setState((previous) =>
			previous.actions === actions
				? { ...previous, step: Math.min(previous.step + 1, lastStep) }
				: previous,
		);
	}, [actions, lastStep]);
	const back = useCallback((): void => {
		setState((previous) =>
			previous.actions === actions
				? { ...previous, step: Math.max(previous.step - 1, 0) }
				: previous,
		);
	}, [actions]);
	return {
		step: current ? state.step : initialStep,
		started: current ? state.status === "ready" : initialStep > 0,
		isResuming: current && state.status === "resuming",
		error: current ? state.error : null,
		start,
		next,
		back,
	};
}
