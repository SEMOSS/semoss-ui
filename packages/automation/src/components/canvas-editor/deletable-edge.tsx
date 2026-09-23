import {
	BaseEdge,
	type Edge,
	EdgeLabelRenderer,
	type EdgeProps,
	getSmoothStepPath,
} from "@xyflow/react";
import { X } from "lucide-react";

export interface DeletableEdgeData extends Record<string, unknown> {
	onDelete: (edgeId: string) => void;
	readOnly?: boolean;
	hovered?: boolean;
}

/** Custom React Flow edge rendering a delete button at its midpoint. */
export function DeletableEdge({
	id,
	sourceX,
	sourceY,
	sourcePosition,
	targetX,
	targetY,
	targetPosition,
	style,
	markerEnd,
	data,
}: EdgeProps<Edge<DeletableEdgeData>>) {
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
			<BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
			<EdgeLabelRenderer>
				<button
					type="button"
					className={`nodrag nopan pointer-events-auto absolute size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-opacity hover:border-destructive/50 hover:text-destructive ${data?.readOnly ? "hidden" : "flex"}`}
					style={{
						transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
						opacity: data?.hovered ? 1 : 0,
					}}
					onClick={() => data?.onDelete(id)}
					aria-label="Remove connection"
				>
					<X className="size-3" />
				</button>
			</EdgeLabelRenderer>
		</>
	);
}
