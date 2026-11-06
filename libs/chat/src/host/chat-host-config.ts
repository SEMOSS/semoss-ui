import type { ComponentType, ReactNode } from "react";
import type {
	ChatPreferencesAdapter,
	RoomEngine,
	RoomEngineConfig,
} from "@semoss/sdk";
import type {
	FileExplorerSecondaryAction,
	FileItem,
	ThemeMap,
	ToolViewLibraries,
} from "@semoss/shared";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import type { SlashCommand } from "../components/lexical/slash-command/types";
import type { RoomIntegrationFactory } from "./room-integration";

/**
 * The chat UI's feature switches. A flag left out keeps its default, which
 * {@link DEFAULT_CHAT_FEATURE_FLAGS} spells out.
 */
export type ChatFeatureFlags = NonNullable<
	ThemeMap["playground"]["featureFlags"]
>;

/**
 * A friendlier message for a backend error: when an error's text matches
 * `pattern`, the UI shows `text`, or the translation at `errorKey`, instead.
 */
export type ChatGracefulError =
	ThemeMap["playground"]["gracefulErrors"][number];

/** A toolbox a new chat starts with. */
export type ChatDefaultTool = ThemeMap["playground"]["defaultTools"][number];

/** The strategy a room's context compaction defaults to. */
export type ChatCompactionStrategy = NonNullable<
	ThemeMap["playground"]["defaultCompactionStrategy"]
>;

/**
 * Where the chat UI sends the user. `@semoss/chat` never imports a router:
 * the host owns its routes and turns each request into its own navigation.
 */
export interface ChatNavigation {
	/**
	 * Show a room.
	 *
	 * @param roomId - The room to show.
	 */
	onOpenRoom(roomId: string): void;
	/**
	 * The address a room is shown at, for links a user can open in a new tab.
	 *
	 * @param roomId - The room.
	 * @returns The room's `href`.
	 */
	getRoomHref(roomId: string): string;
	/**
	 * Start a new chat, optionally with an agent, a knowledge source or a
	 * prompt already chosen.
	 *
	 * @param options - What the new chat starts with.
	 */
	onNewRoom(options?: {
		agentId?: string;
		knowledgeId?: string;
		prompt?: string;
	}): void;
	/** Leave a room that is gone: deleted, or failed to load. */
	onLeaveRoom(): void;
	/**
	 * The address an agent is shown at, for links to it.
	 *
	 * @param agentId - The agent (its workspace id).
	 * @returns The agent's `href`.
	 */
	getAgentHref(agentId: string): string;
	/** Show the agent catalog. */
	onOpenAgents(): void;
	/**
	 * Show an agent.
	 *
	 * @param agentId - The agent (its workspace id).
	 */
	onOpenAgent(agentId: string): void;
	/**
	 * Edit an agent.
	 *
	 * @param agentId - The agent (its workspace id).
	 */
	onEditAgent(agentId: string): void;
	/** Create an agent. */
	onNewAgent(): void;
	/** Show the knowledge library. */
	onOpenKnowledgeList(): void;
	/**
	 * Show a knowledge source.
	 *
	 * @param knowledgeId - The source (its engine id).
	 */
	onOpenKnowledge(knowledgeId: string): void;
	/**
	 * The address a knowledge source is shown at, for links to it.
	 *
	 * @param knowledgeId - The source (its engine id).
	 * @returns The source's `href`.
	 */
	getKnowledgeHref(knowledgeId: string): string;
	/** Go back to wherever the user came from. */
	onBack(): void;
}

/**
 * How a host's file panels plug into a room's Workspace. `@semoss/chat`
 * never imports `@semoss/panels`: a host that shows files hands over the
 * blueprints in {@link ChatHostConfig.panelComponents} and these helpers
 * alongside them.
 */
export interface ChatFilePanels {
	/** The file explorer's panel type, which the Workspace's Files rail opens. */
	explorerType: string;
	/**
	 * The editor panel type that opens a file.
	 *
	 * @param path - The file's path; its extension decides.
	 * @returns The panel type.
	 */
	getPanelType(path: string): string;
	/**
	 * Whether a panel type is one of the file panels, which read the room's
	 * insight and are re-pointed at it on every load.
	 *
	 * @param type - The panel type.
	 * @returns True for a file panel.
	 */
	isFilePanelType(type: string): boolean;
	/**
	 * Wraps the Workspace so its file explorer offers the room's own actions,
	 * such as Add to context. `FileExplorerHostProvider` from
	 * `@semoss/panels`.
	 */
	ExplorerHostProvider?: ComponentType<{
		host: ChatFileExplorerHost;
		children: ReactNode;
	}>;
}

/** The room's additions to a file explorer's right-click menu. */
export interface ChatFileExplorerHost {
	/**
	 * Extra entries for one row.
	 *
	 * @param item - The row's file or directory.
	 * @returns The entries; none when the room has nothing for the item.
	 */
	secondaryActions?: (item: FileItem) => FileExplorerSecondaryAction[];
}

/**
 * Everything a host tells `@semoss/chat`, supplied once through
 * `<ChatProvider config={…}>`. It wraps the SDK's {@link RoomEngineConfig}
 * — how rooms run — with what only a React host needs. Branding (logos,
 * CSS variables, titles, navigation items) is not part of it: the host owns
 * its chrome.
 */
export interface ChatHostConfig {
	/** The host's name, as rooms and exports are labelled. */
	appName: string;
	/** How every room runs: client tools, limits, scope, turn context. */
	engine: RoomEngineConfig;
	/** The model rooms run on when the user does not pick one. */
	defaultModel?: { id: string; name: string };
	/** The UI's feature switches. */
	featureFlags: ChatFeatureFlags;
	/** The toolboxes a new chat starts with; none when unset. */
	defaultTools?: ChatDefaultTool[];
	/**
	 * The temperature a new chat starts at (0–1), when
	 * `featureFlags.enableTemperature` lets the user set one; 0 when unset.
	 */
	defaultTemperature?: number;
	/** The upload types the composer accepts; any type when empty. */
	allowedFileTypes: string[];
	/**
	 * URL prefixes, beyond the web's own, that links in messages may use, such
	 * as a custom protocol.
	 */
	allowedUrlPrefixes: string[];
	/** Friendlier messages for known backend errors. */
	gracefulErrors: ChatGracefulError[];
	/** The strategy a room's context compaction defaults to. */
	defaultCompactionStrategy?: ChatCompactionStrategy;
	/** A note shown while files are dragged over the chat; none when unset. */
	fileDragDisclaimer?: string;
	/**
	 * The embedding model new knowledge uses when the user cannot pick one
	 * (`featureFlags.allowEmbeddingOptions` false).
	 */
	defaultEmbedderId?: string;
	/**
	 * The SEMOSS platform's address, for links to a tool, prompt or app on the
	 * platform; links are left out when unset.
	 */
	platformUrl?: string;
	/**
	 * The Workspace's panel blueprints: the room's own
	 * (`ROOM_PANEL_COMPONENTS`) plus whatever the host adds, such as file
	 * panels and connector viewers. Optional: without them a room has no
	 * Workspace, and the host never loads the dock.
	 */
	panelComponents?: Record<string, WorkbenchPanelConfigAny>;
	/** The host's file panels, when `panelComponents` includes them. */
	filePanels?: ChatFilePanels;
	/** The `component://` libraries tool views are drawn from. */
	toolViewLibraries?: ToolViewLibraries;
	/** Per-room UI integrations, such as connectors; none when unset. */
	integrations?: RoomIntegrationFactory[];
	/** Where the picked model is remembered; nowhere when unset. */
	preferences?: ChatPreferencesAdapter;
	/** Where the chat UI sends the user. */
	navigation: ChatNavigation;
	/**
	 * Where overlays (menus, popovers, dialogs) portal to, so an embed inside a
	 * Shadow DOM can style them; the document body when unset.
	 */
	portalContainer?: HTMLElement | null;
	/**
	 * Commands the host adds to the composer's "/" menu, after the chat's
	 * own. Called as the composer renders, so keep it cheap and pure.
	 *
	 * @param room - The room the composer sends to.
	 * @returns The host's commands.
	 */
	slashCommands?(room: RoomEngine): SlashCommand[];
	/**
	 * Open the host's settings at a page, such as `"connectors"`; the chat
	 * offers no settings link when unset.
	 *
	 * @param page - The settings page.
	 */
	onOpenSettings?(page: string): void;
}

/** The feature switches' defaults, for a host that leaves one out. */
export const DEFAULT_CHAT_FEATURE_FLAGS: Required<
	Pick<
		ChatFeatureFlags,
		| "enableModelSelect"
		| "enableAgent"
		| "enableSuggestions"
		| "enableAgentHarness"
		| "modeFollowsAgent"
		| "enableRewrite"
		| "enablePromptOptimizer"
		| "enableDarkMode"
		| "hideToolsInIframe"
		| "hideChatHistory"
		| "enableKnowledgeMCP"
		| "allowEmbeddingOptions"
		| "showActivityLog"
		| "showPlatformLinks"
		| "enableFeedbackText"
		| "enableTemperature"
	>
> = {
	enableModelSelect: true,
	enableAgent: true,
	enableSuggestions: true,
	enableAgentHarness: false,
	modeFollowsAgent: false,
	enableRewrite: true,
	enablePromptOptimizer: true,
	enableDarkMode: true,
	hideToolsInIframe: false,
	hideChatHistory: false,
	enableKnowledgeMCP: true,
	allowEmbeddingOptions: true,
	showActivityLog: true,
	showPlatformLinks: true,
	enableFeedbackText: true,
	enableTemperature: false,
};
