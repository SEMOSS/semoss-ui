import { useContext } from "react";
import { useStore } from "zustand";
import { ModelChatStoreContext } from "@/contexts/model-chat.context";
import type { ModelChatStoreInterface } from "@/stores/workbench/model";

/**
 * Typed accessor for the dedicated chat store provided by the nearest
 * `ModelWorkbench`.
 *
 * @name useModelChat
 * @param selector - Selects the slice of chat state to subscribe to.
 * @return The selected slice.
 */
export const useModelChat = <T>(
	selector: (state: ModelChatStoreInterface) => T,
): T => {
	const chatStore = useContext(ModelChatStoreContext);
	if (!chatStore) {
		throw new Error(
			"useModelChat must be used underneath a model chat store provider",
		);
	}

	return useStore(chatStore, selector);
};
