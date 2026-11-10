import {
	type DependencyList,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { stableKey } from "./stable-key";

interface UseIteratorApiOptions {
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

interface UseIteratorApiReturn<T> {
	data: T[];
	isLoading: boolean;
	hasMore: boolean;
	/** Advance to the next page (no-op while loading or once exhausted). */
	next: () => void;
	/**
	 * Re-fetch from offset 0. Accumulated pages are left in place (not
	 * cleared) until the new page-0 result arrives and replaces them
	 * wholesale — avoids a flash to empty every time this is called.
	 */
	reset: () => void;
	/**
	 * Patch the already-loaded rows in place (no network call, no scroll reset).
	 * Use after a confirmed mutation so a single row can be edited or removed
	 * without `reset()`'s eventual page-0 replacement jumping the scroll to top.
	 */
	update: (updater: (prev: T[]) => T[]) => void;
}

/** A generated call that pages with `limit` and `offset`. */
type PagedCall = (
	input: { limit: number; offset: number },
	options?: RequestInit,
) => Promise<unknown>;

/** A paged call's other inputs, which the caller passes; the hook fills in limit and offset. */
type PageInput<F extends PagedCall> = Omit<
	Parameters<F>[0],
	"limit" | "offset"
>;

/** The other inputs are optional when every one of them is. */
type PageArgs<F extends PagedCall, O> = Partial<
	PageInput<F>
> extends PageInput<F>
	? [input?: PageInput<F>, options?: O]
	: [input: PageInput<F>, options?: O];

/** Options for paging a generated call. */
interface UseIteratorCallOptions extends UseIteratorApiOptions {}

/** Options for paging a generated call whose response wraps its rows. */
interface UseIteratorSelectOptions<R, T> extends UseIteratorApiOptions {
	/** Reads the rows out of a response, such as `(response) => response.rows`. */
	select: (response: R) => T[];
}

/**
 * Pages through a generated call from `@semoss/sdk/api/*` whose input has
 * `limit` and `offset` and which resolves with a list. The hook fills in limit
 * and offset, starts again from page 0 when the other inputs change (compared by
 * value, so no deps array), and aborts a page it replaces.
 *
 * @example
 * ```ts
 * const { data, next, hasMore } = useIteratorApi(listUsers, { search }, { enabled: isOpen });
 * ```
 */
export function useIteratorApi<
	F extends (
		input: { limit: number; offset: number },
		options?: RequestInit,
	) => Promise<unknown[]>,
>(
	call: F,
	...args: PageArgs<F, UseIteratorCallOptions>
): UseIteratorApiReturn<Awaited<ReturnType<F>>[number]>;
/**
 * Pages through a generated call whose response wraps its rows; `select` reads
 * them out.
 *
 * @example
 * ```ts
 * const rooms = useIteratorApi(listRooms, { search }, { select: (r) => r.rooms });
 * ```
 */
export function useIteratorApi<F extends PagedCall, T>(
	call: F,
	...args: PageArgs<F, UseIteratorSelectOptions<Awaited<ReturnType<F>>, T>>
): UseIteratorApiReturn<T>;
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
	options?: UseIteratorApiOptions,
	deps?: DependencyList,
): UseIteratorApiReturn<T>;
export function useIteratorApi<T>(
	source: PagedCall | ((limit: number, offset: number) => Promise<T[]>),
	second?: unknown,
	third?: unknown,
): UseIteratorApiReturn<T> {
	// The legacy form is fetchPage(limit, offset) with a deps array; a generated
	// call takes one input object, so it has length 1.
	const isLegacy = Array.isArray(third) || source.length >= 2;
	const input = isLegacy ? undefined : (second as object | undefined);
	const options = (isLegacy ? second : third) as
		| Partial<UseIteratorSelectOptions<unknown, T>>
		| undefined;
	const select = options?.select;
	// Compared by value: a new input object with the same content does not re-page.
	const inputKey = isLegacy ? undefined : stableKey(input, "input");

	const fetchPage = isLegacy
		? (limit: number, offset: number) =>
				(source as (limit: number, offset: number) => Promise<T[]>)(
					limit,
					offset,
				)
		: async (limit: number, offset: number, signal: AbortSignal) => {
				const response = await (source as PagedCall)(
					{ ...input, limit, offset },
					{ signal },
				);
				return select ? select(response) : (response as T[]);
			};

	return usePagedFetch<T>(
		fetchPage,
		options ?? {},
		isLegacy ? ((third as DependencyList | undefined) ?? []) : [inputKey],
	);
}

/**
 * Accumulates pages from `fetchPage(limit, offset, signal)`. Changing any value in
 * `deps` resets to page 0, and a page that is replaced or unmounted is aborted.
 */
function usePagedFetch<T>(
	fetchPage: (
		limit: number,
		offset: number,
		signal: AbortSignal,
	) => Promise<T[]>,
	options: UseIteratorApiOptions,
	deps: DependencyList,
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

	// Deliberately does not clear `data`: the page-0 fetch this triggers
	// replaces it wholesale once it resolves (see the `offset === 0` branch
	// below), so leaving stale rows in place until then avoids a flash to
	// empty on every reset (search-term change, filter change, etc).
	const reset = useCallback(() => {
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
		const controller = new AbortController();
		// Mark a fetch in flight for the whole async duration so `next()` cannot
		// advance the offset before this page resolves (see fetchingRef above).
		fetchingRef.current = true;
		setIsLoading(true);
		fetchPageRef
			.current(limit, offset, controller.signal)
			.then((page) => {
				if (versionRef.current !== version) {
					return;
				}
				setData((prev) => (offset === 0 ? page : [...prev, ...page]));
				// A short page means we have reached the end — stop polling.
				setHasMore(page.length >= limit);
			})
			.catch(() => {
				// An aborted page was replaced or unmounted, not exhausted.
				if (
					versionRef.current === version &&
					!controller.signal.aborted
				) {
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
		return () => {
			controller.abort();
		};
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
