import { useCallback, useEffect, useState } from "react";
import {
	type AgentRun,
	isTerminalRun,
	listChildRuns,
	readRun,
} from "@/features/rooms/api/agent-run-api";

/** Inspect durable run records; never attach another consumer to a run's event stream. */
export function useRunDetail(
	insightId: string,
	runId: string,
	isOpen: boolean,
): {
	run: AgentRun | null;
	children: AgentRun[];
	error: string | null;
	isLoading: boolean;
	retry: () => void;
} {
	const [state, setState] = useState<{
		id: string;
		run: AgentRun | null;
		children: AgentRun[];
		error: string | null;
		isLoading: boolean;
	}>({ id: runId, run: null, children: [], error: null, isLoading: true });
	const [retryKey, setRetryKey] = useState(0);
	useEffect(() => {
		if (!isOpen || !runId) return;
		if (retryKey > 0)
			setState((current) => ({
				...current,
				error: null,
				isLoading: current.run === null,
			}));
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let failures = 0;
		const refresh = async (): Promise<void> => {
			try {
				const [run, children] = await Promise.all([
					readRun(insightId, runId),
					listChildRuns(insightId, runId),
				]);
				if (cancelled) return;
				failures = 0;
				setState({
					id: runId,
					run,
					children,
					error: null,
					isLoading: false,
				});
				if (
					!isTerminalRun(run) ||
					children.some((child) => !isTerminalRun(child))
				)
					timer = setTimeout(() => void refresh(), 1500);
			} catch (cause) {
				if (cancelled) return;
				failures++;
				setState((current) => ({
					id: runId,
					run: current.id === runId ? current.run : null,
					children: current.id === runId ? current.children : [],
					isLoading: false,
					error:
						cause instanceof Error
							? cause.message
							: "Could not load this run.",
				}));
				if (failures < 3)
					timer = setTimeout(() => void refresh(), 1500 * failures);
			}
		};
		void refresh();
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [insightId, isOpen, retryKey, runId]);
	const retry = useCallback(() => setRetryKey((key) => key + 1), []);
	return {
		...(state.id === runId
			? state
			: { run: null, children: [], error: null, isLoading: true }),
		retry,
	};
}
