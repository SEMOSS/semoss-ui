import { useContext } from "react";
import { ChatConfigContext } from "./chat-config.context";
import type { ChatCustomization } from "./chat-customization";

/** What chat UI reads when the host customizes nothing. */
const NO_CUSTOMIZATION: ChatCustomization = {};

/**
 * Read the host's customization of the chat's lists. Unlike `useChatConfig`
 * it does not need a `ChatConfigProvider`: without one, nothing is customized.
 *
 * @returns The host's `ChatConfig.customize`, or an empty customization.
 */
export const useChatCustomization = (): ChatCustomization =>
	useContext(ChatConfigContext)?.customize ?? NO_CUSTOMIZATION;
