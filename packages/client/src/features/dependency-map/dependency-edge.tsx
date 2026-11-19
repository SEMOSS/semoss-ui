import {
	BaseEdge,
	type Edge,
	type EdgeProps,
	getStraightPath,
	type ReactFlowState,
	useInternalNode,
	useStore,
} from "@xyflow/react";
import { memo } from "react";
import { cn } from "@semoss/ui/next";
import type { DependencyGraphEdge } from "@/api/dependency-map";
import { getEdgeParams } from "@/components/metamodel/utility";
import type { EdgeEmphasis } from "./dependency-graph";

/** What the canvas hands each edge. */
export interface DependencyEdgeData extends Record<string, unknown> {
	/** The link */
	edge: DependencyGraphEdge;
	/** How strongly to draw it */
	emphasis: EdgeEmphasis;
}

/** An edge on the Dependency Map. */
export type DependencyFlowEdge = Edge<DependencyEdgeData, "dependency">;

/** Below this zoom only highlighted links are drawn: the rest is a blur. */
const THIN_ZOOM = 0.2;

const isThinSelector = (state: ReactFlowState): boolean =>
	state.transform[2] < THIN_ZOOM;

/**
 * A link from the item that has the dependency to the item it depends on,
 * drawn between the two boxes' borders, with an arrow at the dependency.
 * Automatic links are solid and manual ones dashed; a link in a cycle is drawn
 * as a warning and an access gap as a problem. Clicking it opens its details
 * in the drawer; a hovered or selected link is drawn in the primary colour.
 */
export const DependencyEdge = memo(
	({
		id,
		source,
		target,
		data,
		selected,
		markerEnd,
	}: EdgeProps<DependencyFlowEdge>) => {
		const sourceNode = useInternalNode(source);
		const targetNode = useInternalNode(target);
		const isThin = useStore(isThinSelector);
		if (!sourceNode || !targetNode || !data) {
			return null;
		}
		const { edge, emphasis } = data;
		const isStrong = emphasis === "highlight" || emphasis === "gap";
		if (isThin && !isStrong && !selected) {
			return null;
		}
		const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
		const [path] = getStraightPath({
			sourceX: sx,
			sourceY: sy,
			targetX: tx,
			targetY: ty,
		});

		return (
			<BaseEdge
				id={id}
				path={path}
				markerEnd={markerEnd}
				interactionWidth={16}
				className={cn(
					"transition-opacity",
					emphasis === "gap"
						? "stroke-destructive"
						: emphasis === "highlight" || selected
							? "stroke-primary"
							: edge.inCycle
								? "stroke-warning"
								: "stroke-muted-foreground",
					// the edge's group is hovered over its wide hit area
					emphasis !== "gap" &&
						"[.react-flow__edge:hover_&]:stroke-primary",
					emphasis === "dimmed" && "opacity-15",
				)}
				style={{
					strokeWidth: isStrong || selected ? 2 : 1,
					// manual links are dashed, so automatic and manual differ without colour
					strokeDasharray: edge.isAutomatic ? undefined : "6 4",
				}}
			/>
		);
	},
);
DependencyEdge.displayName = "DependencyEdge";
