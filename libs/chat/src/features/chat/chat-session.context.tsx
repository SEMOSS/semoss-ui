import { createContext } from "react";
import type { ChatStore } from "./chat.store";

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
