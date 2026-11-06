import { Observable } from "@semoss/utility/observable";

/** How deep the current {@link batchChanges} calls are nested. */
let batchDepth = 0;

/** Stores that changed inside the current batch, told once it ends. */
const pendingStores = new Set<ObservableStore>();

/**
 * Make several changes and tell each changed store's listeners once, after
 * the last one, instead of once per change. Nested batches end with the
 * outermost.
 *
 * @param change - Makes the changes.
 * @returns What `change` returns.
 */
export const batchChanges = <T>(change: () => T): T => {
	batchDepth += 1;
	try {
		return change();
	} finally {
		batchDepth -= 1;
		if (batchDepth === 0) {
			const stores = [...pendingStores];
			pendingStores.clear();
			for (const store of stores) {
				store.flushChange();
			}
		}
	}
};

/**
 * The base of the room engine's stores. A store's state is its own fields,
 * read through ordinary properties and getters; every change tells the
 * store's listeners, so any framework can watch it — React reads a store
 * through a selector over it (`useRoomSelector` and friends in
 * `@semoss/sdk/react`), and plain code calls `subscribe`.
 *
 * A store lists its data fields once with {@link observeFields}; assigning
 * one of them tells the listeners. Fields hold values that are replaced, not
 * changed in place: a new array or object for every change, so a selector
 * comparing what it read sees the change.
 *
 * Its snapshot is a change counter: it moves on every change of the store,
 * and of the stores it {@link ObservableStore.propagateTo | propagates} to.
 */
export abstract class ObservableStore {
	/** The change counter listeners watch; replaced on every change. */
	private readonly changes = new Observable({ version: 0 });

	/** The stores told whenever this one changes, such as a message's room. */
	private propagation: (() => ObservableStore | null) | null = null;

	/**
	 * The store's change counter. A new object after every change, so React's
	 * `useSyncExternalStore` renders again.
	 *
	 * @returns The current counter.
	 */
	getSnapshot = (): { version: number } => this.changes.getSnapshot();

	/**
	 * Hear about every change to the store.
	 *
	 * @param listener - Called after each change, or once after a batch.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.changes.subscribe(listener);

	/**
	 * Tell this store's listeners it changed, then the store it propagates to.
	 * Inside {@link batchChanges} the listeners are told once the batch ends.
	 */
	protected emit = (): void => {
		if (batchDepth > 0) {
			pendingStores.add(this);
			return;
		}
		this.flushChange();
	};

	/**
	 * Tell the listeners now. Called by {@link emit} and at the end of a
	 * batch; not for subclasses.
	 *
	 * @internal
	 */
	flushChange = (): void => {
		this.changes.set({ version: this.changes.getSnapshot().version + 1 });
		const parent = this.propagation?.();
		if (parent) {
			parent.emit();
		}
	};

	/**
	 * Tell another store whenever this one changes, so a reader of that store
	 * sees this one's changes too — a room hears its messages and tools.
	 *
	 * @param parent - Reads the store to tell; may change over time.
	 */
	protected propagateTo = (parent: () => ObservableStore | null): void => {
		this.propagation = parent;
	};

	/**
	 * Turn data fields into properties whose assignment tells the listeners.
	 * Call it at the end of the constructor, once the fields hold their first
	 * values. The role MobX's `makeObservable` had: getters and methods need
	 * nothing.
	 *
	 * @param store - The store, `this`.
	 * @param fields - The data fields to watch.
	 */
	protected static observeFields = <T extends ObservableStore>(
		store: T,
		fields: readonly (keyof T & string)[],
	): void => {
		for (const field of fields) {
			let value = store[field];
			Object.defineProperty(store, field, {
				configurable: true,
				enumerable: true,
				get: () => value,
				set: (next: T[typeof field]) => {
					if (Object.is(value, next)) {
						return;
					}
					value = next;
					store.emit();
				},
			});
		}
	};
}
