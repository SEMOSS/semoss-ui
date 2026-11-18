import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";

/**
 * Human-readable word for each run status, shown to a person on run cards and
 * the batch summary. Keeps the wording in one place so every surface agrees:
 * "waiting for you" rather than the raw "input required", and "done" for a
 * completed run.
 */
const RUN_STATUS_WORD = {
	SUBMITTED: "running",
	RUNNING: "running",
	INPUT_REQUIRED: "waiting for you",
	COMPLETED: "done",
	FAILED: "failed",
	CANCELLED: "cancelled",
} as const satisfies Record<AgentRun["status"], string>;

/** The person-facing word for a run's status (e.g. "waiting for you"). */
export function runStatusWord(status: AgentRun["status"]): string {
	return RUN_STATUS_WORD[status];
}

/**
 * Tailwind classes for a small status dot, so a person can tell a sub-agent's
 * state at a glance: it pulses while running, turns the warning colour when it
 * needs them, red when it failed, and a quiet muted when it is done or stopped.
 */
const RUN_STATUS_DOT = {
	SUBMITTED: "bg-primary animate-pulse motion-reduce:animate-none",
	RUNNING: "bg-primary animate-pulse motion-reduce:animate-none",
	INPUT_REQUIRED: "bg-warning",
	COMPLETED: "bg-success",
	FAILED: "bg-destructive",
	CANCELLED: "bg-muted-foreground",
} as const satisfies Record<AgentRun["status"], string>;

/** Dot colour (and pulse) for a run's status. */
export function runStatusDotClass(status: AgentRun["status"]): string {
	return RUN_STATUS_DOT[status];
}

/**
 * Epoch milliseconds for a stored run timestamp, or null when absent or invalid.
 * The backend writes these without a timezone, so they are read as UTC - the same
 * way the inspector reads startedAt and completedAt - not as the viewer's local
 * time, which would skew a duration by the timezone offset.
 */
function runTimestampMs(value: string | null | undefined): number | null {
	if (!value) return null;
	const parsed = parseTimestampWithUtcDefault(value);
	return parsed.isValid() ? parsed.valueOf() : null;
}

/**
 * How long a run has taken, in milliseconds, or null when it has not started.
 * A finished run measures start to finish; a running one measures start to
 * {@link now} so the caller can tick it upward while it runs.
 */
export function runDurationMs(
	run: Pick<AgentRun, "startedAt" | "completedAt">,
	now: number,
): number | null {
	const started = runTimestampMs(run.startedAt);
	if (started == null) return null;
	const ended = runTimestampMs(run.completedAt) ?? now;
	return Math.max(ended - started, 0);
}

/**
 * A real name for a sub-agent card, following the issue's fallback order: the
 * spawn-time job label, then the executor label, then the first line of the
 * task, and finally a generic "Sub-agent" - never "Child agent".
 */
export function subAgentName(
	run: Pick<AgentRun, "workspaceName" | "executorLabel" | "input">,
): string {
	const label = run.workspaceName || run.executorLabel;
	if (label) return label;
	const firstTaskLine = run.input?.trim().split("\n", 1)[0]?.trim();
	if (!firstTaskLine) return "Sub-agent";
	// A task's first line can be a sentence; keep the name to a short phrase.
	return firstTaskLine.length > 60
		? `${firstTaskLine.slice(0, 57).trimEnd()}…`
		: firstTaskLine;
}
