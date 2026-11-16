import { createContext } from "react";
import type { ChatStore } from "@/stores/chat/chat.store";

/**
 * Value
 */
type ChatSessionContextProps = {
	/** chat store */
	chat: ChatStore;
};

/**
 * Context
 */
export const ChatSessionContext = createContext<
	ChatSessionContextProps | undefined
>(undefined);
