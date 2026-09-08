import { createContext, type ReactNode } from "react";
import type { StoreApi } from "zustand";
import type { DatabaseWorkbenchState } from "@/stores/workbench/database";

/** Scoped store shared by database workbench panels. */
export const DatabaseWorkbenchStoreContext = createContext<
	StoreApi<DatabaseWorkbenchState> | undefined
>(undefined);

interface DatabaseWorkbenchStoreProviderProps {
	/** Store created for this database workbench instance. */
	store: StoreApi<DatabaseWorkbenchState>;

	/** Workbench panels that consume the store. */
	children: ReactNode;
}

/** Provide one database store to the nearest database workbench. */
export function DatabaseWorkbenchStoreProvider({
	store,
	children,
}: DatabaseWorkbenchStoreProviderProps) {
	return (
		<DatabaseWorkbenchStoreContext.Provider value={store}>
			{children}
		</DatabaseWorkbenchStoreContext.Provider>
	);
}
