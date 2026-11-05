import { useCallback, useEffect, useState } from "react";
import {
	type AgentRun,
	isTerminalRun,
	listChildRuns,
	readRun,
} from "@/features/rooms/api/agent-run-api";

// status reads: every 3 s on screen, 10 s while it waits for the owner, 15 s from a hidden tab
const LIVE_WAIT_MS = 3000;
const WAITING_WAIT_MS = 10_000;
const HIDDEN_WAIT_MS = 15_000;

function nextWait(run: AgentRun, children: AgentRun[]): number {
	if (document.visibilityState === "hidden") return HIDDEN_WAIT_MS;
	const waiting =
		run.status === "INPUT_REQUIRED" &&
		children.every(
			(child) =>
				isTerminalRun(child) || child.status === "INPUT_REQUIRED",
		);
	return waiting ? WAITING_WAIT_MS : LIVE_WAIT_MS;
}

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
		// messages are the heavy part: read them first, then only when the run visibly moves
		let withMessages = true;
		let messages: AgentRun["messages"];
		let lastKey = "";
		const refresh = async (): Promise<void> => {
			const reading = withMessages;
			try {
				const [read, children] = await Promise.all([
					readRun(insightId, runId, reading),
					listChildRuns(insightId, runId),
				]);
				if (cancelled) return;
				failures = 0;
				if (reading) messages = read.messages;
				const run = reading ? read : { ...read, messages };
				setState({
					id: runId,
					run,
					children,
					error: null,
					isLoading: false,
				});
				const key = JSON.stringify([
					run.status,
					run.progress?.activity,
					run.pendingActions.map((action) => action.actionId),
					children.map((child) => [child.runId, child.status]),
				]);
				const moved = key !== lastKey;
				lastKey = key;
				const live =
					!isTerminalRun(run) ||
					children.some((child) => !isTerminalRun(child));
				// something changed since the last message read: read them now
				withMessages = moved && !reading;
				if (!live && !withMessages) return;
				timer = setTimeout(
					() => void refresh(),
					withMessages ? 0 : nextWait(run, children),
				);
			} catch (cause) {
				if (cancelled) return;
				failures++;
				withMessages = reading;
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
