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
	/** Open a file from the room folder in the dock. */
	openFile: (path: string, name: string) => void;
	closeTool: (toolId: string) => void;
	closeWorkbench: () => void;
	onApproveTool: (
		approval: PendingToolApproval,
		argumentsValue: Record<string, unknown>,
	) => Promise<void>;
	onRejectTool: (approval: PendingToolApproval) => Promise<void>;
}
