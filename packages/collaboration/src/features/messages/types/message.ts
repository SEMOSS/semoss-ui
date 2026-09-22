/** Whether one streaming message part can still receive chunks. */
type ConversationPartState = "active" | "complete";

/** Status shared by persisted and live playground tool calls. */
export type ConversationToolStatus =
	| "QUEUED"
	| "RUNNING"
	| "INPUT_REQUIRED"
	| "COMPLETED"
	| "FAILED"
	| "REJECTED"
	| "CANCELLED";

/** One tool call rendered in a message and opened in the room workbench. */
export interface ConversationTool {
	id: string;
	parentMessageId: string;
	name: string;
	title: string;
	description?: string;
	arguments: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	serverTool?: boolean;
	uiUrl?: string;
	status: ConversationToolStatus;
	output?: string;
	error?: string;
	durationMs?: number;
}

/** Controller-owned changes applied over durable tool calls. */
export type ConversationToolStates = Record<
	string,
	Partial<
		Pick<
			ConversationTool,
			"arguments" | "status" | "output" | "error" | "durationMs" | "uiUrl"
		>
	>
>;

export type PlaygroundTurnPhase =
	| "streaming"
	| "executing_tools"
	| "awaiting_approval"
	| "cancelling"
	| "completed"
	| "failed";

export type ConversationMessagePart =
	| {
			type: "text";
			text: string;
			state?: ConversationPartState;
	  }
	| {
			type: "thinking";
			text: string;
			state?: ConversationPartState;
	  }
	| {
			type: "tool";
			tool: ConversationTool;
	  }
	| {
			type: "media";
			fileName: string;
			fileLocation?: string;
			mimeType?: string;
	  };

/** A Playground-style message with ordered, typed content parts. */
export interface ConversationMessage {
	id: string;
	role: "user" | "assistant";
	parts: ConversationMessagePart[];
	createdAt?: string;
	parentMessageId?: string;
	visible?: boolean;
	live?: {
		phase: PlaygroundTurnPhase;
		hasObservationIssue: boolean;
	};
}
