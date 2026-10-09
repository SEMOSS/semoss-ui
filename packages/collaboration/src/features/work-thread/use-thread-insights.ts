import { useContext, useEffect, useRef } from "react";
import {
	canSummarize,
	ThreadInsightsContext,
} from "@/features/collaboration/live/thread-insights.context";
import type { Thread } from "@/features/collaboration/state/collaboration.types";

/** Summary and action items come from Brain in the background; the assistant's room and chat are untouched. */
export function useThreadInsights(thread: Thread): {
	isAvailable: boolean;
	isGenerating: boolean;
	error: string;
	generate: () => void;
} {
	const insights = useContext(ThreadInsightsContext);
	const run = insights?.runs[thread.id];
	const isAvailable = Boolean(insights) && canSummarize(thread);
	return {
		isAvailable,
		isGenerating: Boolean(
			run?.isRunning || (isAvailable && thread.summaryPending),
		),
		error: run?.isRunning ? "" : (run?.error ?? ""),
		generate: () => {
			if (isAvailable) insights?.summarize(thread.id, true);
		},
	};
}

/**
 * An open thread whose summary does not cover its newest message is summarized at once. It asks again when
 * new mail arrives or a new summary lands still behind, but not after a failure; Summarize retries that.
 */
export function useEnsureThreadInsights(thread: Thread | undefined): void {
	const summarize = useContext(ThreadInsightsContext)?.summarize;
	const attempted = useRef<string | null>(null);
	const threadId = thread?.id;
	const key =
		thread && canSummarize(thread) && !thread.summaryCurrent
			? `${thread.id}\n${thread.lastAt}\n${thread.summaryAt ?? ""}`
			: null;
	useEffect(() => {
		if (!key || !threadId || !summarize || attempted.current === key)
			return;
		attempted.current = key;
		summarize(threadId, false);
	}, [key, threadId, summarize]);
}
