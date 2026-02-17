import {
	BaseEdge,
	EdgeLabelRenderer,
	type EdgeProps,
	getBezierPath,
} from "@xyflow/react";
import { cn } from "@semoss/ui/next";

// ─── Default edge (for "next" connections) ───────────────────────
export function DefaultEdge(props: EdgeProps) {
	const {
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		markerEnd,
	} = props;

	const [edgePath] = getBezierPath({
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
	});

	return (
		<BaseEdge
			path={edgePath}
			markerEnd={markerEnd}
			style={{ stroke: "#94a3b8", strokeWidth: 2 }}
		/>
	);
}

// ─── Conditional edge (for ifTrue / ifFalse) ────────────────────
export interface ConditionalEdgeData {
	condition: "ifTrue" | "ifFalse";
	[key: string]: unknown;
}

export function ConditionalEdge(props: EdgeProps) {
	const {
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		markerEnd,
		data,
	} = props;

	const edgeData = data as unknown as ConditionalEdgeData | undefined;
	const condition = edgeData?.condition ?? "ifTrue";
	const isTrue = condition === "ifTrue";

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
	});

	return (
		<>
			<BaseEdge
				path={edgePath}
				markerEnd={markerEnd}
				style={{
					stroke: isTrue ? "#22c55e" : "#ef4444",
					strokeWidth: 2,
				}}
			/>
			<EdgeLabelRenderer>
				<div
					className={cn(
						"pointer-events-none absolute rounded px-1.5 py-0.5 font-semibold text-[10px] text-white",
						isTrue ? "bg-green-500" : "bg-red-500",
					)}
					style={{
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
					}}
				>
					{isTrue ? "True" : "False"}
				</div>
			</EdgeLabelRenderer>
		</>
	);
}
