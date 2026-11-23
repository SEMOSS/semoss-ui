import {
	type ComponentType,
	createContext,
	type ReactNode,
	useContext,
	useMemo,
} from "react";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import type { ToolsHost } from "../../tools/chat-tools/tools-host";
import {
	type ChatOptions,
	type ResolvedChatOptions,
	resolveChatOptions,
} from "./chat-options";

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
	 * Open the host's settings dialog, on a section when one is named (chat UI
	 * asks for `"connectors"`); without it, chat UI links to none.
	 */
	readonly onOpenSettings?: (section?: string) => void;
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
	/**
	 * The items of the composer's plus menu; default `DefaultPlusMenu`. Null
	 * for no plus menu.
	 */
	readonly PlusMenu?: ComponentType | null;
	/**
	 * The commands of the composer's "/" menu; default `DefaultSlashCommands`.
	 * Null for no "/" menu.
	 */
	readonly SlashCommands?: ComponentType | null;
	/** The icons of the Workspace's rail, after its cog; default `DefaultWorkbenchRail`. */
	readonly WorkbenchRail?: ComponentType;
	/**
	 * The host's trees in a room's Files, beside Room Files, such as the
	 * desktop app's folders: it adds each with `useFileExplorerRoot` from
	 * `@semoss/panels`, and draws nothing. Drawn inside the room's Workspace,
	 * where `useRoom` gives the room. None by default.
	 */
	readonly WorkbenchFileRoots?: ComponentType;
}

/**
 * The host's contract with the chat: one object, given to the chat store
 * (`useCreateChatStore`) and to chat UI (`ChatConfigProvider`), or to
 * `ChatProvider`, which does both.
 */
export interface ChatConfig {
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
	/**
	 * Every panel a room's Workspace can open, by panel type. Without it, the
	 * chat's own (`DEFAULT_WORKBENCH_PANELS`); a host spreads those and adds
	 * or removes entries. A room panel left out, such as the activity log,
	 * leaves the rail and the "/" menu too. Declare it at module scope: a new
	 * object makes a new chat store, and remounts the open panels.
	 */
	readonly workbenchPanels?: Record<string, WorkbenchPanelConfigAny>;
}

/** A host's {@link ChatConfig} with every option's default filled in. */
export type ResolvedChatConfig = Omit<ChatConfig, "options"> & {
	readonly options: ResolvedChatOptions;
};

/**
 * The host's chat configuration with its options' defaults filled in,
 * provided by `ChatConfigProvider` and read with `useChatConfig`. Undefined
 * outside a provider.
 */
export const ChatConfigContext = createContext<ResolvedChatConfig | undefined>(
	undefined,
);

/** Props for {@link ChatConfigProvider}. */
interface ChatConfigProviderProps {
	/** The host's options, callbacks, tools, and components. */
	config: ChatConfig;
	/** The chat UI that reads the config. */
	children: ReactNode;
}

/** Give chat UI what the host decides: its options, components, and where to go. */
export const ChatConfigProvider = ({
	config,
	children,
}: ChatConfigProviderProps) => {
	const value = useMemo(
		() => ({ ...config, options: resolveChatOptions(config.options) }),
		[config],
	);
	return (
		<ChatConfigContext.Provider value={value}>
			{children}
		</ChatConfigContext.Provider>
	);
};

/**
 * Read the host's chat configuration from `ChatConfigProvider`.
 *
 * @returns The host's options, with the chat's defaults filled in, its
 * callbacks, tools, and components.
 * @throws When called outside a `ChatConfigProvider`.
 */
export const useChatConfig = (): ResolvedChatConfig => {
	const config = useContext(ChatConfigContext);
	if (!config) {
		throw new Error("useChatConfig must be used within ChatConfigProvider");
	}
	return config;
};
