import {
	Activity,
	AppWindow,
	Brain,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Code2,
	Database,
	Loader2,
	Server,
	Shuffle,
	Workflow,
	X,
	XCircle,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui/next";
import type {
	StepRunStatus,
	WorkflowNode,
	WorkflowNodeType,
} from "@/pages/workflow/workflow.types";

const STEP_ICONS: Record<
	WorkflowNodeType,
	React.ComponentType<{ className?: string }>
> = {
	trigger: Activity,
	"database-engine": Database,
	"storage-engine": Server,
	"vector-engine": Brain,
	"model-engine": Activity,
	"function-engine": Zap,
	app: AppWindow,
	"custom-pixel": Code2,
	"fan-out": Activity,
	conditional: Activity,
	transform: Shuffle,
	"sub-workflow": Workflow,
};

const STEP_COLORS: Record<WorkflowNodeType, string> = {
	trigger: "bg-emerald-500",
	"database-engine": "bg-blue-500",
	"storage-engine": "bg-orange-500",
	"vector-engine": "bg-purple-500",
	"model-engine": "bg-pink-500",
	"function-engine": "bg-yellow-500",
	app: "bg-cyan-500",
	"custom-pixel": "bg-slate-500",
	"fan-out": "bg-indigo-500",
	conditional: "bg-amber-500",
	transform: "bg-teal-500",
	"sub-workflow": "bg-teal-600",
};

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

interface RunPanelProps {
	steps: WorkflowNode[];
	stepStatuses: Record<string, StepRunStatus>;
	stepErrors: Record<string, string>;
	stepDurations: Record<string, number>;
	nodeOutputs: Record<string, string>;
	running: boolean;
	onClose: () => void;
}

export function RunPanel({
	steps,
	stepStatuses,
	stepErrors,
	stepDurations,
	nodeOutputs,
	running,
	onClose,
}: RunPanelProps) {
	const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(
		new Set(),
	);

	const toggleOutput = (stepId: string) => {
		setExpandedOutputs((prev) => {
			const next = new Set(prev);
			if (next.has(stepId)) next.delete(stepId);
			else next.add(stepId);
			return next;
		});
	};

	const completedCount = steps.filter(
		(s) => stepStatuses[s.id] === "success",
	).length;
	const errorStep = steps.find((s) => stepStatuses[s.id] === "error");

	let overallLabel: string;
	let overallClass: string;
	if (running) {
		overallLabel = "Running…";
		overallClass = "text-primary";
	} else if (errorStep) {
		overallLabel = `Failed at "${errorStep.label}"`;
		overallClass = "text-destructive";
	} else if (completedCount > 0) {
		overallLabel = `Completed ${completedCount} of ${steps.length} steps`;
		overallClass = "text-emerald-600";
	} else {
		overallLabel = "Ready";
		overallClass = "text-muted-foreground";
	}

	return (
		<div className="flex w-80 shrink-0 flex-col border-l bg-background">
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					{running && (
						<Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
					)}
					<span className="font-medium text-sm">Run Results</span>
				</div>
				<Button
					size="sm"
					variant="ghost"
					className="h-6 w-6 p-0"
					onClick={onClose}
				>
					<X className="h-3.5 w-3.5" />
				</Button>
			</div>

			{/* Overall status */}
			<div className={`border-b px-4 py-2 text-xs ${overallClass}`}>
				{overallLabel}
			</div>

			{/* Step rows */}
			<div className="flex-1 space-y-1.5 overflow-y-auto p-3">
				{steps.map((step, idx) => {
					const status = stepStatuses[step.id];
					const output = nodeOutputs[step.outputVar];
					const error = stepErrors[step.id];
					const duration = stepDurations[step.id];
					const isOutputOpen = expandedOutputs.has(step.id);
					const Icon = STEP_ICONS[step.type] ?? Code2;
					const color = STEP_COLORS[step.type] ?? "bg-slate-500";

					const borderClass =
						status === "error"
							? "border-destructive/40"
							: status === "success"
								? "border-emerald-500/30"
								: "border-border";

					return (
						<div
							key={step.id}
							className={`rounded-md border text-xs ${borderClass}`}
						>
							{/* Row */}
							<div className="flex items-center gap-2 px-3 py-2">
								<span className="w-4 shrink-0 text-[10px] text-muted-foreground">
									{idx + 1}
								</span>
								<span
									className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${color}`}
								>
									<Icon className="h-3 w-3 text-white" />
								</span>
								<span className="flex-1 truncate font-medium">
									{step.label || step.type}
								</span>
								{duration !== undefined && (
									<span className="shrink-0 text-[10px] text-muted-foreground">
										{formatDuration(duration)}
									</span>
								)}
								{status === "running" && (
									<Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />
								)}
								{status === "success" && (
									<CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
								)}
								{status === "error" && (
									<XCircle className="h-3 w-3 shrink-0 text-destructive" />
								)}
							</div>

							{/* Error message */}
							{status === "error" && error && (
								<div className="border-t px-3 py-2 font-mono text-[10px] text-destructive">
									{error}
								</div>
							)}

							{/* Output toggle */}
							{status === "success" && output && (
								<>
									<button
										type="button"
										onClick={() => toggleOutput(step.id)}
										className="flex w-full items-center gap-1 border-t px-3 py-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
									>
										{isOutputOpen ? (
											<ChevronDown className="h-3 w-3" />
										) : (
											<ChevronRight className="h-3 w-3" />
										)}
										<span className="font-mono">
											{`\${${step.outputVar}}`}
										</span>
									</button>
									{isOutputOpen && (
										<pre className="max-h-48 overflow-auto border-t bg-muted/30 px-3 py-2 font-mono text-[10px]">
											{output}
										</pre>
									)}
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
