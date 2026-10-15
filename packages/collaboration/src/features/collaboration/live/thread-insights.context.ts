import { createContext } from "react";
import type { Thread } from "../state/collaboration.types";

export interface ThreadInsightsRun {
	isRunning: boolean;
	error: string;
}

export interface ThreadInsightsStatus {
	/** Runs this page started or joined, by thread id. */
	runs: Record<string, ThreadInsightsRun>;
	/**
	 * Have Brain summarize the thread and find its action items in the background, never in its assistant room.
	 * Without force nothing runs when the summary already covers the newest message.
	 */
	summarize: (threadId: string, force: boolean) => void;
}

export const ThreadInsightsContext = createContext<ThreadInsightsStatus | null>(
	null,
);

/** Sample, browser-imported, and new-session threads have no server thread to summarize. */
export function canSummarize(thread: Thread): boolean {
	return (
		!thread.isSample &&
		!thread.id.startsWith("connected:") &&
		!thread.id.startsWith("session:")
	);
}
