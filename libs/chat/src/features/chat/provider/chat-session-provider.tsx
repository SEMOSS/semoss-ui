import { type ReactNode, useMemo } from "react";
import type { ChatStore } from "../store/chat.store";
import { ChatSessionContext } from "./chat-session.context";

/** Props for {@link ChatSessionProvider}. */
interface ChatSessionProviderProps {
	/** The session's chat store, made with `useCreateChatStore`. */
	store: ChatStore;
	/** The chat UI that reads the store. */
	children: ReactNode;
}

/**
 * Give chat UI the session's chat store: its models, rooms, and agents.
 * The context value changes only when the store does.
 */
export const ChatSessionProvider = ({
	store,
	children,
}: ChatSessionProviderProps) => {
	const value = useMemo(() => ({ chat: store }), [store]);
	return (
		<ChatSessionContext.Provider value={value}>
			{children}
		</ChatSessionContext.Provider>
	);
};
