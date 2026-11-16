import { useContext } from "react";
import { type ChatConfig, ChatConfigContext } from "./chat-config.context";

/**
 * The host's chat configuration.
 *
 * @returns The theme and navigation the host provided.
 */
export const useChatConfig = (): ChatConfig => {
	const config = useContext(ChatConfigContext);
	if (!config) {
		throw new Error("useChatConfig must be used within ChatConfigProvider");
	}
	return config;
};
