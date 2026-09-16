import type {
	AgentRunItem,
	AgentRunItemsState,
	AgentRunSnapshot,
} from "@semoss/sdk";

/** A persisted room message returned with an agent-run snapshot. */
export interface AutomationAgentRunMessage {
	messageId?: string;
	dateCreated?: string;
	visible?: boolean;
	ornaments?: {
		agentRunRole?: string;
	};
	parts?: AutomationAgentRunMessagePart[];
}

/** The persisted message fields used by Automation's agent-run activity view. */
export interface AutomationAgentRunMessagePart {
	type?: string;
	text?: string;
	uiText?: string;
	thinking?: string;
	toolCall?: {
		id?: string;
		name?: string;
		title?: string;
		arguments?: Record<string, unknown>;
	};
	toolResult?: {
		toolCallId?: string;
		toolStatus?: string;
		output?: string;
	};
}

/** A graphable activity reconstructed from durable history and live events. */
export interface AutomationAgentRunActivity {
	id: string;
	kind: "input" | AgentRunItem["kind"];
	label: string;
	status?: string;
	text?: string;
	arguments?: Record<string, unknown>;
	output?: string;
	error?: string;
	timestamp?: string;
}

/** Every call made to one tool, grouped together instead of one node per call. */
export interface AutomationAgentRunToolGroup {
	id: string;
	toolName: string;
	invocations: AutomationAgentRunActivity[];
}

/** Selection state shared by the Automation agent-run graph and details pane. */
export type AutomationAgentRunSelection =
	| { id: "room"; kind: "room" }
	| { id: "run"; kind: "run" }
	| {
			id: string;
			kind: "activity";
			activity: AutomationAgentRunActivity;
	  }
	| {
			id: string;
			kind: "toolGroup";
			group: AutomationAgentRunToolGroup;
	  };

/** Data sources used to rebuild an Automation agent-run graph. */
export interface AutomationAgentRunGraphData {
	snapshot: AgentRunSnapshot;
	items: AgentRunItemsState;
	messages: AutomationAgentRunMessage[];
}
