import type { Engine } from "@semoss/shared";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import type {
	ConversationMessage,
	ConversationToolStates,
	PlaygroundTurnPhase,
} from "@/features/messages/types/message";
import type { Session } from "@/types/session";

/** One draft submitted by the room composer. */
export interface ComposerSubmission {
	text: string;
	files: File[];
}

/** A tool awaiting a human decision, with durable harness identity when available. */
export interface PendingToolApproval {
	actionId?: string;
	runId?: string;
	roomId?: string;
	requiresResponse?: boolean;
	toolId: string;
	parentMessageId: string;
	toolName: string;
	arguments: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	uiUrl?: string;
}

/** Everything the room screen renders and every action it can raise. */
export interface RoomViewProps {
	agent: AgentConfiguration;
	insightId: string;
	sessions: Session[];
	agentId: string;
	sessionId: string;
	thread: ConversationMessage[];
	toolStates: ConversationToolStates;
	isSending: boolean;
	isRunning: boolean;
	isLoadingHistory: boolean;
	turnError: string | null;
	transportError: Error | null;
	pendingApprovals: PendingToolApproval[];
	phase: PlaygroundTurnPhase | null;
	modelId: string;
	modelName: string;
	isModelSaving: boolean;
	isModelLocked?: boolean;
	showToolWorkbench?: boolean;
	isCancelling: boolean;
	modelError: Error | null;
	roomInstructions: string;
	onSendMessage: (submission: ComposerSubmission) => Promise<void>;
	onModelChange: (engine: Engine) => Promise<void>;
	onOptimizePrompt: (draft: string, instructions: string) => Promise<string>;
	onCancelTurn: () => Promise<void>;
	onReconnect?: () => Promise<void>;
	onApproveTool: (
		approval: PendingToolApproval,
		argumentsValue: Record<string, unknown>,
	) => Promise<void>;
	onRejectTool: (approval: PendingToolApproval) => Promise<void>;
	onConfigure: (id: string) => void;
	onNewRoom: (agentId?: string) => void;
	onOpenRooms: () => void;
}
