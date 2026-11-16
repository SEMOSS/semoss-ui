import { ChatProvider } from "./features/chat/chat-provider";
import { ChatSessionProvider } from "./features/chat/chat-session-provider";
import { ChatConfigProvider } from "./features/chat-config/chat-config-provider";
import { FileDragProvider } from "./features/composer/file-drag.context";
import { RoomComposer } from "./features/composer/room-composer";
import { ConnectorServiceIcon } from "./features/connectors/components/connector-service-icon";
import { RoomContent } from "./features/conversation/room-content";
import { RoomLayout } from "./features/conversation/room-layout";
import { RoomMessages } from "./features/conversation/room-messages";
import { NewKnowledgeFormBody } from "./features/knowledge/new-knowledge-form-body";
import { NewChat } from "./features/new-chat/new-chat";
import { RoomScope } from "./features/room/room-scope";
import { RoomHeader } from "./features/room-header/room-header";
import { RoomTitle } from "./features/room-header/room-title";
import { RoomListSection } from "./features/room-list/room-list-section";
import { RoomSearchDialog } from "./features/room-search/room-search-dialog";
import { SaveWorkspaceDialog } from "./features/room-settings/room-workspace-creation";
import { RoomWorkbench } from "./features/workbench/room-workbench";
import { WorkbenchToggleButton } from "./features/workbench/workbench-toggle-button";

/**
 * The chat's pieces. A host composes them under `Chat.Provider` (or
 * `Chat.SessionProvider` and `Chat.ConfigProvider`), and lays out a room's
 * pieces inside `Chat.Room` however it likes.
 */
export const Chat = {
	/** The session's chat store and the host's config, together. */
	Provider: ChatProvider,
	/** The session's chat store alone, for hosts that put something between it and the config. */
	SessionProvider: ChatSessionProvider,
	/** The host's theme, defaults, platform URL, and navigation alone. */
	ConfigProvider: ChatConfigProvider,
	/** Opens a room by id and provides it to the pieces inside. */
	Room: RoomScope,
	/** A new chat before its first message. */
	NewChat,
	/** A room's conversation beside its Workspace, with a header slot above. */
	Layout: RoomLayout,
	/** A room's header row: the host's controls, the room's name, the Workspace toggle. */
	Header: RoomHeader,
	Title: RoomTitle,
	/** Messages and composer together, outlined while a file is dragged over. */
	Conversation: RoomContent,
	Messages: RoomMessages,
	Composer: RoomComposer,
	/** Lets files dropped on its children attach to the next message. */
	FileDrop: FileDragProvider,
	/** The room's Workspace dock and its toggle. */
	Workbench: RoomWorkbench,
	WorkbenchToggle: WorkbenchToggleButton,
	/** The user's chats, and search across them. */
	RoomList: RoomListSection,
	RoomSearch: RoomSearchDialog,
	/** Save a room's setup as an agent. */
	SaveAgentDialog: SaveWorkspaceDialog,
	/** Create a knowledge base. */
	KnowledgeForm: NewKnowledgeFormBody,
	/** A connector service's logo. */
	ConnectorIcon: ConnectorServiceIcon,
} as const;

export { ChatStore } from "./features/chat/chat.store";
export { throwOnPixelErrors } from "./features/chat/pixel-errors";
export { useChatSession } from "./features/chat/use-chat-session";
export { useCreateChatStore } from "./features/chat/use-create-chat-store";
export type {
	ChatConfig,
	ChatNavigation,
} from "./features/chat-config/chat-config.context";
export {
	type ChatTheme,
	DEFAULT_CHAT_THEME,
	mergeChatTheme,
} from "./features/chat-config/chat-theme";
export { useChatConfig } from "./features/chat-config/use-chat-config";
export {
	type ConnectorProviderId,
	type ConnectorService,
	type ConnectorServiceId,
	getConnectorProvider,
	getConnectorService,
	getConnectorServices,
	sanitizeConnectorServices,
} from "./features/connectors/connector.catalog";
export {
	readUserConnectorTools,
	writeUserConnectorTools,
} from "./features/connectors/connector-tools";
export { useConnectProvider } from "./features/connectors/use-connect-provider";
export {
	type ProviderConnection,
	type UseConnectionsResult,
	useConnections,
} from "./features/connectors/use-connections";
export { offersAgentMode } from "./features/conversation/agent-mode-choice";
export { WorkspaceNavigationContext } from "./features/conversation/workspace-navigation.context";
export {
	isNewChatMode,
	NEW_CHAT_PREFERENCE_KEYS,
	type NewChatBuildDefaults,
	type NewChatMode,
	type NewChatPreferences,
	readDeploymentNewChatDefaults,
	readNewChatPreferences,
} from "./features/new-chat-preferences/new-chat-preferences";
export { useRoom } from "./features/room/room.context";
export type { RoomStore } from "./features/room/room.store";
export type { App, MCPConfig, Workspace } from "./types";
