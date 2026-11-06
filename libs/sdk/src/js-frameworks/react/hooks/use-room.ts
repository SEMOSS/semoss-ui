import { useCallback, useState, useSyncExternalStore } from "react";
import type { AbstractMessageStore } from "../../../stores/room/message/abstract-message.store";
import type { ObservableStore } from "../../../stores/room/observable-store";
import type { RoomEngine } from "../../../stores/room/room-engine.store";
import type { RoomsClient } from "../../../stores/room/rooms-client.store";
import type { ToolCallStore } from "../../../stores/room/tool-call.store";
import { createSelection, useStoreSelector } from "../utility/store-selector";

/** A store nothing changes, for a selector given no store. */
const NO_STORE = {
	getSnapshot: () => null,
	subscribe: () => () => undefined,
};

/**
 * Read part of a room engine store, rendering again only when that part
 * changes. The selector is called with the store whenever it changes; it may
 * build a new object, and one holding the same entries as the last does not
 * render.
 *
 * @param store - The store, or null/undefined for none.
 * @param selector - Picks the part to read.
 * @returns The selected part.
 */
const useObservedStore = <S extends ObservableStore | null | undefined, T>(
	store: S,
	selector: (store: NonNullable<S>) => T,
	fallback: T,
): T =>
	useStoreSelector<unknown, T>(store ?? NO_STORE, () =>
		store ? selector(store as NonNullable<S>) : fallback,
	);

/**
 * Read part of a room, rendering again only when that part changes. A room
 * changes with its messages and tool calls too, so a selector may read
 * through them (`room.tail.parts`); prefer {@link useMessageSelector} for a
 * view of one message, which only that message's changes render.
 *
 * @param room - The room.
 * @param selector - Picks the part to read.
 * @returns The selected part.
 *
 * @example
 * ```tsx
 * const { isLoading, history } = useRoomSelector(room, (r) => ({
 *     isLoading: r.isLoading,
 *     history: r.history,
 * }));
 * ```
 */
export const useRoomSelector = <R extends RoomEngine, T>(
	room: R,
	selector: (room: R) => T,
): T => useStoreSelector<unknown, T>(room, () => selector(room));

/**
 * Read part of a room that may not exist yet, such as a draft's prepared
 * room; the fallback while there is none.
 *
 * @param room - The room, or null/undefined.
 * @param selector - Picks the part to read.
 * @param fallback - The value while there is no room.
 * @returns The selected part.
 */
export const useOptionalRoomSelector = <R extends RoomEngine, T>(
	room: R | null | undefined,
	selector: (room: R) => T,
	fallback: T,
): T => useObservedStore(room, selector, fallback);

/**
 * Read part of one message, rendering again only when that part changes —
 * a streamed chunk renders only the message it fills.
 *
 * @param message - The message.
 * @param selector - Picks the part to read.
 * @returns The selected part.
 */
export const useMessageSelector = <M extends AbstractMessageStore, T>(
	message: M,
	selector: (message: M) => T,
): T => useStoreSelector<unknown, T>(message, () => selector(message));

/**
 * Read part of one tool call, rendering again only when that part changes.
 *
 * @param tool - The call, or null/undefined.
 * @param selector - Picks the part to read.
 * @param fallback - The value while there is no call.
 * @returns The selected part.
 */
export const useToolSelector = <T>(
	tool: ToolCallStore | null | undefined,
	selector: (tool: ToolCallStore) => T,
	fallback: T,
): T => useObservedStore(tool, selector, fallback);

/**
 * Read part of a rooms client — its models, cached rooms, optimistic rooms
 * and rooms version — rendering again only when that part changes.
 *
 * @param client - The rooms client.
 * @param selector - Picks the part to read.
 * @returns The selected part.
 */
export const useRoomsClient = <C extends RoomsClient, T>(
	client: C,
	selector: (client: C) => T,
): T => useStoreSelector<unknown, T>(client, () => selector(client));

/**
 * Read part of any observable store, such as a host's own store built on
 * `ObservableStore`.
 *
 * @param store - The store, or null/undefined.
 * @param selector - Picks the part to read.
 * @param fallback - The value while there is no store.
 * @returns The selected part.
 */
export const useObservableStore = <S extends ObservableStore, T>(
	store: S | null | undefined,
	selector: (store: S) => T,
	fallback: T,
): T => useObservedStore(store, selector, fallback);

/** A stable id for each store, to tell when a list of stores changed. */
const storeIds = new WeakMap<ObservableStore, number>();
let nextStoreId = 0;

/**
 * A store's id, made on first use.
 *
 * @param store - The store.
 * @returns Its id.
 */
const getStoreId = (store: ObservableStore): number => {
	let id = storeIds.get(store);
	if (id === undefined) {
		nextStoreId += 1;
		id = nextStoreId;
		storeIds.set(store, id);
	}
	return id;
};

/**
 * Read from several stores at once, such as the messages folded into one
 * response, rendering again only when the selection changes. Every store in
 * the list is watched.
 *
 * @param stores - The stores.
 * @param selector - Picks what to read from them.
 * @returns The selected part.
 */
export const useStoresSelector = <S extends ObservableStore, T>(
	stores: readonly S[],
	selector: (stores: readonly S[]) => T,
): T => {
	// one cache per component, kept across renders
	const [select] = useState(createSelection);
	const key = stores.map(getStoreId).join(",");
	// biome-ignore lint/correctness/useExhaustiveDependencies: the stores' ids say when the list changed
	const subscribe = useCallback(
		(listener: () => void) => {
			const unsubscribes = stores.map((store) =>
				store.subscribe(listener),
			);
			return () => {
				for (const unsubscribe of unsubscribes) {
					unsubscribe();
				}
			};
		},
		[key],
	);
	// one snapshot per change of any store, as the selection cache needs
	const [snapshots] = useState(() => ({
		key: "",
		version: -1,
		snapshot: {} as object,
	}));
	// made once per render, so reads within a render share the cache
	const selectFromStores = () => selector(stores);
	const getSelection = () => {
		// the stores' change counters, summed: it moves with any of them
		const version = stores.reduce(
			(total, store) => total + store.getSnapshot().version,
			0,
		);
		if (snapshots.key !== key || snapshots.version !== version) {
			snapshots.key = key;
			snapshots.version = version;
			snapshots.snapshot = {};
		}
		return select(snapshots.snapshot, selectFromStores);
	};
	return useSyncExternalStore(subscribe, getSelection, getSelection);
};

/**
 * Read from several tool calls at once, such as a group of them.
 *
 * @param tools - The calls.
 * @param selector - Picks what to read from them.
 * @returns The selected part.
 */
export const useToolsSelector = <T>(
	tools: readonly ToolCallStore[],
	selector: (tools: readonly ToolCallStore[]) => T,
): T => useStoresSelector(tools, selector);
