import {
	type DependencyList,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

export interface UseIteratorApiOptions {
	/** Page size passed as the `limit` argument to `fetchPage` (default 25). */
	limit?: number;
	/**
	 * When false, no fetching happens (e.g. a dropdown that is still closed).
	 * Flipping it to true fetches the first page; include any state that should
	 * re-fetch from scratch in `deps` rather than toggling `enabled`.
	 */
	enabled?: boolean;
}

export interface UseIteratorApiReturn<T> {
	data: T[];
	isLoading: boolean;
	hasMore: boolean;
	/** Advance to the next page (no-op while loading or once exhausted). */
	next: () => void;
	/** Clear accumulated pages and re-fetch from offset 0. */
	reset: () => void;
}

/**
 * REST analog of `useIteratorPixel` (which only speaks pixel). Accumulates
 * paginated results from a GET-backed `fetchPage(limit, offset)` and stops
 * paging once a page returns fewer than `limit` rows — so infinite scroll does
 * not keep polling after the data is exhausted. Pair with `useInfiniteScroll`
 * from `@semoss/ui/next`, gating its `disabled` on `isLoading || !hasMore`.
 *
 * Changing any value in `deps` resets the iterator (offset 0, cleared data).
 */
export function useIteratorApi<T>(
	fetchPage: (limit: number, offset: number) => Promise<T[]>,
	options: UseIteratorApiOptions = {},
	deps: DependencyList = [],
): UseIteratorApiReturn<T> {
	const { limit = 25, enabled = true } = options;

	const [data, setData] = useState<T[]>([]);
	const [offset, setOffset] = useState(0);
	const [resetKey, setResetKey] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);

	// Keep the latest fetcher without making it a fetch trigger.
	const fetchPageRef = useRef(fetchPage);
	fetchPageRef.current = fetchPage;
	// Discards responses from superseded fetches (rapid deps/search changes).
	const versionRef = useRef(0);
	// Mirrors for the stable `next` callback so it never advances mid-load.
	const isLoadingRef = useRef(false);
	const hasMoreRef = useRef(true);
	isLoadingRef.current = isLoading;
	hasMoreRef.current = hasMore;
	const mountedRef = useRef(false);

	const reset = useCallback(() => {
		setData([]);
		setOffset(0);
		setHasMore(true);
		setResetKey((k) => k + 1);
	}, []);

	// Reset whenever the caller's query inputs change (but not on first mount —
	// the fetch effect already loads page 0 then).
	useEffect(
		() => {
			if (!mountedRef.current) {
				mountedRef.current = true;
				return;
			}
			reset();
		},
		// biome-ignore lint/correctness/useExhaustiveDependencies: reset on caller deps
		deps,
	);

	// Fetch the page for the current offset. Setting offset=0 and resetKey in
	// `reset` collapses to a single re-render, so this fires exactly once per
	// reset (no stale duplicate request).
	// biome-ignore lint/correctness/useExhaustiveDependencies: driven by offset/resetKey/deps
	useEffect(() => {
		if (!enabled) {
			return;
		}
		const version = ++versionRef.current;
		setIsLoading(true);
		fetchPageRef
			.current(limit, offset)
			.then((page) => {
				if (versionRef.current !== version) {
					return;
				}
				setData((prev) => (offset === 0 ? page : [...prev, ...page]));
				// A short page means we have reached the end — stop polling.
				setHasMore(page.length >= limit);
			})
			.catch(() => {
				if (versionRef.current === version) {
					setHasMore(false);
				}
			})
			.finally(() => {
				if (versionRef.current === version) {
					setIsLoading(false);
				}
			});
	}, [offset, resetKey, enabled, limit, ...deps]);

	const next = useCallback(() => {
		if (isLoadingRef.current || !hasMoreRef.current) {
			return;
		}
		setOffset((prev) => prev + limit);
	}, [limit]);

	return { data, isLoading, hasMore, next, reset };
}
