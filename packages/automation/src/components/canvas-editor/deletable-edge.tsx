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
	/** This edge's position among its source's other outgoing edges, so fanned-out
	 * branch/jev routes bend at different X positions instead of stacking on one line. */
	laneIndex?: number;
	laneCount?: number;
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
	const laneCount = data?.laneCount ?? 1;
	const laneIndex = data?.laneIndex ?? 0;
	let centerX: number | undefined;
	if (laneCount > 1) {
		const gap = targetX - sourceX;
		const spread = Math.min(28, Math.abs(gap) / (laneCount + 1));
		centerX =
			sourceX + gap / 2 + (laneIndex - (laneCount - 1) / 2) * spread;
	}
	const [edgePath, labelX, labelY] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		...(centerX !== undefined ? { centerX } : {}),
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
