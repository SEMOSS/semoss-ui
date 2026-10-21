import { createContext, useContext } from "react";

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

/** Sample/imported threads need no live history owner. */
export function useThreadHistory(threadId: string): ThreadHistoryState & {
	loadOlder: () => void;
	retry: () => void;
	refresh: () => void;
} {
	const history = useContext(ThreadHistoryContext);
	const page = history?.pages[threadId] ?? EMPTY_THREAD_HISTORY;
	return {
		...page,
		loadOlder: () => {
			if (page.nextCursor) history?.load(threadId, page.nextCursor);
		},
		retry: () =>
			history?.load(
				threadId,
				page.retryRefresh ? undefined : page.nextCursor,
				page.retryRefresh,
			),
		refresh: () => history?.load(threadId, undefined, true),
	};
}
