import {
	CalendarClock,
	ChevronRight,
	Clock3,
	Loader2,
	Play,
	RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CellOutputBlock } from "@semoss/shared";
import { Button, toast } from "@semoss/ui/next";
import { getAutomationRun, listAutomationRuns } from "../../../api";
import type {
	AutomationExecutedDefinition,
	AutomationNode,
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunSummary,
	RunStatus,
} from "../../../domain/automation.types";
import { buildAssistantHandoffPrompt } from "../../../domain/automation-assistant-handoff";
import {
	formatRelativeTime,
	formatRunDuration,
	formatTimestamp,
	getDisplayMeta,
} from "../../../domain/automation-display";
import {
	formatDurationMs,
	normalizeAutomationErrorMessage,
} from "../../../domain/automation-utils";
import type { AutomationWorkflowDocument } from "../../../domain/automation-workflow.types";
import { canvasDocumentFromWorkflow } from "../../../domain/automation-workflow-adapter";
import { getWorkflowNodeDisplay } from "../../../domain/automation-workflow-display";
import { ErrorDetail } from "../../form-editor/error-detail";
import { ExecutedDefinitionDetail } from "../../form-editor/executed-definition-detail";
import { TraceDetail } from "../../form-editor/trace-detail";
import { StatusBadge } from "../../status-badge";
import { RunBanner } from "../run-banner";

export interface RunsTabSnapshot {
	running: boolean;
	latestRunStatus: RunStatus | null;
	aiRunSummary: string | null;
	generatingAiSummary: boolean;
	steps: AutomationNode[];
	results: AutomationNodeResult[];
}

/** Live trace state shared with a host rendering `RunsTab` alongside `AutomationCanvas`. */
export interface AutomationTraceSnapshot extends RunsTabSnapshot {
	executedDefinition: AutomationExecutedDefinition | null;
	/** Latest detail returned for the live run, including its temporary workspace. */
	activeRun?: AutomationRunDetail | null;
}

interface RunsTabProps extends AutomationTraceSnapshot {
	appId: string;
	refreshToken: number;
	onDismiss: () => void;
	/** Pop a step/run output value out into a larger viewer, for a host rendering this tab
	 * alongside the canvas instead of in a separate iframe. */
	onOpenOutput?: (output: string) => void;
	/** Hand a run's status off to the Assistant as a draft prompt. */
	onAskAssistant?: (prompt: string) => void;
	/** Render a past run's snapshot read-only on the canvas, in place of the live editable graph. */
	onViewRun?: (run: AutomationRunDetail) => void;
	/** Returns the canvas to the live editable graph — fired whenever the run detail view is left. */
	onExitHistoricalView?: () => void;
	/** A node to jump straight to in the latest run's results, e.g. from the inspector's
	 * "View run details" button. */
	focusNodeId?: string | null;
	/** Bumped on every request so re-focusing the same node (after navigating away) still
	 * takes effect. */
	focusToken?: number;
}

type View = "history" | "live" | "detail";

function getExecutedSteps(run: AutomationRunDetail | null): AutomationNode[] {
	if (!run?.DEFINITION_SNAPSHOT) return [];
	try {
		return canvasDocumentFromWorkflow(
			JSON.parse(run.DEFINITION_SNAPSHOT) as AutomationWorkflowDocument,
		).steps;
	} catch {
		return [];
	}
}

export function RunsTab({
	appId,
	refreshToken,
	running,
	latestRunStatus,
	aiRunSummary,
	generatingAiSummary,
	steps,
	results,
	executedDefinition,
	onDismiss,
	onOpenOutput,
	onAskAssistant,
	onViewRun,
	onExitHistoricalView,
	focusNodeId,
	focusToken,
}: RunsTabProps) {
	const [view, setView] = useState<View>("history");
	const [runs, setRuns] = useState<AutomationRunSummary[]>([]);
	const [loading, setLoading] = useState(false);
	const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
	const [selectedRun, setSelectedRun] = useState<AutomationRunDetail | null>(
		null,
	);
	const [detailLoading, setDetailLoading] = useState(false);
	const detailsCache = useRef<Record<string, AutomationRunDetail>>({});
	const requestRef = useRef(0);
	const detailRequestRef = useRef(0);
	const previousRefreshTokenRef = useRef(refreshToken);

	// Auto-switch to live view when a run starts. The canvas is released from the historical
	// run at the same time, so the new run's node statuses are not painted onto an old graph.
	// Keyed on the running transition alone, through a ref: depending on the callback would
	// re-run this on every parent render and keep forcing the view back to live, which would
	// make the Run History breadcrumb unusable for the duration of a run.
	const exitHistoricalViewRef = useRef(onExitHistoricalView);
	useEffect(() => {
		exitHistoricalViewRef.current = onExitHistoricalView;
	}, [onExitHistoricalView]);
	useEffect(() => {
		if (!running) return;
		setView("live");
		setSelectedRun(null);
		exitHistoricalViewRef.current?.();
	}, [running]);

	// A "View run details" click from the inspector jumps to the latest run's results,
	// selected on whichever node it was asked for.
	useEffect(() => {
		if (!focusNodeId || !focusToken) return;
		setView("live");
		setSelectedRun(null);
		exitHistoricalViewRef.current?.();
	}, [focusNodeId, focusToken]);

	const refresh = useCallback(async () => {
		const requestId = ++requestRef.current;
		setLoading(true);
		try {
			const nextRuns = await listAutomationRuns(appId);
			if (requestId !== requestRef.current) return;
			setRuns(nextRuns);
			setLastRefreshed(new Date());
		} catch (error) {
			if (requestId === requestRef.current) {
				toast.error(
					error instanceof Error
						? normalizeAutomationErrorMessage(error.message)
						: "Unable to load run history.",
				);
			}
		} finally {
			if (requestId === requestRef.current) setLoading(false);
		}
	}, [appId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	useEffect(() => {
		if (previousRefreshTokenRef.current === refreshToken) return;
		previousRefreshTokenRef.current = refreshToken;
		void refresh();
	}, [refresh, refreshToken]);

	// A run opened from history can still be active. Keep its detail current so
	// status and temporary workspace metadata follow the live execution.
	useEffect(() => {
		if (selectedRun?.STATUS !== "RUNNING") return;
		let cancelled = false;
		const interval = window.setInterval(() => {
			getAutomationRun(appId, selectedRun.RUN_ID)
				.then((detail) => {
					if (cancelled) return;
					detailsCache.current[detail.RUN_ID] = detail;
					setSelectedRun(detail);
					onViewRun?.(detail);
				})
				.catch(() => {
					// The manual refresh remains available if reconciliation fails.
				});
		}, 2500);
		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [appId, onViewRun, selectedRun?.RUN_ID, selectedRun?.STATUS]);

	const openRun = useCallback(
		async (runId: string) => {
			// Opening a second run before the first detail request returns must not let the
			// slower response win and pin the canvas to a run the user already moved off.
			const requestId = ++detailRequestRef.current;
			const cached = detailsCache.current[runId];
			if (cached) {
				setSelectedRun(cached);
				setView("detail");
				onViewRun?.(cached);
				return;
			}
			setDetailLoading(true);
			setView("detail");
			try {
				const detail = await getAutomationRun(appId, runId);
				detailsCache.current[runId] = detail;
				if (requestId !== detailRequestRef.current) return;
				setSelectedRun(detail);
				onViewRun?.(detail);
			} catch (error) {
				if (requestId !== detailRequestRef.current) return;
				toast.error(
					error instanceof Error
						? normalizeAutomationErrorMessage(error.message)
						: "Unable to load run details.",
				);
				setView("history");
			} finally {
				if (requestId === detailRequestRef.current) {
					setDetailLoading(false);
				}
			}
		},
		[appId, onViewRun],
	);

	const goBack = useCallback(() => {
		setView("history");
		setSelectedRun(null);
		onExitHistoricalView?.();
	}, [onExitHistoricalView]);

	const handleOutputPopout = useCallback(
		(output: string) => onOpenOutput?.(output),
		[onOpenOutput],
	);

	const handleAskAssistant = useCallback(() => {
		if (!latestRunStatus || !onAskAssistant) return;
		const prompt = buildAssistantHandoffPrompt({
			status: latestRunStatus,
			runSummary: aiRunSummary,
			steps,
			results,
		});
		onAskAssistant(prompt);
	}, [aiRunSummary, latestRunStatus, onAskAssistant, results, steps]);

	if (view === "live" || (view === "history" && running)) {
		return (
			<LiveRunView
				running={running}
				latestRunStatus={latestRunStatus}
				aiRunSummary={aiRunSummary}
				generatingAiSummary={generatingAiSummary}
				steps={steps}
				results={results}
				executedDefinition={executedDefinition}
				onOutputPopout={handleOutputPopout}
				onAskAssistant={handleAskAssistant}
				onDismiss={onDismiss}
				onBack={goBack}
				focusNodeId={focusNodeId}
				focusToken={focusToken}
			/>
		);
	}

	if (view === "detail") {
		if (detailLoading) {
			return (
				<div className="flex h-full min-h-0 flex-col p-3">
					<RunHistoryBreadcrumb
						current="Loading run"
						onHistoryClick={goBack}
					/>
					<div className="flex flex-1 items-center justify-center">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				</div>
			);
		}
		if (selectedRun) {
			return (
				<HistoryRunView
					run={selectedRun}
					onBack={goBack}
					onOutputPopout={handleOutputPopout}
					onViewRun={onViewRun}
				/>
			);
		}
	}

	// History list view
	return (
		<div className="flex h-full min-h-0 flex-col p-3">
			<div className="flex items-center justify-between">
				<div>
					<p className="font-semibold text-sm">Run History</p>
					<p className="text-[11px] text-muted-foreground">
						View past runs or click Run to start a new one.
					</p>
				</div>
				<div className="flex items-center gap-2">
					{lastRefreshed && (
						<span className="text-[10px] text-muted-foreground/60">
							{formatRelativeTime(lastRefreshed.toISOString())}
						</span>
					)}
					<Button
						size="sm"
						variant="ghost"
						className="h-7 px-2 text-xs"
						onClick={() => void refresh()}
						aria-label="Refresh run history"
					>
						<RefreshCw className="mr-1 h-3 w-3" aria-hidden />
					</Button>
				</div>
			</div>

			<div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg border bg-card">
				{loading ? (
					<div className="flex h-40 items-center justify-center">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : runs.length === 0 ? (
					<div className="flex h-40 flex-col items-center justify-center gap-2 px-4 text-center">
						<p className="font-medium text-sm">No runs yet</p>
						<p className="text-muted-foreground text-xs">
							Completed runs will appear here.
						</p>
					</div>
				) : (
					<div className="divide-y">
						{runs.map((run) => (
							<button
								key={run.RUN_ID}
								type="button"
								onClick={() => void openRun(run.RUN_ID)}
								className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
							>
								<StatusBadge status={run.STATUS} />
								{run.TRIGGER_TYPE === "SCHEDULED" && (
									<span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
										<CalendarClock
											className="h-3 w-3"
											aria-hidden
										/>
									</span>
								)}
								<div className="min-w-0 flex-1">
									<p className="truncate text-xs">
										{formatTimestamp(run.STARTED_AT)}
									</p>
									{run.COMPLETED_AT && (
										<p className="text-[10px] text-muted-foreground">
											{formatRunDuration(
												run.STARTED_AT,
												run.COMPLETED_AT,
											)}
										</p>
									)}
								</div>
								<Play
									className="h-3 w-3 text-muted-foreground"
									aria-hidden
								/>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

function RunHistoryBreadcrumb({
	current,
	onHistoryClick,
}: {
	current: string;
	onHistoryClick: () => void;
}) {
	return (
		<nav
			className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap"
			aria-label="Run history breadcrumb"
		>
			<button
				type="button"
				onClick={onHistoryClick}
				className="shrink-0 font-semibold text-sm transition-colors hover:text-muted-foreground"
			>
				Run History
			</button>
			<ChevronRight
				className="size-4 shrink-0 text-muted-foreground"
				aria-hidden="true"
			/>
			<span className="truncate font-semibold text-muted-foreground text-sm">
				{current}
			</span>
		</nav>
	);
}

/** Live run detail with navigation back to the history list. */
function LiveRunView({
	running,
	latestRunStatus,
	aiRunSummary,
	generatingAiSummary,
	steps,
	results,
	executedDefinition,
	activeRun,
	onOutputPopout,
	onAskAssistant,
	onDismiss,
	onBack,
	focusNodeId,
	focusToken,
}: AutomationTraceSnapshot & {
	onOutputPopout: (output: string) => void;
	onAskAssistant: () => void;
	onDismiss: () => void;
	onBack: () => void;
	focusNodeId?: string | null;
	focusToken?: number;
}) {
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const previousRunningNodeIdRef = useRef<string | null>(null);
	// `onDismiss` only notifies the host — nothing upstream tracks whether this run's banner
	// was dismissed, so without local state it would never actually disappear. Reset whenever
	// the run this banner is about changes, so dismissing one run's banner doesn't also hide
	// the next run's.
	const [bannerDismissed, setBannerDismissed] = useState(false);
	const previousRunStatusRef = useRef(latestRunStatus);

	const stepMap = useMemo(
		() => new Map(steps.map((step) => [step.id, step])),
		[steps],
	);
	const runningResult =
		results.find(
			(r) => r.STATUS === "RUNNING" || r.STATUS === "WAITING_FOR_INPUT",
		) ?? null;
	const selectedResult =
		results.find((r) => r.NODE_ID === selectedNodeId) ??
		runningResult ??
		results[results.length - 1] ??
		null;

	useEffect(() => {
		const runningNodeId = runningResult?.NODE_ID ?? null;
		if (
			runningNodeId &&
			previousRunningNodeIdRef.current !== runningNodeId
		) {
			previousRunningNodeIdRef.current = runningNodeId;
			setSelectedNodeId(runningNodeId);
			return;
		}
		if (!runningNodeId) previousRunningNodeIdRef.current = null;
		setSelectedNodeId((current) =>
			current && results.some((r) => r.NODE_ID === current)
				? current
				: (results[results.length - 1]?.NODE_ID ?? null),
		);
	}, [results, runningResult?.NODE_ID]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: focusToken forces re-focusing the same node id after navigating away and back; it's not read in the body.
	useEffect(() => {
		if (focusNodeId) setSelectedNodeId(focusNodeId);
	}, [focusNodeId, focusToken]);

	useEffect(() => {
		if (previousRunStatusRef.current === latestRunStatus) return;
		previousRunStatusRef.current = latestRunStatus;
		setBannerDismissed(false);
	}, [latestRunStatus]);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="border-b px-3 py-2">
				<RunHistoryBreadcrumb
					current={running ? "Live run" : "Latest run"}
					onHistoryClick={onBack}
				/>
			</div>
			{!running &&
				!bannerDismissed &&
				latestRunStatus &&
				latestRunStatus !== "RUNNING" && (
					<div className="px-3 pt-2">
						<RunBanner
							status={latestRunStatus}
							aiSummary={aiRunSummary}
							generatingAiSummary={generatingAiSummary}
							onDismiss={() => {
								setBannerDismissed(true);
								onDismiss();
							}}
							onAskAssistant={onAskAssistant}
						/>
					</div>
				)}
			<ResultsPanel
				key={activeRun?.RUN_ID}
				results={results}
				executedDefinition={executedDefinition}
				onOutputPopout={onOutputPopout}
				selectedResult={selectedResult}
				stepMap={stepMap}
				onSelectNode={setSelectedNodeId}
			/>
		</div>
	);
}

/** Historical run detail with back button and run metadata. */
function HistoryRunView({
	run,
	onBack,
	onOutputPopout,
	onViewRun,
}: {
	run: AutomationRunDetail;
	onBack: () => void;
	onOutputPopout: (output: string) => void;
	onViewRun?: (run: AutomationRunDetail) => void;
}) {
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const executedSteps = useMemo(() => getExecutedSteps(run), [run]);
	const stepMap = useMemo(
		() => new Map(executedSteps.map((s) => [s.id, s])),
		[executedSteps],
	);
	const results = run.nodeResults ?? [];
	const selectedResult =
		results.find((r) => r.NODE_ID === selectedNodeId) ?? results[0] ?? null;

	return (
		<div className="flex h-full min-h-0 flex-col p-3">
			<div className="flex items-center justify-between gap-2">
				<div className="min-w-0 flex-1">
					<RunHistoryBreadcrumb
						current={`${formatTimestamp(run.STARTED_AT)}${
							run.COMPLETED_AT
								? ` · ${formatRunDuration(run.STARTED_AT, run.COMPLETED_AT)}`
								: ""
						}`}
						onHistoryClick={onBack}
					/>
					{run.RESULT_SUMMARY && (
						<p className="mt-1 truncate text-[11px] text-muted-foreground">
							{run.RESULT_SUMMARY}
						</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{onViewRun && (
						<Button
							size="sm"
							variant="outline"
							className="h-6 rounded-full px-2.5 py-1 text-[11px]"
							onClick={() => onViewRun(run)}
						>
							View on canvas
						</Button>
					)}
					<StatusBadge status={run.STATUS} />
				</div>
			</div>

			<div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg border bg-card">
				<ResultsPanel
					key={run.RUN_ID}
					results={results}
					executedDefinition={{
						version: run.DEFINITION_VERSION,
						hash: run.DEFINITION_HASH,
						snapshot: run.DEFINITION_SNAPSHOT,
					}}
					onOutputPopout={onOutputPopout}
					selectedResult={selectedResult}
					stepMap={stepMap}
					onSelectNode={setSelectedNodeId}
				/>
			</div>
		</div>
	);
}

/** Shared results panel: left nav + right output. */
function ResultsPanel({
	results,
	executedDefinition,
	selectedResult,
	stepMap,
	onOutputPopout,
	onSelectNode,
}: {
	results: AutomationNodeResult[];
	executedDefinition: AutomationExecutedDefinition | null;
	selectedResult: AutomationNodeResult | null;
	stepMap: Map<string, AutomationNode>;
	onOutputPopout: (output: string) => void;
	onSelectNode: (id: string) => void;
}) {
	const [expandedLoopIds, setExpandedLoopIds] = useState<Set<string>>(
		new Set(),
	);

	const [selectedBodyKey, setSelectedBodyKey] = useState<{
		nodeId: string;
		iterationIndex: number;
	} | null>(null);

	const selectedBodyResult = useMemo(() => {
		if (!selectedBodyKey) return null;
		for (const result of results) {
			const iter = result.iterations?.find(
				(i) => i.index === selectedBodyKey.iterationIndex,
			);
			if (iter) {
				return (
					iter.nodeResults.find(
						(r) => r.NODE_ID === selectedBodyKey.nodeId,
					) ?? null
				);
			}
		}
		return null;
	}, [results, selectedBodyKey]);

	const bodyStepMap = useMemo(() => {
		const map = new Map<string, AutomationNode>();
		for (const step of stepMap.values()) {
			for (const bodyNode of step.body?.nodes ?? []) {
				map.set(bodyNode.id, bodyNode);
			}
		}
		return map;
	}, [stepMap]);

	const displayResult = selectedBodyResult ?? selectedResult;
	const displayStep = displayResult
		? (stepMap.get(displayResult.NODE_ID) ??
			bodyStepMap.get(displayResult.NODE_ID))
		: undefined;

	const handleSelectNode = useCallback(
		(nodeId: string) => {
			setSelectedBodyKey(null);
			onSelectNode(nodeId);
		},
		[onSelectNode],
	);

	return (
		<div className="flex min-h-0 flex-1 overflow-hidden">
			<nav
				className="w-56 shrink-0 overflow-y-auto border-border border-r bg-muted/20 p-2"
				aria-label="Run actions"
			>
				{results.length === 0 ? (
					<p className="px-2 py-3 text-muted-foreground text-xs">
						No actions have reported results yet.
					</p>
				) : (
					<div className="space-y-1">
						{results.map((result, index) => {
							const step = stepMap.get(result.NODE_ID);
							const meta = getDisplayMeta(step?.type ?? "app");
							const workflowDisplay = step?.workflowType
								? getWorkflowNodeDisplay(step.workflowType)
								: null;
							const Icon = workflowDisplay?.icon ?? meta.icon;
							const iconColor =
								workflowDisplay?.color ?? meta.color;
							const active =
								selectedResult?.NODE_ID === result.NODE_ID &&
								!selectedBodyKey;
							const displayStatus =
								step?.type === "trigger" &&
								result.STATUS === "PENDING"
									? "SUCCESS"
									: result.STATUS;
							const hasIterations =
								result.iterations &&
								result.iterations.length > 0;
							const isExpanded = expandedLoopIds.has(
								result.NODE_ID,
							);

							return (
								<div key={result.NODE_ID}>
									<div
										className={`flex items-center rounded-md ${active ? "bg-accent text-accent-foreground" : ""}`}
									>
										<button
											type="button"
											onClick={() =>
												handleSelectNode(result.NODE_ID)
											}
											className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted"
										>
											<span
												className={`flex size-6 shrink-0 items-center justify-center rounded bg-muted ${iconColor}`}
											>
												<Icon className="size-3.5" />
											</span>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-xs">
													{index + 1}.{" "}
													{result.NODE_LABEL ||
														step?.label ||
														meta.label}
												</span>
												<span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground [&>span]:px-1.5 [&>span]:py-0.5 [&>span]:text-[9px]">
													<StatusBadge
														status={displayStatus}
													/>{" "}
													{formatDurationMs(
														result.DURATION_MS,
													)}
												</span>
											</span>
										</button>
										{hasIterations && (
											<button
												type="button"
												onClick={() =>
													setExpandedLoopIds(
														(prev) => {
															const next =
																new Set(prev);
															if (
																next.has(
																	result.NODE_ID,
																)
															) {
																next.delete(
																	result.NODE_ID,
																);
															} else {
																next.add(
																	result.NODE_ID,
																);
															}
															return next;
														},
													)
												}
												className="mr-1 shrink-0 rounded p-0.5 hover:bg-muted"
												aria-label={
													isExpanded
														? "Collapse iterations"
														: "Expand iterations"
												}
											>
												<ChevronRight
													className={`size-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
												/>
											</button>
										)}
									</div>
									{hasIterations && isExpanded && (
										<div className="mt-0.5 ml-2 space-y-0.5 border-border/50 border-l pl-2">
											{result.iterations?.map((iter) => (
												<div key={iter.index}>
													<p className="px-2 py-1 font-medium text-[9px] text-muted-foreground/60 uppercase tracking-wide">
														Iteration{" "}
														{iter.index + 1}
													</p>
													{iter.nodeResults.map(
														(bodyResult) => {
															const bodyStep =
																bodyStepMap.get(
																	bodyResult.NODE_ID,
																);
															const bodyMeta =
																getDisplayMeta(
																	bodyStep?.type ??
																		"app",
																);
															const bodyDisplay =
																bodyStep?.workflowType
																	? getWorkflowNodeDisplay(
																			bodyStep.workflowType,
																		)
																	: null;
															const BodyIcon =
																bodyDisplay?.icon ??
																bodyMeta.icon;
															const bodyIconColor =
																bodyDisplay?.color ??
																bodyMeta.color;
															const bodyActive =
																selectedBodyKey?.nodeId ===
																	bodyResult.NODE_ID &&
																selectedBodyKey?.iterationIndex ===
																	iter.index;
															return (
																<button
																	key={`${iter.index}-${bodyResult.NODE_ID}`}
																	type="button"
																	onClick={() =>
																		setSelectedBodyKey(
																			{
																				nodeId: bodyResult.NODE_ID,
																				iterationIndex:
																					iter.index,
																			},
																		)
																	}
																	className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${bodyActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
																>
																	<span
																		className={`flex size-5 shrink-0 items-center justify-center rounded bg-muted ${bodyIconColor}`}
																	>
																		<BodyIcon className="size-3" />
																	</span>
																	<span className="min-w-0 flex-1">
																		<span className="block truncate text-[11px]">
																			{bodyResult.NODE_LABEL ||
																				bodyStep?.label ||
																				bodyMeta.label}
																		</span>
																		<span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground [&>span]:px-1.5 [&>span]:py-0.5 [&>span]:text-[9px]">
																			<StatusBadge
																				status={
																					bodyResult.STATUS
																				}
																			/>{" "}
																			{formatDurationMs(
																				bodyResult.DURATION_MS,
																			)}
																		</span>
																	</span>
																</button>
															);
														},
													)}
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</nav>
			<section
				className="min-w-0 flex-1 overflow-y-auto p-3"
				aria-live="polite"
			>
				{displayResult ? (
					displayResult.STATUS === "RUNNING" &&
					!displayResult.OUTPUT_PREVIEW?.trim() ? (
						<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
							<Loader2 className="size-5 animate-spin text-primary" />
							<span>
								Executing step{" "}
								{displayResult.NODE_LABEL || "..."}...
							</span>
						</div>
					) : displayResult.STATUS === "WAITING_FOR_INPUT" &&
						!displayResult.OUTPUT_PREVIEW?.trim() ? (
						<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
							<Clock3 className="size-5 text-warning" />
							<span>
								{displayResult.NODE_LABEL || "Agent"} is waiting
								for input.
							</span>
						</div>
					) : (
						<div className="space-y-3">
							{displayResult.ERROR_MESSAGE && (
								<ErrorDetail
									message={displayResult.ERROR_MESSAGE}
								/>
							)}
							<CellOutputBlock
								output={
									displayResult.OUTPUT_PREVIEW ??
									"No output was produced."
								}
								onOutputPopout={() =>
									onOutputPopout(
										displayResult.OUTPUT_PREVIEW ??
											"No output was produced.",
									)
								}
							/>
							{displayStep?.workflowType === "trigger.start" &&
								executedDefinition && (
									<ExecutedDefinitionDetail
										definition={executedDefinition}
									/>
								)}
							{displayResult.trace && (
								<TraceDetail
									trace={displayResult.trace}
									step={displayStep}
								/>
							)}
						</div>
					)
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground text-xs">
						Select an action to inspect its output.
					</div>
				)}
			</section>
		</div>
	);
}
