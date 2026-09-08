import { createContext, type ReactNode } from "react";
import type { StoreApi } from "zustand";
import type { ModelChatStoreInterface } from "@/stores/workbench/model";

/** Scoped store shared by model-chat workbench panels. */
export const ModelChatStoreContext = createContext<
	StoreApi<ModelChatStoreInterface> | undefined
>(undefined);

interface ModelChatStoreProviderProps {
	/** Store created for this model workbench instance. */
	store: StoreApi<ModelChatStoreInterface>;

	/** Workbench panels that consume the store. */
	children: ReactNode;
}

/** Provide one model chat store to the nearest model workbench. */
export function ModelChatStoreProvider({
	store,
	children,
}: ModelChatStoreProviderProps) {
	return (
		<ModelChatStoreContext.Provider value={store}>
			{children}
		</ModelChatStoreContext.Provider>
	);
}
