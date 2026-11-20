import { createContext } from "react";
import type { ChatStore } from "../store/chat.store";

/** What the chat session context holds. */
type ChatSessionContextProps = {
	/** The session's chat store. */
	chat: ChatStore;
};

/**
 * The session's chat store, provided by `ChatSessionProvider` and read with
 * `useChatSession`. Undefined outside a provider.
 */
export const ChatSessionContext = createContext<
	ChatSessionContextProps | undefined
>(undefined);
