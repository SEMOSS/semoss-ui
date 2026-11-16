/**
 * The chat's public entry. A host composes these pieces: `ChatProvider` (or
 * `ChatSessionProvider` and `ChatConfigProvider`) at the top, the room list
 * and search in its own chrome, and a room's pieces inside `RoomScope`, laid
 * out however it likes. Every piece is a named export, so a host bundles only
 * what it imports.
 *
 * Biome keeps these exports sorted by path, so they are grouped by feature
 * folder, each with a comment on its first export.
 */

// The session's chat store, its providers, and the hooks that make and read it
export { ChatStore } from "./features/chat/chat.store";
export { ChatProvider } from "./features/chat/chat-provider";
export { ChatSessionProvider } from "./features/chat/chat-session-provider";
export { useChatSelector } from "./features/chat/use-chat-selector";
export { useChatSession } from "./features/chat/use-chat-session";
export { useCreateChatStore } from "./features/chat/use-create-chat-store";
// The host's config: navigation, the theme, and their provider
export type {
	ChatConfig,
	ChatNavigation,
} from "./features/chat-config/chat-config.context";
export { ChatConfigProvider } from "./features/chat-config/chat-config-provider";
export {
	type ChatTheme,
	DEFAULT_CHAT_THEME,
	mergeChatTheme,
} from "./features/chat-config/chat-theme";
export { useChatConfig } from "./features/chat-config/use-chat-config";
// The composer, and the drop target for files dragged onto the conversation
export { FileDropProvider } from "./features/composer/file-drop.context";
export { RoomComposer } from "./features/composer/room-composer";
// Connectors: the catalog, the user's connector tools, and sign in
export { ConnectorServiceIcon } from "./features/connectors/components/connector-service-icon";
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
// The conversation and the room layout around it
export { offersAgentMode } from "./features/conversation/agent-mode-choice";
export { RoomConversation } from "./features/conversation/room-conversation";
export { RoomLayout } from "./features/conversation/room-layout";
export { RoomMessages } from "./features/conversation/room-messages";
export { WorkspaceNavigationContext } from "./features/conversation/workspace-navigation.context";
// Knowledge
export { NewKnowledgeForm } from "./features/knowledge/new-knowledge-form";
// One message's and one tool call's reads
export { useMessage } from "./features/messages/use-message";
export { useTool } from "./features/messages/use-tool";
// The new chat before its first message, and its preferences
export { NewChat } from "./features/new-chat/new-chat";
export {
	isNewChatMode,
	NEW_CHAT_PREFERENCE_KEYS,
	type NewChatBuildDefaults,
	type NewChatMode,
	type NewChatPreferences,
	readDeploymentNewChatDefaults,
	readNewChatPreferences,
} from "./features/new-chat-preferences/new-chat-preferences";
// An open room: its scope, its frame, and the hooks that read it
export { useRoom } from "./features/room/room.context";
export type { RoomStore } from "./features/room/room.store";
export { RoomFrame } from "./features/room/room-frame";
export { RoomScope } from "./features/room/room-scope";
export { useRoomSelector } from "./features/room/use-room-selector";
// The room header and the room's name in it
export { RoomHeader } from "./features/room-header/room-header";
export { RoomTitle } from "./features/room-header/room-title";
// The user's rooms, and search across them
export { RoomList } from "./features/room-list/room-list";
export { RoomSearchDialog } from "./features/room-search/room-search-dialog";
export { useRoomSearchShortcut } from "./features/room-search/use-room-search-shortcut";
// Publishing a room as an agent
export { SaveAgentDialog } from "./features/room-settings/save-agent-dialog";
// The room's Workspace and its toggle
export { RoomWorkbench } from "./features/workbench/room-workbench";
export { RoomWorkbenchToggle } from "./features/workbench/room-workbench-toggle";
// Backend types
export type { App, MCPConfig, Workspace } from "./types";
