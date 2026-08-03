import { useContext } from "react";
import { useStore } from "zustand";
import { ChatContext } from "@/contexts";
import type { ChatState, ChatStore } from "@/stores";

/**
 * Access the chat store. Returns `{ chat }` where `chat` is the Zustand StoreApi.
 * Use `useStore(chat, selector)` or `useChatState(selector)` for reactive state.
 * Call `chat.getState().action()` for non-reactive action calls.
 */
export const useChat = (): { chat: ChatStore } => {
	const store = useContext(ChatContext);
	if (store === undefined) {
		throw new Error("useChat must be used within Chat");
	}
	return { chat: store };
};

/**
 * Subscribe to a slice of the chat store state.
 */
export const useChatState = <T>(selector: (s: ChatState) => T): T => {
	const store = useContext(ChatContext);
	if (store === undefined) {
		throw new Error("useChatState must be used within Chat");
	}
	return useStore(store, selector);
};
