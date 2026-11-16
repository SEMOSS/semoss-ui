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
