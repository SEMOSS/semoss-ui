import { useContext } from "react";
import type { StoreApi } from "zustand";
import { AssistantStoreContext } from "@/contexts/assistant.context";
import type { AssistantState } from "@/stores/assistant";

/**
 * The nearest assistant store handle, for vanilla `getState`/`subscribe` use
 * outside React's render cycle. Prefer `useAssistant` for anything rendered.
 */
export const useAssistantStoreApi = (): StoreApi<AssistantState> => {
	const store = useContext(AssistantStoreContext);
	if (!store) {
		throw new Error(
			"useAssistantStoreApi must be used underneath an assistant store provider",
		);
	}

	return store;
};
