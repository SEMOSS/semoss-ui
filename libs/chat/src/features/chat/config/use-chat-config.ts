import { useContext } from "react";
import { type ChatConfig, ChatConfigContext } from "./chat-config.context";

/**
 * Read the host's chat configuration from `ChatConfigProvider`.
 *
 * @returns The theme, new-chat defaults, platform URL, and navigation the
 * host provided.
 * @throws When called outside a `ChatConfigProvider`.
 */
export const useChatConfig = (): ChatConfig => {
	const config = useContext(ChatConfigContext);
	if (!config) {
		throw new Error("useChatConfig must be used within ChatConfigProvider");
	}
	return config;
};
