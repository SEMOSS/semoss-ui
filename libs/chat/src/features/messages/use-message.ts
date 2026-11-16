import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type {
	AbstractMessageStore,
	MessageSnapshot,
} from "./abstract-message.store";

/**
 * Read a message and re-render when it changes. Only this message's changes
 * render: a streamed token re-renders the message it lands in, not the room.
 * Without a selector, every change re-renders, so the store's derived reads
 * (`activeChild`, `hasTools`, ...) stay current during render.
 *
 * @param message - The message.
 * @param selector - What to read; the whole snapshot when left out.
 * @returns The selection.
 */
export const useMessage = <S extends MessageSnapshot, T = S>(
	message: AbstractMessageStore<S>,
	selector: (snapshot: S) => T = (snapshot) => snapshot as unknown as T,
): T => useStoreSelector(message, selector);
