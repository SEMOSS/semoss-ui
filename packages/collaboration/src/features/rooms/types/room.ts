import type { PendingAgentAction } from "@semoss/sdk";
import type { Engine } from "@semoss/shared";
import type { Agent } from "@/features/agents/types/agent";
import type { ConversationMessage } from "@/features/messages/types/message";
import type { Session } from "@/types/session";

/** One draft submitted by the room composer. */
export interface ComposerSubmission {
	text: string;
	files: File[];
}

/**
 * Everything the room screen renders and every action it can raise.
 *
 * `RoomView` is presentational: it never calls SEMOSS itself. The page above it
 * owns the run and passes results down, which is what keeps SDK calls in feature
 * API modules rather than scattered through the UI.
 */
export interface RoomViewProps {
	agent: Agent;
	sessions: Session[];
	agentId: string;
	sessionId: string;
	/** Timeline entries: the room's persisted history plus the live run. */
	thread: ConversationMessage[];
	/** True while a message is being submitted. */
	isSending: boolean;
	/** True while an agent run is in flight. */
	isRunning: boolean;
	/** True while the room's persisted history is loading. */
	isLoadingHistory: boolean;
	/** Set when the run itself failed server-side, with the server's reason. */
	runError: string | null;
	/** Set when the client could not reach the server. Not a failed run. */
	transportError: Error | null;
	/** Tool calls paused awaiting a human decision. */
	pendingActions: PendingAgentAction[];
	/** Persisted model engine id, or empty to use the server default. */
	modelId: string;
	/** Human-readable name for the current model selection. */
	modelName: string;
	/** True while a model preference is being persisted. */
	isModelSaving: boolean;
	/** True after Stop is requested and before cancellation settles. */
	isCancelling: boolean;
	/** Error resolving the room's persisted model metadata. */
	modelError: Error | null;
	/** The fixed agent's instructions, used when optimizing a draft. */
	roomInstructions: string;
	/** Submit one message as an agent run. */
	onSendMessage: (submission: ComposerSubmission) => Promise<void>;
	/** Persist the selected model for this room. */
	onModelChange: (engine: Engine) => Promise<void>;
	/** Rewrite a draft with the selected model. */
	onOptimizePrompt: (draft: string, instructions: string) => Promise<string>;
	/** Cancel the in-flight run. */
	onCancelRun: () => Promise<void>;
	/** Resolve a paused tool call, optionally with edited arguments or answers. */
	onDecideAction: (
		action: PendingAgentAction,
		decision: "submit" | "reject" | "respond",
		paramValues?: Record<string, unknown>,
	) => Promise<void>;
	onConfigure: (id: string) => void;
	onNewRoom: (agentId?: string) => void;
	onOpenRooms: () => void;
}
