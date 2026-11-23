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
import { Lock, PencilLine, Undo2, X } from "lucide-react";
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

/**
 * What a link says about itself at its midpoint, outside edit mode too: a
 * pencil on a manual link and a lock on an automatic one, each naming the
 * link in its tooltip (the manual name, or the automatic role), so the two
 * kinds differ by more than the line's dashes. A manual link whose name
 * stops the save is drawn as a problem.
 */
export type DependencyEdgeMarker =
	| {
			readonly kind: "manual";
			/** The name a user gave it, or null for none */
			readonly name: string | null;
			/** What stops it being saved, such as a name another link has */
			readonly problem?: string;
	  }
	| {
			readonly kind: "automatic";
			/** What it says, such as "Automatic: Judge model" */
			readonly label: string;
	  };

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
	/** What it says about itself at its midpoint, beside the control */
	marker?: DependencyEdgeMarker;
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
 * A link can say what it is at its midpoint ({@link DependencyEdgeMarker}),
 * and while links are edited carry a control there
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
		const { edge, emphasis, action, marker } = data;
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
		// an edit control on an automatic link is its lock, so the marker's
		// own lock is left out beside it
		const shownMarker =
			marker?.kind === "automatic" && action?.kind === "locked"
				? undefined
				: marker;
		// a mark only, as small as the lock: a line has no room for a name, so
		// a manual link's name is in its tooltip and the drawer's Configuration section
		const markerLabel = !shownMarker
			? ""
			: shownMarker.kind === "automatic"
				? shownMarker.label
				: [
						shownMarker.problem,
						`Manual: ${shownMarker.name ?? "No name"}`,
					]
						.filter(Boolean)
						.join(". ");
		const MarkerIcon = shownMarker?.kind === "manual" ? PencilLine : Lock;
		const markerNode = shownMarker ? (
			<MapTooltip label={markerLabel}>
				<span
					role="img"
					aria-label={markerLabel}
					className={cn(
						"flex size-5 items-center justify-center rounded-full border",
						shownMarker.kind === "manual"
							? shownMarker.problem
								? "border-destructive bg-background text-destructive"
								: "border-dashed bg-background text-muted-foreground"
							: "bg-muted text-muted-foreground",
						emphasis === "dimmed" && "opacity-40",
					)}
				>
					<MarkerIcon className="size-3" aria-hidden="true" />
				</span>
			</MapTooltip>
		) : null;

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
				{(action && ActionIcon) || markerNode ? (
					<EdgeLabelRenderer>
						{/* nodrag and nopan keep a press on the control off the canvas */}
						<div
							className="nodrag nopan pointer-events-auto absolute flex items-center gap-1"
							style={{
								transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
							}}
						>
							{markerNode}
							{action && ActionIcon ? (
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
							) : null}
						</div>
					</EdgeLabelRenderer>
				) : null}
			</>
		);
	},
);
DependencyEdge.displayName = "DependencyEdge";
