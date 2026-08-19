import type {
	AutomationNode,
	AutomationNodeResult,
	RunStatus,
} from "../../../domain/automation.types";
import { NodeResultList } from "../../form-editor/node-result-list";
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
	expandedNodes: Set<string>;
	onDismiss: () => void;
	onToggleNode: (nodeId: string) => void;
}

export function TraceTab({
	running,
	latestRunStatus,
	aiRunSummary,
	generatingAiSummary,
	steps,
	results,
	expandedNodes,
	onDismiss,
	onToggleNode,
}: TraceTabProps) {
	return (
		<div className="h-full overflow-y-auto p-4">
			<div className="mx-auto max-w-3xl space-y-3">
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
							Running
						</span>
					)}
				</div>
				{!running &&
					latestRunStatus &&
					latestRunStatus !== "RUNNING" && (
						<RunBanner
							status={latestRunStatus}
							aiSummary={aiRunSummary}
							generatingAiSummary={generatingAiSummary}
							onDismiss={onDismiss}
						/>
					)}
				<NodeResultList
					steps={steps}
					results={results}
					expandedNodes={expandedNodes}
					onToggleNode={onToggleNode}
				/>
			</div>
		</div>
	);
}
