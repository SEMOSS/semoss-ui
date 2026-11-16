import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { ConnectorsSnapshot, ConnectorsStore } from "./connectors.store";

/**
 * Read a room's connectors and re-render when they change. Without a
 * selector, every change re-renders, so the store's derived reads
 * (`availableSources`, `missingSignIns`, ...) stay current during render.
 *
 * @param store - The room's `connectors`.
 * @param selector - What to read; the whole snapshot when left out.
 * @returns The selection.
 */
export const useConnectors = <T = ConnectorsSnapshot>(
	store: ConnectorsStore,
	selector: (snapshot: ConnectorsSnapshot) => T = (snapshot) =>
		snapshot as unknown as T,
): T => useStoreSelector(store, selector);
