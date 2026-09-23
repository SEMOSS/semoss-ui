import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type {
	AgentRunDetail,
	TranscriptMessage,
	TranscriptPart,
} from "./agent-activity-types";
import { toMs } from "./agent-activity-types";

dayjs.extend(utc);

/**
 * Events returned by GetClaudeCodeTranscriptHistory ( roomId = ... ) - the
 * room's Claude Code JSONL parsed through ClaudeCodeTranscriptParser. Runs on
 * the claude_code harness only persist input/final-output room messages, so
 * this transcript is the only source of their tool calls and results.
 */
export interface ClaudeCodeTranscriptEvent {
	event: string;
	uuid?: string;
	parentUuid?: string | null;
	sessionId?: string;
	data?: unknown;
}

interface ClaudeCodeAssistantThinking {
	thinking?: string | null;
	redacted?: boolean;
	model?: string;
	timestamp?: string;
}

interface ClaudeCodeAssistantText {
	text?: string;
	model?: string;
	timestamp?: string;
}

interface ClaudeCodeToolInvocation {
	toolUseId?: string;
	toolName?: string;
	description?: string;
	subagentType?: string | null;
	timestamp?: string;
}

interface ClaudeCodeAssistantData {
	thinking?: ClaudeCodeAssistantThinking[];
	texts?: ClaudeCodeAssistantText[];
	toolInvocations?: ClaudeCodeToolInvocation[];
	model?: string;
	stopReason?: string | null;
}

interface ClaudeCodeToolResultData {
	toolUseId?: string | null;
	status?: string;
	durationMs?: number;
	filePath?: string | null;
	content?: string | null;
	timestamp?: string;
	stats?: Record<string, number>;
}

const eventTimestamp = (event: ClaudeCodeTranscriptEvent): string | null => {
	const data = (event.data ?? {}) as Record<string, unknown>;
	if (typeof data.timestamp === "string" && data.timestamp) {
		return data.timestamp;
	}
	// Assistant events carry timestamps on their content items instead.
	const assistant = data as ClaudeCodeAssistantData;
	return (
		assistant.toolInvocations?.[0]?.timestamp ??
		assistant.texts?.[0]?.timestamp ??
		assistant.thinking?.[0]?.timestamp ??
		null
	);
};

/** Clock-skew slack when matching JSONL timestamps to AGENT_RUN windows. */
const RUN_WINDOW_SLACK_MS = 10_000;

const isWithinRunWindow = (
	event: ClaudeCodeTranscriptEvent,
	run: AgentRunDetail,
): boolean => {
	const ts = eventTimestamp(event);
	if (!ts) {
		return false;
	}
	const eventMs = dayjs.utc(ts).valueOf();
	if (!Number.isFinite(eventMs)) {
		return false;
	}
	const startMs = toMs(run.startedAt ?? run.dateCreated);
	if (Number.isFinite(startMs) && eventMs < startMs - RUN_WINDOW_SLACK_MS) {
		return false;
	}
	const endMs = toMs(run.completedAt);
	if (Number.isFinite(endMs) && eventMs > endMs + RUN_WINDOW_SLACK_MS) {
		return false;
	}
	return true;
};

const toolCallArguments = (
	invocation: ClaudeCodeToolInvocation,
): Record<string, unknown> => {
	const args: Record<string, unknown> = {};
	if (invocation.description) {
		args.description = invocation.description;
	}
	if (invocation.subagentType) {
		args.subagent_type = invocation.subagentType;
	}
	return args;
};

/**
 * Convert parsed Claude Code events into synthetic TranscriptMessages in the
 * shape GetAgentRun returns for the semoss harness, so the activity graph,
 * tool panels, and transcript tree consume both harnesses identically.
 * Text-only assistant events are skipped - the final answer already exists as
 * the run's final_output room message.
 */
const toTranscriptMessages = (
	events: ClaudeCodeTranscriptEvent[],
	runId: string,
): TranscriptMessage[] => {
	const messages: TranscriptMessage[] = [];

	events.forEach((event, index) => {
		const uuid = event.uuid || `evt-${index}`;

		if (event.event === "assistant") {
			const data = (event.data ?? {}) as ClaudeCodeAssistantData;
			const thinking = data.thinking ?? [];
			const toolInvocations = data.toolInvocations ?? [];
			if (thinking.length === 0 && toolInvocations.length === 0) {
				return;
			}

			const parts: TranscriptPart[] = [];
			for (const item of thinking) {
				if (item.thinking) {
					parts.push({ type: "THINKING", thinking: item.thinking });
				}
			}
			if (toolInvocations.length > 0) {
				for (const item of data.texts ?? []) {
					if (item.text) {
						parts.push({ type: "TEXT", text: item.text });
					}
				}
			}
			toolInvocations.forEach((invocation, invocationIndex) => {
				parts.push({
					type: "TOOL_CALL",
					toolCall: {
						id:
							invocation.toolUseId ||
							`cc-${uuid}-call-${invocationIndex}`,
						name: invocation.toolName || "tool",
						arguments: toolCallArguments(invocation),
						type: "tool_use",
					},
				});
			});
			if (parts.length === 0) {
				return;
			}

			messages.push({
				messageId: `cc-${uuid}`,
				visible: true,
				io: "OUTPUT",
				type: "RESPONSE_TOOL",
				dateCreated: eventTimestamp(event) ?? "",
				ornaments: {
					modelName: data.model ?? "",
					agentRunRole: "assistant_tool",
					agentRunId: runId,
				},
				parts,
			});
			return;
		}

		if (event.event === "tool_result") {
			const data = (event.data ?? {}) as ClaudeCodeToolResultData;
			if (!data.toolUseId) {
				return;
			}
			const parameterValues: Record<string, unknown> = {};
			if (data.filePath) {
				parameterValues.filePath = data.filePath;
			}
			if (data.durationMs) {
				parameterValues.durationMs = data.durationMs;
			}

			messages.push({
				messageId: `cc-${uuid}-result`,
				// Results render nested under their tool call, not as their
				// own transcript step.
				visible: false,
				io: "INPUT",
				type: "INPUT_TOOL_EXEC",
				dateCreated: data.timestamp ?? "",
				ornaments: {
					modelName: "",
					agentRunRole: "tool_result",
					agentRunId: runId,
				},
				parts: [
					{
						type: "TOOL_RESULT",
						toolResult: {
							toolCallId: data.toolUseId,
							toolName: "",
							output: data.content ?? "",
							toolParameterValues: parameterValues,
							toolStatus: /error|fail/i.test(data.status ?? "")
								? "error"
								: "success",
							serverTool: false,
						},
					},
				],
			});
		}
	});

	return messages;
};

/**
 * Merge a room's Claude Code transcript into a run's messages. When the room
 * hosts multiple runs the events are first narrowed to the run's start/end
 * window (the JSONL is per room, not per run). Existing room messages keep
 * their place: input first, synthetic activity in the middle, final output
 * last.
 */
export const mergeClaudeCodeTranscript = (
	run: AgentRunDetail,
	events: ClaudeCodeTranscriptEvent[],
	filterToRunWindow: boolean,
): AgentRunDetail => {
	const relevant = filterToRunWindow
		? events.filter((event) => isWithinRunWindow(event, run))
		: events;
	const synthetic = toTranscriptMessages(relevant, run.runId);
	if (synthetic.length === 0) {
		return run;
	}

	const existing = run.messages ?? [];
	const inputs = existing.filter(
		(message) => message.ornaments?.agentRunRole === "input",
	);
	const finals = existing.filter(
		(message) => message.ornaments?.agentRunRole === "final_output",
	);
	const others = existing.filter(
		(message) => !inputs.includes(message) && !finals.includes(message),
	);

	return {
		...run,
		messages: [...inputs, ...others, ...synthetic, ...finals],
	};
};
