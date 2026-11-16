import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { ChatSnapshot, ChatStore } from "./chat.store";

/**
 * Read the chat's state (its models, cached rooms, and room list counter)
 * and re-render when it changes.
 *
 * @param chat - The session's chat store.
 * @param selector - What to read; the whole snapshot when left out.
 * @returns The selection.
 */
export const useChatState = <T = ChatSnapshot>(
	chat: ChatStore,
	selector: (snapshot: ChatSnapshot) => T = (snapshot) =>
		snapshot as unknown as T,
): T => useStoreSelector(chat, selector);
