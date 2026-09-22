import type { AgentRunProgress, AgentRunStatusValue } from "@semoss/sdk";

/** Whether one live run item can still receive polling updates. */
type ConversationPartState = "active" | "complete";

/** Per-item phases keyed by the agent run item's stable id. */
export type ConversationPartStates = Record<string, ConversationPartState>;

/** Status shared by persisted and live tool calls in the conversation. */
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
	name: string;
	title: string;
	description?: string;
	arguments: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	status: ConversationToolStatus;
	output?: string;
	error?: string;
	durationMs?: number;
}

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
	  }
	| {
			type: "subagent";
			id: string;
			label: string;
			status: AgentRunStatusValue;
			result?: string;
			error?: string;
	  };

/** A Playground-style message with ordered, typed content parts. */
export interface ConversationMessage {
	id: string;
	role: "user" | "assistant";
	parts: ConversationMessagePart[];
	createdAt?: string;
	/** Present only for the temporary assistant entry driven by a live run. */
	live?: {
		status: AgentRunStatusValue;
		progress?: AgentRunProgress;
		hasStreamGap: boolean;
	};
}
