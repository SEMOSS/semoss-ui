import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { ReactNode } from "react";

dayjs.extend(utc);

export interface TreeNodeSpec {
	id: string;
	label: ReactNode;
	leadingIcon?: ReactNode;
	children?: TreeNodeSpec[];
}

export interface AgentActivityRun {
	roomId: string;
	roomName?: string;
	runId: string;
	parentRunId?: string;
	jobId: string;
	workspaceId: string;
	userId: string;
	modelId: string;
	harnessType: string;
	status: string;
	input: string;
	finalText?: string;
	dateCreated: string;
	startedAt: string;
	completedAt?: string;
	inputMessageId?: string;
	finalOutputMessageId?: string;
	artifacts: unknown[];
}

export type AgentActivityLogResponse = Record<string, AgentActivityRun[]>;

export interface RoomSummary {
	roomId: string;
	roomName: string | null;
	runCount: number;
	mostRecentCompletedAt: string | null;
	sortMs: number;
}

export interface TranscriptToolCall {
	name: string;
	arguments: Record<string, unknown>;
	id: string;
	type: string;
}

export interface TranscriptToolResult {
	output: string;
	serverTool: boolean;
	toolStatus: "success" | "error";
	toolCallId: string;
	toolParameterValues: Record<string, unknown>;
	toolName: string;
}

export interface TranscriptPart {
	type: "SYSTEM" | "TEXT" | "THINKING" | "TOOL_CALL" | "TOOL_RESULT";
	prompt?: string;
	uiText?: string;
	text?: string;
	thinking?: string;
	toolCall?: TranscriptToolCall;
	toolResult?: TranscriptToolResult;
}

export interface TranscriptMessage {
	messageId: string;
	visible: boolean;
	io: "INPUT" | "OUTPUT";
	type: "INPUT_TEXT" | "RESPONSE_TOOL" | "INPUT_TOOL_EXEC" | "RESPONSE_TEXT";
	dateCreated: string;
	ornaments: {
		modelName: string;
		agentRunRole:
			| "input"
			| "assistant_tool"
			| "tool_result"
			| "final_output";
		agentRunId: string;
	};
	parts: TranscriptPart[];
}

export interface SubagentRun {
	runId: string;
	parentRunId?: string;
	roomId: string;
	workspaceId: string;
	modelId: string;
	harnessType: string;
	jobId: string;
	status: string;
	input: string;
	finalText?: string;
	errorMessage?: string;
	dateCreated: string;
	startedAt?: string;
	completedAt?: string;
	userId: string;
	artifacts: unknown[];
}

export interface AgentRunDetail {
	jobId: string;
	runId: string;
	parentRunId?: string;
	roomId: string;
	roomName?: string;
	userId: string;
	workspaceId: string;
	harnessType: string;
	modelId: string;
	status: string;
	input: string;
	finalText?: string;
	errorMessage?: string;
	finalOutputMessageId?: string;
	inputMessageId?: string;
	startedAt?: string;
	completedAt?: string;
	dateCreated: string;
	messages: TranscriptMessage[];
	artifacts: unknown[];
}

/**
 * A subagent run with its full run detail (transcript included when the
 * GetAgentRun fetch succeeded) plus its own recursively-loaded subagents.
 */
export interface SubagentRunNode extends AgentRunDetail {
	children: SubagentRunNode[];
}

export interface RoomRunDetail extends AgentRunDetail {
	subagents: SubagentRunNode[];
}

/**
 * Display info for a model engine, resolved via GetEngineMetadata. `name` is
 * the engine's display name (e.g. "CallCenterModel").
 */
export interface EngineInfo {
	name: string;
}

export const toMs = (dateStr: string | undefined): number =>
	dateStr && dayjs.utc(dateStr).isValid()
		? dayjs.utc(dateStr).valueOf()
		: -Infinity;

export const formatRunDuration = (
	startedAt?: string,
	completedAt?: string,
): string | null => {
	const startMs = toMs(startedAt);
	const endMs = toMs(completedAt);
	if (
		!Number.isFinite(startMs) ||
		!Number.isFinite(endMs) ||
		endMs < startMs
	) {
		return null;
	}
	const ms = endMs - startMs;
	return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
};

export const isFailureStatus = (status: string): boolean =>
	/fail|error|cancel/i.test(status);

export const isActiveStatus = (status: string): boolean =>
	/running|submitted|input/i.test(status);

export const tryParseJson = (value: string): unknown => {
	try {
		return JSON.parse(value);
	} catch {
		return undefined;
	}
};

export const toPrettyJson = (value: unknown): string =>
	JSON.stringify(value, null, 2);
