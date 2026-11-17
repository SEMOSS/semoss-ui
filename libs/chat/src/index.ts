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

// The host's config (navigation, the theme, new chat defaults) and its provider
export type {
	ChatConfig,
	ChatNavigation,
} from "./features/chat/config/chat-config.context";
export { ChatConfigProvider } from "./features/chat/config/chat-config-provider";
export {
	type ChatTheme,
	DEFAULT_CHAT_THEME,
	mergeChatTheme,
} from "./features/chat/config/chat-theme";
export {
	isNewChatMode,
	NEW_CHAT_PREFERENCE_KEYS,
	type NewChatBuildDefaults,
	type NewChatMode,
	type NewChatPreferences,
	readDeploymentNewChatDefaults,
	readNewChatPreferences,
} from "./features/chat/config/new-chat-preferences";
export { useChatConfig } from "./features/chat/config/use-chat-config";
// The session: its providers, its chat store, and the hooks that make and read it
export { ChatProvider } from "./features/chat/provider/chat-provider";
export { ChatSessionProvider } from "./features/chat/provider/chat-session-provider";
export { useChatSession } from "./features/chat/provider/use-chat-session";
// Agents: create, save, and delete one in the session's insight
export {
	createAgent,
	deleteAgent,
	editAgent,
} from "./features/chat/store/agent-actions";
export { ChatStore } from "./features/chat/store/chat.store";
export {
	type AgentWorkspaceRead,
	useAgentWorkspace,
} from "./features/chat/store/use-agent-workspace";
export { useChatSelector } from "./features/chat/store/use-chat-selector";
export { useCreateChatStore } from "./features/chat/store/use-create-chat-store";
// Connectors: sign in, the catalog, the user's connector tools, and a service's icon
export { useConnectProvider } from "./features/connectors/accounts/use-connect-provider";
export {
	type ProviderConnection,
	type UseConnectionsResult,
	useConnections,
} from "./features/connectors/accounts/use-connections";
export {
	type ConnectorProviderId,
	type ConnectorService,
	type ConnectorServiceId,
	getConnectorProvider,
	getConnectorService,
	sanitizeConnectorServices,
} from "./features/connectors/store/connector.catalog";
export {
	getConnectorServices,
	readUserConnectorTools,
	writeUserConnectorTools,
} from "./features/connectors/store/connector-tools";
export { ConnectorServiceIcon } from "./features/connectors/viewers/connector-service-icon";
// The conversation: its file drop, composer, and messages
export { FileDropProvider } from "./features/conversation/attachments/file-drop.context";
export { offersAgentMode } from "./features/conversation/composer/agent-mode-choice";
export { RoomComposer } from "./features/conversation/composer/room-composer";
export { RoomMessages } from "./features/conversation/messages/room-messages";
export { RoomConversation } from "./features/conversation/room-conversation";
// One message's and one tool call's reads
export { useMessage } from "./features/conversation/store/use-message";
export { useTool } from "./features/conversation/store/use-tool";
// Knowledge
export { NewKnowledgeForm } from "./features/knowledge/new-knowledge-form";
// The new chat before its first message
export { NewChat } from "./features/new-chat/new-chat";
// An open room: its header, layout, scope, publishing, and the hooks that read it
export { RoomHeader } from "./features/room/header/room-header";
export { RoomTitle } from "./features/room/header/room-title";
export { RoomLayout } from "./features/room/layout/room-layout";
export { WorkspaceNavigationContext } from "./features/room/layout/workspace-navigation.context";
export { useRoom } from "./features/room/scope/room.context";
export { RoomFrame } from "./features/room/scope/room-frame";
export { RoomScope } from "./features/room/scope/room-scope";
export { SaveAgentDialog } from "./features/room/settings/save-agent-dialog";
export type { RoomStore } from "./features/room/store/room.store";
export { useRoomSelector } from "./features/room/store/use-room-selector";
// The user's rooms, and search across them
export { RoomList } from "./features/room-list/list/room-list";
export { RoomSearchDialog } from "./features/room-list/search/room-search-dialog";
export { useRoomSearchShortcut } from "./features/room-list/search/use-room-search-shortcut";
// The room's Workspace and its toggle
export { RoomWorkbenchToggle } from "./features/workbench/rail/room-workbench-toggle";
export { RoomWorkbench } from "./features/workbench/room-workbench";
// Backend types
export type { App, MCPConfig, Workspace } from "./types";
