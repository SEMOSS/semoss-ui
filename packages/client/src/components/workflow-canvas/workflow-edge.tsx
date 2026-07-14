import {
	BaseEdge,
	EdgeLabelRenderer,
	type EdgeProps,
	getSmoothStepPath,
	useReactFlow,
} from "@xyflow/react";
import { X } from "lucide-react";

export function WorkflowEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
}: EdgeProps) {
	const { deleteElements } = useReactFlow();
	const [edgePath, labelX, labelY] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	return (
		<>
			<BaseEdge id={id} path={edgePath} style={{ strokeWidth: 1.5 }} />
			<EdgeLabelRenderer>
				<div
					className="nodrag nopan pointer-events-auto absolute"
					style={{
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
					}}
				>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							deleteElements({ edges: [{ id }] });
						}}
						className="flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground/40 shadow-sm transition-colors hover:border-destructive hover:text-destructive"
						title="Delete connection"
					>
						<X className="h-2.5 w-2.5" />
					</button>
				</div>
			</EdgeLabelRenderer>
		</>
	);
}
