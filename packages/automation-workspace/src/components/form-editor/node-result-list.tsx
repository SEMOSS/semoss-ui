import { Clock3 } from "lucide-react";
import { useMemo } from "react";
import type {
	AutomationNode,
	AutomationNodeResult,
} from "../../domain/automation.types";
import { getDisplayMeta } from "../../domain/automation-display";
import { formatDurationMs } from "../../domain/automation-utils";
import { StatusBadge } from "../status-badge";
import { OutputPreview } from "./output-preview";

export interface NodeResultListProps {
	/** Automation node definitions, used to look up label/type per result */
	steps: AutomationNode[];
	/** Per-node execution results to render */
	results: AutomationNodeResult[];
	/** Node ids whose output preview is currently expanded */
	expandedNodes: Set<string>;
	/** Called with a node id when its output preview is expanded/collapsed */
	onToggleNode: (nodeId: string) => void;
}

export function NodeResultList({
	steps,
	results,
	expandedNodes,
	onToggleNode,
}: NodeResultListProps) {
	const stepMap = useMemo(
		() => new Map(steps.map((step) => [step.id, step])),
		[steps],
	);

	if (results.length === 0) {
		return (
			<div className="rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center text-muted-foreground text-sm">
				No node results available yet.
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{results.map((result, _index) => {
				const step = stepMap.get(result.NODE_ID);
				const meta = getDisplayMeta(step?.type ?? "app-engine");
				const Icon = meta.icon;
				const isExpanded = expandedNodes.has(result.NODE_ID);

				return (
					<div
						key={result.NODE_ID}
						className="rounded-xl border bg-card shadow-sm"
					>
						<div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex min-w-0 flex-1 items-start gap-3">
								<span
									className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${meta.color}`}
								>
									<Icon className="h-5 w-5" />
								</span>
								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-medium text-sm">
											{result.NODE_LABEL ||
												step?.label ||
												meta.label}
										</span>
										<StatusBadge status={result.STATUS} />
									</div>
									{result.ERROR_MESSAGE && (
										<div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive">
											{result.ERROR_MESSAGE}
										</div>
									)}
									{result.OUTPUT_PREVIEW && (
										<OutputPreview
											value={result.OUTPUT_PREVIEW}
											expanded={isExpanded}
											onToggle={() =>
												onToggleNode(result.NODE_ID)
											}
											nodeType={step?.type}
										/>
									)}
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground lg:pl-4">
								<Clock3 className="h-3.5 w-3.5" />
								{formatDurationMs(result.DURATION_MS)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
