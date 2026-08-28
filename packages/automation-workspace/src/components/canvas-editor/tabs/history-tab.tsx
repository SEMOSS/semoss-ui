import { CalendarClock, Loader2, Play, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, toast } from "@semoss/ui/next";
import { getAutomationRun, listAutomationRuns } from "../../../api";
import type {
	AutomationExecutedDefinition,
	AutomationNode,
	AutomationRunDetail,
	AutomationRunSummary,
} from "../../../domain/automation.types";
import {
	formatRelativeTime,
	formatRunDuration,
	formatTimestamp,
} from "../../../domain/automation-display";
import type { AutomationWorkflowDocument } from "../../../domain/automation-workflow.types";
import { canvasDocumentFromWorkflow } from "../../../domain/automation-workflow-adapter";
import { NodeResultList } from "../../form-editor/node-result-list";
import { StatusBadge } from "../../status-badge";

interface HistoryTabProps {
	/** Automation project whose persisted runs should be displayed. */
	appId: string;
	/** Incremented when the editor completes a new run. */
	refreshToken: number;
}

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

function getExecutedDefinition(
	run: AutomationRunDetail,
): AutomationExecutedDefinition {
	return {
		version: run.DEFINITION_VERSION,
		hash: run.DEFINITION_HASH,
		snapshot: run.DEFINITION_SNAPSHOT,
	};
}

/** Persisted automation run list and per-node detail panel. */
export function HistoryTab({ appId, refreshToken }: HistoryTabProps) {
	const [runs, setRuns] = useState<AutomationRunSummary[]>([]);
	const [loading, setLoading] = useState(false);
	const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
	const [details, setDetails] = useState<Record<string, AutomationRunDetail>>(
		{},
	);
	const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
	const [expandedRun, setExpandedRun] = useState<AutomationRunDetail | null>(
		null,
	);
	const [detailLoading, setDetailLoading] = useState(false);
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
	const requestRef = useRef(0);
	const detailRequestRef = useRef(0);
	const previousRefreshTokenRef = useRef(refreshToken);
	const executedSteps = useMemo(
		() => getExecutedSteps(expandedRun),
		[expandedRun],
	);

	const refresh = useCallback(async () => {
		const requestId = requestRef.current + 1;
		requestRef.current = requestId;
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
						? error.message
						: "Unable to load automation history.",
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

	const selectRun = useCallback(
		async (runId: string) => {
			const detailRequestId = detailRequestRef.current + 1;
			detailRequestRef.current = detailRequestId;
			if (expandedRunId === runId) {
				setExpandedRunId(null);
				setExpandedRun(null);
				setDetailLoading(false);
				setExpandedNodes(new Set());
				return;
			}
			setExpandedRunId(runId);
			setExpandedRun(null);
			setExpandedNodes(new Set());
			const cached = details[runId];
			if (cached) {
				setExpandedRun(cached);
				setDetailLoading(false);
				return;
			}
			setDetailLoading(true);
			try {
				const detail = await getAutomationRun(appId, runId);
				if (detailRequestId !== detailRequestRef.current) return;
				setDetails((current) => ({ ...current, [runId]: detail }));
				setExpandedRun(detail);
			} catch (error) {
				if (detailRequestId !== detailRequestRef.current) return;
				toast.error(
					error instanceof Error
						? error.message
						: "Unable to load automation run details.",
				);
				setExpandedRunId(null);
			} finally {
				if (detailRequestId === detailRequestRef.current) {
					setDetailLoading(false);
				}
			}
		},
		[appId, details, expandedRunId],
	);

	const toggleNode = useCallback((nodeId: string) => {
		setExpandedNodes((current) => {
			const next = new Set(current);
			if (next.has(nodeId)) next.delete(nodeId);
			else next.add(nodeId);
			return next;
		});
	}, []);

	return (
		<div className="h-full overflow-y-auto p-4">
			<div className="space-y-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h2 className="font-semibold text-sm">
							Automation History
						</h2>
						<p className="text-[11px] text-muted-foreground">
							Review recent runs and inspect per-node outputs.
						</p>
					</div>
					<div className="flex flex-col items-end gap-0.5">
						<Button
							size="sm"
							variant="ghost"
							className="h-8 px-2 text-xs"
							onClick={() => void refresh()}
						>
							<RefreshCw
								className="mr-1.5 h-3.5 w-3.5"
								aria-hidden
							/>
							Refresh
						</Button>
						{lastRefreshed && (
							<span className="text-[10px] text-muted-foreground/60">
								Updated{" "}
								{formatRelativeTime(
									lastRefreshed.toISOString(),
								)}
							</span>
						)}
					</div>
				</div>

				{loading ? (
					<div className="flex h-40 items-center justify-center rounded-xl border bg-card">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : runs.length === 0 ? (
					<div className="rounded-xl border border-dashed bg-card/60 px-4 py-10 text-center">
						<p className="font-semibold text-sm">No runs yet</p>
						<p className="mt-2 text-muted-foreground text-xs leading-relaxed">
							Completed runs will appear here for review.
						</p>
					</div>
				) : (
					<div className="divide-y rounded-xl border bg-card">
						{runs.map((run) => {
							const isExpanded = expandedRunId === run.RUN_ID;
							return (
								<div key={run.RUN_ID}>
									<button
										type="button"
										onClick={() =>
											void selectRun(run.RUN_ID)
										}
										className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted/40"
									>
										<StatusBadge status={run.STATUS} />
										{run.TRIGGER_TYPE === "SCHEDULED" && (
											<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium text-[11px] text-muted-foreground">
												<CalendarClock
													className="h-3 w-3"
													aria-hidden
												/>
												Scheduled
											</span>
										)}
										<div className="min-w-0 flex-1 space-y-0.5">
											<p className="truncate font-medium text-xs">
												{formatTimestamp(
													run.STARTED_AT,
												)}
											</p>
											{run.COMPLETED_AT && (
												<p className="text-[11px] text-muted-foreground">
													{formatRunDuration(
														run.STARTED_AT,
														run.COMPLETED_AT,
													)}
												</p>
											)}
										</div>
										{isExpanded ? (
											<X
												className="h-3.5 w-3.5 text-muted-foreground"
												aria-hidden
											/>
										) : (
											<Play
												className="h-3.5 w-3.5 text-muted-foreground"
												aria-hidden
											/>
										)}
									</button>
									{isExpanded && (
										<div className="border-t bg-muted/20 px-3 py-4">
											{detailLoading ? (
												<div className="flex h-20 items-center justify-center">
													<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
												</div>
											) : expandedRun ? (
												<div className="space-y-4">
													<NodeResultList
														steps={executedSteps}
														results={
															expandedRun.nodeResults ??
															[]
														}
														expandedNodes={
															expandedNodes
														}
														onToggleNode={
															toggleNode
														}
														executedDefinition={getExecutedDefinition(
															expandedRun,
														)}
													/>
												</div>
											) : null}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
