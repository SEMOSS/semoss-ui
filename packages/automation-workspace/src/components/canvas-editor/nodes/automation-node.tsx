import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import type {
	AutomationNode as AutomationGraphNode,
	StepRunStatus,
} from "../../../domain/automation.types";
import {
	getDisplayMeta,
	getStepHeaderLabel,
} from "../../../domain/automation-display";
import {
	buildPixelPreview,
	extractVarRefs,
	formatDurationMs,
} from "../../../domain/automation-utils";
import { getWorkflowNodeDefinition } from "../../../domain/automation-workflow-adapter";
import { getWorkflowNodeDisplay } from "../../../domain/automation-workflow-display";
import { StatusIcon } from "../../status-icon";

export type AutomationNodeData = {
	step: AutomationGraphNode;
	index: number;
	runStatus?: StepRunStatus;
	runError?: string;
	runDuration?: number;
	runOutput?: string | null;
	isIncomplete?: boolean;
	locked?: boolean;
	isLast?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	onAdd?: () => void;
};

const STATUS_BORDER: Record<string, string> = {
	error: "border-destructive/60",
	success: "border-emerald-500/60",
	running: "border-blue-500/70",
	incomplete: "border-amber-500/60",
	idle: "border-border",
};

export function AutomationNode({ data }: NodeProps) {
	const d = data as AutomationNodeData;
	const { step, runStatus, runDuration, isIncomplete, locked } = d;

	const meta = getDisplayMeta(step.type);
	const workflowDefinition = step.workflowType
		? getWorkflowNodeDefinition(step.workflowType)
		: undefined;
	const workflowDisplay = step.workflowType
		? getWorkflowNodeDisplay(step.workflowType)
		: null;
	const Icon = workflowDisplay?.icon ?? meta.icon;
	const label =
		step.label || workflowDefinition?.label || getStepHeaderLabel(step);
	const borderClass =
		STATUS_BORDER[runStatus ?? (isIncomplete ? "incomplete" : "idle")] ??
		STATUS_BORDER.idle;
	const runningClass =
		runStatus === "running" ? "automation-node-running" : "";
	const pixelPreview = step.workflowType ? "" : buildPixelPreview(step);
	const varRefs = extractVarRefs(pixelPreview);

	const subtitle = (() => {
		const c = step.config as unknown as Record<string, unknown>;
		const parts: string[] = [];
		if (c.engineName) parts.push(c.engineName as string);
		if (c.operation) parts.push(c.operation as string);
		return parts.join(" · ") || workflowDefinition?.label || meta.label;
	})();

	return (
		<div
			className={`group relative w-[280px] rounded-2xl border-2 shadow-sm ${borderClass} ${runningClass} ${locked ? "opacity-75" : ""}`}
		>
			<div className="relative z-[1] m-0.5 rounded-[14px] bg-card">
				{/* Hover actions */}
				{!locked && (
					<div className="-top-2 absolute right-2 z-10 hidden items-center gap-0.5 rounded-full border bg-background px-1 py-0.5 shadow-sm group-hover:flex">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								d.onEdit?.();
							}}
							className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Edit step"
						>
							<Pencil className="h-3 w-3" />
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								d.onDelete?.();
							}}
							className="rounded p-0.5 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
							aria-label="Delete step"
						>
							<Trash2 className="h-3 w-3" />
						</button>
					</div>
				)}

				<div className="cursor-pointer px-4 py-3">
					{/* Header row */}
					<div className="flex items-center gap-3">
						{/* Icon */}
						<span
							className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted ${workflowDisplay?.color ?? meta.color}`}
						>
							<Icon className="h-4.5 w-4.5" />
							{/* Step number badge */}
							<span className="-top-1.5 -left-1.5 absolute flex h-4 w-4 items-center justify-center rounded-full border border-border bg-muted font-medium text-[9px] text-muted-foreground">
								{d.index + 1}
							</span>
						</span>

						{/* Label + subtitle */}
						<div className="min-w-0 flex-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<p className="truncate font-semibold text-sm leading-snug">
										{label}
									</p>
								</TooltipTrigger>
								<TooltipContent side="top">
									{label}
								</TooltipContent>
							</Tooltip>
							<p className="mt-0.5 truncate text-[11px] text-muted-foreground uppercase tracking-wide">
								{subtitle}
							</p>
						</div>

						{/* Run status indicator */}
						{runStatus && runStatus !== "idle" && (
							<div className="ml-auto shrink-0">
								{runStatus === "running" ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
								) : (
									<StatusIcon
										status={runStatus}
										className={`h-3.5 w-3.5 ${runStatus === "success" ? "text-emerald-500" : runStatus === "error" ? "text-destructive" : ""}`}
									/>
								)}
							</div>
						)}
					</div>

					{/* Run duration + variable refs */}
					{(runDuration != null || varRefs.length > 0) && (
						<div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-12">
							{runDuration != null && runStatus !== "running" && (
								<span className="text-[10px] text-muted-foreground/70">
									{runStatus === "error" ? `failed · ` : ""}
									{formatDurationMs(runDuration)}
								</span>
							)}
							{varRefs.slice(0, 2).map((v) => (
								<span
									key={v}
									className="rounded bg-blue-500/10 px-1 py-0.5 font-mono text-[9px] text-blue-600 dark:text-blue-400"
								>
									${"{"}
									{v}
									{"}"}
								</span>
							))}
							{varRefs.length > 2 && (
								<span className="text-[9px] text-muted-foreground/60">
									+{varRefs.length - 2}
								</span>
							)}
						</div>
					)}

					{/* Output var pill */}
					{step.outputVar && (
						<div className="mt-1.5 flex pl-12">
							<span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
								{step.outputVar}
							</span>
						</div>
					)}
				</div>
			</div>

			<Handle
				id={`in-${step.id}`}
				type="target"
				position={Position.Left}
				isConnectable={!locked}
				className="!h-2 !w-2 !border-2 !border-background !bg-muted-foreground/40"
			/>
			{d.isLast && !locked ? (
				<>
					<Handle
						id={`out-${step.id}`}
						type="source"
						position={Position.Right}
						isConnectable
						onClick={(event) => {
							event.stopPropagation();
							d.onAdd?.();
						}}
						aria-label="Add node or drag to connect"
						className="!h-7 !w-7 !border !border-border !bg-background hover:!border-primary shadow-sm transition-colors"
					/>
					<span
						data-tour="add-step"
						className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-0 z-10 flex h-7 w-7 translate-x-1/2 items-center justify-center text-muted-foreground"
					>
						<Plus className="h-4 w-4" />
					</span>
				</>
			) : (
				<Handle
					id={`out-${step.id}`}
					type="source"
					position={Position.Right}
					isConnectable={!locked}
					className="!h-2 !w-2 !border-2 !border-background !bg-muted-foreground/40"
				/>
			)}
		</div>
	);
}
