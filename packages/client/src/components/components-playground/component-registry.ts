import type { ComponentType } from "react";
import { ChatInputDoc } from "./docs/chat-input-doc";
import { ChatPanelDoc } from "./docs/chat-panel-doc";
import { ChatRoomsShellDoc } from "./docs/chat-rooms-shell-doc";
import { EngineSelectDoc } from "./docs/engine-select-doc";
import { McpMenuButtonDoc } from "./docs/mcp-menu-button-doc";
import { McpOverlayDoc } from "./docs/mcp-overlay-doc";
import { MessageBubbleDoc } from "./docs/message-bubble-doc";
import { MessageFeedbackToolbarDoc } from "./docs/message-feedback-toolbar-doc";
import { MessageListDoc } from "./docs/message-list-doc";
import { PromptLibraryDialogDoc } from "./docs/prompt-library-dialog-doc";
import { PromptOptimizerDoc } from "./docs/prompt-optimizer-doc";
import { RoomSidebarDoc } from "./docs/room-sidebar-doc";
import { ToolCallViewDoc } from "./docs/tool-call-view-doc";
import { TypingIndicatorDoc } from "./docs/typing-indicator-doc";

export type ComponentGroup =
	| "Layout"
	| "Composer"
	| "Messages"
	| "Rooms"
	| "Dialogs";

export const COMPONENT_GROUPS: ComponentGroup[] = [
	"Layout",
	"Composer",
	"Messages",
	"Rooms",
	"Dialogs",
];

export interface ComponentDocEntry {
	slug: string;
	title: string;
	group: ComponentGroup;
	Doc: ComponentType;
}

/** Single source of truth: drives both the sidebar nav and the :slug route. */
export const COMPONENT_REGISTRY: ComponentDocEntry[] = [
	{
		slug: "chat-panel",
		title: "ChatPanel",
		group: "Layout",
		Doc: ChatPanelDoc,
	},
	{
		slug: "chat-rooms-shell",
		title: "ChatRoomsShell",
		group: "Layout",
		Doc: ChatRoomsShellDoc,
	},
	{
		slug: "chat-input",
		title: "ChatInput",
		group: "Composer",
		Doc: ChatInputDoc,
	},
	{
		slug: "engine-select",
		title: "EngineSelect",
		group: "Composer",
		Doc: EngineSelectDoc,
	},
	{
		slug: "mcp-menu-button",
		title: "McpMenuButton",
		group: "Composer",
		Doc: McpMenuButtonDoc,
	},
	{
		slug: "mcp-overlay",
		title: "McpOverlay",
		group: "Composer",
		Doc: McpOverlayDoc,
	},
	{
		slug: "prompt-optimizer",
		title: "PromptOptimizer",
		group: "Composer",
		Doc: PromptOptimizerDoc,
	},
	{
		slug: "message-list",
		title: "MessageList",
		group: "Messages",
		Doc: MessageListDoc,
	},
	{
		slug: "message-bubble",
		title: "MessageBubble",
		group: "Messages",
		Doc: MessageBubbleDoc,
	},
	{
		slug: "tool-call-view",
		title: "ToolCallView",
		group: "Messages",
		Doc: ToolCallViewDoc,
	},
	{
		slug: "typing-indicator",
		title: "TypingIndicator",
		group: "Messages",
		Doc: TypingIndicatorDoc,
	},
	{
		slug: "message-feedback-toolbar",
		title: "MessageFeedbackToolbar",
		group: "Messages",
		Doc: MessageFeedbackToolbarDoc,
	},
	{
		slug: "room-sidebar",
		title: "RoomSidebar",
		group: "Rooms",
		Doc: RoomSidebarDoc,
	},
	{
		slug: "prompt-library-dialog",
		title: "PromptLibraryDialog",
		group: "Dialogs",
		Doc: PromptLibraryDialogDoc,
	},
];
