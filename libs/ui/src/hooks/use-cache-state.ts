import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The localStorage key one cached value lives under.
 *
 * `name` is the whole contract: it namespaces the value *and* versions it. A
 * caller whose shape changes bumps a suffix in the name it passes, which
 * orphans the old entry rather than migrating it — the trade is one reset for
 * that caller against carrying a repair path for every past shape.
 */
const getKey = (name: string) => `smss--${name}`;

/**
 * Read one cached value, outside React.
 *
 * The React-free half of {@link useCacheState}, for callers that need the
 * cache before any component mounts — a store hydrating in its constructor,
 * say. Same key format as the hooks, so all three can share a name.
 *
 * @param name - Cache name, as passed to `useCacheState`.
 * @return The cached value, or null when absent or unreadable.
 */
export const readCacheState = <T>(name: string): T | null => {
	try {
		const item = localStorage.getItem(getKey(name));
		if (!item) {
			return null;
		}
		const state = (JSON.parse(item) as { state?: unknown })?.state;
		// The stored shape is taken on trust: `T` says what was written, not
		// what came back. Storage can hand back a truncated entry, or one an
		// older build wrote, so anything a renderer walks belongs behind a
		// check where it is consumed — the workbench validates an arrangement
		// in `loadSnapshot`, not here.
		return state as T;
	} catch (e) {
		console.error(e);
		return null;
	}
};

/**
 * Write one cached value, outside React.
 *
 * @param name - Cache name, as passed to `useCacheState`.
 * @param value - The value to store.
 */
export const writeCacheState = <T>(name: string, value: T): void => {
	try {
		localStorage.setItem(getKey(name), JSON.stringify({ state: value }));
	} catch (e) {
		// quota, or storage disabled in a private window
		console.error(e);
	}
};

/**
 * Access state from the cache.
 *
 * Reads synchronously on the first render — the cached value is there before
 * anything paints, so a caller never renders its default and then swaps.
 *
 * @param initialState - Value to use when nothing is cached.
 * @param name - Cache name; see {@link getKey} for how it versions.
 * @return The current value and a setter that caches it.
 */
export const useCacheState = <T>(initialState: T, name: string) => {
	const [state, setState] = useState<T>(
		() => readCacheState<T>(name) ?? initialState,
	);

	// Read on a name change, never depended on: both are routinely inline
	// literals, so depending on them would re-read on every render.
	const fallback = useRef({ initialState });
	fallback.current = { initialState };

	// The initializer covered the name this hook mounted with; this is only
	// for a caller that genuinely swaps names mid-life.
	const loaded = useRef(name);
	useEffect(() => {
		if (loaded.current === name) {
			return;
		}
		loaded.current = name;
		const { initialState: fresh } = fallback.current;
		setState(readCacheState<T>(name) ?? fresh);
	}, [name]);

	/**
	 * Handle changing of the data
	 */
	const onChange = useCallback(
		(data: T) => {
			// Write first. A caller may be tearing down when it calls this —
			// the workbench persists its layout from an unmount cleanup — and
			// the `setState` below is a no-op by then.
			writeCacheState(name, data);
			setState(data);
		},
		[name],
	);

	return [state, onChange] as const;
};
