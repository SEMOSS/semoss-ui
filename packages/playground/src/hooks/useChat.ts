import { useContext } from "react";
import { ChatContext } from "@/contexts";

/**
 * Access the current chat store
 * @returns the chat store
 */
export const useChat = () => {
	const context = useContext(ChatContext);
	if (context === undefined) {
		throw new Error("useChat must be used within Chat");
	}

	return context;
};
