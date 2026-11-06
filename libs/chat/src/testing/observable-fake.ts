/** What the room engine's selector hooks read from a store. */
export interface ObservableFake {
	/** The change counter the hooks watch. */
	getSnapshot(): { version: number };
	/** Hear about each change. */
	subscribe(listener: () => void): () => void;
	/** Tell the readers a field of the fake changed. */
	notify(): void;
}

/**
 * Make a plain test double — a room, a message, a tool call — readable by
 * the room engine's selector hooks (`useRoomSelector` and friends): it gets
 * an observable store's `getSnapshot` and `subscribe`, and `notify` to tell
 * its readers when the test changes one of its fields. For tests only.
 *
 * @param fake - The double; extended in place.
 * @returns The same double.
 */
export const asObservableFake = <T extends object>(
	fake: T,
): T & ObservableFake => {
	let snapshot = { version: 0 };
	const listeners = new Set<() => void>();
	return Object.assign(fake, {
		getSnapshot: () => snapshot,
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		notify: () => {
			snapshot = { version: snapshot.version + 1 };
			for (const listener of listeners) {
				listener();
			}
		},
	});
};
