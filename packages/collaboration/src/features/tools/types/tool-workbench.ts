import type {
	createWorkbenchStore,
	WorkbenchSnapshot,
} from "@semoss/workbench";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";

export interface ToolPanelConfig {
	toolId: string;
}

type ToolDisplayMode = "hidden" | "inline" | "workbench";

export interface ToolWorkbenchContextValue {
	store: ReturnType<typeof createWorkbenchStore>;
	snapshot: WorkbenchSnapshot;
	roomId: string;
	insightId: string;
	openRun: (runId: string) => void;
	tools: Record<string, ConversationTool>;
	/** Presentation metadata from each tool's original message. */
	toolCreatedAt?: Record<string, string>;
	pendingApprovals: PendingToolApproval[];
	isOpen: boolean;
	activeToolId: string | null;
	isToolInline: (toolId: string) => boolean;
	getToolDisplayMode: (toolId: string) => ToolDisplayMode;
	openInline: (toolId: string) => void;
	openWorkbench: (toolId?: string) => void;
	/**
	 * Open a file in the dock: from the room folder, or from another insight
	 * such as the attachment download area, which the dock never re-points.
	 */
	openFile: (path: string, name: string, insightId?: string) => void;
	closeTool: (toolId: string) => void;
	/** Close the dock; true means it owns returning focus to the opening control. */
	closeWorkbench: () => boolean;
	onApproveTool: (
		approval: PendingToolApproval,
		argumentsValue: Record<string, unknown>,
	) => Promise<void>;
	onRejectTool: (approval: PendingToolApproval) => Promise<void>;
}
