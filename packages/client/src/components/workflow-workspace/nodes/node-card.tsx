import { Handle, type NodeProps, Position } from "@xyflow/react";
import { AlertTriangle, Code2, ExternalLink, Info, Trash2 } from "lucide-react";
import { memo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import type {
	EngineOption,
	WorkflowNodeType,
} from "@/pages/workflow/workflow.types";
import { NODE_TYPE_META } from "@/pages/workflow/workflow.types";
import { NODE_COLORS, NODE_ICONS } from "../workflow-node-meta";
import { useWorkflowWorkspaceContext } from "../workflow-workspace-context";

// ─── data shape flowing through ReactFlow ────────────────────────────────────

export interface WorkflowNodeData extends Record<string, unknown> {
	nodeType: WorkflowNodeType;
	label: string;
	outputVar: string;
	config: Record<string, unknown>;
	onSettings?: (id: string) => void;
	floatingWarning?: boolean;
}

// ─── collapsed summary line ───────────────────────────────────────────────────

function collapsedSummary(
	config: Record<string, unknown>,
	enginesByType: Record<string, EngineOption[]>,
	nodeType: WorkflowNodeType,
): string {
	const engineTypeMap: Partial<Record<WorkflowNodeType, string>> = {
		"database-engine": "DATABASE",
		"storage-engine": "STORAGE",
		"vector-engine": "VECTOR",
		"model-engine": "MODEL",
		"function-engine": "FUNCTION",
	};
	const eKey = engineTypeMap[nodeType];
	if (eKey && config.engineId) {
		const engines = enginesByType[eKey] ?? [];
		const found = engines.find((e) => e.engine_id === config.engineId);
		return found
			? (found.engine_display_name ?? found.engine_name)
			: String(config.engineId).slice(0, 20);
	}
	if (config.targetProjectId)
		return `→ ${String(config.targetProjectId).slice(0, 28)}`;
	if (config.pixel) {
		const px = String(config.pixel);
		return px.length > 35 ? `${px.slice(0, 35)}…` : px;
	}
	if (config.pixelExpression) {
		const px = String(config.pixelExpression);
		return px.length > 35 ? `${px.slice(0, 35)}…` : px;
	}
	if (config.inputVar) return `each \${${config.inputVar}}`;
	return "";
}

// ─── node card ────────────────────────────────────────────────────────────────

const NODE_TOOLTIP_MAP = new Map(
	NODE_TYPE_META.map((m) => [m.type, m.tooltip]),
);

export const WorkflowNodeCard = memo(({ id, data }: NodeProps) => {
	const d = data as WorkflowNodeData;
	const { enginesByType, deleteNode, openSettings } =
		useWorkflowWorkspaceContext();

	const Icon = NODE_ICONS[d.nodeType] ?? Code2;
	const color = NODE_COLORS[d.nodeType] ?? "bg-slate-500";
	const isTrigger = d.nodeType === "trigger";
	const floating = !isTrigger && !!d.floatingWarning;
	const summary = collapsedSummary(d.config, enginesByType, d.nodeType);
	const tooltip = NODE_TOOLTIP_MAP.get(d.nodeType);

	const handleOpen = (e: React.MouseEvent) => {
		e.stopPropagation();
		openSettings(id);
	};

	return (
		<div
			className={`group relative flex min-w-[200px] flex-col rounded-lg border bg-background shadow-sm transition-all duration-150 hover:shadow-md ${floating ? "ring-2 ring-amber-400/70 hover:ring-amber-400" : "hover:ring-1 hover:ring-primary/20"}`}
		>
			{/* header */}
			<div
				className={`flex w-full items-center gap-1 rounded-t-lg px-3 py-2 ${color}`}
			>
				<button
					type="button"
					className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
					onClick={handleOpen}
				>
					<Icon className="h-3.5 w-3.5 flex-shrink-0 text-white/90" />
					<span className="min-w-0 flex-1 truncate font-medium text-white text-xs">
						{d.label}
					</span>
					<ExternalLink className="h-3 w-3 flex-shrink-0 text-white/60 opacity-0 transition-opacity group-hover:opacity-100" />
				</button>
				{tooltip && (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={(e) => e.stopPropagation()}
								className="flex-shrink-0 rounded p-0.5 text-white/50 transition-colors hover:text-white"
								title="About this node"
							>
								<Info className="h-3 w-3" />
							</button>
						</TooltipTrigger>
						<TooltipContent
							side="right"
							className="max-w-72 whitespace-pre-line text-xs leading-relaxed"
						>
							{tooltip}
						</TooltipContent>
					</Tooltip>
				)}
			</div>

			{/* body — also opens settings panel on click */}
			<button
				type="button"
				onClick={handleOpen}
				className="w-full cursor-pointer text-left"
			>
				{floating && (
					<div className="flex items-center gap-1 border-amber-200 border-b bg-amber-50 px-3 py-1 text-[10px] text-amber-600 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
						<AlertTriangle className="h-2.5 w-2.5 flex-shrink-0" />
						Not connected to trigger
					</div>
				)}
				{summary && (
					<div className="truncate px-3 pt-1 text-[10px] text-muted-foreground">
						{summary}
					</div>
				)}
				<div className="px-3 py-2">
					<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
						{`→ \${${d.outputVar}}`}
					</span>
				</div>
			</button>

			{/* delete — hover-only footer, non-trigger nodes */}
			{!isTrigger && (
				<div className="flex justify-end border-t px-3 py-1 opacity-0 transition-opacity group-hover:opacity-100">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							deleteNode(id);
						}}
						className="flex items-center gap-1 text-[10px] text-destructive hover:underline"
					>
						<Trash2 className="h-3 w-3" /> Delete
					</button>
				</div>
			)}

			{/* connection handles */}
			{!isTrigger && (
				<Handle
					type="target"
					position={Position.Left}
					className="!h-3 !w-3 !rounded-full !border-2 !border-background !bg-primary"
				/>
			)}
			<Handle
				type="source"
				position={Position.Right}
				className="!h-3 !w-3 !rounded-full !border-2 !border-background !bg-primary"
			/>
		</div>
	);
});

WorkflowNodeCard.displayName = "WorkflowNodeCard";
