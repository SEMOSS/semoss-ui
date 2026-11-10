/**
 * Internal helpers for the SDK's React hooks, which read its stores through
 * `useSyncExternalStore`. Not exported from `@semoss/sdk/react`: apps read the
 * stores through `useSession`, `useConfig` and `useSessionPermissions`.
 */
import { useState, useSyncExternalStore } from "react";
import { isShallowEqual } from "@semoss/utility/object";

/**
 * Make a selector cache that remembers its last selection.
 *
 * `useSyncExternalStore` renders again whenever its read returns a different
 * value, so a selector that builds a new object on every read would render
 * forever. The cache returns the last value when the snapshot and selector
 * are unchanged, and also when a new selection holds the same entries as the
 * last one.
 *
 * @returns Selects from a snapshot, through the cache.
 */
export const createSelection = () => {
	let last: { snapshot: unknown; selector: unknown; value: unknown } | null =
		null;

	return <S, T>(snapshot: S, selector: (snapshot: S) => T): T => {
		// the same read as last time gives the same value
		if (last && last.snapshot === snapshot && last.selector === selector) {
			return last.value as T;
		}

		// keep the last value when the new one is equal, so nothing renders
		const value = selector(snapshot);
		const kept =
			last && isShallowEqual(last.value, value)
				? (last.value as T)
				: value;

		last = { snapshot: snapshot, selector: selector, value: kept };
		return kept;
	};
};

/**
 * Take a store's actions by name, to hand to selectors beside its state. A
 * store's actions are its own fields, so they keep their `this` and never
 * change between renders.
 *
 * @param store - The store.
 * @param names - The actions to take.
 * @returns The actions, by name.
 */
export const pickActions = <T, K extends keyof T>(
	store: T,
	names: readonly K[],
): Pick<T, K> =>
	Object.fromEntries(names.map((name) => [name, store[name]])) as Pick<T, K>;

/**
 * Read part of an observable store, rendering again only when that part
 * changes.
 *
 * @param store - The store, such as a `SessionStore` or `ConfigStore`.
 * @param selector - Picks the part to read. It may build a new object; one
 * holding the same entries as the last does not cause a render.
 * @returns The selected part.
 */
export const useStoreSelector = <S, T>(
	store: {
		subscribe: (listener: () => void) => () => void;
		getSnapshot: () => S;
	},
	selector: (snapshot: S) => T,
): T => {
	// one cache per component, kept across renders
	const [select] = useState(createSelection);

	const getSelection = () => select(store.getSnapshot(), selector);
	return useSyncExternalStore(store.subscribe, getSelection, getSelection);
};
