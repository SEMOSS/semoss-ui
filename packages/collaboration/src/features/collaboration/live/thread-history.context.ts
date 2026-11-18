import { createContext } from "react";

export interface ThreadHistoryState {
	isLoading: boolean;
	hasLoaded?: boolean;
	hasMore: boolean;
	nextCursor?: string;
	error?: string;
	retryRefresh?: boolean;
	unavailableCount: number;
}

export const EMPTY_THREAD_HISTORY: ThreadHistoryState = {
	isLoading: false,
	hasMore: false,
	unavailableCount: 0,
};

export const ThreadHistoryContext = createContext<{
	pages: Record<string, ThreadHistoryState>;
	load: (threadId: string, cursor?: string, refresh?: boolean) => void;
} | null>(null);
