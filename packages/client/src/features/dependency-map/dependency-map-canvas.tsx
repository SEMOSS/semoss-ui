import {
	Background,
	Controls,
	MarkerType,
	MiniMap,
	ReactFlow,
	type ReactFlowInstance,
	type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type KeyboardEvent, type ReactNode, useMemo } from "react";
import { useIsMobile, useTheme } from "@semoss/ui/next";
import type { UserCatalogAccess } from "@/api/dependency-map";
import { DependencyEdge, type DependencyFlowEdge } from "./dependency-edge";
import {
	DEPENDENCY_FAMILIES,
	type DependencyGraphIndex,
	type MapEmphasis,
} from "./dependency-graph";
import { type DependencyFlowNode, DependencyNode } from "./dependency-node";

const nodeTypes = { dependency: DependencyNode };
const edgeTypes = { dependency: DependencyEdge };

const EDGE_MARKER_COLORS = {
	normal: "var(--color-muted-foreground)",
	dimmed: "var(--color-muted-foreground)",
	highlight: "var(--color-primary)",
	gap: "var(--color-destructive)",
} as const;

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
	/** Overlays drawn on the canvas, each in a React Flow `Panel` */
	children?: ReactNode;
}

/**
 * The Dependency Map's canvas: every item where the backend placed it, its
 * links, a minimap coloured by type, zoom controls, and the overlays the map
 * hands it (the view bar, the legend, empty states). Only what is on screen is
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
	children,
}: DependencyMapCanvasProps) => {
	const { resolvedTheme } = useTheme();
	// a phone's canvas is too small to give room to an overview
	const isMobile = useIsMobile();

	// thousands of objects: rebuild them only when what they draw changes
	const nodes = useMemo(
		(): DependencyFlowNode[] =>
			index.graph.nodes.map((node) => ({
				id: node.id,
				type: "dependency",
				position: { x: node.x, y: node.y },
				selected: node.id === selectedId,
				ariaLabel: `${node.name}${node.missing ? ", deleted" : ""}`,
				data: {
					node,
					emphasis: emphasis.nodes.get(node.id) ?? "normal",
					access: access ? (access.get(node.id) ?? null) : undefined,
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
					markerEnd: {
						type: MarkerType.ArrowClosed,
						width: 16,
						height: 16,
						color: EDGE_MARKER_COLORS[edgeEmphasis],
					},
					data: { edge, emphasis: edgeEmphasis },
				};
			}),
		[index, emphasis, selectedEdgeId],
	);

	// selection is the page's: React Flow measures and draws the nodes as
	// given, and a click, or Enter on a focused item or link, selects it
	const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
		if (event.key !== "Enter") {
			return;
		}
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}
		const id = target.getAttribute("data-id");
		if (!id) {
			return;
		}
		if (target.classList.contains("react-flow__node")) {
			onSelectNode(id);
		} else if (target.classList.contains("react-flow__edge")) {
			onSelectEdge(id);
		}
	};

	return (
		<section
			aria-label="Dependency map canvas"
			className="relative size-full min-h-0 overflow-hidden bg-background"
			onKeyDown={handleKeyDown}
		>
			<ReactFlow<DependencyFlowNode, DependencyFlowEdge>
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodeClick={(_, node) => onSelectNode(node.id)}
				onEdgeClick={(_, edge) => onSelectEdge(edge.id)}
				onPaneClick={onClearSelection}
				onInit={onInit}
				nodesDraggable={false}
				nodesConnectable={false}
				edgesFocusable={true}
				onlyRenderVisibleElements={true}
				minZoom={0.05}
				maxZoom={2}
				fitView={defaultViewport === undefined}
				defaultViewport={defaultViewport}
				fitViewOptions={{ padding: 0.1 }}
				colorMode={resolvedTheme === "dark" ? "dark" : "light"}
				proOptions={{ hideAttribution: true }}
			>
				<Background gap={24} />
				<Controls
					showInteractive={false}
					className="overflow-hidden rounded-md border border-border"
				/>
				{isMobile ? null : (
					<MiniMap<DependencyFlowNode>
						pannable={true}
						zoomable={true}
						ariaLabel="Dependency map overview"
						className="rounded-md border border-border bg-card"
						nodeColor={(flowNode) =>
							flowNode.data.node.missing
								? "var(--color-destructive)"
								: DEPENDENCY_FAMILIES[
										index.families.get(flowNode.id) ??
											"DATA"
									].color
						}
					/>
				)}
				{children}
			</ReactFlow>
		</section>
	);
};
