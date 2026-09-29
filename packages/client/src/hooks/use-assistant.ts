import { useContext } from "react";
import { useStore } from "zustand";
import { AssistantStoreContext } from "@/contexts/assistant.context";
import type { AssistantState } from "@/stores/assistant";

/** Select state from the nearest workbench's assistant store. */
export const useAssistant = <T>(selector: (state: AssistantState) => T): T => {
	const store = useContext(AssistantStoreContext);
	if (!store) {
		throw new Error(
			"useAssistant must be used underneath an assistant store provider",
		);
	}

	return useStore(store, selector);
};
