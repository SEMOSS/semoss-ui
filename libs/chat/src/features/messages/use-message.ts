import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { AbstractMessageStore } from "./abstract-message.store";

/**
 * Read a message and re-render when what you read changes. Only this
 * message's own changes run the selector, so a streamed token renders the
 * message it lands in and nothing else.
 *
 * @param message - The message.
 * @param selector - What to read, through the message's getters.
 * @returns The selection.
 */
export const useMessage = <M extends AbstractMessageStore, T>(
	message: M,
	selector: (message: M) => T,
): T => useStoreSelector(message, () => selector(message));
