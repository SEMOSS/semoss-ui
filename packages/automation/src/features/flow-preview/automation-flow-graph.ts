import { type Edge, MarkerType, type Node } from "@xyflow/react";
import type { DeletableEdgeData } from "../../components/canvas-editor/deletable-edge";
import { layoutFlowNodes } from "../../components/canvas-editor/flow-layout";
import type { AutomationFlow } from "./automation-flow.types";

export type AutomationPreviewNode = Node<
	{
		label: string;
		workflowType: string;
		inputPorts: string[];
		outputPorts: string[];
	},
	"preview"
>;

/** Maps only the public graph fields into inert React Flow nodes and edges. */
export function buildAutomationFlowGraph(workflow: AutomationFlow): {
	nodes: AutomationPreviewNode[];
	edges: Edge<DeletableEdgeData>[];
} {
	const laidOut = layoutFlowNodes(workflow.nodes, workflow.edges, () => ({
		width: 280,
		height: 72,
	}));
	const nodes: AutomationPreviewNode[] = laidOut.map((node, index) => ({
		id: node.id,
		type: "preview",
		position: {
			x: workflow.nodes[index].position?.x ?? node.position.x,
			y: workflow.nodes[index].position?.y ?? node.position.y,
		},
		data: {
			label: node.label,
			workflowType: node.type,
			inputPorts: [
				...new Set(
					workflow.edges
						.filter((edge) => edge.target === node.id)
						.map((edge) => edge.targetPort),
				),
			],
			outputPorts: [
				...new Set(
					workflow.edges
						.filter((edge) => edge.source === node.id)
						.map((edge) => edge.sourcePort),
				),
			],
		},
		draggable: false,
		connectable: false,
		selectable: false,
		deletable: false,
		focusable: false,
	}));
	const edges: Edge<DeletableEdgeData>[] = workflow.edges.map(
		(edge, index) => ({
			id: `preview-edge-${index}`,
			type: "preview",
			source: edge.source,
			target: edge.target,
			sourceHandle: edge.sourcePort,
			targetHandle: edge.targetPort,
			selectable: false,
			deletable: false,
			focusable: false,
			reconnectable: false,
			data: { readOnly: true },
			style: { stroke: "var(--muted-foreground)", strokeWidth: 1.5 },
			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: "var(--muted-foreground)",
			},
		}),
	);
	return { nodes, edges };
}
