import type { ReactNode } from "react";
import type { ChatConfig } from "../config/chat-config.context";
import { ChatConfigProvider } from "../config/chat-config.context";
import { useCreateChatStore } from "../store/use-create-chat-store";
import { ChatSessionProvider } from "./chat-session.context";

/** Props for {@link ChatProvider}. */
interface ChatProviderProps {
	/** The host's options, callbacks, tools, and components. */
	config: ChatConfig;
	/** The chat UI that reads the store and the config. */
	children: ReactNode;
}

/**
 * Everything chat UI needs: it makes the chat store from the host's config
 * and provides both. A host that reads the store in the same component that
 * provides it calls `useCreateChatStore(config)` and renders
 * `ChatSessionProvider` and `ChatConfigProvider` itself.
 *
 * @returns The chat store's and the config's providers around `children`.
 */
export const ChatProvider = ({ config, children }: ChatProviderProps) => {
	const store = useCreateChatStore(config);
	return (
		<ChatSessionProvider store={store}>
			<ChatConfigProvider config={config}>{children}</ChatConfigProvider>
		</ChatSessionProvider>
	);
};
