import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { type SearchEntry, searchCollaboration } from "./collaboration-search";

interface SearchState {
	term: string;
	entries: SearchEntry[];
	total: number;
	offset: number;
	status: "idle" | "loading" | "ready" | "error";
	error: string | null;
}
interface CollaborationSearchResult extends SearchState {
	hasMore: boolean;
	loadMore: () => void;
	retry: () => void;
}
const empty = (term: string): SearchState => ({
	term,
	entries: [],
	total: 0,
	offset: 0,
	status: "idle",
	error: null,
});

/** Debounces saved-record reads and discards responses after query changes or dismissal. */
export function useCollaborationSearch(
	query: string,
	isOpen: boolean,
): CollaborationSearchResult {
	const { actions } = useInsight();
	const term = query.trim().toLowerCase();
	const [state, setState] = useState<SearchState>(() => empty(""));
	const [attempt, setAttempt] = useState(0);
	const generation = useRef(0);
	const pending = useRef(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt intentionally restarts a failed first-page request.
	useEffect(() => {
		const request = ++generation.current;
		pending.current = false;
		if (!isOpen || !term) {
			setState(empty(term));
			return;
		}
		setState({ ...empty(term), status: "loading" });
		pending.current = true;
		const timer = window.setTimeout(() => {
			searchCollaboration(actions, term)
				.then((page) => {
					if (generation.current !== request) return;
					setState({
						term,
						entries: page.items,
						total: page.total,
						offset: page.items.length,
						status: "ready",
						error: null,
					});
				})
				.catch((cause: unknown) => {
					if (generation.current !== request) return;
					setState({
						...empty(term),
						status: "error",
						error:
							cause instanceof Error
								? cause.message
								: "Search failed.",
					});
				})
				.finally(() => {
					if (generation.current === request) pending.current = false;
				});
		}, 250);
		return () => {
			window.clearTimeout(timer);
			++generation.current;
			pending.current = false;
		};
	}, [actions, term, isOpen, attempt]);

	const loadMore = (): void => {
		if (
			pending.current ||
			!isOpen ||
			state.term !== term ||
			state.offset >= state.total
		)
			return;
		const request = generation.current;
		pending.current = true;
		setState((previous) => ({
			...previous,
			status: "loading",
			error: null,
		}));
		searchCollaboration(actions, term, state.offset)
			.then((page) => {
				if (generation.current !== request) return;
				setState((previous) => {
					const ids = new Set(
						previous.entries.map((row) => `${row.kind}:${row.id}`),
					);
					return {
						...previous,
						entries: [
							...previous.entries,
							...page.items.filter(
								(row) => !ids.has(`${row.kind}:${row.id}`),
							),
						],
						total: page.total,
						offset: page.items.length
							? previous.offset + page.items.length
							: page.total,
						status: "ready",
						error: null,
					};
				});
			})
			.catch((cause: unknown) => {
				if (generation.current !== request) return;
				setState((previous) => ({
					...previous,
					status: "error",
					error:
						cause instanceof Error
							? cause.message
							: "Search failed.",
				}));
			})
			.finally(() => {
				if (generation.current === request) pending.current = false;
			});
	};
	const current =
		state.term === term
			? state
			: {
					...empty(term),
					status: term ? ("loading" as const) : ("idle" as const),
				};
	return {
		...current,
		hasMore: current.offset < current.total,
		loadMore,
		retry: () => {
			if (current.entries.length) loadMore();
			else setAttempt((value) => value + 1);
		},
	};
}
