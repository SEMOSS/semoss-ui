import { createContext, type ReactNode } from "react";
import type { StoreApi } from "zustand";
import type { ConfigStoreState } from "@/stores";

/** Config Zustand store for the current application. */
export const ConfigStoreContext = createContext<
	StoreApi<ConfigStoreState> | undefined
>(undefined);

interface ConfigStoreProviderProps {
	/** Application content that consumes the store. */
	children: ReactNode;

	/** Config store */
	store: StoreApi<ConfigStoreState>;
}

/** Provide one stable config store to the application tree. */
export function ConfigStoreProvider({
	children,
	store,
}: ConfigStoreProviderProps) {
	return (
		<ConfigStoreContext.Provider value={store}>
			{children}
		</ConfigStoreContext.Provider>
	);
}
