import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { ChatStore } from "./chat.store";

/**
 * Read the session's chat store (its models, cached rooms, and the room list
 * counter) and re-render when what you read changes.
 *
 * The store's getters read its snapshot, so the selector reads through the
 * store rather than the snapshot it is handed.
 *
 * @param chat - The chat store.
 * @param selector - What to read, through the store's getters.
 * @returns The selection.
 */
export const useChatSelector = <T>(
	chat: ChatStore,
	selector: (chat: ChatStore) => T,
): T => useStoreSelector(chat, () => selector(chat));
