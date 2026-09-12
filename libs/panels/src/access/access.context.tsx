import { createContext, type ReactNode } from "react";
import type { StoreApi } from "zustand";
import type { PermissionCache } from "./permission-cache";

/**
 * The store a host exposes its resource permissions through.
 *
 * Structural on purpose: the client satisfies it with its session store, which
 * carries auth and user state the panels have no business seeing. A host with
 * no session at all can mount a store that only holds the cache.
 */
export type AccessStore = StoreApi<PermissionCache>;

/** The nearest host's permission cache. */
export const AccessStoreContext = createContext<AccessStore | undefined>(
	undefined,
);

interface AccessStoreProviderProps {
	/** The host's store, which must satisfy `PermissionCache`. */
	store: AccessStore;
	children: ReactNode;
}

/** Provide a host's permission cache to the file panels. */
export function AccessStoreProvider({
	store,
	children,
}: AccessStoreProviderProps) {
	return (
		<AccessStoreContext.Provider value={store}>
			{children}
		</AccessStoreContext.Provider>
	);
}
