import { useContext } from "react";
import { ChatSessionContext } from "./chat-session.context";

/**
 * Access the current chat store
 * @returns the chat store
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
