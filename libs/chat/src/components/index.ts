/**
 * Presentational entry point — "@semoss/chat/components". These components
 * are built directly on @semoss/ui's tokens/components (Button, Spinner,
 * bg-accent/bg-card/border-input, etc.) to match playground's actual look
 * rather than an invented palette — see docs/chat-components/PLAN.md's
 * design-approach decision. That means the host app must already have
 * `@semoss/ui/globals.css` imported (and typically a `<ThemeProvider>`
 * from `@semoss/ui/next`) — this package ships no CSS of its own.
 */

import { Chat as ChatRoot } from "./chat";
import { ChatHeader } from "./chat-header";
import { ChatInput, createDefaultSlashCommands } from "./chat-input";
import { ChatRoomsPage } from "./chat-rooms-page";
import { EngineSelect } from "./engine-select";
import { FileEditorSidebar } from "./file-editor-sidebar";
import { McpMenuButton } from "./mcp-menu-button";
import { McpOverlay } from "./mcp-overlay";
import { MessageBubble } from "./message-bubble";
import { MessageFeedbackToolbar } from "./message-feedback-toolbar";
import { MessageList } from "./message-list";
import { PromptLibraryDialog } from "./prompt-library-dialog";
import { PromptOptimizer } from "./prompt-optimizer";
import { RoomSettingsSidebar } from "./room-settings-sidebar";
import { RoomSidebar } from "./room-sidebar";
import { SelectionChatButton } from "./selection-chat-button";
import { ToolCallView } from "./tool-call-view";
import { ToolResponseSidebar } from "./tool-response-sidebar";
import { TypingIndicator } from "./typing-indicator";

const Chat = Object.assign(ChatRoot, {
	Header: ChatHeader,
	Input: ChatInput,
	createDefaultSlashCommands,
	RoomsPage: ChatRoomsPage,
	EngineSelect,
	FileEditorSidebar,
	McpMenuButton,
	McpOverlay,
	MessageBubble,
	MessageFeedbackToolbar,
	MessageList,
	PromptLibraryDialog,
	PromptOptimizer,
	RoomSettingsSidebar,
	RoomSidebar,
	SelectionChatButton,
	ToolCallView,
	ToolResponseSidebar,
	TypingIndicator,
});

export { Chat };

// Re-export types for consumers that need them directly.
export type { ChatProps } from "./chat";
export type { ChatHeaderProps } from "./chat-header";
export type {
	ChatInputDefaultSlashCommandActions,
	ChatInputDefaultSlashCommandId,
	ChatInputMcpTab,
	ChatInputProps,
	ChatInputSlashCommand,
} from "./chat-input";
export type { ChatRoomsPageProps } from "./chat-rooms-page";
export type { EngineSelectProps } from "./engine-select";
export type { FileEditorSidebarProps } from "./file-editor-sidebar";
export type { McpMenuButtonProps } from "./mcp-menu-button";
export type {
	McpOverlayAgent,
	McpOverlayOpenMode,
	McpOverlayWorkspaceRef,
} from "./mcp-overlay";
export type { MessageBubbleProps, ToolResponseDetails } from "./message-bubble";
export type { MessageFeedbackToolbarProps } from "./message-feedback-toolbar";
export type { MessageListProps, MessageRenderHelpers } from "./message-list";
export type {
	PromptLibraryDialogProps,
	PromptLibraryItem,
} from "./prompt-library-dialog";
export type { PromptOptimizerProps } from "./prompt-optimizer";
export type { RoomSettingsSidebarProps } from "./room-settings-sidebar";
export type { RoomSidebarProps } from "./room-sidebar";
export type { SelectionChatButtonProps } from "./selection-chat-button";
export type { ToolCallStatus, ToolCallViewProps } from "./tool-call-view";
export type { TypingIndicatorProps } from "./typing-indicator";
