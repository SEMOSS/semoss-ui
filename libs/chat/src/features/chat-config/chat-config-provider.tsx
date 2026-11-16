import type { ReactNode } from "react";
import { type ChatConfig, ChatConfigContext } from "./chat-config.context";

interface ChatConfigProviderProps {
	/** The host's theme, defaults, platform URL, and navigation. */
	config: ChatConfig;
	children: ReactNode;
}

/** Give chat UI what the host decides: its theme, defaults, and where to go. */
export const ChatConfigProvider = ({
	config,
	children,
}: ChatConfigProviderProps) => (
	<ChatConfigContext.Provider value={config}>
		{children}
	</ChatConfigContext.Provider>
);
