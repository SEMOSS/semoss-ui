import {
	type DependencyList,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

export interface UseIteratorApiOptions {
	/**
	 * Page size passed as the `limit` argument to `fetchPage` (default 25). Must
	 * be STABLE for the hook's lifetime: a runtime change re-fetches at the
	 * current offset without resetting, corrupting the accumulated pages. Put any
	 * value that should re-page from scratch in `deps` instead.
	 */
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
	/**
	 * Patch the already-loaded rows in place (no network call, no scroll reset).
	 * Use after a confirmed mutation so a single row can be edited or removed
	 * without `reset()` throwing away accumulated pages and jumping to the top.
	 */
	update: (updater: (prev: T[]) => T[]) => void;
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
	// Guards for the stable `next` callback so it never advances mid-load or past
	// the end. `fetchingRef` is owned solely by the fetch effect (set when a fetch
	// starts, cleared when the latest one settles) — NOT mirrored from `isLoading`
	// state. The fetch starts in an effect and its state commit lags a render
	// behind, while the scroll element attaches in a separate commit; a
	// render-mirrored flag would read false in that gap and let useInfiniteScroll's
	// triggerOnMount advance the offset before page 0 arrives (superseding and
	// dropping page 0). `hasMore` is safe to mirror — it only changes on resolve.
	const fetchingRef = useRef(false);
	const hasMoreRef = useRef(true);
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
	// biome-ignore lint/correctness/useExhaustiveDependencies: driven by offset/resetKey (deps re-fetch via reset)
	useEffect(() => {
		if (!enabled) {
			return;
		}
		const version = ++versionRef.current;
		// Mark a fetch in flight for the whole async duration so `next()` cannot
		// advance the offset before this page resolves (see fetchingRef above).
		fetchingRef.current = true;
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
				// Only the latest fetch clears the flags; a superseded fetch must
				// leave them set for the request that replaced it.
				if (versionRef.current === version) {
					fetchingRef.current = false;
					setIsLoading(false);
				}
			});
		// `deps` is intentionally NOT in this array: a deps change re-fetches via
		// `reset()` (which bumps resetKey) so the effect always runs *after*
		// offset has been reset to 0. Including `...deps` fired the effect in the
		// same commit as reset(), before setOffset(0) applied — issuing a stale
		// request at the old offset with the new filter, then a second at offset 0.
		// The fetch itself reads fetchPageRef.current, which closes over the latest
		// deps, so correctness does not depend on them being in the array.
	}, [offset, resetKey, enabled, limit]);

	const next = useCallback(() => {
		if (fetchingRef.current || !hasMoreRef.current) {
			return;
		}
		setOffset((prev) => prev + limit);
	}, [limit]);

	// Patch loaded rows locally (no refetch). Offset is left as-is: a removed row
	// leaves a one-row gap against the server offset, which only matters if the
	// user then pages further — an acceptable trade for keeping scroll position.
	const update = useCallback((updater: (prev: T[]) => T[]) => {
		setData(updater);
	}, []);

	return { data, isLoading, hasMore, next, reset, update };
}
