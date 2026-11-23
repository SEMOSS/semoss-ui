import type { ReactFlowInstance, Viewport } from "@xyflow/react";
import { type ReactNode, useMemo } from "react";
import type { UserCatalogAccess } from "@/api/dependency-map";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";
import type { DependencyFlowEdge } from "./dependency-edge";
import {
	DependencyFlowCanvas,
	edgeMarker,
	type GraphMenuTarget,
} from "./dependency-flow-canvas";
import {
	ACCESS_LEVEL_LABELS,
	type DependencyGraphIndex,
	type MapEmphasis,
} from "./dependency-graph";
import type {
	DependencyFlowNode,
	DependencyNodeStatus,
} from "./dependency-node";

const EDGE_MARKER_COLORS = {
	normal: "var(--color-muted-foreground)",
	dimmed: "var(--color-muted-foreground)",
	highlight: "var(--color-primary)",
	gap: "var(--color-destructive)",
} as const;

/**
 * The badge a node shows for the picked user's access in User Access.
 *
 * @param access - Their access to the item, or null for none.
 * @returns The node's status.
 */
const toAccessStatus = (
	access: UserCatalogAccess | null,
): DependencyNodeStatus =>
	access
		? {
				label: ACCESS_LEVEL_LABELS[access.permission],
				variant: "secondary",
			}
		: { label: "No access", variant: "outline" };

interface DependencyMapCanvasProps {
	/** The network */
	index: DependencyGraphIndex;
	/** How strongly to draw each node and edge */
	emphasis: MapEmphasis;
	/** The picked user's access, or null when the User Access lens is off */
	access: ReadonlyMap<string, UserCatalogAccess> | null;
	/** The selected item */
	selectedId: string;
	/** The selected link */
	selectedEdgeId: string;
	/** Selects an item, by pointer or keyboard */
	onSelectNode: (id: string) => void;
	/** Selects a link, by pointer or keyboard */
	onSelectEdge: (id: string) => void;
	/** Clears the selection */
	onClearSelection: () => void;
	/** Hands the canvas's instance up, so search can center on an item */
	onInit: (
		instance: ReactFlowInstance<DependencyFlowNode, DependencyFlowEdge>,
	) => void;
	/** Where to start, such as the view kept from before the map expanded; fits the network when left out */
	defaultViewport?: Viewport;
	/** The right-click menu's items for what was right-clicked */
	renderMenu: (target: GraphMenuTarget) => ReactNode;
	/** Overlays drawn on the canvas, each in a React Flow `Panel` */
	children?: ReactNode;
}

/**
 * The Dependency Map's canvas: every item where the backend placed it, its
 * links, zoom controls, and the overlays the map hands it (the view bar, the
 * legend, empty states). Only what is on screen is
 * rendered, so large networks stay responsive.
 */
export const DependencyMapCanvas = ({
	index,
	emphasis,
	access,
	selectedId,
	selectedEdgeId,
	onSelectNode,
	onSelectEdge,
	onClearSelection,
	onInit,
	defaultViewport,
	renderMenu,
	children,
}: DependencyMapCanvasProps) => {
	// thousands of objects: rebuild them only when what they draw changes
	const nodes = useMemo(
		(): DependencyFlowNode[] =>
			index.graph.nodes.map((node) => ({
				id: node.id,
				type: "dependency",
				position: { x: node.x, y: node.y },
				// a fixed size, so fitting and centring never wait on measuring
				width: index.graph.nodeSize.width,
				height: index.graph.nodeSize.height,
				selected: node.id === selectedId,
				ariaLabel: `${node.name}, ${getDependencyTypeConfig(node.type).label}${node.missing ? ", deleted" : ""}`,
				data: {
					node,
					emphasis: emphasis.nodes.get(node.id) ?? "normal",
					status: access
						? toAccessStatus(access.get(node.id) ?? null)
						: undefined,
				},
			})),
		[index, emphasis, access, selectedId],
	);

	const edges = useMemo(
		(): DependencyFlowEdge[] =>
			[...index.edges.values()].map((edge) => {
				const edgeEmphasis = emphasis.edges.get(edge.id) ?? "normal";
				const sourceName =
					index.nodes.get(edge.source)?.name ?? edge.source;
				const targetName =
					index.nodes.get(edge.target)?.name ?? edge.target;
				return {
					id: edge.id,
					type: "dependency",
					source: edge.source,
					target: edge.target,
					selected: edge.id === selectedEdgeId,
					ariaLabel: `${sourceName} uses ${targetName}`,
					// draw highlighted links over the rest
					zIndex:
						edgeEmphasis === "highlight" || edgeEmphasis === "gap"
							? 1
							: 0,
					markerEnd: edgeMarker(EDGE_MARKER_COLORS[edgeEmphasis]),
					data: { edge, emphasis: edgeEmphasis },
				};
			}),
		[index, emphasis, selectedEdgeId],
	);

	return (
		<DependencyFlowCanvas
			aria-label="Ontology canvas"
			nodes={nodes}
			edges={edges}
			onSelectNode={onSelectNode}
			onSelectEdge={(edge) => onSelectEdge(edge.id)}
			onClearSelection={onClearSelection}
			onInit={onInit}
			renderMenu={renderMenu}
			edgesFocusable={true}
			onlyRenderVisibleElements={true}
			minZoom={0.05}
			fitView={defaultViewport === undefined}
			defaultViewport={defaultViewport}
			fitViewOptions={{ padding: 0.1 }}
		>
			{children}
		</DependencyFlowCanvas>
	);
};
