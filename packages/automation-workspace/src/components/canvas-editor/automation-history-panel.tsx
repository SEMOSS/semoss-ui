import { Loader2, Play, RefreshCw, X } from "lucide-react";
import { Button } from "@semoss/ui/next";
import type {
	AutomationNode,
	AutomationRunDetail,
	AutomationRunSummary,
} from "../../domain/automation.types";
import {
	formatRelativeTime,
	formatRunDuration,
	formatTimestamp,
} from "../../domain/automation-display";
import { NodeResultList } from "../form-editor/node-result-list";
import { StatusBadge } from "../status-badge";

interface AutomationHistoryPanelProps {
	steps: AutomationNode[];
	runs: AutomationRunSummary[];
	loading: boolean;
	lastRefreshed: Date | null;
	expandedRunId: string | null;
	expandedRun: AutomationRunDetail | null;
	detailLoading: boolean;
	expandedNodes: Set<string>;
	showExecutedDefinition: boolean;
	onRefresh: () => void;
	onSelectRun: (runId: string) => void;
	onToggleNode: (nodeId: string) => void;
	onToggleExecutedDefinition: () => void;
}

export function AutomationHistoryPanel({
	steps,
	runs,
	loading,
	lastRefreshed,
	expandedRunId,
	expandedRun,
	detailLoading,
	expandedNodes,
	showExecutedDefinition,
	onRefresh,
	onSelectRun,
	onToggleNode,
	onToggleExecutedDefinition,
}: AutomationHistoryPanelProps) {
	return (
		<div className="h-full overflow-y-auto px-4 py-4">
			<div className="mx-auto max-w-3xl space-y-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h2 className="font-semibold text-sm">
							Automation history
						</h2>
						<p className="text-[11px] text-muted-foreground">
							Review runs and inspect per-step outputs.
						</p>
					</div>
					<div className="flex flex-col items-end gap-0.5">
						<Button
							size="sm"
							variant="ghost"
							className="h-8 px-2 text-xs"
							onClick={onRefresh}
						>
							<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
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
					<div className="flex h-40 items-center justify-center rounded-2xl border bg-card">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : runs.length === 0 ? (
					<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
						<p className="font-semibold text-sm">No runs yet</p>
						<p className="mt-2 text-muted-foreground text-xs leading-relaxed">
							Each run is recorded here with its executed
							definition and step outputs.
						</p>
					</div>
				) : (
					<div className="divide-y rounded-2xl border bg-card">
						{runs.map((run) => {
							const isExpanded = expandedRunId === run.RUN_ID;
							return (
								<div key={run.RUN_ID}>
									<button
										type="button"
										onClick={() => onSelectRun(run.RUN_ID)}
										className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
									>
										<StatusBadge status={run.STATUS} />
										<div className="flex-1 space-y-0.5">
											<p className="font-medium text-xs">
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
											<X className="h-3.5 w-3.5 text-muted-foreground" />
										) : (
											<Play className="h-3.5 w-3.5 text-muted-foreground" />
										)}
									</button>
									{isExpanded && (
										<div className="border-t bg-muted/20 px-4 py-4">
											{detailLoading ? (
												<div className="flex h-20 items-center justify-center">
													<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
												</div>
											) : expandedRun ? (
												<div className="space-y-4">
													{expandedRun.DEFINITION_HASH && (
														<div className="rounded-lg border bg-background px-3 py-2 text-[11px]">
															<div className="flex items-center justify-between gap-3">
																<span className="text-muted-foreground">
																	Executed
																	definition
																	{expandedRun.DEFINITION_VERSION !=
																	null
																		? ` v${expandedRun.DEFINITION_VERSION}`
																		: ""}
																</span>
																<Button
																	size="sm"
																	variant="ghost"
																	className="h-7 px-2 text-[11px]"
																	onClick={
																		onToggleExecutedDefinition
																	}
																>
																	{showExecutedDefinition
																		? "Hide definition"
																		: "View definition"}
																</Button>
															</div>
															<p className="mt-1 break-all font-mono text-muted-foreground">
																SHA-256:{" "}
																{
																	expandedRun.DEFINITION_HASH
																}
															</p>
															{showExecutedDefinition &&
																expandedRun.DEFINITION_SNAPSHOT && (
																	<pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-[10px] leading-relaxed">
																		{
																			expandedRun.DEFINITION_SNAPSHOT
																		}
																	</pre>
																)}
														</div>
													)}
													<NodeResultList
														steps={steps}
														results={
															expandedRun.nodeResults ??
															[]
														}
														expandedNodes={
															expandedNodes
														}
														onToggleNode={
															onToggleNode
														}
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
