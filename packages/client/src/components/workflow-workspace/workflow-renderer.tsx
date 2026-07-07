import {
	Background,
	BackgroundVariant,
	Controls,
	MiniMap,
	type Node,
	ReactFlow,
} from "@xyflow/react";
import { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";
import { useRootStore } from "@/hooks";
import type {
	WorkflowDocument,
	WorkflowGraph,
} from "@/pages/workflow/workflow.types";
import { WorkflowNodeCard, type WorkflowNodeData } from "./nodes/node-card";
import { toRFEdge, toRFNode } from "./workflow-utils";

// ─── read-only view of the workflow canvas ────────────────────────────────────

interface WorkflowRendererProps {
	appId: string;
}

export function WorkflowRenderer({ appId }: WorkflowRendererProps) {
	const { monolithStore } = useRootStore();
	const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>([]);
	const [edges, setEdges] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		monolithStore
			.runQuery<[WorkflowDocument]>(`GetWorkflow(project="${appId}")`)
			.then((res) => {
				const doc = res.pixelReturn[0]
					.output as WorkflowDocument | null;
				const graph: WorkflowGraph = doc?.graph ?? {
					nodes: [],
					edges: [],
				};
				const noop = () => {};
				setNodes(graph.nodes.map((wn) => toRFNode(wn, noop)));
				setEdges(graph.edges.map(toRFEdge));
			})
			.finally(() => setLoading(false));
		// biome-ignore lint/correctness/useExhaustiveDependencies: mount only
	}, [appId]);

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="h-full w-full">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={{ workflowNode: WorkflowNodeCard }}
				fitView
				nodesDraggable={false}
				nodesConnectable={false}
				elementsSelectable={false}
				proOptions={{ hideAttribution: true }}
			>
				<Background
					variant={BackgroundVariant.Dots}
					gap={16}
					size={1}
					className="opacity-30"
				/>
				<Controls showInteractive={false} />
				<MiniMap zoomable pannable className="rounded-md border" />
			</ReactFlow>
		</div>
	);
}
