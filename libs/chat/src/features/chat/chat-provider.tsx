import type { ReactNode } from "react";
import type { ChatConfig } from "../chat-config/chat-config.context";
import { ChatConfigProvider } from "../chat-config/chat-config-provider";
import { ChatSessionProvider } from "./chat-session-provider";
import { useCreateChatStore } from "./use-create-chat-store";

interface ChatProviderProps {
	/** The host's theme, defaults, platform URL, and navigation. */
	config: ChatConfig;
	children: ReactNode;
}

/**
 * Everything chat UI needs, for a host that has nothing to put between the
 * session and the config: it makes the chat store and provides both.
 */
export const ChatProvider = ({ config, children }: ChatProviderProps) => {
	const store = useCreateChatStore(config.theme, config.newChatDefaults);
	return (
		<ChatSessionProvider store={store}>
			<ChatConfigProvider config={config}>{children}</ChatConfigProvider>
		</ChatSessionProvider>
	);
};
