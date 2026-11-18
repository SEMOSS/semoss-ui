import { type ComponentType, createContext } from "react";
import type { ThemeMap } from "@semoss/shared";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import type { ToolsHost } from "../../tools/chat-tools/tools-host";
import type { NewChatBuildDefaults } from "./new-chat-preferences";

/** What the chat is configured with, beyond its theme. */
export interface ChatOptions {
	/** A room's link, so it opens in a new tab like any link. */
	readonly roomHref: (roomId: string) => string;
	/** An agent's link; without it, chat UI shows no agent links. */
	readonly agentHref?: (workspaceId: string) => string;
	/** The build's new-chat defaults, under the theme's. */
	readonly new?: NewChatBuildDefaults;
	/** Where the SEMOSS platform app is served, for catalog links and tool UIs. */
	readonly platformUrl?: string;
	/**
	 * The origin tool views frame an app's pages from, such as the desktop
	 * app's second local origin, so a tool's page is on another origin than
	 * chat UI and cannot script it. Without it, they are framed from the
	 * module as it is.
	 */
	readonly toolFrameOrigin?: string;
}

/**
 * What the chat tells the host. Chat code never routes itself, so the same
 * pieces work under any router, or none. Keep each one's identity stable.
 */
export interface ChatCallbacks {
	/** Open a room. */
	readonly onOpenRoom: (roomId: string) => void;
	/**
	 * Start a new chat: when a room cannot be opened, and after the open room
	 * is deleted.
	 */
	readonly onOpenNewChat: () => void;
	/**
	 * Open the host's settings dialog, on a page when one is named (chat UI
	 * asks for `"connectors"`); without it, chat UI links to none.
	 */
	readonly onOpenSettings?: (page?: string) => void;
	/**
	 * A room's Workspace opened or closed, so the host can make room for it
	 * (the playground folds its navigation).
	 */
	readonly onWorkbenchOpenChange?: (isOpen: boolean) => void;
}

/**
 * The components a host draws in the chat's places. Each is a plain component
 * with no props, made of the chat's exported items and the host's own; the
 * chat's default is used where one is left out. Declare them at module scope.
 */
export interface ChatComponents {
	/** The items of the composer's plus menu; default `DefaultPlusMenu`. */
	readonly PlusMenu?: ComponentType;
	/** The commands of the composer's "/" menu; default `DefaultSlashCommands`. */
	readonly SlashCommands?: ComponentType;
	/** The icons of the Workspace's rail, after its cog; default `DefaultWorkbenchRail`. */
	readonly WorkbenchRail?: ComponentType;
	/**
	 * Every panel a room's Workspace can open, by panel type. Without it, the
	 * chat's own (`DEFAULT_WORKBENCH_PANEL_COMPONENTS`); a host spreads those
	 * and adds or removes entries. A new object makes a new chat store, and
	 * blueprint identity churn remounts panels.
	 */
	readonly WorkbenchPanels?: Record<string, WorkbenchPanelConfigAny>;
}

/**
 * The host's contract with the chat: one object, given to the chat store
 * (`useCreateChatStore`) and to chat UI (`ChatConfigProvider`), or to
 * `ChatProvider`, which does both.
 */
export interface ChatConfig {
	/** The deployment's theme, with every default filled in. */
	readonly theme: ThemeMap["playground"];
	/** What the chat is configured with. */
	readonly options: ChatOptions;
	/** What the chat tells the host. */
	readonly callbacks: ChatCallbacks;
	/**
	 * The tools the host runs in the browser, such as the desktop app's
	 * folders. Keep its identity stable: a new one makes a new chat store.
	 */
	readonly tools?: ToolsHost;
	/** The host's own components in the chat's places. */
	readonly components?: ChatComponents;
}

/**
 * The host's chat configuration, provided by `ChatConfigProvider` and read
 * with `useChatConfig`. Undefined outside a provider.
 */
export const ChatConfigContext = createContext<ChatConfig | undefined>(
	undefined,
);
