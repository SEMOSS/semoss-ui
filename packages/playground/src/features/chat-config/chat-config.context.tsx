import { createContext } from "react";
import type { ThemeMap } from "@semoss/shared";

/**
 * Where chat UI asks the host to go. Chat code never routes itself, so the
 * same pieces work under any router, or none.
 */
export interface ChatNavigation {
	/** Open a room. */
	openRoom: (roomId: string) => void;
	/** A room was deleted from inside chat UI. */
	onRoomDeleted: (roomId: string) => void;
}

/** What the host gives every piece of chat UI. */
export interface ChatConfig {
	/** The deployment's theme, with every default filled in. */
	readonly theme: ThemeMap["playground"];
	readonly navigation: ChatNavigation;
}

export const ChatConfigContext = createContext<ChatConfig | undefined>(
	undefined,
);
