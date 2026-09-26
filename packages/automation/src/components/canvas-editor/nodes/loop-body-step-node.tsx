import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Plus } from "lucide-react";
import { getWorkflowNodeDisplay } from "../../../domain/automation-workflow-display";
import type { LoopBodyCanvasNodeData } from "../loop-body-canvas.types";

/** Compact action card rendered inside an expanded loop container. */
export function LoopBodyStepNode({ data }: NodeProps) {
	const d = data as LoopBodyCanvasNodeData;
	const display = d.node.workflowType
		? getWorkflowNodeDisplay(d.node.workflowType)
		: null;
	const Icon = display?.icon ?? Plus;
	const sourceHandle = `out-${d.node.id}`;
	const isConnected = d.connectedSourceHandles.includes(sourceHandle);

	return (
		<div
			className={`relative w-44 rounded-xl border bg-background shadow-sm ${d.selected ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
		>
			<button
				type="button"
				className="nodrag flex min-h-14 w-full items-center gap-2 rounded-xl px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onClick={() => d.onSelect(d.node.id)}
			>
				<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
					<Icon className="size-4" aria-hidden />
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate font-medium text-xs">
						{d.node.label}
					</span>
					<span className="block truncate text-muted-foreground text-xs">
						{d.node.outputVar}
					</span>
				</span>
			</button>
			<Handle
				id={`in-${d.node.id}`}
				type="target"
				position={Position.Left}
				isConnectable={false}
				className="size-2! border-2! border-background! bg-muted-foreground/50!"
			/>
			<Handle
				id={sourceHandle}
				type="source"
				position={Position.Right}
				isConnectable={false}
				aria-label={`${d.node.label} output`}
				className="pointer-events-none size-2! border-2! border-background! bg-muted-foreground/50!"
			/>
			{!d.readOnly && (
				<button
					type="button"
					aria-label={`${isConnected ? "Insert" : "Add"} a step after ${d.node.label}`}
					className="nodrag nopan -translate-y-1/2 absolute top-1/2 right-0 z-10 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					onClick={(event) => {
						event.stopPropagation();
						if (event.detail === 0) {
							d.onAddAfter(d.node.id, sourceHandle);
						}
					}}
					onPointerDown={(event) => {
						event.stopPropagation();
						d.onAddAfter(d.node.id, sourceHandle);
					}}
				>
					<Plus className="size-3.5" aria-hidden />
				</button>
			)}
		</div>
	);
}
