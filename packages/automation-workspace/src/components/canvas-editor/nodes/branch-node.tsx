import { Handle, type NodeProps, Position, useEdges } from "@xyflow/react";
import { GitBranch, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import type {
	AutomationNode as AutomationGraphNode,
	BranchConfig,
	StepRunStatus,
} from "../../../domain/automation.types";
import { formatDurationMs } from "../../../domain/automation-utils";
import { StatusIcon } from "../../status-icon";

export type BranchNodeData = {
	step: AutomationGraphNode;
	index: number;
	runStatus?: StepRunStatus;
	runError?: string;
	runDuration?: number;
	isIncomplete?: boolean;
	locked?: boolean;
	/** True for a few seconds right after an Assistant tool call changes this step. */
	highlighted?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	onAddClause?: (clauseId: string) => void;
	onAddElse?: () => void;
};

const STATUS_BORDER: Record<string, string> = {
	error: "border-destructive/60",
	success: "border-emerald-500/60",
	running: "border-blue-500/70",
	incomplete: "border-amber-500/60",
	idle: "border-border",
};

export function BranchNode({ data }: NodeProps) {
	const d = data as BranchNodeData;
	const { step, runStatus, runDuration, isIncomplete, locked, highlighted } =
		d;
	const config = step.config as BranchConfig;
	const firstCondition = config.clauses[0]?.condition;
	const additionalConditions = config.clauses.length - 1;
	const edges = useEdges();
	const outputCount = config.clauses.length + 1;
	const elseConnected = edges.some(
		(e) => e.source === step.id && e.sourceHandle === `else-${step.id}`,
	);
	const borderClass =
		STATUS_BORDER[runStatus ?? (isIncomplete ? "incomplete" : "idle")] ??
		STATUS_BORDER.idle;
	const runningClass =
		runStatus === "running" ? "automation-node-running" : "";
	const highlightClass = highlighted
		? "animate-pulse ring-2 ring-primary ring-offset-2 ring-offset-background"
		: "";

	return (
		<div
			className={`group relative w-[280px] rounded-2xl border-2 shadow-sm ${borderClass} ${runningClass} ${highlightClass} ${locked ? "opacity-75" : ""}`}
			style={{ minHeight: `${88 + additionalConditions * 48}px` }}
		>
			<div className="relative z-1 m-0.5 rounded-[14px] bg-card">
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
							aria-label="Edit branch"
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
							aria-label="Delete branch"
						>
							<Trash2 className="h-3 w-3" />
						</button>
					</div>
				)}

				<div className="cursor-pointer px-4 py-3">
					<div className="flex items-center gap-3">
						<span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950">
							<GitBranch className="h-4.5 w-4.5" />
							<span className="-top-1.5 -left-1.5 absolute flex h-4 w-4 items-center justify-center rounded-full border border-border bg-muted font-medium text-[9px] text-muted-foreground">
								{d.index + 1}
							</span>
						</span>
						<div className="min-w-0 flex-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<p className="truncate font-semibold text-sm leading-snug">
										{step.label || "Decision"}
									</p>
								</TooltipTrigger>
								<TooltipContent side="top">
									{step.label || "Decision"}
								</TooltipContent>
							</Tooltip>
							<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
								{firstCondition
									? `${additionalConditions > 0 ? `${additionalConditions + 1} conditions` : `if ${firstCondition}`}`
									: "No condition set"}
							</p>
						</div>
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
					{runDuration != null && runStatus !== "running" && (
						<div className="mt-1.5 pl-12">
							<span className="text-[10px] text-muted-foreground/70">
								{formatDurationMs(runDuration)}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Input handle */}
			<Handle
				id={`in-${step.id}`}
				type="target"
				position={Position.Left}
				isConnectable={!locked}
				className="h-2! w-2! border-2! border-background! bg-muted-foreground/40!"
			/>

			{config.clauses.map((clause, index) => (
				<BranchOutputHandle
					key={clause.id}
					id={`case-${step.id}-${clause.id}`}
					label={index === 0 ? "If" : "Else if"}
					connected={edges.some(
						(edge) =>
							edge.source === step.id &&
							edge.sourceHandle ===
								`case-${step.id}-${clause.id}`,
					)}
					locked={locked}
					top={`${((index + 1) / (outputCount + 1)) * 100}%`}
					onAdd={() => d.onAddClause?.(clause.id)}
				/>
			))}
			<BranchOutputHandle
				id={`else-${step.id}`}
				label="Else"
				connected={elseConnected}
				locked={locked}
				top={`${(outputCount / (outputCount + 1)) * 100}%`}
				onAdd={() => d.onAddElse?.()}
				isElse
			/>
		</div>
	);
}

function BranchOutputHandle({
	id,
	label,
	connected,
	locked,
	top,
	onAdd,
	isElse = false,
}: {
	id: string;
	label: string;
	connected: boolean;
	locked?: boolean;
	top: string;
	onAdd: () => void;
	isElse?: boolean;
}) {
	const handleClass =
		connected || locked
			? isElse
				? "h-2! w-2! border-2! border-background! bg-red-500!"
				: "h-2! w-2! border-2! border-background! bg-emerald-500!"
			: isElse
				? "h-7! w-7! border! border-red-500/40! bg-background! hover:border-red-500! shadow-sm transition-colors"
				: "h-7! w-7! border! border-emerald-500/40! bg-background! hover:border-emerald-500! shadow-sm transition-colors";
	const labelClass = isElse ? "text-red-500" : "text-emerald-600";
	return (
		<>
			<Handle
				id={id}
				type="source"
				position={Position.Right}
				isConnectable={!locked}
				onClick={(event) => {
					event.stopPropagation();
					if (!locked && !connected) onAdd();
				}}
				style={{ top }}
				aria-label={
					connected
						? `${label} branch`
						: `Add node to ${label} branch`
				}
				className={handleClass}
			/>
			{!connected && !locked && (
				<span
					className={`pointer-events-none absolute z-10 flex h-7 w-7 items-center justify-center ${labelClass}`}
					style={{
						top,
						right: 0,
						transform: "translateX(50%) translateY(-50%)",
					}}
				>
					<Plus className="h-4 w-4" />
				</span>
			)}
			<span
				className={`pointer-events-none absolute right-0 font-medium text-[9px] ${labelClass}`}
				style={{
					top,
					transform: `translateX(calc(100% + ${connected || locked ? 6 : 20}px)) translateY(-50%)`,
				}}
			>
				{label}
			</span>
		</>
	);
}
