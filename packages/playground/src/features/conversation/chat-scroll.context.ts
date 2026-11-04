import { createContext } from "react";

/**
 * Reports whether the conversation is scrolled away from its top, so the
 * header floating over it can blur what passes beneath.
 */
export const ChatScrollContext = createContext<
	((isScrolled: boolean) => void) | null
>(null);
