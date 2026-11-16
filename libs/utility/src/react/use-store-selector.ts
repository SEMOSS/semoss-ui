import { useState, useSyncExternalStore } from "react";
import { isShallowEqual } from "../object";
import type { ReadableStore } from "../store";

/** The last read of a store through a selector, kept to answer the next one. */
interface Selection<S, T> {
	/** The snapshot that was read. */
	snapshot: S;

	/** The selector it was read through. */
	selector: (snapshot: S) => T;

	/** What the selector returned, or the equal value before it. */
	value: T;
}

/**
 * Select the whole snapshot. Declared once, so it is the same selector on
 * every render.
 *
 * @param snapshot - The store's state.
 * @returns The same state.
 */
const selectSnapshot = <S>(snapshot: S): S => snapshot;

/**
 * Read a store's whole state, rendering again on every change to it.
 *
 * @param store - The store to read, such as one built on `StoreState`.
 * @returns The store's current state.
 */
export function useStoreSelector<S>(store: ReadableStore<S>): S;

/**
 * Read part of a store, rendering again only when that part changes.
 *
 * `useSyncExternalStore` renders whenever its read returns a different value,
 * so a selector that builds a new object or array on every read would render
 * forever. This keeps the last selection and returns it again when the
 * snapshot and selector are unchanged, and when a new selection holds the same
 * entries as the last one (compared one level deep, entries by identity).
 *
 * @param store - The store to read, such as one built on `StoreState`.
 * @param selector - Picks the part to read. It may build a new object or
 * array, and must not change the snapshot.
 * @returns The selected part.
 *
 * @example
 * ```ts
 * const count = useStoreSelector(counterStore, (state) => state.count);
 * const { status, error } = useStoreSelector(counterStore, (state) => ({
 *     status: state.status,
 *     error: state.error,
 * }));
 * ```
 */
export function useStoreSelector<S, T>(
	store: ReadableStore<S>,
	selector: (snapshot: S) => T,
): T;

export function useStoreSelector<S, T>(
	store: ReadableStore<S>,
	selector: (snapshot: S) => S | T = selectSnapshot,
): S | T {
	// one cache per component, kept across renders
	const [cache] = useState<{ last: Selection<S, S | T> | null }>(() => ({
		last: null,
	}));

	const getSelection = (): S | T => {
		const snapshot = store.getSnapshot();
		const last = cache.last;

		// the same read as last time gives the same value
		if (
			last &&
			Object.is(last.snapshot, snapshot) &&
			last.selector === selector
		) {
			return last.value;
		}

		// keep the last value when the new one is equal, so nothing renders
		const selected = selector(snapshot);
		const value =
			last && isShallowEqual(last.value, selected)
				? last.value
				: selected;

		cache.last = { snapshot: snapshot, selector: selector, value: value };
		return value;
	};

	return useSyncExternalStore(store.subscribe, getSelection, getSelection);
}
