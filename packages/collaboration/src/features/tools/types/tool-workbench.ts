import type { PendingAgentAction } from "@semoss/sdk";
import type { createWorkbenchStore } from "@semoss/workbench";
import type { ConversationTool } from "@/features/messages/types/message";

export interface ToolPanelConfig {
	toolId: string;
}

type ToolDisplayMode = "hidden" | "inline" | "workbench";

export interface ToolWorkbenchContextValue {
	store: ReturnType<typeof createWorkbenchStore>;
	roomId: string;
	tools: Record<string, ConversationTool>;
	pendingActions: PendingAgentAction[];
	isOpen: boolean;
	activeToolId: string | null;
	isToolInline: (toolId: string) => boolean;
	getToolDisplayMode: (toolId: string) => ToolDisplayMode;
	openInline: (toolId: string) => void;
	openWorkbench: (toolId: string) => void;
	closeTool: (toolId: string) => void;
	closeWorkbench: () => void;
	onDecideAction: (
		action: PendingAgentAction,
		decision: "submit" | "reject" | "respond",
		paramValues?: Record<string, unknown>,
	) => Promise<void>;
}
