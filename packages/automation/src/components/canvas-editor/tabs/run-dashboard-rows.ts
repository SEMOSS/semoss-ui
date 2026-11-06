import type {
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunSummary,
	NodeStatus,
	RunStatus,
} from "../../../domain/automation.types";
import {
	lastRelevantResult,
	runtimeNodeId,
	statusForResults,
} from "./run-data-browser-data";

/** `${runId}:${nodeId}` — identifies one loop node's expand/collapse state within one run. */
export type LoopRowKey = string;

/** Mirrors the backend rule: only a RUNNING or agent-waiting run can be cancelled. */
export function isRunCancellable(status: RunStatus): boolean {
	return status === "RUNNING" || status === "WAITING_FOR_INPUT";
}

export function loopRowKey(runId: string, nodeId: string): LoopRowKey {
	return `${runId}:${nodeId}`;
}

interface BaseDashboardRow {
	/** Unique across the whole flattened list — used as both React key and virtualizer index anchor. */
	key: string;
	depth: 0 | 1 | 2;
}

export interface DashboardRunRow extends BaseDashboardRow {
	kind: "run";
	depth: 0;
	run: AutomationRunSummary;
	/** 1-based, ascending by STARTED_AT across all currently fetched runs — the first run ever is 1. */
	runNumber: number;
	expanded: boolean;
	loading: boolean;
	loadError?: string;
}

export interface DashboardNodeRow extends BaseDashboardRow {
	kind: "node";
	depth: 1;
	runId: string;
	node: AutomationNodeResult;
	isLoop: boolean;
	iterationCount: number;
	/** Only meaningful when isLoop is true. */
	expanded: boolean;
}

export interface DashboardIterationRow extends BaseDashboardRow {
	kind: "iteration";
	depth: 2;
	runId: string;
	nodeId: string;
	nodeLabel: string;
	iterationIndex: number;
	status: NodeStatus | undefined;
	durationMs: number;
	stepCount: number;
	/** The step whose incoming/outgoing/variable-map data is shown when this row is clicked. */
	result: AutomationNodeResult | null;
}

export type DashboardRow =
	| DashboardRunRow
	| DashboardNodeRow
	| DashboardIterationRow;

export interface BuildDashboardRowsParams {
	runs: AutomationRunSummary[];
	expandedRunIds: ReadonlySet<string>;
	runDetails: ReadonlyMap<string, AutomationRunDetail>;
	loadingRunIds: ReadonlySet<string>;
	runErrors: ReadonlyMap<string, string>;
	expandedLoopKeys: ReadonlySet<LoopRowKey>;
	/** Precomputed by assignRunNumbers(allRuns) — pass this when `runs` is a filtered subset so IDs stay stable while searching. */
	runNumbers?: ReadonlyMap<string, number>;
}

/**
 * Flattens runs into one row per run, plus (when expanded) one row per node
 * and, for loop nodes that are further expanded, one row per loop iteration —
 * so a 5000-iteration loop contributes 5000 iteration rows, not one.
 */
export function buildDashboardRows(
	params: BuildDashboardRowsParams,
): DashboardRow[] {
	const {
		runs,
		expandedRunIds,
		runDetails,
		loadingRunIds,
		runErrors,
		expandedLoopKeys,
	} = params;
	const rows: DashboardRow[] = [];
	const runNumbers = params.runNumbers ?? assignRunNumbers(runs);

	for (const run of runs) {
		const expanded = expandedRunIds.has(run.RUN_ID);
		rows.push({
			kind: "run",
			key: `run:${run.RUN_ID}`,
			depth: 0,
			run,
			runNumber: runNumbers.get(run.RUN_ID) ?? 0,
			expanded,
			loading: loadingRunIds.has(run.RUN_ID),
			loadError: runErrors.get(run.RUN_ID),
		});
		if (!expanded) continue;

		const detail = runDetails.get(run.RUN_ID);
		if (!detail) continue;

		for (const node of detail.nodeResults) {
			const nodeId = runtimeNodeId(node);
			const iterations = node.iterations ?? [];
			const isLoop = iterations.length > 0;
			const loopExpanded =
				isLoop && expandedLoopKeys.has(loopRowKey(run.RUN_ID, nodeId));
			rows.push({
				kind: "node",
				key: `node:${run.RUN_ID}:${nodeId}`,
				depth: 1,
				runId: run.RUN_ID,
				node,
				isLoop,
				iterationCount: iterations.length,
				expanded: loopExpanded,
			});
			if (!loopExpanded) continue;

			for (const iteration of iterations) {
				rows.push({
					kind: "iteration",
					key: `iter:${run.RUN_ID}:${nodeId}:${iteration.index}`,
					depth: 2,
					runId: run.RUN_ID,
					nodeId,
					nodeLabel: node.NODE_LABEL || node.NODE_ID,
					iterationIndex: iteration.index,
					status: statusForResults(iteration.nodeResults),
					durationMs: iteration.nodeResults.reduce(
						(sum, result) => sum + (result.DURATION_MS || 0),
						0,
					),
					stepCount: iteration.nodeResults.length,
					result: lastRelevantResult(iteration.nodeResults),
				});
			}
		}
	}

	return rows;
}

/** Maps each run to a unique, 1-based number in ascending STARTED_AT order — ties broken by RUN_ID for stability. */
export function assignRunNumbers(
	runs: AutomationRunSummary[],
): ReadonlyMap<string, number> {
	const sorted = [...runs].sort((a, b) => {
		const diff =
			new Date(a.STARTED_AT).getTime() - new Date(b.STARTED_AT).getTime();
		return diff !== 0 ? diff : a.RUN_ID.localeCompare(b.RUN_ID);
	});
	const numbers = new Map<string, number>();
	sorted.forEach((run, index) => {
		numbers.set(run.RUN_ID, index + 1);
	});
	return numbers;
}
