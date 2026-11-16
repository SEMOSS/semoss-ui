import { createContext } from "react";
import type { ChatStore } from "@/stores";

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
