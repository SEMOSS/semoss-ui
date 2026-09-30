import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { InsightActions } from "@/lib/pixel";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { readThreadMessagesPage } from "./live-state";
import {
	EMPTY_THREAD_HISTORY,
	ThreadHistoryContext,
	type ThreadHistoryState,
} from "./thread-history.context";

/** Own the initial read and subsequent pages once per open thread. */
export function ThreadHistoryProvider({
	actions,
	children,
}: {
	actions: InsightActions;
	children: ReactNode;
}) {
	const { state, dispatch } = useCollaborationSession();
	const latest = useRef(state);
	latest.current = state;
	const [pages, setPages] = useState<Record<string, ThreadHistoryState>>({});
	const requests = useRef(new Map<string, symbol>());
	const requested = useRef(new Set<string>());
	const load = useCallback(
		(threadId: string, cursor?: string, refresh = false) => {
			if (requests.current.has(threadId)) return;
			const token = Symbol(threadId);
			requests.current.set(threadId, token);
			setPages((current) => ({
				...current,
				[threadId]: {
					...(current[threadId] ?? EMPTY_THREAD_HISTORY),
					isLoading: true,
					error: undefined,
				},
			}));
			void readThreadMessagesPage(actions, threadId, cursor)
				.then((page) => {
					if (requests.current.get(threadId) !== token) return;
					const current = latest.current;
					const thread = current.threads.find(
						(item) => item.id === threadId,
					);
					if (!thread || !current.openThreadIds.includes(threadId))
						return;
					const byId = new Map(
						page.messages.map((message) => [message.id, message]),
					);
					if (cursor || refresh)
						for (const message of current.workspaces[threadId]
							?.messages ?? [])
							if (!refresh || !byId.has(message.id))
								byId.set(message.id, message);
					const messages = [...byId.values()].sort(
						(a, b) =>
							a.at.localeCompare(b.at) ||
							a.id.localeCompare(b.id),
					);
					dispatch({
						type: "source.import",
						thread,
						people: [],
						workspace: { messages },
					});
					setPages((previous) => ({
						...previous,
						[threadId]: {
							isLoading: false,
							hasLoaded: true,
							hasMore:
								refresh && previous[threadId]?.hasLoaded
									? previous[threadId].hasMore
									: page.hasMore,
							nextCursor:
								refresh && previous[threadId]?.hasLoaded
									? previous[threadId].nextCursor
									: page.nextCursor,
							unavailableCount:
								(cursor
									? (previous[threadId]?.unavailableCount ??
										0)
									: 0) + page.unavailableCount,
						},
					}));
				})
				.catch((cause: unknown) => {
					if (requests.current.get(threadId) !== token) return;
					setPages((current) => ({
						...current,
						[threadId]: {
							...(current[threadId] ?? EMPTY_THREAD_HISTORY),
							isLoading: false,
							retryRefresh: refresh,
							error:
								cause instanceof Error
									? cause.message
									: "Could not load thread history.",
						},
					}));
				})
				.finally(() => {
					if (requests.current.get(threadId) === token)
						requests.current.delete(threadId);
				});
		},
		[actions, dispatch],
	);
	useEffect(() => {
		for (const id of requested.current) {
			if (!state.openThreadIds.includes(id)) {
				requested.current.delete(id);
				requests.current.delete(id);
				setPages((current) => {
					const next = { ...current };
					delete next[id];
					return next;
				});
			}
		}
		for (const id of state.openThreadIds) {
			const thread = state.threads.find((item) => item.id === id);
			if (
				requested.current.has(id) ||
				thread?.isSample ||
				id.startsWith("connected:")
			)
				continue;
			requested.current.add(id);
			load(id);
		}
	}, [load, state.openThreadIds, state.threads]);
	useEffect(
		() => () => {
			requests.current.clear();
			requested.current.clear();
		},
		[],
	);
	return (
		<ThreadHistoryContext.Provider value={{ pages, load }}>
			{children}
		</ThreadHistoryContext.Provider>
	);
}
