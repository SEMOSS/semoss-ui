import { createContext, type ReactNode } from "react";
import type { StoreApi } from "zustand";
import type { AssistantState } from "@/stores/assistant";

/** Scoped store shared by the assistant panel and its subviews. */
export const AssistantStoreContext = createContext<
	StoreApi<AssistantState> | undefined
>(undefined);

interface AssistantStoreProviderProps {
	/** Store created for this workbench instance. */
	store: StoreApi<AssistantState>;

	/** Workbench content that consumes the store. */
	children: ReactNode;
}

/** Provide one assistant store to the nearest workbench. */
export function AssistantStoreProvider({
	store,
	children,
}: AssistantStoreProviderProps) {
	return (
		<AssistantStoreContext.Provider value={store}>
			{children}
		</AssistantStoreContext.Provider>
	);
}
