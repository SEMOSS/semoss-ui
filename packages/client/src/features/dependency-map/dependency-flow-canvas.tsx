import {
	Background,
	Controls,
	type EdgeMarker,
	MarkerType,
	ReactFlow,
	type ReactFlowInstance,
	type ReactFlowProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type KeyboardEvent, type ReactNode, useState } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
	useTheme,
} from "@semoss/ui/next";
import { DependencyEdge, type DependencyFlowEdge } from "./dependency-edge";
import { type DependencyFlowNode, DependencyNode } from "./dependency-node";

const nodeTypes = { dependency: DependencyNode };
const edgeTypes = { dependency: DependencyEdge };

/** What a right-click on a graph landed on. */
export type GraphMenuTarget =
	| { readonly kind: "node"; readonly id: string }
	| { readonly kind: "edge"; readonly id: string }
	| { readonly kind: "pane" };

/**
 * The arrow at a link's dependency end, in the colour the link is drawn in.
 *
 * @param color - A CSS colour, such as `var(--color-primary)`.
 * @returns The link's end marker.
 */
export const edgeMarker = (color: string): EdgeMarker => ({
	type: MarkerType.ArrowClosed,
	width: 16,
	height: 16,
	color,
});

/** Props for {@link DependencyFlowCanvas}. */
interface DependencyFlowCanvasProps
	extends Pick<
		ReactFlowProps<DependencyFlowNode, DependencyFlowEdge>,
		| "minZoom"
		| "fitView"
		| "fitViewOptions"
		| "defaultViewport"
		| "edgesFocusable"
		| "onlyRenderVisibleElements"
	> {
	/** The canvas's accessible name */
	"aria-label": string;
	/** The items, built and placed by the graph's owner */
	nodes: DependencyFlowNode[];
	/** The links, built by the graph's owner */
	edges: DependencyFlowEdge[];
	/** Selects an item, by pointer or Enter */
	onSelectNode: (id: string) => void;
	/** Runs when a link is clicked, or Enter pressed on a focused one */
	onSelectEdge?: (edge: DependencyFlowEdge) => void;
	/** Clears the selection, on a click on the empty canvas */
	onClearSelection: () => void;
	/** Hands the canvas's instance up, so its owner can centre and fit items */
	onInit: (
		instance: ReactFlowInstance<DependencyFlowNode, DependencyFlowEdge>,
	) => void;
	/**
	 * The right-click menu's items for what was right-clicked; null leaves the
	 * browser's own menu
	 */
	renderMenu: (target: GraphMenuTarget) => ReactNode;
	/** Overlays drawn on the canvas, each in a React Flow `Panel` */
	children?: ReactNode;
}

/**
 * The React Flow frame both dependency graphs draw in, the admin Ontology and
 * the Ontology tab: items are placed by their owner and never dragged or
 * connected, with the dot background, zoom controls and the page's colour
 * mode. A click, or Enter on a focused item or link, selects it.
 *
 * The right-click menu is the shared `ContextMenu` over the whole canvas. The
 * frame records what a right-click landed on (an item, a link, or the empty
 * canvas) in React Flow's context menu events, which run before the menu
 * opens, and the owner's `renderMenu` gives the items for that target. It
 * opens at the pointer, and from the keyboard with the context menu key or
 * Shift+F10 on a focused item; Escape closes it and returns focus.
 */
export const DependencyFlowCanvas = ({
	"aria-label": ariaLabel,
	nodes,
	edges,
	onSelectNode,
	onSelectEdge,
	onClearSelection,
	onInit,
	renderMenu,
	children,
	...flowProps
}: DependencyFlowCanvasProps) => {
	const { resolvedTheme } = useTheme();
	// what the last right-click landed on, so the menu shows its actions
	const [menuTarget, setMenuTarget] = useState<GraphMenuTarget>({
		kind: "pane",
	});
	const menuItems = renderMenu(menuTarget);

	// selection is the owner's: React Flow draws the items as given, and a
	// click, or Enter on a focused item or link, selects it
	const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
		if (event.key !== "Enter" || !(event.target instanceof Element)) {
			return;
		}
		const id = event.target.getAttribute("data-id");
		if (!id) {
			return;
		}
		if (event.target.classList.contains("react-flow__node")) {
			onSelectNode(id);
		} else if (event.target.classList.contains("react-flow__edge")) {
			const edge = edges.find((candidate) => candidate.id === id);
			if (edge) {
				onSelectEdge?.(edge);
			}
		}
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild disabled={!menuItems}>
				<section
					aria-label={ariaLabel}
					className="relative size-full min-h-0 overflow-hidden bg-background"
					onKeyDown={handleKeyDown}
				>
					<ReactFlow<DependencyFlowNode, DependencyFlowEdge>
						{...flowProps}
						nodes={nodes}
						edges={edges}
						nodeTypes={nodeTypes}
						edgeTypes={edgeTypes}
						onNodeClick={(_, node) => onSelectNode(node.id)}
						onEdgeClick={(_, edge) => onSelectEdge?.(edge)}
						onPaneClick={onClearSelection}
						onNodeContextMenu={(_, node) =>
							setMenuTarget({ kind: "node", id: node.id })
						}
						onEdgeContextMenu={(_, edge) =>
							setMenuTarget({ kind: "edge", id: edge.id })
						}
						onPaneContextMenu={() =>
							setMenuTarget({ kind: "pane" })
						}
						onInit={onInit}
						nodesDraggable={false}
						nodesConnectable={false}
						maxZoom={2}
						colorMode={resolvedTheme === "dark" ? "dark" : "light"}
						proOptions={{ hideAttribution: true }}
					>
						<Background gap={24} />
						<Controls
							showInteractive={false}
							className="overflow-hidden rounded-md border border-border"
						/>
						{children}
					</ReactFlow>
				</section>
			</ContextMenuTrigger>
			{menuItems ? (
				<ContextMenuContent className="w-56">
					{menuItems}
				</ContextMenuContent>
			) : null}
		</ContextMenu>
	);
};
