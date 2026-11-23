import type { ReactFlowInstance } from "@xyflow/react";
import { Plus, Trash2 } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import type {
	DependencyEdgeAction,
	DependencyEdgeMarker,
	DependencyFlowEdge,
} from "@/features/dependency-map/dependency-edge";
import {
	DependencyFlowCanvas,
	edgeMarker,
	type GraphMenuTarget,
} from "@/features/dependency-map/dependency-flow-canvas";
import type { DependencyFlowNode } from "@/features/dependency-map/dependency-node";
import {
	getDependencyAccessLabel,
	getDependencyRoleLabel,
	getDependencyTypeConfig,
} from "./catalog-dependency";
import { type DraftLink, getOwnDraftLink } from "./catalog-dependency-draft";
import {
	type DependencyGraphView,
	GRAPH_NODE_SIZE,
	getGraphBounds,
} from "./catalog-dependency-graph";
import { getDependencyAccessStatus } from "./dependency-access-status";
import {
	FIT_VIEW_OPTIONS,
	FitViewOnChange,
	MIN_ZOOM,
} from "./fit-view-on-change";

/** The owner's links while they are edited on the canvas. */
export interface CanvasEditState {
	/** The draft's manual links, by target id */
	readonly links: ReadonlyMap<string, DraftLink>;
	/** Marks a manual link for removal */
	readonly onRemove: (id: string) => void;
	/** Brings back a link marked for removal */
	readonly onRestore: (id: string) => void;
	/** What stops the save, by target id, such as a name another link has */
	readonly problems: ReadonlyMap<string, string>;
}

/** Props for {@link CatalogDependencyCanvas}. */
interface CatalogDependencyCanvasProps {
	/** What to draw, placed */
	view: DependencyGraphView;
	/** The owner's id */
	rootId: string;
	/** The selected item, or an empty string */
	selectedId: string;
	/** The search's matches, ringed on the canvas */
	matchIds: ReadonlySet<string>;
	/** Selects an item, by pointer or keyboard */
	onSelect: (id: string) => void;
	/** Clears the selection */
	onClearSelection: () => void;
	/** Shows the items one link further out from an item */
	onExpand: (id: string) => void;
	/** Hands the canvas's instance up, so the view can centre and fit items */
	onInit: (
		instance: ReactFlowInstance<DependencyFlowNode, DependencyFlowEdge>,
	) => void;
	/** The right-click menu's items for what was right-clicked */
	renderMenu: (target: GraphMenuTarget) => ReactNode;
	/**
	 * The owner's links while they are edited: each of its links carries a
	 * control at its midpoint, and new and removed targets say so
	 */
	edit?: CanvasEditState;
	/** Overlays drawn on the canvas, each in a React Flow `Panel` */
	children?: ReactNode;
}

/**
 * The Ontology tab's canvas: the owner in the middle, what uses it to the
 * left and what it uses to the right, each item with the user's access, and a
 * "+N" on any item the view stops at. Items are placed by the graph model and
 * never dragged; a click, or Enter on a focused item, selects it. The view
 * fits again whenever the items shown change. While the owner's links are
 * edited, each manual link has Remove (or Undo once removed) at its
 * midpoint, and a click on a manual link opens its target. The owner's own
 * links always say what they are at their midpoint: a manual link its name,
 * an automatic one a lock naming its role.
 */
export const CatalogDependencyCanvas = ({
	view,
	rootId,
	selectedId,
	matchIds,
	onSelect,
	onClearSelection,
	onExpand,
	onInit,
	renderMenu,
	edit,
	children,
}: CatalogDependencyCanvasProps) => {
	const nodes = useMemo(
		(): DependencyFlowNode[] =>
			view.nodes.map((node) => {
				const typeLabel = getDependencyTypeConfig(node.type).label;
				const draftLink = getOwnDraftLink(node, edit?.links ?? null);
				const status = draftLink?.isRemoved
					? {
							label: "Removed",
							variant: "outline" as const,
							icon: Trash2,
						}
					: draftLink?.isNew
						? {
								label: "New",
								variant: "secondary" as const,
								icon: Plus,
							}
						: node.access
							? getDependencyAccessStatus(node.access, {
									isCompact: true,
								})
							: undefined;
				return {
					id: node.id,
					type: "dependency",
					position: { x: node.x, y: node.y },
					// a fixed size, so the canvas never waits on measuring it
					width: GRAPH_NODE_SIZE.width,
					height: GRAPH_NODE_SIZE.height,
					selected: node.id === selectedId,
					ariaLabel: [
						node.name,
						node.hiddenCount === undefined ? typeLabel : null,
						node.id === rootId ? "this item" : null,
						draftLink?.isNew || draftLink?.isRemoved
							? (status?.label ?? null)
							: node.access
								? getDependencyAccessLabel(node.access)
								: null,
					]
						.filter(Boolean)
						.join(", "),
					data: {
						node,
						emphasis:
							node.id === rootId
								? "root"
								: draftLink?.isRemoved
									? "dimmed"
									: matchIds.has(node.id)
										? "match"
										: "normal",
						status,
						caption:
							node.hiddenCount === undefined
								? undefined
								: "Items you can't view",
						isPrivate: node.isPrivate,
						// editing shows the direct links only, so nothing further opens
						hiddenChildren: edit ? 0 : node.hiddenChildren,
						hiddenSide: node.side === "USED_BY" ? "left" : "right",
						onExpand,
					},
				};
			}),
		[view, rootId, selectedId, matchIds, onExpand, edit],
	);

	const edges = useMemo(
		(): DependencyFlowEdge[] =>
			view.edges.map((edge) => {
				const isHighlighted =
					selectedId !== "" &&
					(edge.source === selectedId || edge.target === selectedId);
				const isOwnerLink = edge.source === rootId;
				const isOwnLink = edit !== undefined && isOwnerLink;
				const draftLink = isOwnLink
					? edit.links.get(edge.target)
					: undefined;
				const roleLabel = getDependencyRoleLabel(edge.role);
				// the owner's own links say what they are; links further out
				// keep to the line, so the canvas stays clear
				const marker: DependencyEdgeMarker | undefined = !isOwnerLink
					? undefined
					: edge.isAutomatic
						? {
								kind: "automatic",
								label: `Automatic: ${roleLabel}`,
							}
						: {
								kind: "manual",
								name: edge.name,
								problem: edit?.problems.get(edge.target),
							};
				const action: DependencyEdgeAction | undefined = !isOwnLink
					? undefined
					: edge.isAutomatic
						? {
								kind: "locked",
								label: `Automatic: ${roleLabel}. Change it in the configuration`,
							}
						: draftLink?.isRemoved
							? {
									kind: "restore",
									label: "Undo Removal",
									onClick: () => edit.onRestore(edge.target),
								}
							: {
									kind: "remove",
									label: "Remove Dependency",
									onClick: () => edit.onRemove(edge.target),
								};
				return {
					id: edge.id,
					type: "dependency",
					source: edge.source,
					target: edge.target,
					focusable: false,
					selectable: false,
					zIndex: isHighlighted ? 1 : 0,
					markerEnd: edgeMarker(
						isHighlighted
							? "var(--color-primary)"
							: "var(--color-muted-foreground)",
					),
					data: {
						edge,
						emphasis: draftLink?.isRemoved
							? "dimmed"
							: isHighlighted
								? "highlight"
								: "normal",
						action,
						marker,
					},
				};
			}),
		[view, selectedId, rootId, edit],
	);

	// the area the items shown cover: when it changes, the view fits it again
	const bounds = getGraphBounds(view);

	return (
		<DependencyFlowCanvas
			aria-label="Dependency graph"
			nodes={nodes}
			edges={edges}
			onSelectNode={onSelect}
			onSelectEdge={(edge) => {
				// a manual link of the owner opens its target in the drawer
				if (
					edit &&
					edge.source === rootId &&
					edit.links.has(edge.target)
				) {
					onSelect(edge.target);
				}
			}}
			onClearSelection={onClearSelection}
			onInit={onInit}
			renderMenu={renderMenu}
			edgesFocusable={false}
			minZoom={MIN_ZOOM}
			fitView={true}
			fitViewOptions={FIT_VIEW_OPTIONS}
		>
			<FitViewOnChange bounds={bounds} />
			{children}
		</DependencyFlowCanvas>
	);
};
