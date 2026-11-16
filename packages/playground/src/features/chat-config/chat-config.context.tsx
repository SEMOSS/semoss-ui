import { createContext } from "react";
import type { ThemeMap } from "@semoss/shared";
import type { NewChatBuildDefaults } from "@/features/new-chat-preferences/new-chat-preferences";

/**
 * Where chat UI asks the host to go. Chat code never routes itself, so the
 * same pieces work under any router, or none.
 */
export interface ChatNavigation {
	/** Open a room. */
	openRoom: (roomId: string) => void;
	/** A room's link, so it opens in a new tab like any link. */
	roomHref: (roomId: string) => string;
	/** An agent's link; without it, chat UI shows no agent links. */
	agentHref?: (workspaceId: string) => string;
	/** A room was deleted from inside chat UI. */
	onRoomDeleted: (roomId: string) => void;
}

/** What the host gives every piece of chat UI. */
export interface ChatConfig {
	/** The deployment's theme, with every default filled in. */
	readonly theme: ThemeMap["playground"];
	readonly navigation: ChatNavigation;
	/** The build's new-chat defaults, under the theme's. */
	readonly newChatDefaults: NewChatBuildDefaults;
}

export const ChatConfigContext = createContext<ChatConfig | undefined>(
	undefined,
);
