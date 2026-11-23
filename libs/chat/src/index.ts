/**
 * The chat's public entry. A host composes these pieces: `ChatProvider` at
 * the top, `RoomHistory` in its own navigation, and a room's pieces inside
 * `RoomScope`, laid
 * out however it likes. Every piece is a named export, so a host bundles only
 * what it imports.
 *
 * Biome keeps these exports sorted by path, so they are grouped by feature
 * folder, each with a comment on its first export.
 */

// The host's contract: its config and the components it draws in the chat's places
export type {
	ChatCallbacks,
	ChatComponents,
	ChatConfig,
} from "./features/chat/config/chat-config.context";
export type {
	AgentModePolicy,
	ChatOptions,
} from "./features/chat/config/chat-options";
// The session: its provider, its chat store, and the hook that reads it
export { ChatProvider } from "./features/chat/provider/chat-provider";
export { useChatSession } from "./features/chat/provider/chat-session.context";
export type { ChatStore } from "./features/chat/store/chat.store";
// The conversation: its file drop, composer, and messages
export { FileDropProvider } from "./features/conversation/attachments/file-drop.context";
// The composer's plus menu and "/" menu, for a host that draws its own
export type { Composer } from "./features/conversation/composer/composer.context";
export { useComposer } from "./features/conversation/composer/composer.context";
export { AgentItem } from "./features/conversation/composer/plus-menu/agent-item";
export { AttachFilesItem } from "./features/conversation/composer/plus-menu/attach-files-item";
export { DefaultPlusMenu } from "./features/conversation/composer/plus-menu/default-plus-menu";
export { KnowledgeItem } from "./features/conversation/composer/plus-menu/knowledge-item";
export { ModeItem } from "./features/conversation/composer/plus-menu/mode-item";
export { ToolsItem } from "./features/conversation/composer/plus-menu/tools-item";
export { RoomComposer } from "./features/conversation/composer/room-composer";
export { DefaultSlashCommands } from "./features/conversation/composer/slash-command/default-slash-commands";
export {
	SlashCommand,
	type SlashCommandProps,
} from "./features/conversation/composer/slash-command/slash-command";
export { RoomMessages } from "./features/conversation/messages/room-messages";
export { RoomConversation } from "./features/conversation/room-conversation";
export { RoomSuggestions } from "./features/conversation/suggestions/room-suggestions";
// Knowledge
export { NewKnowledgeForm } from "./features/knowledge/new-knowledge-form";
// The new chat before its first message, and the pieces a host places in it
export { NewChat } from "./features/new-chat/new-chat";
export { NewChatBackdrop } from "./features/new-chat/new-chat-backdrop";
export { NewChatBanner } from "./features/new-chat/new-chat-banner";
export { NewChatWelcome } from "./features/new-chat/new-chat-welcome";
// A room's actions: Publish as Agent's dialog
export { SaveAgentDialog } from "./features/room/actions/save-agent-dialog";
// An open room: its header, layout, scope, and the hooks that read it
export { RoomHeader } from "./features/room/header/room-header";
export { RoomTitle } from "./features/room/header/room-title";
export { RoomFrame } from "./features/room/layout/room-frame";
export { SplitLayout } from "./features/room/layout/split-layout";
export { useWorkbenchNavigation } from "./features/room/layout/use-workbench-navigation";
export { useRoom } from "./features/room/scope/room.context";
export { RoomScope } from "./features/room/scope/room-scope";
export type { RoomStore } from "./features/room/store/room.store";
export { ROOM_PANEL_TYPES } from "./features/room/store/room-workbench-layout";
// The user's rooms, and search across them
export { RoomHistory } from "./features/room-history/room-history";
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
// The user's settings dialog: the chat's pages, which a host hands it beside its own
export { useDefaultUserSettingsSections } from "./features/user-settings/use-default-user-settings-sections";
export {
	type UseUserSettingsDialogReturn,
	useUserSettingsDialog,
} from "./features/user-settings/use-user-settings-dialog";
export type { UserSettingsSection } from "./features/user-settings/user-settings-dialog";
export { UserSettingsDialog } from "./features/user-settings/user-settings-dialog";
// The room's Workspace: its panel blueprints, toggle, and rail, for a host that draws its own icons
export { DEFAULT_WORKBENCH_PANELS } from "./features/workbench/panels/default-workbench-panels";
export { DefaultWorkbenchRail } from "./features/workbench/rail/default-workbench-rail";
export { RoomWorkbenchToggle } from "./features/workbench/rail/room-workbench-toggle";
export {
	useWorkbenchRail,
	type WorkbenchRailValue,
} from "./features/workbench/rail/workbench-rail.context";
export {
	WorkbenchRailItem,
	type WorkbenchRailItemProps,
} from "./features/workbench/rail/workbench-rail-item";
export { RoomWorkbench } from "./features/workbench/room-workbench";
