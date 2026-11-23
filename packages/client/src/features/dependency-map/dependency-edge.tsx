import {
	BaseEdge,
	type Edge,
	EdgeLabelRenderer,
	type EdgeProps,
	getStraightPath,
	type ReactFlowState,
	useInternalNode,
	useStore,
} from "@xyflow/react";
import { Lock, Undo2, X } from "lucide-react";
import { memo } from "react";
import { Button, cn } from "@semoss/ui/next";
import type { DependencyGraphEdge } from "@/api/dependency-map";
import { getEdgeParams } from "@/components/metamodel/utility";
import type { EdgeEmphasis } from "./dependency-graph";
import { MapTooltip } from "./map-tooltip";

/**
 * A control at a link's midpoint while links are edited: remove a manual link,
 * bring back one marked for removal, or a lock on an automatic one, which
 * only its owner's configuration changes.
 */
export interface DependencyEdgeAction {
	/** What the control does */
	readonly kind: "remove" | "restore" | "locked";
	/** Its name, read by screen readers and shown in its tooltip */
	readonly label: string;
	/** Runs it; a lock has none */
	readonly onClick?: () => void;
}

const ACTION_ICONS = { remove: X, restore: Undo2, locked: Lock } as const;

/** What the canvas hands each edge. */
export interface DependencyEdgeData extends Record<string, unknown> {
	/** The link */
	edge: Pick<DependencyGraphEdge, "isAutomatic"> & {
		/** Whether it is part of a cycle, drawn as a warning */
		inCycle?: boolean;
	};
	/** How strongly to draw it */
	emphasis: EdgeEmphasis;
	/** A control at its midpoint, while links are edited */
	action?: DependencyEdgeAction;
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
 * While links are edited, a link can carry a control at its midpoint
 * ({@link DependencyEdgeAction}).
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
		const { edge, emphasis, action } = data;
		const isStrong = emphasis === "highlight" || emphasis === "gap";
		if (isThin && !isStrong && !selected) {
			return null;
		}
		const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
		const [path, labelX, labelY] = getStraightPath({
			sourceX: sx,
			sourceY: sy,
			targetX: tx,
			targetY: ty,
		});

		const ActionIcon = action ? ACTION_ICONS[action.kind] : null;

		return (
			<>
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
				{action && ActionIcon ? (
					<EdgeLabelRenderer>
						{/* nodrag and nopan keep a press on the control off the canvas */}
						<div
							className="nodrag nopan pointer-events-auto absolute"
							style={{
								transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
							}}
						>
							<MapTooltip label={action.label}>
								{action.onClick ? (
									<Button
										type="button"
										size="icon-sm"
										variant="outline"
										aria-label={action.label}
										className={cn(
											"size-6 rounded-full bg-background shadow-xs",
											action.kind === "remove" &&
												"hover:border-destructive hover:text-destructive",
										)}
										onClick={(event) => {
											event.stopPropagation();
											action.onClick?.();
										}}
									>
										<ActionIcon aria-hidden="true" />
									</Button>
								) : (
									<span
										role="img"
										aria-label={action.label}
										className="flex size-6 items-center justify-center rounded-full border bg-muted text-muted-foreground"
									>
										<ActionIcon
											className="size-3"
											aria-hidden="true"
										/>
									</span>
								)}
							</MapTooltip>
						</div>
					</EdgeLabelRenderer>
				) : null}
			</>
		);
	},
);
DependencyEdge.displayName = "DependencyEdge";
