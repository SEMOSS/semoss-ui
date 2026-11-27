import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { ChatStore } from "../store/chat.store";

/** What the chat session context holds. */
interface ChatSession {
	/** The session's chat store. */
	readonly chat: ChatStore;
}

/**
 * The session's chat store, provided by `ChatSessionProvider` and read with
 * `useChatSession`. Undefined outside a provider.
 */
export const ChatSessionContext = createContext<ChatSession | undefined>(
	undefined,
);

/** Props for {@link ChatSessionProvider}. */
interface ChatSessionProviderProps {
	/** The session's chat store, made with `useCreateChatStore`. */
	store: ChatStore;
	/** The chat UI that reads the store. */
	children: ReactNode;
}

/**
 * Give chat UI the session's chat store: its models and rooms. The context
 * value changes only when the store does.
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

/**
 * Read the session's chat store from `ChatSessionProvider`.
 *
 * @returns The context value, whose `chat` is the store.
 * @throws When called outside a `ChatSessionProvider`.
 */
export const useChatSession = (): ChatSession => {
	const context = useContext(ChatSessionContext);
	if (context === undefined) {
		throw new Error(
			"useChatSession must be used within ChatSessionProvider",
		);
	}
	return context;
};
