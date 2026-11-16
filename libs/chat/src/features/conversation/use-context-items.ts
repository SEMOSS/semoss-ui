import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type {
	ContextItemsSnapshot,
	ContextItemsStore,
} from "./context-items.store";

/**
 * Read a room's queue for its next message.
 *
 * @param store - The room's `contextItems`.
 * @param selector - What to read from the queue.
 * @returns The selection; it re-renders only when the selection changes.
 */
export const useContextItems = <T>(
	store: ContextItemsStore,
	selector: (snapshot: ContextItemsSnapshot) => T,
): T => useStoreSelector(store, selector);
