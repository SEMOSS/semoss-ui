import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { AbstractMessageStore } from "./abstract-message.store";

/**
 * Read a message and re-render when what you read changes. The message is an
 * entry of its room, so the selector runs on every change to the room; a
 * change to another message leaves this one's entry, and so the selection,
 * as it was, and a streamed token renders only the message it lands in.
 *
 * @param message - The message.
 * @param selector - What to read, through the message's getters.
 * @returns The selection.
 */
export const useMessage = <M extends AbstractMessageStore, T>(
	message: M,
	selector: (message: M) => T,
): T => useStoreSelector(message.room, () => selector(message));
