import { Handle, type NodeProps, Position } from "@xyflow/react";
import {
	Bot,
	BrainCircuit,
	Code2,
	Cog,
	Diamond,
	FileOutput,
	Hash,
	Package,
} from "lucide-react";
import { cn } from "@semoss/ui/next";
import { useWorkflowEditor } from "@/stores/workflow";
import type { StepType } from "@/types/workflow";
import { STEP_TYPE_LABELS, STEP_TYPES } from "@/types/workflow";

// ─── Icon mapping ────────────────────────────────────────────────
const STEP_ICONS: Record<StepType, React.ReactNode> = {
	LLM_ASK: <Bot className="h-4 w-4" />,
	LLM_AGENT: <BrainCircuit className="h-4 w-4" />,
	RUN_TOOL: <Cog className="h-4 w-4" />,
	RUN_PIXEL: <Code2 className="h-4 w-4" />,
	CONDITION: <Diamond className="h-4 w-4" />,
	STATIC: <Hash className="h-4 w-4" />,
	OUTPUT: <FileOutput className="h-4 w-4" />,
};

const USE_APP_ICON = <Package className="h-4 w-4" />;

// ─── Color mapping ───────────────────────────────────────────────
const STEP_COLORS: Record<StepType, string> = {
	LLM_ASK: "border-blue-400 bg-blue-50",
	LLM_AGENT: "border-purple-400 bg-purple-50",
	RUN_TOOL: "border-amber-400 bg-amber-50",
	RUN_PIXEL: "border-emerald-400 bg-emerald-50",
	CONDITION: "border-orange-400 bg-orange-50",
	STATIC: "border-gray-400 bg-gray-50",
	OUTPUT: "border-rose-400 bg-rose-50",
};

const STEP_ICON_BG: Record<StepType, string> = {
	LLM_ASK: "bg-blue-100 text-blue-700",
	LLM_AGENT: "bg-purple-100 text-purple-700",
	RUN_TOOL: "bg-amber-100 text-amber-700",
	RUN_PIXEL: "bg-emerald-100 text-emerald-700",
	CONDITION: "bg-orange-100 text-orange-700",
	STATIC: "bg-gray-100 text-gray-700",
	OUTPUT: "bg-rose-100 text-rose-700",
};

// ─── Node Data ───────────────────────────────────────────────────
export interface WorkflowNodeData {
	stepId: string;
	type: StepType;
	name: string;
	description?: string;
	isEntry: boolean /** UI-only: "project" for Use App blocks, "engine" or undefined for Use Engine */;
	source?: "engine" | "project";
	[key: string]: unknown;
}

// ─── Component ───────────────────────────────────────────────────
export function WorkflowNode({ data, selected }: NodeProps) {
	const nodeData = data as unknown as WorkflowNodeData;
	const { state } = useWorkflowEditor();
	const isSelected = state.selectedStepId === nodeData.stepId;
	const stepType = nodeData.type as StepType;
	const isCondition = stepType === STEP_TYPES.CONDITION;
	const isUseApp =
		stepType === STEP_TYPES.RUN_TOOL && nodeData.source === "project";

	// Pick icon and label based on variant
	const icon = isUseApp ? USE_APP_ICON : STEP_ICONS[stepType];
	const typeLabel = isUseApp ? "Use App" : STEP_TYPE_LABELS[stepType];
	const colorClass = isUseApp
		? "border-teal-400 bg-teal-50"
		: STEP_COLORS[stepType];
	const iconBgClass = isUseApp
		? "bg-teal-100 text-teal-700"
		: STEP_ICON_BG[stepType];

	return (
		<div
			className={cn(
				"relative min-w-[180px] max-w-[240px] rounded-lg border-2 shadow-sm transition-shadow",
				colorClass,
				(selected || isSelected) && "shadow-md ring-2 ring-blue-500",
			)}
		>
			{/* Entry badge */}
			{nodeData.isEntry && (
				<div className="-top-3 -translate-x-1/2 absolute left-1/2 rounded-full bg-green-600 px-2 py-0.5 font-semibold text-[10px] text-white">
					START
				</div>
			)}

			{/* Target handle (top) */}
			<Handle
				type="target"
				position={Position.Top}
				className="!w-3 !h-3 !bg-gray-400 !border-white !border-2"
			/>

			{/* Body */}
			<div className="flex items-center gap-2 px-3 py-2">
				<div
					className={cn(
						"flex items-center justify-center rounded-md p-1.5",
						iconBgClass,
					)}
				>
					{icon}
				</div>
				<div className="flex flex-col overflow-hidden">
					<span className="truncate font-semibold text-xs">
						{nodeData.name}
					</span>
					<span className="text-[10px] text-muted-foreground">
						{typeLabel}
					</span>
				</div>
			</div>

			{/* Source handles */}
			{isCondition ? (
				<>
					{/* biome-ignore lint/correctness/useUniqueElementIds: Handle IDs are @xyflow/react edge routing identifiers, not DOM IDs */}
					<Handle
						type="source"
						position={Position.Bottom}
						id="ifTrue"
						className="!w-3 !h-3 !bg-green-500 !border-white !border-2 !left-[30%]"
					/>
					{/* biome-ignore lint/correctness/useUniqueElementIds: Handle IDs are @xyflow/react edge routing identifiers, not DOM IDs */}
					<Handle
						type="source"
						position={Position.Bottom}
						id="ifFalse"
						className="!w-3 !h-3 !bg-red-500 !border-white !border-2 !left-[70%]"
					/>
				</>
			) : (
				// biome-ignore lint/correctness/useUniqueElementIds: Handle IDs are @xyflow/react edge routing identifiers, not DOM IDs
				<Handle
					type="source"
					position={Position.Bottom}
					id="next"
					className="!w-3 !h-3 !bg-gray-400 !border-white !border-2"
				/>
			)}
		</div>
	);
}
