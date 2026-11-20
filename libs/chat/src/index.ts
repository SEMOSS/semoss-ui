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

// The host's contract: its config, the theme, and the components it draws in the chat's places
export type {
	ChatCallbacks,
	ChatComponents,
	ChatConfig,
	ChatOptions,
} from "./features/chat/config/chat-config.context";
export { ChatConfigProvider } from "./features/chat/config/chat-config-provider";
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
// The composer's plus menu and "/" menu, for a host that draws its own
export type { Composer } from "./features/conversation/composer/composer.context";
export { AttachFilesItem } from "./features/conversation/composer/plus-menu/attach-files-item";
export { ChooseAgentItem } from "./features/conversation/composer/plus-menu/choose-agent-item";
export { DefaultPlusMenu } from "./features/conversation/composer/plus-menu/default-plus-menu";
export { KnowledgeItem } from "./features/conversation/composer/plus-menu/knowledge-item";
export { ModeChoiceItem } from "./features/conversation/composer/plus-menu/mode-choice-item";
export { ToolsItem } from "./features/conversation/composer/plus-menu/tools-item";
export { RoomComposer } from "./features/conversation/composer/room-composer";
export { DefaultSlashCommands } from "./features/conversation/composer/slash-command/default-slash-commands";
export {
	SlashCommand,
	type SlashCommandProps,
} from "./features/conversation/composer/slash-command/slash-command";
export { useComposer } from "./features/conversation/composer/use-composer";
export { RoomMessages } from "./features/conversation/messages/room-messages";
export { RoomConversation } from "./features/conversation/room-conversation";
// Knowledge
export { NewKnowledgeForm } from "./features/knowledge/new-knowledge-form";
// The new chat before its first message
export { NewChat } from "./features/new-chat/new-chat";
// A room's actions: Publish as Agent's dialog
export { SaveAgentDialog } from "./features/room/actions/save-agent-dialog";
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
// Tools a host runs in the browser, and the folder tools a host offers over a folder of its own
export { splitFolderPath } from "./features/tools/chat-tools/folder-path";
export { FolderToolError } from "./features/tools/chat-tools/folder-text";
export { summarizeFolderToolCall } from "./features/tools/chat-tools/folder-tool-labels";
export {
	describeFolderTool,
	executeFolderTool,
	FOLDER_TOOL_OPERATIONS,
	type FolderSpace,
	type FolderToolOperation,
} from "./features/tools/chat-tools/folder-tools";
export type {
	FolderEntry,
	ToolFolder,
} from "./features/tools/chat-tools/room-folder";
export type {
	ClientTool,
	ClientToolExecution,
	ClientToolOutcome,
	HostFiles,
	ToolsHost,
	ToolsHostChange,
} from "./features/tools/chat-tools/tools-host";
// Reading one agent
export { useAgentWorkspace } from "./features/tools/mcp/use-agent-workspace";
// The user's settings dialog: the chat's pages, which a host hands it beside its own
export { useDefaultSettingsPages } from "./features/user-settings/use-default-settings-pages";
export {
	type UseUserSettingsDialogReturn,
	useUserSettingsDialog,
} from "./features/user-settings/use-user-settings-dialog";
export { UserSettingsDialog } from "./features/user-settings/user-settings-dialog";
export type { UserSettingsSection } from "./features/user-settings/user-settings-section";
// The room's Workspace: its panel blueprints, toggle, and rail, for a host that draws its own icons
export { DEFAULT_WORKBENCH_PANEL_COMPONENTS } from "./features/workbench/panels/room-panel-components";
export { DefaultWorkbenchRail } from "./features/workbench/rail/default-workbench-rail";
export {
	RailItem,
	type RailItemProps,
} from "./features/workbench/rail/rail-item";
export { RoomWorkbenchToggle } from "./features/workbench/rail/room-workbench-toggle";
export { useWorkbench } from "./features/workbench/rail/use-workbench";
export type { WorkbenchRail } from "./features/workbench/rail/workbench-rail.context";
export { RoomWorkbench } from "./features/workbench/room-workbench";
// Backend types
export type { App, MCPConfig, Workspace } from "./types";
