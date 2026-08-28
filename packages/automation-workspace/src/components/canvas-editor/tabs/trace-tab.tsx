import { GitBranch, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CellOutputBlock } from "@semoss/shared";
import type {
	AutomationNode,
	AutomationNodeResult,
	RunStatus,
} from "../../../domain/automation.types";
import { getDisplayMeta } from "../../../domain/automation-display";
import { formatDurationMs } from "../../../domain/automation-utils";
import { getWorkflowNodeDisplay } from "../../../domain/automation-workflow-display";
import { ErrorDetail, TraceDetail } from "../../form-editor/node-result-list";
import { StatusBadge } from "../../status-badge";
import { RunBanner } from "../run-banner";

/** Props for the run-trace dock tab. */
export interface AutomationTraceSnapshot {
	running: boolean;
	latestRunStatus: RunStatus | null;
	aiRunSummary: string | null;
	generatingAiSummary: boolean;
	steps: AutomationNode[];
	results: AutomationNodeResult[];
}

interface TraceTabProps extends AutomationTraceSnapshot {
	onDismiss: () => void;
}

export function TraceTab({
	running,
	latestRunStatus,
	aiRunSummary,
	generatingAiSummary,
	steps,
	results,
	onDismiss,
}: TraceTabProps) {
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const previousRunningNodeIdRef = useRef<string | null>(null);

	const stepMap = new Map(steps.map((step) => [step.id, step]));
	const runningResults = results.filter(
		(result) => result.STATUS === "RUNNING",
	);
	const runningResult = runningResults[0] ?? null;
	const selectedResult =
		results.find((result) => result.NODE_ID === selectedNodeId) ??
		runningResult ??
		results[results.length - 1] ??
		null;
	const selectedStep = selectedResult
		? stepMap.get(selectedResult.NODE_ID)
		: undefined;
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
		if (!runningNodeId) {
			previousRunningNodeIdRef.current = null;
		}
		setSelectedNodeId((current) =>
			current && results.some((result) => result.NODE_ID === current)
				? current
				: (results[results.length - 1]?.NODE_ID ?? null),
		);
	}, [results, runningResult?.NODE_ID]);

	return (
		<div className="flex h-full min-h-0 flex-col p-3">
			<div className="flex items-center justify-between">
				<div>
					<p className="font-semibold text-sm">Run details</p>
					<p className="text-[11px] text-muted-foreground">
						Observe action progress and outputs as they arrive.
					</p>
				</div>
				{running && (
					<span className="flex items-center gap-1.5 text-[11px] text-primary">
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
						{runningResults.length > 1
							? `${runningResults.length} running`
							: "Running"}
					</span>
				)}
			</div>
			{!running && latestRunStatus && latestRunStatus !== "RUNNING" && (
				<RunBanner
					status={latestRunStatus}
					aiSummary={aiRunSummary}
					generatingAiSummary={generatingAiSummary}
					onDismiss={onDismiss}
				/>
			)}
			<div className="mt-3 flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
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
								const meta = getDisplayMeta(
									step?.type ?? "app",
								);
								const workflowDisplay = step?.workflowType
									? getWorkflowNodeDisplay(step.workflowType)
									: null;
								const Icon =
									step?.type === "branch"
										? GitBranch
										: (workflowDisplay?.icon ?? meta.icon);
								const iconColor =
									step?.type === "branch"
										? "text-orange-600"
										: (workflowDisplay?.color ??
											meta.color);
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
										onClick={() =>
											setSelectedNodeId(result.NODE_ID)
										}
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
									{selectedResult.NODE_LABEL || "..."}
									...
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
									onOutputPopout={() => {
										const parentOrigin =
											new URLSearchParams(
												window.location.search,
											).get("parentOrigin");
										if (
											parentOrigin &&
											window.parent !== window
										) {
											window.parent.postMessage(
												{
													type: "SEMOSS_AUTOMATION_OPEN_OUTPUT",
													output:
														selectedResult.OUTPUT_PREVIEW ??
														"No output was produced.",
												},
												parentOrigin,
											);
										}
									}}
								/>
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
		</div>
	);
}
