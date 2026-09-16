import { createContext, type ReactNode } from "react";
import type { StoreApi } from "zustand";
import type { SessionStoreState } from "@/stores";

/** Session Zustand store for the current application. */
export const SessionStoreContext = createContext<
	StoreApi<SessionStoreState> | undefined
>(undefined);

interface SessionStoreProviderProps {
	/** Application content that consumes the store. */
	children: ReactNode;

	/** Session store */
	store: StoreApi<SessionStoreState>;
}

/** Provide one stable session store to the application tree. */
export function SessionStoreProvider({
	children,
	store,
}: SessionStoreProviderProps) {
	return (
		<SessionStoreContext.Provider value={store}>
			{children}
		</SessionStoreContext.Provider>
	);
}
