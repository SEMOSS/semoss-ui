import type {
	AutomationRunSummary,
	AutomationTriggerType,
	RunStatus,
} from "../../../domain/automation.types";

/** Runs still in flight are excluded from duration/success-rate math — they have no outcome yet. */
const TERMINAL_STATUSES: ReadonlySet<RunStatus> = new Set([
	"SUCCESS",
	"FAILED",
	"INTERRUPTED",
	"CANCELLED",
]);

export interface RunDashboardStats {
	totalRuns: number;
	/** Of the runs that have finished (terminal status), the fraction that ended in SUCCESS. 0-100, null if none finished yet. */
	successRatePct: number | null;
	/** Mean wall-clock duration across finished runs with a COMPLETED_AT, in ms. Null if none qualify. */
	avgDurationMs: number | null;
	statusCounts: Record<RunStatus, number>;
	triggerCounts: Record<AutomationTriggerType | "UNKNOWN", number>;
	/** STATUS of the run with the latest STARTED_AT, for a Mirth-style deployment status dot. Null if no runs. */
	latestStatus: RunStatus | null;
}

/** Mirth Connect's channel dashboard columns, remapped onto automation run outcomes. */
export interface MirthStyleCounts {
	received: number;
	filtered: number;
	queued: number;
	sent: number;
	errored: number;
}

function runDurationMs(run: AutomationRunSummary): number | null {
	if (!run.COMPLETED_AT) return null;
	const started = Date.parse(run.STARTED_AT);
	const completed = Date.parse(run.COMPLETED_AT);
	if (Number.isNaN(started) || Number.isNaN(completed)) return null;
	return completed - started;
}

/** Aggregates summary stats from whatever run page is already loaded — purely client-side, no new backend call. */
export function computeRunDashboardStats(
	runs: AutomationRunSummary[],
): RunDashboardStats {
	const statusCounts: Record<RunStatus, number> = {
		RUNNING: 0,
		WAITING_FOR_INPUT: 0,
		SUCCESS: 0,
		FAILED: 0,
		INTERRUPTED: 0,
		CANCELLED: 0,
	};
	const triggerCounts: Record<AutomationTriggerType | "UNKNOWN", number> = {
		MANUAL: 0,
		PLAYGROUND: 0,
		SCHEDULED: 0,
		UNKNOWN: 0,
	};

	let finishedCount = 0;
	let successCount = 0;
	let durationSumMs = 0;
	let durationCount = 0;
	let latestStatus: RunStatus | null = null;
	let latestStartedAtMs = -Infinity;

	for (const run of runs) {
		statusCounts[run.STATUS] = (statusCounts[run.STATUS] ?? 0) + 1;
		triggerCounts[run.TRIGGER_TYPE ?? "UNKNOWN"] += 1;

		if (TERMINAL_STATUSES.has(run.STATUS)) {
			finishedCount += 1;
			if (run.STATUS === "SUCCESS") successCount += 1;
		}

		const durationMs = runDurationMs(run);
		if (durationMs !== null) {
			durationSumMs += durationMs;
			durationCount += 1;
		}

		const startedAtMs = Date.parse(run.STARTED_AT);
		if (!Number.isNaN(startedAtMs) && startedAtMs > latestStartedAtMs) {
			latestStartedAtMs = startedAtMs;
			latestStatus = run.STATUS;
		}
	}

	return {
		totalRuns: runs.length,
		successRatePct:
			finishedCount === 0 ? null : (successCount / finishedCount) * 100,
		avgDurationMs:
			durationCount === 0 ? null : durationSumMs / durationCount,
		statusCounts,
		triggerCounts,
		latestStatus,
	};
}

/** Remaps run outcome counts onto Mirth Connect's Received/Filtered/Queued/Sent/Errored dashboard columns. */
export function toMirthStyleCounts(stats: RunDashboardStats): MirthStyleCounts {
	const { statusCounts } = stats;
	return {
		received: stats.totalRuns,
		filtered: statusCounts.CANCELLED,
		queued: statusCounts.RUNNING + statusCounts.WAITING_FOR_INPUT,
		sent: statusCounts.SUCCESS,
		errored: statusCounts.FAILED + statusCounts.INTERRUPTED,
	};
}
