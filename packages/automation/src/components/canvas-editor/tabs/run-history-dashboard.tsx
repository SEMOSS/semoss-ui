import { useVirtualizer } from "@tanstack/react-virtual";
import {
	Check,
	ChevronRight,
	CircleCheck,
	Copy,
	History,
	Inbox,
	Loader2,
	Maximize2,
	RotateCw,
	Route,
	Search,
	SearchX,
	Square,
	TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CellOutputBlock } from "@semoss/shared";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import {
	cancelAutomationRun,
	getAutomationRun,
	type LoopIterationTarget,
	reprocessWholeAutomationRun,
	rerunAutomationNodes,
} from "../../../api";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunSummary,
	RunStatus,
} from "../../../domain/automation.types";
import { normalizeAutomationErrorMessage } from "../../../domain/automation-utils";
import {
	assignRunNumbers,
	buildDashboardRows,
	buildNodeByNodeRows,
	type DashboardRow,
	defaultDetailTab,
	isRunCancellable,
	isRunRerunnable,
	iterationFromRunIdQuery,
	iterationNodeResults,
	loopBodyReprocessableIds,
	loopBodyReprocessableNodes,
	type NodeByNodeRow,
	nodeErrorText,
	nodeSuccessText,
	nodeTimeLabel,
	ranInIteration,
	reprocessableNodes,
	runIdMatchesQuery,
	type StartedFilters,
	sortRunsNewestFirst,
	startedAtMatches,
	summarizeRuns,
} from "./run-dashboard-rows";
import {
	DashboardEmptyState,
	RunStatsStrip,
	StatusPill,
	statusAccent,
} from "./run-dashboard-visuals";
import { runMatchesKeyword } from "./run-data-browser-data";
import { getRunScopeVariableRows } from "./run-node-view-state";

interface RunHistoryDashboardProps {
	appId: string;
	/** The run page already loaded by the history list — no separate backend fetch for the top-level list. */
	runs: AutomationRunSummary[];
	onOutputPopout: (output: string) => void;
	/** Reloads the run list, e.g. to observe a cancelled run reaching its terminal status. */
	onRefreshRuns?: () => Promise<void> | void;
}

const ROW_HEIGHT = 46;
const DETAIL_PANEL_HEIGHT = 340;
// design-lint-disable-next-line arbitrary-size -- fixed column widths keep virtualized rows aligned with the header
const GRID_COLUMNS = "grid-cols-[32px_210px_160px_160px_120px_minmax(0,1fr)]";
// design-lint-disable-next-line arbitrary-size -- fixed column widths keep virtualized rows aligned with the header
const NODE_GRID_COLUMNS =
	"grid-cols-[64px_64px_minmax(0,1fr)_160px_160px_120px_90px]";
// design-lint-disable-next-line arbitrary-size -- the pop-out fills nearly the whole viewport
const POPOUT_DIALOG_SIZE = "h-[94vh] w-[97vw] max-w-[97vw] sm:max-w-[97vw]";
const HEADER_ROW =
	"items-center gap-3 border-border border-b bg-muted px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider";
const ROW_BASE =
	"group grid h-full items-center gap-3 border-border border-b border-l-4 px-4 hover:bg-accent";
const MAX_CONCURRENT_DETAIL_LOADS = 4;
const MAX_VISIBLE_PATH_STEPS = 6;
const CANCEL_POLL_INTERVAL_MS = 2000;
const CANCEL_POLL_MAX_TICKS = 15;
type DetailTab = "variables" | "error" | "success";

const STATUS_FILTER_OPTIONS: { status: RunStatus; label: string }[] = [
	{ status: "SUCCESS", label: "Succeeded" },
	{ status: "FAILED", label: "Failed" },
	{ status: "RUNNING", label: "Running" },
	{ status: "WAITING_FOR_INPUT", label: "Pending (waiting for input)" },
	{ status: "INTERRUPTED", label: "Interrupted" },
	{ status: "CANCELLED", label: "Cancelled" },
];

interface SelectedNode {
	key: string;
	label: string;
	result: AutomationNodeResult;
}

interface DetailPanelRow {
	kind: "detail";
	key: string;
}

type RenderRow = DashboardRow | NodeByNodeRow | DetailPanelRow;
type ViewMode = "runs" | "nodes";

const NO_STARTED_FILTERS: StartedFilters = {
	dateFrom: "",
	dateTo: "",
	timeFrom: "",
	timeTo: "",
};

const FILTER_LABEL =
	"font-semibold text-muted-foreground text-xs uppercase tracking-wider";
const ACTION_BUTTON =
	"h-8 gap-1.5 rounded-full px-3.5 font-medium text-xs transition-colors";
const REPROCESS_BUTTON = cn(
	ACTION_BUTTON,
	"border-primary/30 bg-primary/5 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground",
);
const CANCEL_BUTTON = cn(
	ACTION_BUTTON,
	"border-destructive/30 bg-destructive/5 text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground",
);
const FILTER_INPUT =
	"h-9 rounded-lg bg-background text-xs hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30";

/**
 * Mirth Connect message-browser-style dashboard: one row per run, expandable
 * into one row per node, and (for loop nodes) further expandable into one row
 * per loop iteration — so a 5000-iteration loop contributes 5000 rows.
 */
export function RunHistoryDashboard({
	appId,
	runs,
	onOutputPopout,
	onRefreshRuns,
}: RunHistoryDashboardProps) {
	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const [expandedRunIds, setExpandedRunIds] = useState<Set<string>>(
		new Set(),
	);
	const [runDetails, setRunDetails] = useState<
		Map<string, AutomationRunDetail>
	>(new Map());
	const [loadingRunIds, setLoadingRunIds] = useState<Set<string>>(new Set());
	const [runErrors, setRunErrors] = useState<Map<string, string>>(new Map());

	const fetchDetailIfNeeded = useCallback(
		(runId: string) => {
			if (runDetails.has(runId) || loadingRunIds.has(runId)) return;
			setLoadingRunIds((prev) => new Set(prev).add(runId));
			setRunErrors((prev) => {
				if (!prev.has(runId)) return prev;
				const next = new Map(prev);
				next.delete(runId);
				return next;
			});
			getAutomationRun(appId, runId)
				.then((detail) => {
					if (!isMountedRef.current) return;
					setRunDetails((prev) => new Map(prev).set(runId, detail));
				})
				.catch((error: unknown) => {
					if (!isMountedRef.current) return;
					setRunErrors((prev) =>
						new Map(prev).set(
							runId,
							error instanceof Error
								? normalizeAutomationErrorMessage(error.message)
								: "Unable to load run details.",
						),
					);
				})
				.finally(() => {
					if (!isMountedRef.current) return;
					setLoadingRunIds((prev) => {
						const next = new Set(prev);
						next.delete(runId);
						return next;
					});
				});
		},
		[appId, runDetails, loadingRunIds],
	);

	/** Opens or closes one run row (or one loop iteration's run), loading the run's nodes when needed. */
	const toggleRun = useCallback(
		(expandKey: string, runId: string) => {
			const opening = !expandedRunIds.has(expandKey);
			setExpandedRunIds((prev) => {
				const next = new Set(prev);
				if (opening) next.add(expandKey);
				else next.delete(expandKey);
				return next;
			});
			if (opening) fetchDetailIfNeeded(runId);
		},
		[expandedRunIds, fetchDetailIfNeeded],
	);

	const [selected, setSelected] = useState<SelectedNode | null>(null);
	const [detailTab, setDetailTab] = useState<DetailTab>("variables");

	const selectNode = useCallback(
		(key: string, label: string, result: AutomationNodeResult | null) => {
			if (!result) return;
			// Choosing the open node again collapses it.
			setSelected((current) =>
				current?.key === key ? null : { key, label, result },
			);
			setDetailTab(defaultDetailTab(result));
		},
		[],
	);

	const [cancelTarget, setCancelTarget] =
		useState<AutomationRunSummary | null>(null);
	const [cancelSubmitting, setCancelSubmitting] = useState(false);
	const [cancellingRunIds, setCancellingRunIds] = useState<Set<string>>(
		new Set(),
	);

	const refreshRunDetail = useCallback(
		(runId: string) => {
			getAutomationRun(appId, runId)
				.then((detail) => {
					if (!isMountedRef.current) return;
					setRunDetails((prev) => new Map(prev).set(runId, detail));
				})
				.catch(() => {
					// The cached detail stays as it was; the row can still be re-expanded.
				});
		},
		[appId],
	);

	/**
	 * The run being reprocessed, the node the dialog starts with (null = every node), and the
	 * loop pass whose body nodes are on offer instead of the run's top-level nodes (null = none).
	 */
	const [reprocessTarget, setReprocessTarget] = useState<{
		runId: string;
		nodeId: string | null;
		loop: LoopIterationTarget | null;
	} | null>(null);
	const [reprocessSelected, setReprocessSelected] =
		useState<ReadonlySet<string> | null>(null);
	/** Whether the dialog runs the whole message again rather than only the chosen nodes. */
	const [reprocessWhole, setReprocessWhole] = useState(false);
	const [nodeRerunPending, setNodeRerunPending] = useState(false);

	const reprocessDetail = reprocessTarget
		? runDetails.get(reprocessTarget.runId)
		: undefined;
	const reprocessNodes = useMemo(() => {
		if (!reprocessDetail) return [];
		const loop = reprocessTarget?.loop;
		return loop
			? loopBodyReprocessableNodes(
					reprocessDetail,
					loop.loopNodeId,
					iterationNodeResults(reprocessDetail, loop),
				)
			: reprocessableNodes(reprocessDetail);
	}, [reprocessDetail, reprocessTarget]);
	const reprocessLoopLabel = useMemo(() => {
		const loop = reprocessTarget?.loop;
		if (!loop || !reprocessDetail) return null;
		const loopNode = reprocessDetail.nodeResults.find(
			(result) => result.NODE_ID === loop.loopNodeId,
		);
		return loopNode?.NODE_LABEL || loop.loopNodeId;
	}, [reprocessTarget, reprocessDetail]);

	/** Per finished run whose detail is loaded, the nodes that get their own Reprocess button. */
	const reprocessableByRun = useMemo(() => {
		const byRun = new Map<string, ReadonlySet<string>>();
		for (const run of runs) {
			const detail = runDetails.get(run.RUN_ID);
			if (detail && isRunRerunnable(run.STATUS)) {
				byRun.set(
					run.RUN_ID,
					new Set(reprocessableNodes(detail).map((node) => node.id)),
				);
			}
		}
		return byRun;
	}, [runs, runDetails]);

	/** The same per finished run, for the body nodes of each of its loops. */
	const reprocessableLoopBodiesByRun = useMemo(() => {
		const byRun = new Map<
			string,
			ReadonlyMap<string, ReadonlySet<string>>
		>();
		for (const run of runs) {
			const detail = runDetails.get(run.RUN_ID);
			if (!detail || !isRunRerunnable(run.STATUS)) continue;
			const byLoop = new Map<string, ReadonlySet<string>>();
			for (const result of detail.nodeResults) {
				if ((result.iterations?.length ?? 0) > 0) {
					byLoop.set(
						result.NODE_ID,
						loopBodyReprocessableIds(detail, result.NODE_ID),
					);
				}
			}
			if (byLoop.size > 0) byRun.set(run.RUN_ID, byLoop);
		}
		return byRun;
	}, [runs, runDetails]);

	const openReprocess = useCallback(
		(
			runId: string,
			nodeId: string | null,
			loop: LoopIterationTarget | null,
		) => {
			setReprocessSelected(null);
			// A message's own button offers to run the whole message again; a node's does not.
			setReprocessWhole(nodeId === null && loop === null);
			setReprocessTarget({ runId, nodeId, loop });
			fetchDetailIfNeeded(runId);
		},
		[fetchDetailIfNeeded],
	);

	const closeReprocess = useCallback(() => {
		setReprocessTarget(null);
		setReprocessSelected(null);
	}, []);

	// Tick the starting nodes once the run's detail has loaded: one node, or every node.
	useEffect(() => {
		if (
			!reprocessTarget ||
			reprocessSelected !== null ||
			reprocessNodes.length === 0
		) {
			return;
		}
		setReprocessSelected(
			new Set(
				reprocessNodes
					.filter(
						(node) =>
							reprocessTarget.nodeId === null ||
							node.id === reprocessTarget.nodeId,
					)
					.map((node) => node.id),
			),
		);
	}, [reprocessTarget, reprocessSelected, reprocessNodes]);

	const toggleReprocessNode = useCallback((nodeId: string) => {
		setReprocessSelected((prev) => {
			const next = new Set(prev ?? []);
			if (next.has(nodeId)) {
				next.delete(nodeId);
			} else {
				next.add(nodeId);
			}
			return next;
		});
	}, []);

	// A reprocess is one long request, so poll the list to show the new run working meanwhile.
	useEffect(() => {
		if (!nodeRerunPending || !onRefreshRuns) return;
		const interval = window.setInterval(
			() => void onRefreshRuns(),
			CANCEL_POLL_INTERVAL_MS,
		);
		return () => window.clearInterval(interval);
	}, [nodeRerunPending, onRefreshRuns]);

	const confirmReprocess = useCallback(async () => {
		if (!reprocessTarget) return;
		const { runId, loop } = reprocessTarget;
		// Sent in run order; the backend orders them anyway.
		const nodeIds = reprocessNodes
			.filter((node) => reprocessSelected?.has(node.id))
			.map((node) => node.id);
		if (!reprocessWhole && nodeIds.length === 0) return;
		setNodeRerunPending(true);
		try {
			// Either way the original run is untouched and a new run is started.
			const started = reprocessWhole
				? await reprocessWholeAutomationRun(appId, runId)
				: await rerunAutomationNodes(
						appId,
						runId,
						nodeIds,
						loop ?? undefined,
					);
			if (isMountedRef.current) {
				if (started.STATUS === "FAILED") {
					toast.error(
						"The reprocess started a new run, but it failed. Open the new run to see why.",
					);
				} else {
					toast.success("Reprocessed as a new run.");
				}
			}
		} catch (error) {
			if (isMountedRef.current) {
				toast.error(
					error instanceof Error
						? normalizeAutomationErrorMessage(error.message)
						: "Unable to reprocess.",
				);
			}
		} finally {
			if (isMountedRef.current) {
				setNodeRerunPending(false);
				setReprocessTarget(null);
				setReprocessSelected(null);
			}
			// The new run may exist even when this failed part-way, so always reload the list.
			void onRefreshRuns?.();
		}
	}, [
		appId,
		reprocessTarget,
		reprocessSelected,
		reprocessNodes,
		reprocessWhole,
		onRefreshRuns,
	]);

	const confirmCancel = useCallback(async () => {
		if (!cancelTarget) return;
		const runId = cancelTarget.RUN_ID;
		setCancelSubmitting(true);
		try {
			await cancelAutomationRun(appId, runId);
			if (!isMountedRef.current) return;
			setCancellingRunIds((prev) => new Set(prev).add(runId));
			toast.info("Cancellation requested.");
			setCancelTarget(null);
			await onRefreshRuns?.();
		} catch (error) {
			if (!isMountedRef.current) return;
			toast.error(
				error instanceof Error
					? normalizeAutomationErrorMessage(error.message)
					: "Unable to cancel this run.",
			);
		} finally {
			if (isMountedRef.current) setCancelSubmitting(false);
		}
	}, [appId, cancelTarget, onRefreshRuns]);

	// A cancelled running run reaches CANCELLED asynchronously, so poll until it settles (bounded).
	useEffect(() => {
		if (cancellingRunIds.size === 0 || !onRefreshRuns) return;
		let ticks = 0;
		const interval = window.setInterval(() => {
			ticks += 1;
			if (ticks > CANCEL_POLL_MAX_TICKS) {
				setCancellingRunIds(new Set());
				return;
			}
			void onRefreshRuns();
		}, CANCEL_POLL_INTERVAL_MS);
		return () => window.clearInterval(interval);
	}, [cancellingRunIds, onRefreshRuns]);

	// Once a cancelled run leaves its active status, stop tracking it and refresh any cached detail.
	useEffect(() => {
		if (cancellingRunIds.size === 0) return;
		const settled = [...cancellingRunIds].filter((runId) => {
			const run = runs.find((candidate) => candidate.RUN_ID === runId);
			return !run || !isRunCancellable(run.STATUS);
		});
		if (settled.length === 0) return;
		setCancellingRunIds((prev) => {
			const next = new Set(prev);
			for (const runId of settled) next.delete(runId);
			return next;
		});
		for (const runId of settled) {
			if (runDetails.has(runId)) refreshRunDetail(runId);
		}
	}, [runs, cancellingRunIds, runDetails, refreshRunDetail]);

	const [keyword, setKeyword] = useState("");
	const [runIdQuery, setRunIdQuery] = useState("");
	const [started, setStarted] = useState<StartedFilters>(NO_STARTED_FILTERS);
	const changeStarted = useCallback(
		(field: keyof StartedFilters, value: string) =>
			setStarted((prev) => ({ ...prev, [field]: value })),
		[],
	);
	const [statusFilters, setStatusFilters] = useState<Set<RunStatus>>(
		new Set(),
	);

	const toggleStatusFilter = useCallback((status: RunStatus) => {
		setStatusFilters((prev) => {
			const next = new Set(prev);
			if (next.has(status)) {
				next.delete(status);
			} else {
				next.add(status);
			}
			return next;
		});
	}, []);

	/** Ticks every status in the group, or clears them all when they are already all ticked. */
	const toggleStatusGroup = useCallback((statuses: RunStatus[]) => {
		setStatusFilters((prev) => {
			const next = new Set(prev);
			const allOn = statuses.every((status) => prev.has(status));
			for (const status of statuses) {
				if (allOn) next.delete(status);
				else next.add(status);
			}
			return next;
		});
	}, []);

	const hasActiveFilters =
		keyword.trim() !== "" ||
		runIdQuery.trim() !== "" ||
		Object.values(started).some((value) => value !== "") ||
		statusFilters.size > 0;

	const clearFilters = useCallback(() => {
		setKeyword("");
		setRunIdQuery("");
		setStarted(NO_STARTED_FILTERS);
		setStatusFilters(new Set());
	}, []);

	/** Stable, independent of any active filters, so a run's displayed ID never changes while searching. */
	const runNumbers = useMemo(() => assignRunNumbers(runs), [runs]);

	const matchesNonStatusFilters = useCallback(
		(run: AutomationRunSummary) => {
			if (!startedAtMatches(run.STARTED_AT, started)) return false;
			return runIdMatchesQuery(
				runIdQuery,
				runNumbers.get(run.RUN_ID),
				run.RUN_ID,
			);
		},
		[started, runIdQuery, runNumbers],
	);

	const matchesNonKeywordFilters = useCallback(
		(run: AutomationRunSummary) =>
			(statusFilters.size === 0 || statusFilters.has(run.STATUS)) &&
			matchesNonStatusFilters(run),
		[statusFilters, matchesNonStatusFilters],
	);

	// Keyword search reads retained message/variable data, which is only fetched once a run is expanded —
	// so eagerly load details for every run that otherwise passes the filters while a keyword is active.
	useEffect(() => {
		if (!keyword.trim()) return;
		for (const run of runs) {
			if (matchesNonKeywordFilters(run) && !runErrors.has(run.RUN_ID)) {
				fetchDetailIfNeeded(run.RUN_ID);
			}
		}
	}, [
		keyword,
		runs,
		runErrors,
		matchesNonKeywordFilters,
		fetchDetailIfNeeded,
	]);

	const filteredRuns = useMemo(() => {
		const trimmedKeyword = keyword.trim();
		return sortRunsNewestFirst(
			runs.filter((run) => {
				if (!matchesNonKeywordFilters(run)) return false;
				if (trimmedKeyword) {
					const detail = runDetails.get(run.RUN_ID);
					if (!detail) return false;
					if (!runMatchesKeyword(detail, trimmedKeyword))
						return false;
				}
				return true;
			}),
		);
	}, [runs, matchesNonKeywordFilters, keyword, runDetails]);

	/**
	 * The runs every filter except status lets through. The outcome cards count these, so
	 * ticking one status never empties the others' counts.
	 */
	const outcomeTotals = useMemo(() => {
		const trimmedKeyword = keyword.trim();
		return summarizeRuns(
			runs.filter((run) => {
				if (!matchesNonStatusFilters(run)) return false;
				if (!trimmedKeyword) return true;
				const detail = runDetails.get(run.RUN_ID);
				return detail
					? runMatchesKeyword(detail, trimmedKeyword)
					: false;
			}),
		);
	}, [runs, matchesNonStatusFilters, keyword, runDetails]);

	const searchingForKeyword =
		keyword.trim() !== "" &&
		runs.some(
			(run) =>
				matchesNonKeywordFilters(run) && loadingRunIds.has(run.RUN_ID),
		);

	// A search like "45.3" names one loop iteration's run.
	const iterationQuery = useMemo(
		() => iterationFromRunIdQuery(runIdQuery),
		[runIdQuery],
	);

	const [viewMode, setViewMode] = useState<ViewMode>("runs");

	const changeViewMode = useCallback((mode: ViewMode) => {
		setViewMode(mode);
		setSelected(null);
	}, []);

	// A loop only shows as separate runs once its run's nodes are known, so load every run's
	// nodes up front, a few at a time rather than all at once.
	useEffect(() => {
		let inFlight = loadingRunIds.size;
		for (const run of filteredRuns) {
			if (inFlight >= MAX_CONCURRENT_DETAIL_LOADS) break;
			if (
				runDetails.has(run.RUN_ID) ||
				loadingRunIds.has(run.RUN_ID) ||
				runErrors.has(run.RUN_ID)
			) {
				continue;
			}
			fetchDetailIfNeeded(run.RUN_ID);
			inFlight += 1;
		}
	}, [
		filteredRuns,
		runDetails,
		loadingRunIds,
		runErrors,
		fetchDetailIfNeeded,
	]);

	const dashboardRows = useMemo(
		() =>
			buildDashboardRows({
				runs: filteredRuns,
				expandedRunIds,
				runDetails,
				loadingRunIds,
				runErrors,
				runNumbers,
				iterationQuery,
			}),
		[
			filteredRuns,
			expandedRunIds,
			runDetails,
			loadingRunIds,
			runErrors,
			runNumbers,
			iterationQuery,
		],
	);

	// Only built while it is shown: a long loop makes this tens of thousands of rows.
	const nodeRows = useMemo(
		() =>
			viewMode === "nodes"
				? buildNodeByNodeRows({
						runs: filteredRuns,
						runDetails,
						loadingRunIds,
						runErrors,
						runNumbers,
					})
				: [],
		[
			viewMode,
			filteredRuns,
			runDetails,
			loadingRunIds,
			runErrors,
			runNumbers,
		],
	);

	const rows: (DashboardRow | NodeByNodeRow)[] =
		viewMode === "nodes" ? nodeRows : dashboardRows;

	const nodeExecutionCount = useMemo(
		() => nodeRows.filter((row) => row.kind === "execution").length,
		[nodeRows],
	);
	const loadedRunCount = filteredRuns.filter((run) =>
		runDetails.has(run.RUN_ID),
	).length;

	const renderRows = useMemo<RenderRow[]>(() => {
		if (!selected) return rows;
		const index = rows.findIndex((row) => row.key === selected.key);
		if (index === -1) return rows;
		const next: RenderRow[] = [...rows];
		next.splice(index + 1, 0, {
			kind: "detail",
			key: `detail:${selected.key}`,
		});
		return next;
	}, [rows, selected]);

	// A state-backed ref, so the list re-attaches when the dashboard moves between the page and the expanded window.
	const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
		null,
	);
	const [popout, setPopout] = useState(false);
	const rowVirtualizer = useVirtualizer({
		count: renderRows.length,
		getScrollElement: () => scrollElement,
		estimateSize: (index) =>
			renderRows[index]?.kind === "detail"
				? DETAIL_PANEL_HEIGHT
				: ROW_HEIGHT,
		overscan: 16,
	});

	// The detail row's presence/absence changes row sizes, so force a full re-measure of offsets.
	// biome-ignore lint/correctness/useExhaustiveDependencies: selected?.key (not just its identity) must retrigger the remeasure, and so must the list moving to a new scroll element.
	useEffect(() => {
		rowVirtualizer.measure();
	}, [rowVirtualizer, selected?.key, scrollElement]);

	const board = (
		<div
			className={
				popout
					? "flex h-full min-h-0 flex-col overflow-y-auto rounded-xl border bg-card"
					: "flex h-full min-h-0 flex-col overflow-y-auto rounded-2xl border bg-card shadow-sm"
			}
		>
			{popout ? null : (
				<div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
					<span className="font-semibold text-sm tracking-tight">
						Run history
					</span>
					<button
						type="button"
						onClick={() => setPopout(true)}
						title="Open the run history in a larger window"
						className="flex h-8 items-center gap-1.5 rounded-lg border bg-background px-3 font-medium text-xs transition-colors hover:border-primary/40 hover:text-primary"
					>
						<Maximize2 className="size-3.5" aria-hidden />
						Expand
					</button>
				</div>
			)}
			<RunStatsStrip
				totals={outcomeTotals}
				showing={filteredRuns.length}
				overall={runs.length}
				filtersActive={hasActiveFilters}
				onClearFilters={clearFilters}
				statusFilters={statusFilters}
				onToggleGroup={toggleStatusGroup}
			/>
			<RunHistoryFilterBar
				keyword={keyword}
				onKeywordChange={setKeyword}
				runIdQuery={runIdQuery}
				onRunIdQueryChange={setRunIdQuery}
				started={started}
				onStartedChange={changeStarted}
				statusFilters={statusFilters}
				onToggleStatusFilter={toggleStatusFilter}
				hasActiveFilters={hasActiveFilters}
				onClearFilters={clearFilters}
				searching={searchingForKeyword}
			/>
			<div className="flex items-center justify-between gap-3 border-border border-b bg-muted/40 px-4 py-3 text-xs">
				<fieldset className="m-0 inline-flex gap-0.5 rounded-xl border-0 bg-muted p-1">
					<legend className="sr-only">Run history view</legend>
					{(
						[
							{
								mode: "runs",
								label: "Run history",
								icon: History,
							},
							{
								mode: "nodes",
								label: "Node by node",
								icon: Route,
							},
						] as const
					).map(({ mode, label, icon: Icon }) => (
						<button
							key={mode}
							type="button"
							aria-pressed={viewMode === mode}
							onClick={() => changeViewMode(mode)}
							className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 font-medium text-xs transition-all duration-200 ${
								viewMode === mode
									? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
									: "text-muted-foreground hover:bg-background/60 hover:text-foreground"
							}`}
						>
							<Icon className="size-3.5" aria-hidden />
							{label}
						</button>
					))}
				</fieldset>
				<span className="text-muted-foreground">
					{viewMode === "nodes"
						? `${nodeExecutionCount.toLocaleString()} node execution${nodeExecutionCount === 1 ? "" : "s"} · ${loadedRunCount} of ${filteredRuns.length} run${filteredRuns.length === 1 ? "" : "s"} loaded`
						: `Showing ${filteredRuns.length.toLocaleString()} of ${runs.length.toLocaleString()} run${runs.length === 1 ? "" : "s"}`}
				</span>
			</div>
			{viewMode === "nodes" ? (
				<div className={cn("grid", NODE_GRID_COLUMNS, HEADER_ROW)}>
					<span>Run</span>
					<span>Hit</span>
					<span>Path</span>
					<span>Time Started</span>
					<span>Time Ended</span>
					<span>Status</span>
					<span>Duration</span>
				</div>
			) : (
				<div className={cn("grid", GRID_COLUMNS, HEADER_ROW)}>
					<span />
					<span>ID / Node</span>
					<span>Time Started</span>
					<span>Time Ended</span>
					<span>Status</span>
					<span>Actions</span>
				</div>
			)}

			{runs.length === 0 ? (
				<DashboardEmptyState
					icon={Inbox}
					title="No runs yet"
					description="Run this automation and every message will appear here, ready to inspect node by node."
				/>
			) : filteredRuns.length === 0 ? (
				searchingForKeyword ? (
					<DashboardEmptyState
						icon={Search}
						title="Searching retained run data…"
						description="Looking through incoming and outgoing messages and variable maps."
					/>
				) : (
					<DashboardEmptyState
						icon={SearchX}
						title="No runs match your filters"
						description="Try widening the date range or clearing a status to see more messages."
					/>
				)
			) : (
				<div
					ref={setScrollElement}
					className="relative min-h-90 flex-1 overflow-y-auto"
				>
					<div
						style={{
							height: rowVirtualizer.getTotalSize(),
							width: "100%",
							position: "relative",
						}}
					>
						{rowVirtualizer.getVirtualItems().map((virtualRow) => {
							const row = renderRows[virtualRow.index];
							return (
								<div
									key={row.key}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										height: virtualRow.size,
										transform: `translateY(${virtualRow.start}px)`,
									}}
								>
									{row.kind === "detail" && selected ? (
										<NodeDetailPanel
											selected={selected}
											detailTab={detailTab}
											onChangeTab={setDetailTab}
											onOutputPopout={onOutputPopout}
										/>
									) : row.kind === "execution" ||
										row.kind === "run-status" ? (
										<NodeByNodeRowView
											row={row}
											selectedKey={selected?.key ?? null}
											onSelectNode={selectNode}
											onRetry={fetchDetailIfNeeded}
										/>
									) : (
										<DashboardRowView
											row={row as DashboardRow}
											selectedKey={selected?.key ?? null}
											onToggleRun={toggleRun}
											onRetry={fetchDetailIfNeeded}
											onSelectNode={selectNode}
											cancellingRunIds={cancellingRunIds}
											onCancelRun={setCancelTarget}
											reprocessableByRun={
												reprocessableByRun
											}
											reprocessableLoopBodiesByRun={
												reprocessableLoopBodiesByRun
											}
											reprocessBusy={nodeRerunPending}
											onReprocess={openReprocess}
										/>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
			<Dialog
				open={reprocessTarget !== null}
				onOpenChange={(open) => {
					if (!open && !nodeRerunPending) closeReprocess();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Reprocess message{" "}
							{reprocessTarget
								? runNumbers.get(reprocessTarget.runId)
								: ""}
						</DialogTitle>
						<DialogDescription>
							{reprocessLoopLabel !== null &&
							reprocessTarget?.loop ? (
								<>
									Loop {reprocessLoopLabel}, item{" "}
									{reprocessTarget.loop.iteration + 1}.{" "}
								</>
							) : null}
							This starts a new run, using the automation as it is
							saved now. The original run stays exactly as it ran.
							{reprocessWhole
								? " Every node runs again from the start, using the automation's current variable defaults."
								: " Only the nodes you choose run again, in order. The new run shows every other node as carried over from the original, so nodes after a reprocessed node are not recalculated unless you choose them too."}
							{reprocessTarget?.loop
								? " Only this item of the loop is run again; the loop's other items and its collected results are carried over as they were."
								: null}
						</DialogDescription>
					</DialogHeader>
					{reprocessTarget?.nodeId === null &&
					reprocessTarget.loop === null ? (
						<div className="inline-flex w-fit gap-0.5 rounded-xl bg-muted p-1">
							{(
								[
									{ whole: true, label: "Whole message" },
									{ whole: false, label: "Choose nodes" },
								] as const
							).map(({ whole, label }) => (
								<button
									key={label}
									type="button"
									aria-pressed={reprocessWhole === whole}
									disabled={nodeRerunPending}
									onClick={() => setReprocessWhole(whole)}
									className={`h-8 rounded-lg px-4 font-medium text-xs transition-all duration-200 disabled:opacity-60 ${
										reprocessWhole === whole
											? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
											: "text-muted-foreground hover:bg-background/60 hover:text-foreground"
									}`}
								>
									{label}
								</button>
							))}
						</div>
					) : null}
					{reprocessWhole ? null : reprocessDetail === undefined ? (
						<div className="flex items-center gap-2 py-4 text-muted-foreground text-xs">
							<Loader2
								className="h-4 w-4 animate-spin"
								aria-hidden
							/>
							Loading this message's nodes…
						</div>
					) : reprocessNodes.length === 0 ? (
						<p className="py-4 text-muted-foreground text-xs">
							None of this message's nodes can be reprocessed.
						</p>
					) : (
						<div className="flex flex-col gap-2">
							<div className="flex items-center gap-1">
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="h-7 px-2 text-xs"
									disabled={nodeRerunPending}
									onClick={() =>
										setReprocessSelected(
											new Set(
												reprocessNodes.map(
													(node) => node.id,
												),
											),
										)
									}
								>
									Select all
								</Button>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="h-7 px-2 text-xs"
									disabled={nodeRerunPending}
									onClick={() =>
										setReprocessSelected(new Set())
									}
								>
									Select none
								</Button>
							</div>
							<ul className="max-h-72 divide-y overflow-y-auto rounded-xl border shadow-sm">
								{reprocessNodes.map((node) => (
									<li key={node.id}>
										<label className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm transition-colors hover:bg-primary/5 has-[:checked]:bg-primary/[0.07]">
											<input
												type="checkbox"
												className="size-4 accent-primary"
												checked={
													reprocessSelected?.has(
														node.id,
													) ?? false
												}
												disabled={nodeRerunPending}
												onChange={() =>
													toggleReprocessNode(node.id)
												}
											/>
											<span className="min-w-0 flex-1 truncate font-medium">
												{node.label}
											</span>
											<StatusPill
												status={node.status}
												kind="node"
											/>
										</label>
									</li>
								))}
							</ul>
						</div>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={closeReprocess}
							disabled={nodeRerunPending}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={() => void confirmReprocess()}
							disabled={
								nodeRerunPending ||
								(!reprocessWhole &&
									(!reprocessSelected ||
										reprocessSelected.size === 0))
							}
						>
							{nodeRerunPending ? (
								<Spinner className="size-4" />
							) : (
								<RotateCw
									className="mr-1 h-4 w-4"
									aria-hidden
								/>
							)}
							{reprocessWhole
								? "Run message again"
								: `Reprocess ${reprocessSelected?.size ?? 0} node${reprocessSelected?.size === 1 ? "" : "s"}`}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog
				open={cancelTarget !== null}
				onOpenChange={(open) => {
					if (!open && !cancelSubmitting) setCancelTarget(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel this run?</DialogTitle>
						<DialogDescription>
							{cancelTarget?.STATUS === "WAITING_FOR_INPUT"
								? "The run is waiting for agent input. Cancelling stops the agent and ends the run without running the remaining steps."
								: "The run stops between steps. Work already completed in this run is kept in its history."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setCancelTarget(null)}
							disabled={cancelSubmitting}
						>
							Keep running
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={() => void confirmCancel()}
							disabled={cancelSubmitting}
						>
							{cancelSubmitting ? (
								<Spinner className="size-4" />
							) : null}
							Cancel run
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);

	if (!popout) return board;
	return (
		<>
			<div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
				<span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<Maximize2 className="size-5" aria-hidden />
				</span>
				<p className="font-semibold text-sm">
					The run history is open in the expanded window
				</p>
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="rounded-full"
					onClick={() => setPopout(false)}
				>
					Bring it back here
				</Button>
			</div>
			<Dialog
				open
				onOpenChange={(open) => {
					if (!open) setPopout(false);
				}}
			>
				<DialogContent
					className={cn(
						POPOUT_DIALOG_SIZE,
						"gap-0 overflow-hidden rounded-2xl p-0",
					)}
				>
					<div className="flex shrink-0 items-center border-b bg-muted/30 px-5 py-3.5 pr-14">
						<DialogTitle className="text-base">
							Advanced run history
						</DialogTitle>
						<DialogDescription className="sr-only">
							The run history dashboard, shown larger.
						</DialogDescription>
					</div>
					<div className="min-h-0 flex-1 p-3">{board}</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

function RunHistoryFilterBar({
	keyword,
	onKeywordChange,
	runIdQuery,
	onRunIdQueryChange,
	started,
	onStartedChange,
	statusFilters,
	onToggleStatusFilter,
	hasActiveFilters,
	onClearFilters,
	searching,
}: {
	keyword: string;
	onKeywordChange: (value: string) => void;
	runIdQuery: string;
	onRunIdQueryChange: (value: string) => void;
	started: StartedFilters;
	onStartedChange: (field: keyof StartedFilters, value: string) => void;
	statusFilters: ReadonlySet<RunStatus>;
	onToggleStatusFilter: (status: RunStatus) => void;
	hasActiveFilters: boolean;
	onClearFilters: () => void;
	searching: boolean;
}) {
	return (
		<div className="flex flex-wrap items-end gap-x-4 gap-y-3 border-border border-b bg-muted/30 px-4 py-3">
			<div className="flex min-w-65 flex-1 flex-col gap-1.5">
				<span className={FILTER_LABEL}>
					Search messages &amp; variable map
				</span>
				<div className="group relative">
					<Search
						className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground transition-colors group-focus-within:text-primary"
						aria-hidden="true"
					/>
					<Input
						value={keyword}
						onChange={(event) =>
							onKeywordChange(event.target.value)
						}
						placeholder="Search incoming, outgoing, and variable map values"
						className={`${FILTER_INPUT} pl-9`}
					/>
				</div>
			</div>
			<div className="flex w-32 flex-col gap-1.5">
				<span className={FILTER_LABEL}>Run ID</span>
				<Input
					value={runIdQuery}
					onChange={(event) => onRunIdQueryChange(event.target.value)}
					placeholder="e.g. 42"
					className={FILTER_INPUT}
				/>
			</div>
			{(
				[
					["date", "dateFrom", "Date from"],
					["date", "dateTo", "Date to"],
					["time", "timeFrom", "Time from"],
					["time", "timeTo", "Time to"],
				] as const
			).map(([type, field, label]) => (
				<div key={field} className="flex flex-col gap-1.5">
					<span className={FILTER_LABEL}>{label}</span>
					<input
						type={type}
						value={started[field]}
						onChange={(event) =>
							onStartedChange(field, event.target.value)
						}
						aria-label={label}
						className={`${FILTER_INPUT} border px-2.5`}
					/>
				</div>
			))}
			<div className="flex flex-col gap-1.5">
				<span className={FILTER_LABEL}>Status</span>
				<fieldset
					aria-label="Filter by status"
					className="m-0 flex min-w-0 flex-wrap items-center gap-1.5 border-0 p-0"
				>
					{STATUS_FILTER_OPTIONS.map(({ status, label }) => (
						<label
							key={status}
							className="flex cursor-pointer select-none items-center gap-1.5 rounded-full border bg-background px-2.5 py-1.5 text-xs transition-colors hover:border-primary/40 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/10 has-[:checked]:font-medium has-[:checked]:text-primary"
						>
							<input
								type="checkbox"
								className="size-3.5 accent-primary"
								checked={statusFilters.has(status)}
								onChange={() => onToggleStatusFilter(status)}
							/>
							{label}
						</label>
					))}
				</fieldset>
			</div>
			{searching ? (
				<span className="flex items-center gap-1.5 text-primary text-xs">
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
					Searching retained data…
				</span>
			) : null}
			{hasActiveFilters ? (
				<button
					type="button"
					onClick={onClearFilters}
					className="flex h-9 items-center rounded-lg px-3 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
				>
					Clear filters
				</button>
			) : null}
		</div>
	);
}

function formatDurationMs(ms: number): string {
	if (ms < 1000) return `${ms} ms`;
	const seconds = ms / 1000;
	if (seconds < 60) return `${seconds.toFixed(1)} s`;
	return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

/** One row of the node-by-node view: a single node execution, or a placeholder for an unloaded run. */
function NodeByNodeRowView({
	row,
	selectedKey,
	onSelectNode,
	onRetry,
}: {
	row: NodeByNodeRow;
	selectedKey: string | null;
	onSelectNode: (
		key: string,
		label: string,
		result: AutomationNodeResult | null,
	) => void;
	onRetry: (runId: string) => void;
}) {
	if (row.kind === "run-status") {
		return (
			<div
				className={`grid h-full ${NODE_GRID_COLUMNS} items-center gap-3 border-border border-b border-l-[3px] border-l-transparent bg-muted/40 px-4 text-muted-foreground text-xs`}
			>
				<span className="font-medium tabular-nums">
					{row.runNumber}
				</span>
				<span />
				<span className="col-span-5 flex items-center gap-2">
					{row.state === "loading" ? (
						<>
							<Loader2
								className="h-3.5 w-3.5 animate-spin text-primary"
								aria-hidden
							/>
							Loading this run's nodes…
						</>
					) : (
						<>
							{row.message ?? "Unable to load run details."}
							<button
								type="button"
								onClick={() => onRetry(row.runId)}
								className="rounded-md px-2 py-0.5 font-medium text-destructive underline-offset-2 transition-colors hover:bg-destructive/10 hover:underline"
							>
								Retry
							</button>
						</>
					)}
				</span>
			</div>
		);
	}

	const isSelected = row.key === selectedKey;
	const detailLabel =
		row.iterationIndex === null
			? row.label
			: `${row.loopLabel} · Item ${row.iterationIndex + 1} · ${row.label}`;
	const visibleSteps = row.path.slice(-MAX_VISIBLE_PATH_STEPS);
	const hiddenSteps = row.path.length - visibleSteps.length;
	return (
		<button
			type="button"
			onClick={() => onSelectNode(row.key, detailLabel, row.result)}
			title={row.path.map((step) => step.label).join(" → ")}
			className={cn(
				ROW_BASE,
				NODE_GRID_COLUMNS,
				statusAccent(row.status),
				"w-full cursor-pointer text-left text-xs focus-visible:bg-accent focus-visible:outline-none",
				isSelected ? "bg-accent" : "bg-background",
			)}
		>
			<span className="flex items-center gap-1.5 font-medium text-muted-foreground tabular-nums">
				<ChevronRight
					className={`size-3.5 shrink-0 transition-transform duration-200 group-hover:text-primary ${isSelected ? "rotate-90 text-primary" : ""}`}
					aria-hidden
				/>
				{row.runNumber}
			</span>
			<span className="text-muted-foreground tabular-nums">
				{row.hit}
			</span>
			<span className="flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap">
				{hiddenSteps > 0 ? (
					<span className="shrink-0 text-muted-foreground">…</span>
				) : null}
				{visibleSteps.map((step, index) => {
					const isCurrent = index === visibleSteps.length - 1;
					return (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: steps can repeat labels; position is their identity.
							key={index}
							className="flex shrink-0 items-center gap-1"
						>
							<span
								className={
									isCurrent
										? "rounded-md bg-primary/10 px-1.5 py-0.5 font-semibold text-primary"
										: step.kind === "iteration"
											? "text-muted-foreground italic"
											: "text-muted-foreground"
								}
							>
								{step.label}
							</span>
							{isCurrent ? null : (
								<ChevronRight
									className="size-3 text-muted-foreground/50"
									aria-hidden
								/>
							)}
						</span>
					);
				})}
			</span>
			<span className="text-muted-foreground tabular-nums">
				{nodeTimeLabel(row.result.STARTED_AT)}
			</span>
			<span className="text-muted-foreground tabular-nums">
				{nodeTimeLabel(row.result.COMPLETED_AT)}
			</span>
			<span>
				<StatusPill status={row.status} kind="node" />
			</span>
			<span className="font-medium text-muted-foreground tabular-nums">
				{formatDurationMs(row.durationMs)}
			</span>
		</button>
	);
}

function DashboardRowView({
	row,
	selectedKey,
	onToggleRun,
	onRetry,
	onSelectNode,
	cancellingRunIds,
	onCancelRun,
	reprocessableByRun,
	reprocessableLoopBodiesByRun,
	reprocessBusy,
	onReprocess,
}: {
	row: DashboardRow;
	selectedKey: string | null;
	onToggleRun: (expandKey: string, runId: string) => void;
	onRetry: (runId: string) => void;
	onSelectNode: (
		key: string,
		label: string,
		result: AutomationNodeResult | null,
	) => void;
	cancellingRunIds: Set<string>;
	onCancelRun: (run: AutomationRunSummary) => void;
	reprocessableByRun: ReadonlyMap<string, ReadonlySet<string>>;
	reprocessableLoopBodiesByRun: ReadonlyMap<
		string,
		ReadonlyMap<string, ReadonlySet<string>>
	>;
	reprocessBusy: boolean;
	/**
	 * Opens the reprocess dialog for a run, starting with one node ticked, or all when null.
	 * A loop pass offers that pass's body nodes instead of the run's top-level nodes.
	 */
	onReprocess: (
		runId: string,
		nodeId: string | null,
		loop: LoopIterationTarget | null,
	) => void;
}) {
	if (row.kind === "run") {
		return (
			<div
				className={cn(
					ROW_BASE,
					GRID_COLUMNS,
					statusAccent(row.status),
					"text-sm",
					row.expanded ? "bg-accent" : "bg-background",
				)}
			>
				<button
					type="button"
					onClick={() => onToggleRun(row.expandKey, row.run.RUN_ID)}
					aria-label={row.expanded ? "Collapse run" : "Expand run"}
					className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
				>
					{row.loading ? (
						<Loader2 className="size-3.5 animate-spin text-primary" />
					) : (
						<ChevronRight
							className={`size-4 transition-transform duration-200 ${row.expanded ? "rotate-90 text-primary" : ""}`}
						/>
					)}
				</button>
				<span className="flex min-w-0 items-center gap-2">
					<span className="rounded-md bg-muted px-2 py-0.5 font-mono font-semibold text-foreground text-xs tabular-nums transition-colors group-hover:bg-primary/10 group-hover:text-primary">
						{row.iteration === null
							? row.runNumber
							: `${row.runNumber}.${row.iteration}`}
					</span>
					{row.run.REPROCESSED_FROM_RUN_ID ? (
						<span
							className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs ring-1 ring-primary/20 ring-inset"
							title={
								row.reprocessedFromRunNumber === null
									? "Started by reprocessing an earlier run"
									: `Started by reprocessing run ${row.reprocessedFromRunNumber}`
							}
						>
							<RotateCw className="size-2.5" aria-hidden />
							{row.reprocessedFromRunNumber === null
								? "Reprocessed"
								: `from ${row.reprocessedFromRunNumber}`}
						</span>
					) : null}
					{row.loadError ? (
						<button
							type="button"
							onClick={() => onRetry(row.run.RUN_ID)}
							className="truncate rounded-md px-1.5 py-0.5 text-destructive text-xs underline-offset-2 hover:bg-destructive/10 hover:underline"
						>
							{row.loadError} · Retry
						</button>
					) : null}
				</span>
				<span className="text-muted-foreground tabular-nums">
					{nodeTimeLabel(row.startedAt)}
				</span>
				<span className="text-muted-foreground tabular-nums">
					{nodeTimeLabel(row.completedAt)}
				</span>
				<span>
					<StatusPill status={row.status} kind="run" />
				</span>
				<span className="flex justify-start">
					{isRunCancellable(row.run.STATUS) ? (
						<Button
							type="button"
							size="sm"
							variant="outline"
							className={CANCEL_BUTTON}
							disabled={cancellingRunIds.has(row.run.RUN_ID)}
							onClick={() => onCancelRun(row.run)}
							aria-label={`Cancel run ${row.runNumber}`}
						>
							{cancellingRunIds.has(row.run.RUN_ID) ? (
								<Loader2
									className="size-3.5 animate-spin"
									aria-hidden
								/>
							) : (
								<Square className="size-3.5" aria-hidden />
							)}
							Cancel
						</Button>
					) : isRunRerunnable(row.run.STATUS) ? (
						<Button
							type="button"
							size="sm"
							variant="outline"
							className={REPROCESS_BUTTON}
							disabled={reprocessBusy}
							onClick={() =>
								onReprocess(row.run.RUN_ID, null, row.loop)
							}
							aria-label={`Reprocess message ${row.iteration === null ? row.runNumber : `${row.runNumber}.${row.iteration}`}`}
							title={
								row.loop
									? "Choose which nodes of this loop item to run again"
									: "Choose which nodes of this message to run again"
							}
						>
							<RotateCw className="size-3.5" aria-hidden />
							Reprocess message
						</Button>
					) : null}
				</span>
			</div>
		);
	}

	if (row.kind === "node") {
		const nodeLabel = row.node.NODE_LABEL || row.node.NODE_ID;
		const isSelected = row.key === selectedKey;
		return (
			<div
				className={cn(
					ROW_BASE,
					GRID_COLUMNS,
					statusAccent(row.node.STATUS),
					"relative pl-8 text-sm",
					isSelected ? "bg-accent" : "bg-background",
				)}
			>
				<span
					aria-hidden
					className="absolute top-0 left-[22px] h-1/2 w-3 rounded-bl-md border-border border-b border-l"
				/>
				<button
					type="button"
					onClick={() => onSelectNode(row.key, nodeLabel, row.node)}
					aria-label={
						isSelected
							? `Collapse ${nodeLabel}`
							: `Expand ${nodeLabel}`
					}
					aria-expanded={isSelected}
					className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
				>
					<ChevronRight
						className={`size-4 transition-transform duration-200 ${isSelected ? "rotate-90 text-primary" : ""}`}
					/>
				</button>
				<button
					type="button"
					onClick={() => onSelectNode(row.key, nodeLabel, row.node)}
					title={nodeLabel}
					className="flex w-full min-w-0 items-center gap-2 text-left font-medium transition-colors hover:text-primary"
				>
					<span className="truncate">{nodeLabel}</span>
					{row.node.CARRIED_OVER ? (
						<span
							className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs ring-1 ring-border ring-inset"
							title="Not run again: this result was carried over from the run this one reprocesses"
						>
							Carried over
						</span>
					) : null}
				</button>
				<span className="text-muted-foreground tabular-nums">
					{nodeTimeLabel(row.node.STARTED_AT)}
				</span>
				<span className="text-muted-foreground tabular-nums">
					{nodeTimeLabel(row.node.COMPLETED_AT)}
				</span>
				<span>
					<StatusPill status={row.node.STATUS} kind="node" />
				</span>
				<span className="flex justify-start">
					{(
						row.loop
							? ranInIteration(row.node.STATUS) &&
								reprocessableLoopBodiesByRun
									.get(row.runId)
									?.get(row.loop.loopNodeId)
									?.has(row.node.NODE_ID)
							: reprocessableByRun
									.get(row.runId)
									?.has(row.node.NODE_ID)
					) ? (
						<Button
							type="button"
							size="sm"
							variant="outline"
							className={REPROCESS_BUTTON}
							disabled={reprocessBusy}
							onClick={() =>
								onReprocess(
									row.runId,
									row.node.NODE_ID,
									row.loop,
								)
							}
							aria-label={`Reprocess ${nodeLabel}`}
							title="Run this node again, optionally with others"
						>
							<RotateCw className="size-3.5" aria-hidden />
							Reprocess
						</Button>
					) : null}
				</span>
			</div>
		);
	}
}

function isDetailTab(value: string): value is DetailTab {
	return value === "variables" || value === "error" || value === "success";
}

/** The reason a node failed, in a card that stands out, with a one-click copy for sharing it. */
function ErrorReason({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	useEffect(() => {
		if (!copied) return;
		const timer = window.setTimeout(() => setCopied(false), 1800);
		return () => window.clearTimeout(timer);
	}, [copied]);
	return (
		<div className="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5">
			<div className="flex items-center justify-between gap-3 border-destructive/20 border-b bg-destructive/10 px-4 py-2.5">
				<span className="flex items-center gap-2 font-semibold text-destructive text-sm">
					<TriangleAlert className="size-4" aria-hidden />
					Why this node failed
				</span>
				<button
					type="button"
					onClick={() => {
						void navigator.clipboard?.writeText(text).then(
							() => setCopied(true),
							() => undefined,
						);
					}}
					className="flex h-7 items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-2.5 font-medium text-destructive text-xs transition-colors hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
				>
					{copied ? (
						<Check className="size-3.5" aria-hidden />
					) : (
						<Copy className="size-3.5" aria-hidden />
					)}
					{copied ? "Copied" : "Copy"}
				</button>
			</div>
			<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-foreground text-xs leading-relaxed">
				{text}
			</pre>
		</div>
	);
}

function NodeDetailPanel({
	selected,
	detailTab,
	onChangeTab,
	onOutputPopout,
}: {
	selected: SelectedNode;
	detailTab: DetailTab;
	onChangeTab: (tab: DetailTab) => void;
	onOutputPopout: (output: string) => void;
}) {
	const variableRows = getRunScopeVariableRows(selected.result.scopeSnapshot);
	const errorText = nodeErrorText(selected.result);
	const successText = nodeSuccessText(selected.result);

	return (
		<section className="flex h-full w-full flex-col border-border border-b border-l-[3px] border-l-primary bg-muted/30 pl-9 shadow-inner">
			<Tabs
				value={detailTab}
				onValueChange={(value) => {
					if (isDetailTab(value)) onChangeTab(value);
				}}
				className="flex min-h-0 flex-1 flex-col"
			>
				<TabsList className="mx-4 mt-3 w-fit rounded-xl bg-muted p-1 shadow-sm">
					{successText === null ? null : (
						<TabsTrigger
							value="success"
							className="gap-1.5 rounded-lg px-4 text-success data-[state=active]:text-success"
						>
							<CircleCheck className="size-3.5" aria-hidden />
							Success message
						</TabsTrigger>
					)}
					<TabsTrigger value="variables" className="rounded-lg px-4">
						Variable Map
					</TabsTrigger>
					{errorText === null ? null : (
						<TabsTrigger
							value="error"
							className="gap-1.5 rounded-lg px-4 text-destructive data-[state=active]:text-destructive"
						>
							<TriangleAlert className="size-3.5" aria-hidden />
							Error message
						</TabsTrigger>
					)}
				</TabsList>
				{successText === null ? null : (
					<TabsContent
						value="success"
						className="min-h-0 flex-1 overflow-y-auto p-4"
					>
						<div className="overflow-hidden rounded-xl border border-success/30 bg-success/5">
							<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-foreground text-xs leading-relaxed">
								{successText}
							</pre>
						</div>
					</TabsContent>
				)}
				{errorText === null ? null : (
					<TabsContent
						value="error"
						className="min-h-0 flex-1 overflow-y-auto p-4"
					>
						<ErrorReason text={errorText} />
					</TabsContent>
				)}
				<TabsContent
					value="variables"
					className="min-h-0 flex-1 overflow-y-auto p-4"
				>
					{variableRows && variableRows.length > 0 ? (
						<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
							<Table
								className="text-xs"
								wrapperClassName="overflow-visible"
							>
								<TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
									<TableRow>
										<TableHead className="h-auto py-2 font-semibold uppercase tracking-wider">
											Name
										</TableHead>
										<TableHead className="h-auto py-2 font-semibold uppercase tracking-wider">
											Value
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{variableRows.map((row) => (
										<TableRow
											key={row.name}
											className="transition-colors hover:bg-primary/5"
										>
											<TableCell className="align-top font-mono font-semibold text-primary">
												{row.name}
											</TableCell>
											<TableCell className="break-words align-top font-mono">
												{row.value}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<CellOutputBlock
							output="No variable snapshot was retained for this node."
							onOutputPopout={() =>
								onOutputPopout(
									"No variable snapshot was retained for this node.",
								)
							}
						/>
					)}
				</TabsContent>
			</Tabs>
		</section>
	);
}
