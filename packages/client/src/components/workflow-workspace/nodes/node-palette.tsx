import type { DragEvent, FC } from "react";
import { NODE_PALETTE } from "../workflow.types";

/**
 * Left sidebar palette — each item can be dragged onto the ReactFlow canvas.
 * Sets dataTransfer with the node type so the canvas drop handler can read it.
 */
export const NodePalette: FC = () => {
	const onDragStart = (event: DragEvent<HTMLButtonElement>, type: string) => {
		event.dataTransfer.setData("application/workflow-node-type", type);
		event.dataTransfer.effectAllowed = "move";
	};

	return (
		<div className="flex h-full w-52 shrink-0 flex-col gap-1 overflow-y-auto border-border border-r bg-background p-2">
			<p className="px-1 py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
				Nodes
			</p>
			{NODE_PALETTE.map((meta) => (
				<button
					key={meta.type}
					type="button"
					draggable
					onDragStart={(e) => onDragStart(e, meta.type)}
					className="flex cursor-grab flex-col gap-0.5 rounded-md border border-border bg-card px-3 py-2 text-left shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
					style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
				>
					<span className="font-medium text-sm">{meta.label}</span>
					<span className="line-clamp-2 text-muted-foreground text-xs">
						{meta.description}
					</span>
				</button>
			))}
		</div>
	);
};
