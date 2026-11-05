import {
	BaseEdge,
	type Edge,
	EdgeLabelRenderer,
	type EdgeProps,
} from "@xyflow/react";
import { X } from "lucide-react";

export interface DeletableEdgeData extends Record<string, unknown> {
	onDelete?: (edgeId: string) => void;
	readOnly?: boolean;
	hovered?: boolean;
	/** This edge's position among its source's other outgoing edges, so fanned-out
	 * branch/jev routes bend at different X positions instead of stacking on one line. */
	laneIndex?: number;
	laneCount?: number;
}

/**
 * Orthogonal (Manhattan) path matching the bpmn-js routing algorithm.
 *
 * Forward edges (tx >= sx): right → bend at laneX → left into target.
 * Backward edges (tx < sx): right → up above the flow → left → down into
 *   target, producing a visible arc instead of overlapping the forward edges.
 */
function buildOrthogonalPath(
	sx: number,
	sy: number,
	tx: number,
	ty: number,
	laneIndex: number,
	laneCount: number,
): [path: string, labelX: number, labelY: number] {
	// Backward edge: U-shape above the flow so loop-backs are clearly visible.
	if (tx < sx) {
		const BACK_PAD = 60;
		const LANE_STEP = 22;
		const laneY = Math.min(sy, ty) - BACK_PAD - laneIndex * LANE_STEP;
		const r = Math.min(
			4,
			Math.abs(sy - laneY) / 2,
			Math.abs(tx - sx) / 2,
			Math.abs(ty - laneY) / 2,
		);
		const h = Math.sign(tx - sx); // -1 (going left)
		const v1 = Math.sign(laneY - sy); // -1 (going up to lane)
		const v2 = Math.sign(ty - laneY); // +1 (going down from lane to target)
		const path = [
			`M ${sx} ${sy}`,
			`L ${sx} ${laneY - r * v1}`,
			`Q ${sx} ${laneY} ${sx + r * h} ${laneY}`,
			`L ${tx - r * h} ${laneY}`,
			`Q ${tx} ${laneY} ${tx} ${laneY + r * v2}`,
			`L ${tx} ${ty}`,
		].join(" ");
		return [path, (sx + tx) / 2, laneY];
	}

	// Direct horizontal line when source and target share the same Y.
	if (Math.abs(sy - ty) < 1) {
		return [`M ${sx} ${sy} L ${tx} ${ty}`, (sx + tx) / 2, sy];
	}

	// Forward edge: horizontal → vertical → horizontal.
	const dx = tx - sx;
	const baseLaneX = sx + Math.max(40, dx / 2);
	const spread =
		laneCount > 1
			? Math.min(36, Math.max(12, Math.abs(dx) / laneCount))
			: 0;
	const laneX = baseLaneX + (laneIndex - (laneCount - 1) / 2) * spread;
	const r = Math.min(
		4,
		Math.abs(laneX - sx) / 2,
		Math.abs(ty - sy) / 2,
		Math.abs(tx - laneX) / 2,
	);
	const h1 = Math.sign(laneX - sx);
	const v = Math.sign(ty - sy);
	const h2 = Math.sign(tx - laneX);
	const path = [
		`M ${sx} ${sy}`,
		`L ${laneX - r * h1} ${sy}`,
		`Q ${laneX} ${sy} ${laneX} ${sy + r * v}`,
		`L ${laneX} ${ty - r * v}`,
		`Q ${laneX} ${ty} ${laneX + r * h2} ${ty}`,
		`L ${tx} ${ty}`,
	].join(" ");
	return [path, laneX, (sy + ty) / 2];
}

/** Custom React Flow edge rendering a delete button at its midpoint. */
export function DeletableEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	style,
	markerEnd,
	data,
}: EdgeProps<Edge<DeletableEdgeData>>) {
	const laneCount = data?.laneCount ?? 1;
	const laneIndex = data?.laneIndex ?? 0;
	const [edgePath, labelX, labelY] = buildOrthogonalPath(
		sourceX,
		sourceY,
		targetX,
		targetY,
		laneIndex,
		laneCount,
	);

	return (
		<>
			<BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
			{!data?.readOnly && (
				<EdgeLabelRenderer>
					<button
						type="button"
						className="nodrag nopan pointer-events-auto absolute flex size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-opacity hover:border-destructive/50 hover:text-destructive"
						style={{
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
							opacity: data?.hovered ? 1 : 0,
						}}
						onClick={() => data?.onDelete?.(id)}
						aria-label="Remove connection"
					>
						<X className="size-3" aria-hidden />
					</button>
				</EdgeLabelRenderer>
			)}
		</>
	);
}
