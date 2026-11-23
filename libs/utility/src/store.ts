import { isPlainObject } from "./object";

/**
 * What a store exposes for reading: the two functions React's
 * `useSyncExternalStore` needs. A store built on `StoreState` forwards both,
 * and may declare `implements ReadableStore<Snapshot>` to have that checked.
 */
export interface ReadableStore<S> {
	/** Read the current state, the same object until it changes. */
	getSnapshot: () => S;

	/** Hear about every change; returns a function that stops listening. */
	subscribe: (listener: () => void) => () => void;
}

/**
 * Makes the next state from the current one. Reading the current state here,
 * rather than before an `await`, keeps a write made in the meantime.
 */
type Updater<S, N> = (current: Readonly<S>) => N;

/**
 * The state itself when `update` can merge into it, and `never` otherwise.
 * Arrays, maps, sets, dates, functions and primitives cannot take a shallow
 * merge; class instances cannot be told apart here and are refused when
 * `update` runs.
 */
type Mergeable<S> = S extends
	| readonly unknown[]
	| ReadonlyMap<unknown, unknown>
	| ReadonlySet<unknown>
	| Date
	| ((...args: never[]) => unknown)
	? never
	: S extends object
		? S
		: never;

/**
 * Whether a write is an updater rather than the next state.
 *
 * @param next - What the caller passed.
 * @returns True for an updater.
 */
const isUpdater = <S, N>(next: N | Updater<S, N>): next is Updater<S, N> =>
	typeof next === "function";

/**
 * State held as one immutable snapshot, replaced on every change, so any
 * framework can watch it: React reads it with `useSyncExternalStore`, and
 * plain code calls `subscribe`. It has no dependencies, so it also runs in
 * Node.
 *
 * A store owns one and exposes its `getSnapshot` and `subscribe`. Change the
 * state only through `set` or `update`, which make a new snapshot. A
 * snapshot is never changed in place, so comparing two snapshots by
 * reference says whether anything changed. The state cannot be a function.
 *
 * @example
 * ```ts
 * interface CounterSnapshot {
 *     readonly count: number;
 * }
 *
 * class CounterStore {
 *     private readonly state = new StoreState<CounterSnapshot>({ count: 0 });
 *
 *     getSnapshot = (): CounterSnapshot => this.state.getSnapshot();
 *     subscribe = (listener: () => void) => this.state.subscribe(listener);
 *
 *     increment = () =>
 *         this.state.update((current) => ({ count: current.count + 1 }));
 * }
 * ```
 */
export class StoreState<S> {
	/** The current state; replaced, never changed in place. */
	private snapshot: S;

	/** Everyone told about each change, one entry per `subscribe` call. */
	private readonly listeners = new Set<() => void>();

	/** Counts changes, so a round of telling can see that a newer one ran. */
	private version = 0;

	/**
	 * Start with the first state.
	 *
	 * @param initial - The state before anything changes it.
	 * @throws A `TypeError` when the state is a function, which `set` could not
	 * tell from an updater.
	 */
	constructor(initial: S) {
		if (typeof initial === "function") {
			throw new TypeError(
				"StoreState cannot hold a function; wrap it in an object.",
			);
		}

		this.snapshot = initial;
	}

	/**
	 * Read the current state. Returns the same object until the state changes,
	 * as `useSyncExternalStore` requires.
	 *
	 * @returns The current state. Do not change it in place.
	 */
	getSnapshot = (): Readonly<S> => this.snapshot;

	/**
	 * Hear about every change to the state. Each call is its own
	 * subscription, even for a listener that is already subscribed.
	 *
	 * @param listener - Called after each change, with no arguments; read the
	 * new state with `getSnapshot`.
	 * @returns Stops listening. Safe to call more than once.
	 */
	subscribe = (listener: () => void): (() => void) => {
		// its own function, so stopping one subscription leaves the others
		const subscription = () => listener();

		this.listeners.add(subscription);
		return () => {
			this.listeners.delete(subscription);
		};
	};

	/**
	 * Replace the state and tell every listener. Does nothing when the next
	 * state is the current one.
	 *
	 * @param next - The new state, or a function that makes it from the
	 * current state. Must be a new object, not the current one changed in
	 * place.
	 * @throws What a listener threw, after every listener was told; an
	 * `AggregateError` when several threw.
	 */
	set = (next: S | Updater<S, S>): void => {
		const value = isUpdater(next) ? next(this.snapshot) : next;

		// the same state is not a change
		if (Object.is(value, this.snapshot)) {
			return;
		}

		this.snapshot = value;
		this.notify();
	};

	/**
	 * Change some fields of the state, keeping the rest, and tell every
	 * listener. Does nothing when every field already holds its new value.
	 * Only for state that is a plain object; replace any other state with
	 * `set`.
	 *
	 * @param partial - The fields to change, or a function that makes them
	 * from the current state.
	 * @throws A `TypeError` when the state is not a plain object, and what a
	 * listener threw, as `set` does.
	 */
	update = <K extends keyof S>(
		partial: S extends Mergeable<S>
			? Pick<S, K> | Updater<S, Pick<S, K>>
			: never,
	): void => {
		const current = this.snapshot;

		// spreading anything else would lose what it is
		if (!isPlainObject(current)) {
			throw new TypeError(
				"StoreState.update needs state that is a plain object; replace other state with set.",
			);
		}

		// the parameter's type only decides who may call; here it is one of these
		const input: Pick<S, K> | Updater<S, Pick<S, K>> = partial;
		const changes = isUpdater(input) ? input(current) : input;

		// keep the snapshot when no field would change
		const isChanged = Reflect.ownKeys(changes).some(
			(key) =>
				!Object.hasOwn(current, key) ||
				!Object.is(current[key], Reflect.get(changes, key)),
		);
		if (!isChanged) {
			return;
		}

		this.snapshot = { ...current, ...changes };
		this.notify();
	};

	/**
	 * Tell everyone listening when the change began. A listener that stopped
	 * meanwhile is skipped, one that started meanwhile hears the next change,
	 * and one that throws does not keep the others from hearing.
	 */
	private notify(): void {
		this.version += 1;

		const version = this.version;
		const errors: unknown[] = [];

		for (const listener of [...this.listeners]) {
			// a listener changed the state, which told everyone about the newest
			if (version !== this.version) {
				break;
			}
			if (!this.listeners.has(listener)) {
				continue;
			}

			try {
				listener();
			} catch (error) {
				errors.push(error);
			}
		}

		if (errors.length === 1) {
			throw errors[0];
		}
		if (errors.length > 1) {
			throw new AggregateError(errors, "Several listeners threw.");
		}
	}
}
