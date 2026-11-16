import { useContext } from "react";
import { ChatSessionContext } from "./chat-session.context";

/**
 * Read the session's chat store from `ChatSessionProvider`.
 *
 * @returns The context value, whose `chat` is the store.
 * @throws When called outside a `ChatSessionProvider`.
 */
export const useChatSession = () => {
	const context = useContext(ChatSessionContext);
	if (context === undefined) {
		throw new Error(
			"useChatSession must be used within ChatSessionProvider",
		);
	}

	return context;
};
