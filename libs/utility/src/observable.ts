/**
 * State held as one immutable snapshot, replaced on every change, so any
 * framework can watch it: React reads it with `useSyncExternalStore`, and
 * plain code calls `subscribe`. It has no dependencies, so it also runs in
 * Node.
 *
 * A store owns one and exposes its `getSnapshot` and `subscribe`. Change the
 * state only through `set` or `update`, which always make a new snapshot. A
 * snapshot is never changed in place, so comparing two snapshots by
 * reference says whether anything changed.
 *
 * @example
 * ```ts
 * class CounterStore {
 *     private readonly state = new Observable({ count: 0 });
 *
 *     getSnapshot = () => this.state.getSnapshot();
 *     subscribe = (listener: () => void) => this.state.subscribe(listener);
 *
 *     increment = () =>
 *         this.state.update({ count: this.state.getSnapshot().count + 1 });
 * }
 * ```
 */
export class Observable<S> {
	/** The current state; replaced, never changed in place. */
	private snapshot: S;

	/** Everyone told about each change. */
	private readonly listeners = new Set<() => void>();

	/**
	 * Start with the first state.
	 *
	 * @param initial - The state before anything changes it.
	 */
	constructor(initial: S) {
		this.snapshot = initial;
	}

	/**
	 * Read the current state. Returns the same object until the state changes,
	 * as `useSyncExternalStore` requires.
	 *
	 * @returns The current state.
	 */
	getSnapshot = (): S => this.snapshot;

	/**
	 * Hear about every change to the state.
	 *
	 * @param listener - Called after each change, with no arguments; read the
	 * new state with `getSnapshot`.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	/**
	 * Replace the state and tell every listener.
	 *
	 * @param next - The new state. Must be a new object, not the current one
	 * changed in place.
	 */
	set = (next: S): void => {
		this.snapshot = next;
		for (const listener of this.listeners) {
			listener();
		}
	};

	/**
	 * Change some fields of the state, keeping the rest, and tell every
	 * listener.
	 *
	 * @param partial - The fields to change.
	 */
	update = (partial: Partial<S>): void => {
		this.set({ ...this.snapshot, ...partial });
	};
}
