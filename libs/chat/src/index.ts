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

// The host's contract: its config, the theme, and how it customizes the chat's lists
export type {
	ChatConfig,
	ChatNavigation,
} from "./features/chat/config/chat-config.context";
export { ChatConfigProvider } from "./features/chat/config/chat-config-provider";
export type { ChatCustomization } from "./features/chat/config/chat-customization";
export {
	type ChatTheme,
	DEFAULT_CHAT_THEME,
	mergeChatTheme,
} from "./features/chat/config/chat-theme";
export type { NewChatBuildDefaults } from "./features/chat/config/new-chat-preferences";
export { useChatConfig } from "./features/chat/config/use-chat-config";
export {
	resolveServerChatTheme,
	useServerChatTheme,
} from "./features/chat/config/use-server-chat-theme";
// The session: its providers, its chat store, and the hooks that make and read it
export { ChatProvider } from "./features/chat/provider/chat-provider";
export { ChatSessionProvider } from "./features/chat/provider/chat-session-provider";
export { useChatSession } from "./features/chat/provider/use-chat-session";
export { ChatStore } from "./features/chat/store/chat.store";
export { useChatSelector } from "./features/chat/store/use-chat-selector";
export {
	type ChatStoreConfig,
	useCreateChatStore,
} from "./features/chat/store/use-create-chat-store";
// The conversation: its file drop, composer, and messages
export { FileDropProvider } from "./features/conversation/attachments/file-drop.context";
export { RoomComposer } from "./features/conversation/composer/room-composer";
// The composer's plus menu and a slash command, for a host that customizes them
export {
	RoomComposerMenu,
	type RoomComposerMenuProps,
} from "./features/conversation/composer/room-composer-menu";
export type { SlashCommand } from "./features/conversation/composer/slash-command/slash-command";
export { RoomMessages } from "./features/conversation/messages/room-messages";
export { RoomConversation } from "./features/conversation/room-conversation";
// Knowledge
export { NewKnowledgeForm } from "./features/knowledge/new-knowledge-form";
// Folders on the user's machine, for a host that can reach them
export type {
	LocalFolder,
	LocalFoldersHost,
} from "./features/local-folders/store/local-folders-host";
// The new chat before its first message
export { NewChat } from "./features/new-chat/new-chat";
// A room's actions: Publish as Agent's dialog, and an action a host adds or removes
export { SaveAgentDialog } from "./features/room/actions/save-agent-dialog";
export type {
	DefaultRoomActionId,
	RoomActionItem,
} from "./features/room/actions/use-room-action-items";
// An open room: its header, layout, scope, and the hooks that read it
export { RoomHeader } from "./features/room/header/room-header";
export { RoomTitle } from "./features/room/header/room-title";
export { RoomLayout } from "./features/room/layout/room-layout";
export { useRoom } from "./features/room/scope/room.context";
export { RoomFrame } from "./features/room/scope/room-frame";
export { RoomScope } from "./features/room/scope/room-scope";
export type { RoomStore } from "./features/room/store/room.store";
// One message's and one tool call's reads
export { useMessage } from "./features/room/store/use-message";
export { useRoomSelector } from "./features/room/store/use-room-selector";
export { useTool } from "./features/room/store/use-tool";
// The user's rooms, and search across them
export { RoomList } from "./features/room-list/list/room-list";
export { RoomSearchDialog } from "./features/room-list/search/room-search-dialog";
export { useRoomSearchShortcut } from "./features/room-list/search/use-room-search-shortcut";
// Reading one agent
export { useAgentWorkspace } from "./features/tools/mcp/use-agent-workspace";
// The user's settings dialog: General and Connectors, plus the host's own pages
export {
	type UseUserSettingsDialogReturn,
	useUserSettingsDialog,
} from "./features/user-settings/use-user-settings-dialog";
export { UserSettingsDialog } from "./features/user-settings/user-settings-dialog";
export type { UserSettingsSection } from "./features/user-settings/user-settings-section";
// The room's Workspace: its panel blueprints, toggle, and a panel a host adds or removes
export { DEFAULT_WORKBENCH_PANEL_COMPONENTS } from "./features/workbench/panels/room-panel-components";
export { RoomWorkbenchToggle } from "./features/workbench/rail/room-workbench-toggle";
export type { WorkbenchPanelOption } from "./features/workbench/rail/use-workbench-panels";
export { RoomWorkbench } from "./features/workbench/room-workbench";
// Backend types
export type { App, MCPConfig, Workspace } from "./types";
