import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getDisplayMeta } from "@/components/automation-form-editor/automation-editor-utils";
import { StatusBadge } from "@/components/automation-form-editor/automation-status";
import { useRootStore } from "@/hooks";
import type {
	AutomationDocument,
	AutomationGraph,
	AutomationNode,
	AutomationRunSummary,
} from "@/pages/automation/automation.types";

interface AutomationRendererProps {
	appId: string;
}

/**
 * Read-only summary of an automation's steps and latest run — shown on the
 * non-edit "view" page (ViewAppPage) for AUTOMATION-type apps. Users without
 * edit access land here, so this intentionally has no Save/Run controls.
 */
export function AutomationRenderer({ appId }: AutomationRendererProps) {
	const { monolithStore } = useRootStore();
	const [loading, setLoading] = useState(true);
	const [steps, setSteps] = useState<AutomationNode[]>([]);
	const [latestRun, setLatestRun] = useState<AutomationRunSummary | null>(
		null,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: monolithStore is a stable singleton ref
	useEffect(() => {
		Promise.all([
			monolithStore
				.runQuery<[AutomationDocument]>(
					`GetAutomation(project=["${appId}"])`,
				)
				.catch(() => null),
			monolithStore
				.runQuery(
					`ListAutomationRuns(project=["${appId}"], limit=[1]);`,
				)
				.catch(() => null),
		]).then(([autoRes, runRes]) => {
			const doc = (autoRes?.pixelReturn?.[0]?.output ??
				null) as AutomationDocument | null;
			const graph: AutomationGraph = doc?.graph ?? {
				nodes: [],
				edges: [],
			};
			setSteps(graph.nodes);

			const runs =
				(runRes?.pixelReturn?.[0]?.output as
					| AutomationRunSummary[]
					| undefined) ?? [];
			setLatestRun(runs[0] ?? null);
			setLoading(false);
		});
	}, [appId]);

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto flex h-full max-w-3xl flex-col gap-4 overflow-auto px-6 py-6">
			<div className="flex items-center justify-between">
				<span className="font-semibold text-lg">Automation Steps</span>
				{latestRun ? (
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-xs">
							Last run
						</span>
						<StatusBadge status={latestRun.STATUS} />
					</div>
				) : null}
			</div>

			{steps.length === 0 ? (
				<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-10 text-center text-muted-foreground text-sm">
					This automation has no steps yet.
				</div>
			) : (
				<ol className="flex flex-col gap-2">
					{steps.map((step, index) => {
						const meta = getDisplayMeta(step.type);
						const Icon = meta.icon;
						return (
							<li
								key={step.id}
								className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
							>
								<span className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground text-xs">
									{index + 1}
								</span>
								<span
									className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted ${meta.color}`}
								>
									<Icon className="h-4 w-4" />
								</span>
								<span className="flex flex-col">
									<span className="font-medium text-sm">
										{step.label || meta.label}
									</span>
									<span className="text-muted-foreground text-xs">
										{meta.label}
									</span>
								</span>
							</li>
						);
					})}
				</ol>
			)}
		</div>
	);
}
