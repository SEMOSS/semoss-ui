import {
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	Loader2,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	RunStatus,
	WorkflowRunDetail,
	WorkflowRunSummary,
} from "@/pages/workflow/workflow.types";

function formatTimestamp(iso: string): string {
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return iso;
	}
}

function formatDuration(startedAt: string, completedAt: string | null): string {
	if (!completedAt) return "—";
	try {
		const ms =
			new Date(completedAt).getTime() - new Date(startedAt).getTime();
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
	} catch {
		return "—";
	}
}

const STATUS_CHIP: Record<RunStatus, string> = {
	RUNNING: "bg-primary/10 text-primary",
	SUCCESS: "bg-emerald-500/10 text-emerald-600",
	FAILED: "bg-destructive/10 text-destructive",
	INTERRUPTED: "bg-amber-500/10 text-amber-600",
	CANCELLED: "bg-muted text-muted-foreground",
};

function StatusIcon({
	status,
	className,
}: {
	status: string;
	className?: string;
}) {
	if (status === "RUNNING")
		return <Loader2 className={`animate-spin ${className}`} />;
	if (status === "FAILED" || status === "INTERRUPTED")
		return <XCircle className={className} />;
	if (status === "CANCELLED") return <XCircle className={className} />;
	return <CheckCircle2 className={className} />;
}

interface HistoryPanelProps {
	appId: string;
}

export function HistoryPanel({ appId }: HistoryPanelProps) {
	const { monolithStore } = useRootStore();
	const [runs, setRuns] = useState<WorkflowRunSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
	const [runDetail, setRunDetail] = useState<WorkflowRunDetail | null>(null);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

	const fetchRuns = () => {
		setLoading(true);
		monolithStore
			.runQuery(`ListWorkflowRuns(app=["${appId}"], limit=[25]);`)
			.then((res) => {
				const list =
					(res.pixelReturn[0].output as WorkflowRunSummary[]) ?? [];
				setRuns(list);
			})
			.finally(() => setLoading(false));
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount + appId
	useEffect(() => {
		fetchRuns();
	}, [appId]);

	const selectRun = async (runId: string) => {
		if (selectedRunId === runId) {
			setSelectedRunId(null);
			setRunDetail(null);
			return;
		}
		setSelectedRunId(runId);
		setRunDetail(null);
		setExpandedNodes(new Set());
		setLoadingDetail(true);
		try {
			const res = await monolithStore.runQuery(
				`GetWorkflowRun(app=["${appId}"], runId=["${runId}"]);`,
			);
			setRunDetail(res.pixelReturn[0].output as WorkflowRunDetail);
		} finally {
			setLoadingDetail(false);
		}
	};

	const toggleNode = (nodeId: string) => {
		setExpandedNodes((prev) => {
			const next = new Set(prev);
			if (next.has(nodeId)) next.delete(nodeId);
			else next.add(nodeId);
			return next;
		});
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto">
			<div className="mx-auto max-w-2xl px-6 py-4">
				<div className="mb-4 flex items-center justify-between">
					<span className="font-medium text-sm">Run History</span>
					<Button
						size="sm"
						variant="ghost"
						className="h-7 px-2 text-xs"
						onClick={fetchRuns}
					>
						<RefreshCw className="mr-1.5 h-3 w-3" />
						Refresh
					</Button>
				</div>

				{runs.length === 0 ? (
					<div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
						No runs yet — click "Run Workflow" to start.
					</div>
				) : (
					<div className="space-y-2">
						{runs.map((run) => {
							const isSelected = selectedRunId === run.RUN_ID;
							const chipClass =
								STATUS_CHIP[run.STATUS] ?? STATUS_CHIP.FAILED;

							return (
								<div
									key={run.RUN_ID}
									className="rounded-lg border bg-card"
								>
									{/* Summary row */}
									<button
										type="button"
										onClick={() => selectRun(run.RUN_ID)}
										className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
									>
										<span
											className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[10px] ${chipClass}`}
										>
											<StatusIcon
												status={run.STATUS}
												className="h-3 w-3"
											/>
											{run.STATUS}
										</span>
										<span className="flex-1 text-muted-foreground text-xs">
											{formatTimestamp(run.STARTED_AT)}
										</span>
										<span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
											<Clock className="h-3 w-3" />
											{formatDuration(
												run.STARTED_AT,
												run.COMPLETED_AT,
											)}
										</span>
										{isSelected ? (
											<ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										) : (
											<ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										)}
									</button>

									{/* Top-level error */}
									{run.ERROR_MESSAGE && !isSelected && (
										<div className="border-t px-4 py-2 font-mono text-[11px] text-destructive">
											{run.ERROR_MESSAGE}
										</div>
									)}

									{/* Per-node detail */}
									{isSelected && (
										<div className="border-t">
											{loadingDetail ? (
												<div className="flex items-center justify-center py-6">
													<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
												</div>
											) : runDetail ? (
												<div className="divide-y">
													{runDetail.nodeResults.map(
														(node, idx) => {
															const nodeChip =
																STATUS_CHIP[
																	node.STATUS
																] ??
																STATUS_CHIP.FAILED;
															const isNodeOpen =
																expandedNodes.has(
																	node.NODE_ID,
																);

															return (
																<div
																	key={
																		node.NODE_ID
																	}
																>
																	<div className="flex items-center gap-2 px-4 py-2.5 text-xs">
																		<span className="w-4 shrink-0 text-[10px] text-muted-foreground">
																			{idx +
																				1}
																		</span>
																		<span className="flex-1 font-medium">
																			{
																				node.NODE_LABEL
																			}
																		</span>
																		<span
																			className={`flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${nodeChip}`}
																		>
																			<StatusIcon
																				status={
																					node.STATUS
																				}
																				className="h-2.5 w-2.5"
																			/>
																			{
																				node.STATUS
																			}
																		</span>
																		<span className="shrink-0 text-[10px] text-muted-foreground">
																			{node.DURATION_MS !=
																			null
																				? `${(node.DURATION_MS / 1000).toFixed(1)}s`
																				: "—"}
																		</span>
																	</div>

																	{node.ERROR_MESSAGE && (
																		<div className="px-4 pb-2 font-mono text-[10px] text-destructive">
																			{
																				node.ERROR_MESSAGE
																			}
																		</div>
																	)}

																	{node.OUTPUT_PREVIEW && (
																		<>
																			<button
																				type="button"
																				onClick={() =>
																					toggleNode(
																						node.NODE_ID,
																					)
																				}
																				className="flex w-full items-center gap-1 px-4 pb-2 text-[10px] text-muted-foreground hover:text-foreground"
																			>
																				{isNodeOpen ? (
																					<ChevronDown className="h-3 w-3" />
																				) : (
																					<ChevronRight className="h-3 w-3" />
																				)}
																				Output
																				preview
																			</button>
																			{isNodeOpen && (
																				<pre className="mx-4 mb-2 max-h-32 overflow-auto rounded border bg-muted/30 p-2 font-mono text-[10px]">
																					{
																						node.OUTPUT_PREVIEW
																					}
																				</pre>
																			)}
																		</>
																	)}
																</div>
															);
														},
													)}
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
