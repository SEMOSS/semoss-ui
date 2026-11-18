import { createContext } from "react";
import type { ThemeMap } from "@semoss/shared";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import type { LocalFoldersHost } from "../../local-folders/store/local-folders-host";
import type { ChatCustomization } from "./chat-customization";
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
	/**
	 * Open the host's settings dialog, on a section when one is named (chat UI
	 * asks for `"connectors"`); without it, chat UI links to none.
	 */
	openSettings?: (section?: string) => void;
}

/**
 * The host's contract with the chat: one object, given to the chat store
 * (`useCreateChatStore`) and to chat UI (`ChatConfigProvider`), or to
 * `ChatProvider`, which does both.
 */
export interface ChatConfig {
	/** The deployment's theme, with every default filled in. */
	readonly theme: ThemeMap["playground"];
	/** Where chat UI asks the host to go. */
	readonly navigation: ChatNavigation;
	/** The build's new-chat defaults, under the theme's. */
	readonly newChatDefaults: NewChatBuildDefaults;
	/** Where the SEMOSS platform app is served, for catalog links and tool UIs. */
	readonly platformUrl: string;
	/**
	 * The origin tool views frame an app's pages from, such as the desktop
	 * app's second local origin, so a tool's page is on another origin than
	 * chat UI and cannot script it. Without it, they are framed from the
	 * module as it is.
	 */
	readonly toolFrameOrigin?: string;
	/**
	 * The host's way to the user's own files, such as the desktop app's
	 * attached folders. Without it, chat UI offers no folders to attach. Keep
	 * its identity stable: a new one makes a new chat store.
	 */
	readonly localFolders?: LocalFoldersHost;
	/**
	 * Hears when a room's Workspace opens or closes, so the host can make room
	 * for it (the playground folds its navigation). Keep its identity stable.
	 */
	readonly onWorkbenchOpenChange?: (isOpen: boolean) => void;
	/**
	 * Every panel a room's Workspace can open, by panel type. Without it, the
	 * chat's own (`DEFAULT_WORKBENCH_PANEL_COMPONENTS`); a host spreads those
	 * and adds or removes entries. Declare it at module scope: a new object
	 * makes a new chat store, and blueprint identity churn remounts panels.
	 */
	readonly workbenchPanelComponents?: Record<string, WorkbenchPanelConfigAny>;
	/** The host's changes to the lists chat UI builds; see {@link ChatCustomization}. */
	readonly customize?: ChatCustomization;
}

/**
 * The host's chat configuration, provided by `ChatConfigProvider` and read
 * with `useChatConfig`. Undefined outside a provider.
 */
export const ChatConfigContext = createContext<ChatConfig | undefined>(
	undefined,
);
