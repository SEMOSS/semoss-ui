import {
	ArrowLeft,
	CalendarClock,
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
import { ExecutedDefinitionDetail } from "../../form-editor/executed-definition-detail";
import { ErrorDetail, TraceDetail } from "../../form-editor/node-result-list";
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

/** Live trace state shared with the host workbench's trace iframe. */
export interface AutomationTraceSnapshot extends RunsTabSnapshot {
	executedDefinition: AutomationExecutedDefinition | null;
}

interface RunsTabProps extends AutomationTraceSnapshot {
	appId: string;
	refreshToken: number;
	onDismiss: () => void;
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
	const previousRefreshTokenRef = useRef(refreshToken);

	// Auto-switch to live view when a run starts
	useEffect(() => {
		if (running) setView("live");
	}, [running]);

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

	const openRun = useCallback(
		async (runId: string) => {
			const cached = detailsCache.current[runId];
			if (cached) {
				setSelectedRun(cached);
				setView("detail");
				return;
			}
			setDetailLoading(true);
			setView("detail");
			try {
				const detail = await getAutomationRun(appId, runId);
				detailsCache.current[runId] = detail;
				setSelectedRun(detail);
			} catch (error) {
				toast.error(
					error instanceof Error
						? normalizeAutomationErrorMessage(error.message)
						: "Unable to load run details.",
				);
				setView("history");
			} finally {
				setDetailLoading(false);
			}
		},
		[appId],
	);

	const goBack = useCallback(() => {
		setView("history");
		setSelectedRun(null);
	}, []);

	const handleOutputPopout = useCallback((output: string) => {
		const parentOrigin = new URLSearchParams(window.location.search).get(
			"parentOrigin",
		);
		if (parentOrigin && window.parent !== window) {
			window.parent.postMessage(
				{
					type: "SEMOSS_AUTOMATION_OPEN_OUTPUT",
					output,
				},
				parentOrigin,
			);
		}
	}, []);

	const handleAskAssistant = useCallback(() => {
		if (!latestRunStatus) return;
		const parentOrigin = new URLSearchParams(window.location.search).get(
			"parentOrigin",
		);
		if (!parentOrigin || window.parent === window) return;
		const prompt = buildAssistantHandoffPrompt({
			status: latestRunStatus,
			runSummary: aiRunSummary,
			steps,
			results,
		});
		window.parent.postMessage(
			{ type: "SEMOSS_AUTOMATION_ASK_ASSISTANT", prompt },
			parentOrigin,
		);
	}, [aiRunSummary, latestRunStatus, results, steps]);

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
			/>
		);
	}

	if (view === "detail") {
		if (detailLoading) {
			return (
				<div className="flex h-full flex-col">
					<BackButton onClick={goBack} />
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

function BackButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
		>
			<ArrowLeft className="h-3 w-3" />
			Run History
		</button>
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
	onOutputPopout,
	onAskAssistant,
	onDismiss,
	onBack,
}: AutomationTraceSnapshot & {
	onOutputPopout: (output: string) => void;
	onAskAssistant: () => void;
	onDismiss: () => void;
	onBack: () => void;
}) {
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const previousRunningNodeIdRef = useRef<string | null>(null);

	const stepMap = new Map(steps.map((step) => [step.id, step]));
	const runningResult = results.find((r) => r.STATUS === "RUNNING") ?? null;
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

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex items-center justify-between border-b px-2 py-1">
				<BackButton onClick={onBack} />
				{running && (
					<span className="flex items-center gap-1.5 text-[11px] text-primary">
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
						Running
					</span>
				)}
			</div>
			{!running && latestRunStatus && latestRunStatus !== "RUNNING" && (
				<div className="px-3 pt-2">
					<RunBanner
						status={latestRunStatus}
						aiSummary={aiRunSummary}
						generatingAiSummary={generatingAiSummary}
						onDismiss={onDismiss}
						onAskAssistant={onAskAssistant}
					/>
				</div>
			)}
			<ResultsPanel
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
}: {
	run: AutomationRunDetail;
	onBack: () => void;
	onOutputPopout: (output: string) => void;
}) {
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const executedSteps = useMemo(() => getExecutedSteps(run), [run]);
	const stepMap = new Map(executedSteps.map((s) => [s.id, s]));
	const results = run.nodeResults ?? [];
	const selectedResult =
		results.find((r) => r.NODE_ID === selectedNodeId) ?? results[0] ?? null;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex items-center justify-between border-b px-2 py-1">
				<BackButton onClick={onBack} />
				<div className="flex items-center gap-2">
					<StatusBadge status={run.STATUS} />
					<span className="text-[10px] text-muted-foreground">
						{formatTimestamp(run.STARTED_AT)}
						{run.COMPLETED_AT &&
							` · ${formatRunDuration(run.STARTED_AT, run.COMPLETED_AT)}`}
					</span>
				</div>
			</div>
			{run.RESULT_SUMMARY && (
				<div className="border-b px-3 py-2 text-[11px] text-muted-foreground">
					{run.RESULT_SUMMARY}
				</div>
			)}
			<ResultsPanel
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
	const selectedStep = selectedResult
		? stepMap.get(selectedResult.NODE_ID)
		: undefined;

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
								selectedResult?.NODE_ID === result.NODE_ID;
							const displayStatus =
								step?.type === "trigger" &&
								result.STATUS === "PENDING"
									? "SUCCESS"
									: result.STATUS;

							return (
								<button
									key={result.NODE_ID}
									type="button"
									onClick={() => onSelectNode(result.NODE_ID)}
									className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left ${active ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
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
							);
						})}
					</div>
				)}
			</nav>
			<section
				className="min-w-0 flex-1 overflow-y-auto p-3"
				aria-live="polite"
			>
				{selectedResult ? (
					selectedResult.STATUS === "RUNNING" &&
					!selectedResult.OUTPUT_PREVIEW?.trim() ? (
						<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
							<Loader2 className="size-5 animate-spin text-primary" />
							<span>
								Executing step{" "}
								{selectedResult.NODE_LABEL || "..."}...
							</span>
						</div>
					) : (
						<div className="space-y-3">
							{selectedResult.ERROR_MESSAGE && (
								<ErrorDetail
									message={selectedResult.ERROR_MESSAGE}
								/>
							)}
							<CellOutputBlock
								output={
									selectedResult.OUTPUT_PREVIEW ??
									"No output was produced."
								}
								onOutputPopout={() =>
									onOutputPopout(
										selectedResult.OUTPUT_PREVIEW ??
											"No output was produced.",
									)
								}
							/>
							{selectedStep?.workflowType === "trigger.start" &&
								executedDefinition && (
									<ExecutedDefinitionDetail
										definition={executedDefinition}
									/>
								)}
							{selectedResult.trace && (
								<TraceDetail
									trace={selectedResult.trace}
									step={selectedStep}
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
