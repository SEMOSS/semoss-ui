import type { LoopIterationTarget } from "../../../api/automation-history";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunSummary,
	NodeStatus,
	RunStatus,
} from "../../../domain/automation.types";
import {
	formatTimestamp,
	parseUtcDate,
} from "../../../domain/automation-display";
import { runtimeNodeId } from "./run-data-browser-data";
import {
	nodesMatchVariableConditions,
	type VariableCondition,
} from "./run-variable-search";

/** Newest run first, by when it started; ties fall back to RUN_ID so the order is stable. */
export function sortRunsNewestFirst(
	runs: AutomationRunSummary[],
): AutomationRunSummary[] {
	return [...runs].sort((a, b) => {
		const diff =
			parseUtcDate(b.STARTED_AT).getTime() -
			parseUtcDate(a.STARTED_AT).getTime();
		return diff !== 0 ? diff : b.RUN_ID.localeCompare(a.RUN_ID);
	});
}

/** A node's recorded start or end time for display; a dash until the node has one. */
export function nodeTimeLabel(value: string | null | undefined): string {
	return value ? formatTimestamp(value) : "—";
}

/**
 * Identifies one run row for expand/collapse state: the run itself, or — for a run with a
 * loop — one of the runs its loop iterations are shown as.
 */
export function displayRunKey(runId: string, iteration: number | null): string {
	return iteration === null ? runId : `${runId}#${iteration}`;
}

/** Mirrors the backend rule: only a RUNNING or agent-waiting run can be cancelled. */
export function isRunCancellable(status: RunStatus): boolean {
	return status === "RUNNING" || status === "WAITING_FOR_INPUT";
}

/**
 * Why a node failed, for its Error tab: the message it recorded, or a plain note when a
 * failed node kept none. A node that did not fail shows only a message it recorded
 * (a cancelled node says so), and null when it has none, so no tab is offered.
 */
export function nodeErrorText(
	result: Pick<AutomationNodeResult, "STATUS" | "ERROR_MESSAGE">,
): string | null {
	const message = result.ERROR_MESSAGE?.trim();
	if (message) return message;
	return result.STATUS === "FAILED"
		? "This node failed, but no error message was retained."
		: null;
}

/**
 * What a succeeded node reports in its Success tab: a plain confirmation, followed by the
 * result it recorded when there is one. Null for a node that did not succeed.
 */
export function nodeSuccessText(
	result: Pick<
		AutomationNodeResult,
		"STATUS" | "NODE_LABEL" | "NODE_ID" | "OUTPUT_PREVIEW" | "OUTPUT_VALUE"
	>,
): string | null {
	if (result.STATUS !== "SUCCESS") return null;
	const confirmation = `${result.NODE_LABEL || result.NODE_ID} completed successfully.`;
	const output = (result.OUTPUT_PREVIEW ?? result.OUTPUT_VALUE)?.trim();
	return output ? `${confirmation}\n\n${output}` : confirmation;
}

/** A failed node opens on its error, a succeeded one on its success message. */
export function defaultDetailTab(
	result: Pick<AutomationNodeResult, "STATUS" | "ERROR_MESSAGE">,
): "error" | "success" | "variables" {
	if (nodeErrorText(result) !== null && result.STATUS === "FAILED") {
		return "error";
	}
	return result.STATUS === "SUCCESS" ? "success" : "variables";
}

/** The date and time-of-day filters of the dashboard; each is an empty string until set. */
export interface StartedFilters {
	/** "YYYY-MM-DD": runs started on or after the start of this day. */
	dateFrom: string;
	/** "YYYY-MM-DD": runs started on or before the end of this day. */
	dateTo: string;
	/** "HH:MM": runs started at or after this time of day, on any date. */
	timeFrom: string;
	/** "HH:MM": runs started at or before the end of this minute, on any date. */
	timeTo: string;
}

function minutesOfDay(time: string): number | null {
	const match = /^(\d{1,2}):(\d{2})/.exec(time);
	return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/**
 * Whether a run's start passes the date range and the time-of-day window. Dates and times
 * are separate searches: a date alone means whole days, and a time alone applies to every
 * date, so picking one never fills in the other. A window whose end is before its start
 * runs past midnight. Judged in the viewer's local time.
 */
export function startedAtMatches(
	startedAt: string,
	filters: StartedFilters,
): boolean {
	const { dateFrom, dateTo, timeFrom, timeTo } = filters;
	if (!dateFrom && !dateTo && !timeFrom && !timeTo) return true;
	const started = parseUtcDate(startedAt);
	if (Number.isNaN(started.getTime())) return false;

	if (dateFrom && started < new Date(`${dateFrom}T00:00:00`)) return false;
	if (dateTo && started > new Date(`${dateTo}T23:59:59.999`)) return false;

	const from = timeFrom ? minutesOfDay(timeFrom) : null;
	const to = timeTo ? minutesOfDay(timeTo) : null;
	if (from === null && to === null) return true;
	const minute = started.getHours() * 60 + started.getMinutes();
	if (from !== null && to !== null && from > to) {
		return minute >= from || minute <= to;
	}
	if (from !== null && minute < from) return false;
	if (to !== null && minute > to) return false;
	return true;
}

export interface RunSummaryTotals {
	total: number;
	succeeded: number;
	failed: number;
	/** Still working or paused for input. */
	inProgress: number;
	/** Cancelled or interrupted. */
	stopped: number;
	/** Whole percent of finished runs that succeeded; null until a run has finished. */
	successRate: number | null;
}

/** Counts runs by outcome for the dashboard's headline numbers. */
export function summarizeRuns(
	runs: readonly Pick<AutomationRunSummary, "STATUS">[],
): RunSummaryTotals {
	const totals = {
		total: runs.length,
		succeeded: 0,
		failed: 0,
		inProgress: 0,
		stopped: 0,
	};
	for (const { STATUS } of runs) {
		if (STATUS === "SUCCESS") totals.succeeded += 1;
		else if (STATUS === "FAILED") totals.failed += 1;
		else if (STATUS === "RUNNING" || STATUS === "WAITING_FOR_INPUT") {
			totals.inProgress += 1;
		} else totals.stopped += 1;
	}
	const finished = totals.total - totals.inProgress;
	return {
		...totals,
		successRate:
			finished === 0
				? null
				: Math.round((totals.succeeded / finished) * 100),
	};
}

/** Mirrors the backend rule: only a finished run can have nodes re-run. */
export function isRunRerunnable(status: RunStatus): boolean {
	return (
		status === "SUCCESS" ||
		status === "FAILED" ||
		status === "CANCELLED" ||
		status === "INTERRUPTED"
	);
}

/** Nodes the backend refuses to re-run: the trigger and the nodes that open a durable wait. */
const NON_RERUNNABLE_NODE_TYPES = new Set([
	"trigger.start",
	"control.wait",
	"agent.run",
]);

/**
 * Top-level node IDs of a run that can be re-run, read from the graph the run
 * recorded. Empty when that graph is missing or unreadable, so nothing is offered
 * that the backend could not validate.
 */
export function rerunnableNodeIds(
	detail: Pick<AutomationRunDetail, "DEFINITION_SNAPSHOT">,
): Set<string> {
	const ids = new Set<string>();
	if (!detail.DEFINITION_SNAPSHOT) return ids;
	try {
		const snapshot = JSON.parse(detail.DEFINITION_SNAPSHOT) as {
			graph?: { nodes?: { id?: unknown; type?: unknown }[] };
		};
		for (const node of snapshot.graph?.nodes ?? []) {
			if (
				typeof node.id === "string" &&
				typeof node.type === "string" &&
				!NON_RERUNNABLE_NODE_TYPES.has(node.type)
			) {
				ids.add(node.id);
			}
		}
	} catch {
		return new Set();
	}
	return ids;
}

export interface ReprocessableNode {
	id: string;
	label: string;
	status: NodeStatus;
}

/**
 * The top-level nodes of a run that can be reprocessed, in run order: every node the
 * backend accepts, never a loop iteration. Empty when the run's recorded graph can't be read.
 */
export function reprocessableNodes(
	detail: Pick<AutomationRunDetail, "DEFINITION_SNAPSHOT" | "nodeResults">,
): ReprocessableNode[] {
	const allowed = rerunnableNodeIds(detail);
	return detail.nodeResults
		.filter((result) => allowed.has(result.NODE_ID))
		.map((result) => ({
			id: result.NODE_ID,
			label: result.NODE_LABEL || result.NODE_ID,
			status: result.STATUS,
		}));
}

/**
 * The body nodes of one loop iteration that can be reprocessed, in the order they ran:
 * those the recorded loop body holds that the server accepts and that actually ran in
 * that iteration. Empty when the loop or the recorded graph can't be read.
 */
export function loopBodyReprocessableNodes(
	detail: Pick<AutomationRunDetail, "DEFINITION_SNAPSHOT">,
	loopNodeId: string,
	iterationResults: AutomationNodeResult[],
): ReprocessableNode[] {
	const allowed = loopBodyReprocessableIds(detail, loopNodeId);
	return iterationResults
		.filter(
			(result) =>
				allowed.has(result.NODE_ID) && ranInIteration(result.STATUS),
		)
		.map((result) => ({
			id: result.NODE_ID,
			label: result.NODE_LABEL || result.NODE_ID,
			status: result.STATUS,
		}));
}

/** The server only re-runs a loop body node that actually ran, and either succeeded or failed. */
export function ranInIteration(status: NodeStatus): boolean {
	return status === "SUCCESS" || status === "FAILED";
}

/**
 * IDs of the body nodes of one loop that the server accepts for reprocessing, read from the
 * graph the run recorded. Empty when the loop or that graph can't be read.
 */
export function loopBodyReprocessableIds(
	detail: Pick<AutomationRunDetail, "DEFINITION_SNAPSHOT">,
	loopNodeId: string,
): Set<string> {
	const ids = new Set<string>();
	if (!detail.DEFINITION_SNAPSHOT) return ids;
	try {
		const snapshot = JSON.parse(detail.DEFINITION_SNAPSHOT) as {
			graph?: {
				nodes?: {
					id?: unknown;
					body?: { nodes?: { id?: unknown; type?: unknown }[] };
				}[];
			};
		};
		const loop = snapshot.graph?.nodes?.find(
			(candidate) => candidate.id === loopNodeId,
		);
		for (const node of loop?.body?.nodes ?? []) {
			if (
				typeof node.id === "string" &&
				typeof node.type === "string" &&
				!NON_RERUNNABLE_NODE_TYPES.has(node.type)
			) {
				ids.add(node.id);
			}
		}
	} catch {
		return new Set();
	}
	return ids;
}

/**
 * Exact match on the displayed run number or the full run ID. A numeric query never
 * matches digits inside a raw run ID, and "45" never matches run 145 or 450. A loop
 * iteration like "45.3" matches on its run number; {@link iterationFromRunIdQuery}
 * narrows the result to that iteration.
 */
export function runIdMatchesQuery(
	query: string,
	runNumber: number | undefined,
	runId: string,
): boolean {
	const needle = query.trim().toLowerCase();
	if (!needle) return true;
	const iterationQuery = /^(\d+)\.\d+$/.exec(needle);
	if (iterationQuery) {
		return (
			runNumber !== undefined && Number(iterationQuery[1]) === runNumber
		);
	}
	if (/^\d+$/.test(needle)) {
		return runNumber !== undefined && Number(needle) === runNumber;
	}
	return runId.toLowerCase() === needle;
}

/** The loop iteration a search like "45.3" names (3), or null when it names none. */
export function iterationFromRunIdQuery(query: string): number | null {
	const match = /^\d+\.(\d+)$/.exec(query.trim());
	return match ? Number(match[1]) : null;
}

interface BaseDashboardRow {
	/** Unique across the whole flattened list — used as both React key and virtualizer index anchor. */
	key: string;
	depth: 0 | 1;
}

export interface DashboardRunRow extends BaseDashboardRow {
	kind: "run";
	depth: 0;
	/** Identifies this row's expand/collapse state; see {@link displayRunKey}. */
	expandKey: string;
	/** The run as the server knows it — actions such as cancel and reprocess act on this. */
	run: AutomationRunSummary;
	/** 1-based, ascending by STARTED_AT across all currently fetched runs — the first run ever is 1. */
	runNumber: number;
	/**
	 * 1-based loop iteration this row stands for, shown as run "45.3". Null for a run shown
	 * as it ran.
	 */
	iteration: number | null;
	/** The outcome shown for this row: an iteration reports its own nodes, not the whole run's. */
	status: RunStatus;
	/** When this row started and ended: the run's own times, or for a loop iteration its nodes'. */
	startedAt: string | null;
	completedAt: string | null;
	/** The loop pass this row stands for, as the server counts it; null for a run shown as it ran. */
	loop: LoopIterationTarget | null;
	/**
	 * Displayed number of the run this one reprocesses, when it was started by a reprocess
	 * and that run is among those listed; null otherwise.
	 */
	reprocessedFromRunNumber: number | null;
	expanded: boolean;
	loading: boolean;
	loadError?: string;
}

export interface DashboardNodeRow extends BaseDashboardRow {
	kind: "node";
	depth: 1;
	runId: string;
	node: AutomationNodeResult;
	/** The loop pass this node ran in; null for a node that ran outside any loop. */
	loop: LoopIterationTarget | null;
}

export type DashboardRow = DashboardRunRow | DashboardNodeRow;

export interface BuildDashboardRowsParams {
	runs: AutomationRunSummary[];
	/** Keys from {@link displayRunKey} of the run rows that are expanded. */
	expandedRunIds: ReadonlySet<string>;
	runDetails: ReadonlyMap<string, AutomationRunDetail>;
	loadingRunIds: ReadonlySet<string>;
	runErrors: ReadonlyMap<string, string>;
	/** Precomputed by assignRunNumbers(allRuns) — pass this when `runs` is a filtered subset so IDs stay stable while searching. */
	runNumbers?: ReadonlyMap<string, number>;
	/** When a search names one loop iteration ("45.3"), only that iteration is shown. */
	iterationQuery?: number | null;
	/** Variable searches: a loop pass is only shown when its own steps meet every one. */
	variableConditions?: readonly VariableCondition[];
}

/** One row of the run list: a run as it ran, or one loop iteration shown as a run of its own. */
interface DisplayRun {
	iteration: number | null;
	loop: LoopIterationTarget | null;
	nodes: DisplayNode[];
	status: RunStatus;
	startedAt: string | null;
	completedAt: string | null;
}

/**
 * When a set of nodes started and ended: the earliest start and the latest end any of them
 * recorded. Each is null when none of them recorded one.
 */
function timesOf(nodes: AutomationNodeResult[]): {
	startedAt: string | null;
	completedAt: string | null;
} {
	let startedAt: string | null = null;
	let completedAt: string | null = null;
	for (const node of nodes) {
		if (
			node.STARTED_AT &&
			(startedAt === null ||
				parseUtcDate(node.STARTED_AT) < parseUtcDate(startedAt))
		) {
			startedAt = node.STARTED_AT;
		}
		if (
			node.COMPLETED_AT &&
			(completedAt === null ||
				parseUtcDate(node.COMPLETED_AT) > parseUtcDate(completedAt))
		) {
			completedAt = node.COMPLETED_AT;
		}
	}
	return { startedAt, completedAt };
}

interface DisplayNode {
	node: AutomationNodeResult;
	loop: LoopIterationTarget | null;
}

/** The nodes one loop pass ran, as recorded; empty when the run has no such pass. */
export function iterationNodeResults(
	detail: Pick<AutomationRunDetail, "nodeResults">,
	loop: LoopIterationTarget,
): AutomationNodeResult[] {
	const loopNode = detail.nodeResults.find(
		(result) => result.NODE_ID === loop.loopNodeId,
	);
	return (
		loopNode?.iterations?.find((pass) => pass.index === loop.iteration)
			?.nodeResults ?? []
	);
}

/** The outcome of a set of nodes, or null when none of them settles it. */
function outcomeOf(nodes: DisplayNode[]): RunStatus | null {
	if (nodes.some(({ node }) => node.STATUS === "FAILED")) return "FAILED";
	if (nodes.some(({ node }) => node.STATUS === "WAITING_FOR_INPUT")) {
		return "WAITING_FOR_INPUT";
	}
	if (nodes.some(({ node }) => node.STATUS === "RUNNING")) return "RUNNING";
	return null;
}

/**
 * The loop passes of a node that count as runs of their own. A reprocess copies every pass
 * of a loop, but only the passes it ran again belong to it, so passes whose nodes were all
 * carried over are left out. A pass with no nodes is kept: nothing says it was carried over.
 */
function keptIterations(node: AutomationNodeResult) {
	return (node.iterations ?? []).filter(
		(iteration) =>
			iteration.nodeResults.length === 0 ||
			iteration.nodeResults.some((inner) => !inner.CARRIED_OVER),
	);
}

/**
 * The rows a run is displayed as. A run without a loop is one row. A loop never appears as
 * a "repeat steps" node: each of its iterations becomes a run of its own, numbered under
 * the original (45.1, 45.2, ...), holding everything that ran up to and including that
 * iteration. Nodes after the last loop ran after its last iteration, so they go with it.
 * The last iteration also carries the original run's outcome. A loop carried over whole by
 * a reprocess is an ordinary node.
 */
function displayRunsFor(
	run: AutomationRunSummary,
	detail: AutomationRunDetail | undefined,
): DisplayRun[] {
	const results = detail?.nodeResults ?? [];
	const hasLoop = results.some((node) => keptIterations(node).length > 0);
	if (!detail || !hasLoop) {
		return [
			{
				iteration: null,
				loop: null,
				nodes: results.map((node) => ({ node, loop: null })),
				status: run.STATUS,
				startedAt: run.STARTED_AT,
				completedAt: run.COMPLETED_AT,
			},
		];
	}

	const displayRuns: DisplayRun[] = [];
	// What each iteration itself ran, apart from the earlier nodes its row also lists.
	const ownNodes: AutomationNodeResult[][] = [];
	const before: DisplayNode[] = [];

	results.forEach((node) => {
		const iterations = keptIterations(node);
		if (iterations.length === 0) {
			before.push({ node, loop: null });
			return;
		}
		for (const iteration of iterations) {
			const loop = {
				loopNodeId: node.NODE_ID,
				iteration: iteration.index,
			};
			const nodes = [
				...before,
				...iteration.nodeResults.map((inner) => ({
					node: inner,
					loop,
				})),
			];
			ownNodes.push(iteration.nodeResults);
			displayRuns.push({
				iteration: displayRuns.length + 1,
				loop,
				nodes,
				status: outcomeOf(nodes) ?? "SUCCESS",
				...withRunFallback(timesOf(iteration.nodeResults), run),
			});
		}
	});

	// Nodes between two loops ran after the earlier loop's last pass, so they go with it.
	const loopIndexes = results
		.map((node, index) => (keptIterations(node).length > 0 ? index : -1))
		.filter((index) => index >= 0);
	let runIndex = -1;
	loopIndexes.forEach((loopIndex, position) => {
		runIndex += keptIterations(results[loopIndex]).length;
		const isLast = position === loopIndexes.length - 1;
		const tailResults = results
			.slice(
				loopIndex + 1,
				isLast ? undefined : loopIndexes[position + 1],
			)
			.filter((node) => keptIterations(node).length === 0);
		if (tailResults.length === 0 && !isLast) return;
		const target = displayRuns[runIndex];
		target.nodes = [
			...target.nodes,
			...tailResults.map((node) => ({ node, loop: null })),
		];
		target.status =
			outcomeOf(target.nodes) ?? (isLast ? run.STATUS : target.status);
		Object.assign(
			target,
			withRunFallback(
				timesOf([...ownNodes[runIndex], ...tailResults]),
				run,
			),
		);
	});
	// Newest first, like the runs themselves; each row keeps its own iteration number.
	return displayRuns.reverse();
}

/** A row whose nodes recorded no times (older runs) shows the run's own. */
function withRunFallback(
	times: { startedAt: string | null; completedAt: string | null },
	run: AutomationRunSummary,
) {
	return times.startedAt === null && times.completedAt === null
		? { startedAt: run.STARTED_AT, completedAt: run.COMPLETED_AT }
		: times;
}

/**
 * Flattens runs into one row per run — a run with a loop becomes one row per loop
 * iteration, so a loop that repeats 5000 times is 5000 runs — plus, when a row is
 * expanded, one row per node it holds.
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
		iterationQuery = null,
		variableConditions = [],
	} = params;
	const rows: DashboardRow[] = [];
	const runNumbers = params.runNumbers ?? assignRunNumbers(runs);

	for (const run of runs) {
		const detail = runDetails.get(run.RUN_ID);
		for (const displayRun of displayRunsFor(run, detail)) {
			if (
				iterationQuery !== null &&
				displayRun.iteration !== iterationQuery
			) {
				continue;
			}
			if (
				displayRun.loop !== null &&
				!nodesMatchVariableConditions(
					displayRun.nodes.map(({ node }) => node),
					variableConditions,
				)
			) {
				continue;
			}
			const expandKey = displayRunKey(run.RUN_ID, displayRun.iteration);
			const expanded = expandedRunIds.has(expandKey);
			rows.push({
				kind: "run",
				key: `run:${expandKey}`,
				depth: 0,
				expandKey,
				run,
				runNumber: runNumbers.get(run.RUN_ID) ?? 0,
				iteration: displayRun.iteration,
				status: displayRun.status,
				startedAt: displayRun.startedAt,
				completedAt: displayRun.completedAt,
				loop: displayRun.loop,
				reprocessedFromRunNumber: run.REPROCESSED_FROM_RUN_ID
					? (runNumbers.get(run.REPROCESSED_FROM_RUN_ID) ?? null)
					: null,
				expanded,
				loading: loadingRunIds.has(run.RUN_ID),
				loadError: runErrors.get(run.RUN_ID),
			});
			if (!expanded) continue;

			for (const { node, loop } of displayRun.nodes) {
				rows.push({
					kind: "node",
					key: `node:${expandKey}:${runtimeNodeId(node)}`,
					depth: 1,
					runId: run.RUN_ID,
					node,
					loop,
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

/** One step of the path a run took to reach a node execution. */
export interface NodePathStep {
	label: string;
	/** A node that was hit, or the "Item N" marker for the loop iteration the path is inside. */
	kind: "node" | "iteration";
}

/** One node execution: a node hit once, or one node of one loop iteration. */
export interface NodeExecutionRow {
	kind: "execution";
	key: string;
	runId: string;
	runNumber: number;
	/** 1-based position among the node executions of this run, in the order they ran. */
	hit: number;
	nodeId: string;
	label: string;
	/**
	 * Every node hit so far in this run, ending at this one. Inside a loop it runs through
	 * the loop and the current iteration's nodes only, so it stays short however long the loop is.
	 */
	path: NodePathStep[];
	/** Zero-based loop iteration this execution belongs to, or null outside a loop. */
	iterationIndex: number | null;
	loopLabel: string | null;
	status: NodeStatus;
	durationMs: number;
	result: AutomationNodeResult;
}

/** Stands in for a run whose nodes have not loaded yet, or could not be. */
export interface NodeRunStatusRow {
	kind: "run-status";
	key: string;
	runId: string;
	runNumber: number;
	state: "loading" | "error";
	message?: string;
}

export type NodeByNodeRow = NodeExecutionRow | NodeRunStatusRow;

export interface BuildNodeByNodeRowsParams {
	runs: AutomationRunSummary[];
	runDetails: ReadonlyMap<string, AutomationRunDetail>;
	loadingRunIds: ReadonlySet<string>;
	runErrors: ReadonlyMap<string, string>;
	runNumbers: ReadonlyMap<string, number>;
}

/**
 * A node that was skipped or never reached was not hit, and neither was one carried over
 * from the run a reprocess came from: it did not run in this run, so it gets no row.
 */
function wasHit(result: AutomationNodeResult): boolean {
	return (
		result.STATUS !== "PENDING" &&
		result.STATUS !== "SKIPPED" &&
		!result.CARRIED_OVER
	);
}

/**
 * Flattens runs into one row per node execution, in the order the nodes ran. A node
 * inside a loop contributes one row per iteration, so a loop of 5 nodes that runs
 * 5000 times contributes 25,000 rows (plus the loop node itself). Runs keep the
 * order they are given in. A run whose nodes are not loaded gets a single
 * placeholder row so it is never silently missing.
 */
export function buildNodeByNodeRows(
	params: BuildNodeByNodeRowsParams,
): NodeByNodeRow[] {
	const { runs, runDetails, loadingRunIds, runErrors, runNumbers } = params;
	const rows: NodeByNodeRow[] = [];

	for (const run of runs) {
		const runId = run.RUN_ID;
		const runNumber = runNumbers.get(runId) ?? 0;
		const detail = runDetails.get(runId);
		if (!detail) {
			const message = runErrors.get(runId);
			rows.push({
				kind: "run-status",
				key: `${runId}:status`,
				runId,
				runNumber,
				state:
					message !== undefined && !loadingRunIds.has(runId)
						? "error"
						: "loading",
				message,
			});
			continue;
		}

		let hit = 0;
		const firstRowOfRun = rows.length;
		const push = (
			result: AutomationNodeResult,
			path: NodePathStep[],
			iterationIndex: number | null,
			loopLabel: string | null,
		) => {
			hit += 1;
			rows.push({
				kind: "execution",
				key: `${runId}:exec:${hit}`,
				runId,
				runNumber,
				hit,
				nodeId: result.NODE_ID,
				label: result.NODE_LABEL || result.NODE_ID,
				path,
				iterationIndex,
				loopLabel,
				status: result.STATUS,
				durationMs: result.DURATION_MS ?? 0,
				result,
			});
		};
		const stepFor = (result: AutomationNodeResult): NodePathStep => ({
			label: result.NODE_LABEL || result.NODE_ID,
			kind: "node",
		});

		// Top-level nodes hit so far; a loop stays in it as one step, with its iterations beneath.
		const trail: NodePathStep[] = [];
		for (const result of detail.nodeResults) {
			const iterations = result.iterations ?? [];
			// A loop carried over by a reprocess was not hit itself, but a pass of it may have been.
			const passRan = iterations.some((iteration) =>
				iteration.nodeResults.some(wasHit),
			);
			if (!wasHit(result) && !passRan) continue;
			trail.push(stepFor(result));
			if (wasHit(result)) push(result, [...trail], null, null);
			const loopLabel = result.NODE_LABEL || result.NODE_ID;
			for (const iteration of iterations) {
				const iterationStep: NodePathStep = {
					label: `Item ${iteration.index + 1}`,
					kind: "iteration",
				};
				const inner: NodePathStep[] = [];
				for (const innerResult of iteration.nodeResults) {
					if (!wasHit(innerResult)) continue;
					inner.push(stepFor(innerResult));
					push(
						innerResult,
						[...trail, iterationStep, ...inner],
						iteration.index,
						loopLabel,
					);
				}
			}
		}
		// Newest first; each row keeps its own hit number.
		rows.push(...rows.splice(firstRowOfRun).reverse());
	}

	return rows;
}
