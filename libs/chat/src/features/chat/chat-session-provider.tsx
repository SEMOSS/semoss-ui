import { type ReactNode, useMemo } from "react";
import type { ChatStore } from "./chat.store";
import { ChatSessionContext } from "./chat-session.context";

interface ChatSessionProviderProps {
	/** The session's chat store, made with `useCreateChatStore`. */
	store: ChatStore;
	children: ReactNode;
}

/** Give chat UI the session's chat store: its models, rooms, and agents. */
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
