import { createContext } from "react";
import type { ThemeMap } from "@semoss/shared";
import type { NewChatBuildDefaults } from "./new-chat-preferences";

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
	/** Start a new chat, as when a room cannot be opened. */
	openNewChat: () => void;
	/** A room was deleted from inside chat UI. */
	onRoomDeleted: (roomId: string) => void;
	/** Open the host's settings on a section; without it, chat UI links to none. */
	openSettings?: (section: "connectors") => void;
}

/** What the host gives every piece of chat UI. */
export interface ChatConfig {
	/** The deployment's theme, with every default filled in. */
	readonly theme: ThemeMap["playground"];
	/** Where chat UI asks the host to go. */
	readonly navigation: ChatNavigation;
	/** The build's new-chat defaults, under the theme's. */
	readonly newChatDefaults: NewChatBuildDefaults;
	/** Where the SEMOSS platform app is served, for catalog links and tool UIs. */
	readonly platformUrl: string;
}

/**
 * The host's chat configuration, provided by `ChatConfigProvider` and read
 * with `useChatConfig`. Undefined outside a provider.
 */
export const ChatConfigContext = createContext<ChatConfig | undefined>(
	undefined,
);
