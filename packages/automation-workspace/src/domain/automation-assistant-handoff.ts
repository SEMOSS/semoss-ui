import type {
	AutomationNode,
	AutomationNodeResult,
	RunStatus,
} from "./automation.types";
import {
	formatDurationMs,
	normalizeAutomationErrorMessage,
} from "./automation-utils";

/**
 * Posted from the trace iframe to the host when the user asks the Assistant
 * for help with a failed run. The host only accepts this after re-validating
 * the message's origin and source against its own trace iframe — the same
 * checks it already applies to every other trace → host message.
 */
export interface AutomationAskAssistantMessage {
	type: "SEMOSS_AUTOMATION_ASK_ASSISTANT";
	/** Business-friendly, user-reviewable prompt prefilled into the Assistant composer. */
	prompt: string;
}

const MAX_STEPS_IN_SUMMARY = 20;
const MAX_ERROR_LENGTH = 400;
const MAX_OUTPUT_PREVIEW_LENGTH = 160;
const MAX_PROMPT_LENGTH = 6000;

/** Collapses internal whitespace onto one line and truncates so no single field can dominate the prompt. */
function boundText(value: string, maxLength: number): string {
	const collapsed = value.replace(/\s+/g, " ").trim();
	if (collapsed.length <= maxLength) return collapsed;
	return `${collapsed.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Extracts the terminal cause from a multi-line runtime error. Python
 * tracebacks put the actionable exception last, so preserve that line rather
 * than truncating the beginning of the stack.
 */
function getFailureReason(error: string): string {
	const lines = error
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	let terminalLineIndex = -1;
	for (let index = lines.length - 1; index >= 0; index -= 1) {
		if (
			/(?:error|exception|failed|timed?\s*out|timeout|refused|denied|unavailable|not found|invalid)/i.test(
				lines[index],
			)
		) {
			terminalLineIndex = index;
			break;
		}
	}
	const terminalError =
		terminalLineIndex >= 0
			? lines.slice(terminalLineIndex).join(" ")
			: (lines.at(-1) ?? error);
	const text = normalizeAutomationErrorMessage(terminalError);
	return boundText(text || terminalError, MAX_ERROR_LENGTH);
}

/** Truncates the fully assembled, multi-line prompt without collapsing its line breaks. */
function truncatePrompt(value: string, maxLength: number): string {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength).trimEnd()}…`;
}

const STATUS_TEXT: Record<RunStatus, string> = {
	RUNNING: "still running",
	SUCCESS: "completed successfully",
	FAILED: "failed",
	INTERRUPTED: "was interrupted",
	CANCELLED: "was cancelled",
};

/**
 * Builds a bounded, business-friendly summary of one run for the Assistant handoff prompt.
 * Only user-facing labels, statuses, durations, error messages, and short output previews are
 * included — never a step's raw configuration (which may hold connection details or secrets).
 */
export function buildAssistantHandoffPrompt(params: {
	status: RunStatus;
	runSummary: string | null;
	steps: AutomationNode[];
	results: AutomationNodeResult[];
}): string {
	const { status, runSummary, steps, results } = params;
	const stepMap = new Map(steps.map((step) => [step.id, step]));

	const lines: string[] = [];
	lines.push(
		`This automation run ${STATUS_TEXT[status] ?? "did not complete"}. Please help me understand what went wrong and how to fix it.`,
	);
	if (runSummary) {
		lines.push("", `Run summary: ${boundText(runSummary, 400)}`);
	}

	const shownResults = results.slice(0, MAX_STEPS_IN_SUMMARY);
	if (shownResults.length > 0) {
		lines.push("", "Step-by-step trace:");
		shownResults.forEach((result, index) => {
			const step = stepMap.get(result.NODE_ID);
			const label = result.NODE_LABEL || step?.label || "Untitled step";
			const parts = [
				`${index + 1}. ${boundText(label, 80)} — ${result.STATUS}`,
			];
			if (result.DURATION_MS != null) {
				parts.push(`(${formatDurationMs(result.DURATION_MS)})`);
			}
			lines.push(parts.join(" "));
			if (result.ERROR_MESSAGE) {
				lines.push(
					`   Failure reason: ${getFailureReason(result.ERROR_MESSAGE)}`,
				);
			}
			if (result.OUTPUT_PREVIEW) {
				lines.push(
					`   Output preview: ${boundText(result.OUTPUT_PREVIEW, MAX_OUTPUT_PREVIEW_LENGTH)}`,
				);
			}
		});
		if (results.length > shownResults.length) {
			lines.push(
				`…and ${results.length - shownResults.length} more step(s) not shown.`,
			);
		}
	}

	return truncatePrompt(lines.join("\n"), MAX_PROMPT_LENGTH);
}
