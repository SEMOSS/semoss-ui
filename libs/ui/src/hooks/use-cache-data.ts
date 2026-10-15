import { useCallback, useRef } from "react";
import { readCacheState, writeCacheState } from "./use-cache-state";

/**
 * Cache data a consumer owns: read once, written on change.
 *
 * The read happens during the first render, so the cached value is there
 * before anything paints. The write is *only* a write: it does not set state,
 * so the value this returns stays the one that was read and the consumer
 * never re-renders on a save.
 *
 * That is the whole difference from {@link useCacheState}, and it is what a
 * consumer that owns the live value after mount wants — a dock, an editor,
 * anything running its own state in a store. The value here seeds it, the
 * store runs it, and each change is written on the way past. Somewhere that
 * has to *render* the cached value as it changes (a toggle, a sidebar's open
 * flag) wants `useCacheState` instead.
 *
 * What comes back is whatever was stored, cast to `T` — see
 * {@link readCacheState}. A consumer that can be broken by a stale or
 * truncated entry checks it on the way in.
 *
 * Both hooks share the key format and the `{ state }` payload, so the two can
 * be pointed at the same name.
 *
 * The read is keyed by `name`: once per name, and again if a consumer swaps
 * the name it wants mid-life. Neither re-renders anything.
 *
 * @param name - Cache name; it namespaces *and* versions the entry, so bump a
 *   suffix rather than migrating when the stored shape changes.
 * @param initialState - Value to seed with when nothing is cached.
 * @return The value that was read, and a function that caches a new one.
 */
export const useCacheData = <T>(name: string, initialState: T) => {
	// Read during render, remembered against the name it was read for.
	const cached = useRef<{ name: string; value: T } | null>(null);
	if (cached.current?.name !== name) {
		cached.current = {
			name: name,
			value: readCacheState<T>(name) ?? initialState,
		};
	}

	const onChange = useCallback(
		(data: T) => writeCacheState(name, data),
		[name],
	);

	return [cached.current.value, onChange] as const;
};
