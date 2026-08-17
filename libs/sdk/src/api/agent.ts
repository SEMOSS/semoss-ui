import { Env } from "../env";
import { post } from "../utility";
import { runPixel } from "./base";
import type { PlaygroundMessage } from "./room";

/**
 * Throw when a pixel response contains an operation error. No-op when the
 * error list is empty.
 *
 * @name assertPixelSuccess
 * @param errors - Operation errors collected from a runPixel response.
 */
const assertPixelSuccess = (errors: string[]): void => {
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}
};

/** Lifecycle status of a durable agent run. */
export type AgentRunStatus =
	| "SUBMITTED"
	| "RUNNING"
	| "INPUT_REQUIRED"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED"
	| (string & {});

/** Action awaiting a user decision while a run is INPUT_REQUIRED. */
export type AgentPendingAction = Record<string, unknown> & {
	/** Durable id used to approve/reject/respond via RunMCPTool. */
	actionId?: string;
	/** Name of the tool the agent wants to invoke. */
	toolName?: string;
	/** Arguments the agent supplied for the tool call. */
	toolArgs?: Record<string, unknown> | unknown;
	/** Tool metadata (`_meta`) forwarded from the tool definition. */
	toolMeta?: Record<string, unknown>;
	/** True when the action renders a custom UI instead of a plain prompt. */
	hasUi?: boolean;
	/** URL of the custom UI to render for the action. */
	uiUrl?: string;
	/** Current lifecycle status of the pending action. */
	status?: string;
};

/** Durable agent run record returned by RunAgent / GetAgentRun. */
export interface AgentRunRecord {
	/** Durable id of the run. */
	runId: string;
	/** Id of the parent run when this run is a delegated subagent. */
	parentRunId?: string | null;
	/** Display alias for a subagent run. */
	alias?: string;
	/** Room the run executed against. */
	roomId?: string;
	/** Workspace the run executed within. */
	workspaceId?: string;
	/** Engine id of the model that served the run. */
	modelId?: string;
	/** Agent harness that executed the run (e.g. "semoss"). */
	harnessType?: string;
	/** Lifecycle status of the run. */
	status?: AgentRunStatus;
	/** User prompt that started the run. */
	input?: string;
	/** Durable message id of the persisted input message. */
	inputMessageId?: string;
	/** Final assistant text produced by the run. */
	finalText?: string;
	/** Durable message id of the persisted final output message. */
	finalOutputMessageId?: string;
	/** Backend failure reason for FAILED / CANCELLED runs. */
	errorMessage?: string;
	/** When the run record was created. */
	dateCreated?: string;
	/** When the run started executing. */
	startedAt?: string;
	/** When the run reached a terminal status. */
	completedAt?: string;
	/** Actions awaiting a user decision while INPUT_REQUIRED. */
	pendingActions?: AgentPendingAction[];
	/** Legacy job id; used as the run id when `runId` is absent. */
	jobId?: string;
}

/** Durable run record with its persisted messages attached. */
export type AgentRunRecordWithMessages = AgentRunRecord & {
	/** Persisted playground messages attached to the run. */
	messages?: PlaygroundMessage[];
};

/** One item in an agent run's live activity stream. */
export interface AgentStreamItem {
	/** Stream-scoped id of the item (durable message id once completed). */
	id: string;
	/** Category of the item on the activity feed. */
	kind: "message" | "reasoning" | "tool" | "subagent";
	/** Author role for message items. */
	role?: string;
	/** Accumulated text for message/reasoning items. */
	text?: string;
	/** Durable message id assigned when a message item completes. */
	messageId?: string;
	/** Reasoning summary text. */
	summary?: string;
	/** Tool name for tool items. */
	name?: string;
	/** Display title for tool items. */
	title?: string;
	/** Tool description for tool items. */
	description?: string;
	/** Arguments supplied to the tool call. */
	arguments?: Record<string, unknown>;
	/** Tool metadata forwarded from the tool definition. */
	metadata?: Record<string, unknown>;
	/** Current status of the tool call or subagent run. */
	status?: string;
	/** Tool output once the call completes. */
	output?: string;
	/** Failure reason for the tool call or subagent run. */
	error?: string;
	/** Wall-clock duration of the tool call in milliseconds. */
	durationMs?: number;
	/** Durable run id of a delegated subagent. */
	childRunId?: string;
	/** Display alias of a delegated subagent. */
	alias?: string;
	/** Room a subagent run executed against. */
	roomId?: string;
	/** Workspace a subagent run executed within. */
	workspaceId?: string;
	/** Short preview of a subagent's final result. */
	resultPreview?: string;
}

/** One event emitted on an agent run's live activity stream. */
export interface AgentStreamEvent {
	/** Stream protocol version. */
	version: number;
	/** Unique id of the event. */
	eventId: string;
	/** Monotonic position of the event on the run's stream. */
	sequence: number;
	/** Run the event belongs to. */
	runId: string;
	/** When the event was emitted. */
	timestamp: string;
	/** Lifecycle phase of the item the event describes. */
	type: "item.started" | "item.updated" | "item.completed";
	/** Full item payload for started/completed events. */
	item?: AgentStreamItem;
	/** Id of the item an update event targets. */
	itemId?: string;
	/** Kind of the item an update event targets. */
	kind?: AgentStreamItem["kind"];
	/** Incremental text appended to a message/reasoning item. */
	delta?: string;
	/** Partial fields merged into a tool/subagent item. */
	patch?: Partial<AgentStreamItem>;
}

/** Run snapshot included with every streaming poll response. */
export type AgentRunStreamSnapshot = AgentRunRecord & {
	/** Room the run executed against (always present on snapshots). */
	roomId: string;
	/** Current lifecycle status (always present on snapshots). */
	status: AgentRunStatus;
};

/** Response of one agentRunStreaming poll. */
export interface AgentRunStreamingResponse {
	/** Latest run snapshot at poll time. */
	run: AgentRunStreamSnapshot;
	/** Events emitted since the previous poll. */
	events: AgentStreamEvent[];
	/** Count of events evicted before the client could read them. */
	droppedEvents: number;
}

/** Inline tool definition forwarded to RunAgent via paramValues.tools. */
export interface AgentToolDefinition {
	/** Unique tool name the model calls. */
	name: string;
	/** Display title shown in the UI. */
	title?: string;
	/** What the tool does; shown to the model. */
	description?: string;
	/** JSON schema describing the tool's arguments. */
	inputSchema: Record<string, unknown>;
	/** Execution metadata (e.g. SMSS_MCP_EXECUTION) for the harness. */
	_meta?: Record<string, unknown>;
}

/** Structured parameters forwarded to RunAgent via paramValues. */
export interface RunAgentParamValues {
	/** Tool permission mode for the run (e.g. "default"). */
	permissionMode?: string;
	/** Whether extended thinking is enabled. */
	thinking?: boolean;
	/** Thinking budget hint (low | medium | high | xhigh). */
	effort?: string;
	/** Inline tool definitions exposed to the run. */
	tools?: AgentToolDefinition[];
	[key: string]: unknown;
}

/**
 * True when a run has stopped progressing without user input. Treats
 * INPUT_REQUIRED as terminal because the stream stays idle until the user
 * decides on the pending action.
 *
 * @name isTerminalAgentRunStatus
 * @param status - Run status to test; compared case-insensitively.
 * @return Whether the status is COMPLETED, FAILED, CANCELLED, or
 * INPUT_REQUIRED.
 */
export const isTerminalAgentRunStatus = (status?: string): boolean => {
	const normalized = (status ?? "").trim().toUpperCase();
	return (
		normalized === "COMPLETED" ||
		normalized === "FAILED" ||
		normalized === "CANCELLED" ||
		normalized === "INPUT_REQUIRED"
	);
};

/**
 * Pick the pixel result whose output is the durable run record (carries a
 * string `status`); RunAgent may emit auxiliary outputs alongside it.
 *
 * @name findAgentRunOutput
 * @param results - Pixel return entries from a RunAgent response.
 * @return The run record output, or null when none matches.
 */
const findAgentRunOutput = (
	results: { output: unknown }[],
): AgentRunRecord | null => {
	for (const result of results) {
		const output = result?.output;
		if (
			output &&
			typeof output === "object" &&
			typeof (output as AgentRunRecord).status === "string"
		) {
			return output as AgentRunRecord;
		}
	}
	return null;
};

/**
 * Start a durable agent run against a room (semoss harness, non-blocking).
 *
 * Failures surface as `status: FAILED | CANCELLED` on the returned record —
 * the backend does not throw for them — so callers must inspect the status.
 *
 * @name runAgent
 * @param insightId - Insight the pixel executes against.
 * @param params - Run parameters: target roomId, model engineId, user
 * command, maxTurns budget, structured paramValues, and optional image file
 * paths to attach to the input message.
 * @return The durable run record; `runId` falls back to `jobId` when the
 * backend only returns a job id.
 */
export const runAgent = async (
	insightId: string,
	params: {
		roomId: string;
		engineId: string;
		command: string;
		maxTurns: number;
		paramValues: RunAgentParamValues;
		image?: string[];
	},
): Promise<AgentRunRecord> => {
	const imagePart = params.image?.length
		? `, image=${JSON.stringify(params.image)}`
		: "";
	const response = await runPixel<[AgentRunRecord]>(
		`RunAgent(roomId=${JSON.stringify(params.roomId)}, engine=${JSON.stringify(params.engineId)}, command=[${JSON.stringify(`<encode>${params.command}</encode>`)}], harnessType=["semoss"], maxTurns=${params.maxTurns}, maxReflections=0, paramValues=[${JSON.stringify(params.paramValues)}]${imagePart}, wait=false);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const record = findAgentRunOutput(response.pixelReturn);
	if (!record?.runId && !record?.jobId) {
		throw new Error("RunAgent did not return a durable run ID");
	}

	return { ...record, runId: record.runId ?? (record.jobId as string) };
};

/**
 * Poll the live activity stream for a run (snapshot + new events). Throws
 * when no run id is provided.
 *
 * @name getAgentRunStreaming
 * @param runId - Durable id of the run to poll.
 * @return The latest run snapshot, events emitted since the previous poll,
 * and the dropped-event count.
 */
export const getAgentRunStreaming = async (
	runId: string,
): Promise<AgentRunStreamingResponse> => {
	if (!runId) {
		throw new Error("No run id provided for streaming");
	}

	const response = await post<AgentRunStreamingResponse>(
		`${Env.MODULE}/api/engine/agentRunStreaming`,
		{ runId },
	);

	return response.data;
};

/**
 * Load the durable record (and optionally messages) for one run.
 *
 * @name getAgentRun
 * @param insightId - Insight the pixel executes against.
 * @param runId - Durable id of the run to load.
 * @param includeMessages - Whether to attach the run's persisted messages;
 * defaults to true.
 * @return The run record, or null when the run does not exist.
 */
export const getAgentRun = async (
	insightId: string,
	runId: string,
	includeMessages = true,
): Promise<AgentRunRecordWithMessages | null> => {
	const response = await runPixel<[AgentRunRecordWithMessages]>(
		`GetAgentRun(runId=${JSON.stringify(runId)}, includeMessages=${includeMessages});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	return response.pixelReturn[0]?.output ?? null;
};

/**
 * Load every root run for a room, oldest first.
 *
 * @name getAgentRunsForRoom
 * @param insightId - Insight the pixel executes against.
 * @param roomId - Room whose runs to load.
 * @param includeMessages - Whether to attach each run's persisted messages;
 * defaults to true.
 * @return The room's root run records, or an empty array when none exist.
 */
export const getAgentRunsForRoom = async (
	insightId: string,
	roomId: string,
	includeMessages = true,
): Promise<AgentRunRecordWithMessages[]> => {
	const response = await runPixel<[AgentRunRecordWithMessages[]]>(
		`GetAgentRunsForRoom(roomId=${JSON.stringify(roomId)}, includeMessages=${includeMessages});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const records = response.pixelReturn[0]?.output;
	return Array.isArray(records) ? records : [];
};

/**
 * Load the delegated (child) runs spawned by a run.
 *
 * @name getSubagentRuns
 * @param insightId - Insight the pixel executes against.
 * @param runId - Durable id of the parent run.
 * @return The child run records, or an empty array when none exist.
 */
export const getSubagentRuns = async (
	insightId: string,
	runId: string,
): Promise<AgentRunRecord[]> => {
	const response = await runPixel<[AgentRunRecord[]]>(
		`GetSubagentRuns(runId=${JSON.stringify(runId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const records = response.pixelReturn[0]?.output;
	return Array.isArray(records) ? records : [];
};

/**
 * Request cancellation of an in-flight run.
 *
 * @name stopAgentRun
 * @param insightId - Insight the pixel executes against.
 * @param runId - Durable id of the run to cancel.
 * @return Resolves when the cancellation request is accepted.
 */
export const stopAgentRun = async (
	insightId: string,
	runId: string,
): Promise<void> => {
	const response = await runPixel<[unknown]>(
		`StopAgentRun(runId=${JSON.stringify(runId)});`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/**
 * Approve or reject a pending tool action on an INPUT_REQUIRED run.
 *
 * @name decideAgentAction
 * @param insightId - Insight the pixel executes against.
 * @param actionId - Id of the pending action to decide.
 * @param decision - "approve" to run the tool, "reject" to skip it.
 * @return Resolves when the decision is recorded.
 */
export const decideAgentAction = async (
	insightId: string,
	actionId: string,
	decision: "approve" | "reject",
): Promise<void> => {
	const response = await runPixel<[unknown]>(
		`RunMCPTool(actionId=[${JSON.stringify(actionId)}], decision=[${JSON.stringify(decision)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};

/**
 * Answer a pending RequestUserInput action with structured answers.
 *
 * @name respondToAgentUserInput
 * @param insightId - Insight the pixel executes against.
 * @param actionId - Id of the pending RequestUserInput action.
 * @param answers - Answer map keyed by question id.
 * @return Resolves when the response is delivered to the run.
 */
export const respondToAgentUserInput = async (
	insightId: string,
	actionId: string,
	answers: Record<string, string | string[] | boolean>,
): Promise<void> => {
	const payload = JSON.stringify({ version: 1, answers });
	const response = await runPixel<[unknown]>(
		`RunMCPTool(actionId=[${JSON.stringify(actionId)}], decision=["respond"], mcpToolResult=[${JSON.stringify(payload)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);
};
