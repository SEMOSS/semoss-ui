import { Background, ReactFlow } from "@xyflow/react";
import { useMemo, useRef } from "react";
import { P } from "@semoss/ui/next";
import { DeletableEdge } from "../../components/canvas-editor/deletable-edge";
import type { AutomationFlow } from "./automation-flow.types";
import { AutomationFlowControls } from "./automation-flow-controls";
import { buildAutomationFlowGraph } from "./automation-flow-graph";
import { AutomationFlowNode } from "./automation-flow-node";
import "@xyflow/react/dist/style.css";

export type { AutomationFlow } from "./automation-flow.types";

export interface AutomationFlowPreviewProps {
	/** Safe graph projection supplied by the same server definition that executes. */
	workflow: AutomationFlow;
}

const nodeTypes = { preview: AutomationFlowNode };
const edgeTypes = { preview: DeletableEdge };

/** Read-only workflow diagram requiring no Automation project or execution context. */
export function AutomationFlowPreview({
	workflow,
}: AutomationFlowPreviewProps) {
	const { nodes, edges } = useMemo(
		() => buildAutomationFlowGraph(workflow),
		[workflow],
	);
	const containerRef = useRef<HTMLElement>(null);
	const labels = new Map(workflow.nodes.map((node) => [node.id, node.label]));
	if (nodes.length === 0) {
		return (
			<P className="flex h-80 items-center justify-center text-muted-foreground text-sm">
				No flow is available for this routine.
			</P>
		);
	}
	return (
		<div className="space-y-3">
			<section
				ref={containerRef}
				className="h-80 w-full min-w-0 overflow-hidden rounded-lg border border-border sm:h-96"
				aria-label="Routine workflow graph"
			>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
					onInit={(flow) => {
						const start =
							nodes.find(
								(node) =>
									node.data.workflowType === "trigger.start",
							) ?? nodes[0];
						const height =
							containerRef.current?.clientHeight ?? 320;
						void flow.setViewport({
							x: 24 - start.position.x * 0.85,
							y: height / 2 - (start.position.y + 36) * 0.85,
							zoom: 0.85,
						});
					}}
					minZoom={0.1}
					maxZoom={2}
					nodesDraggable={false}
					nodesConnectable={false}
					nodesFocusable={false}
					edgesFocusable={false}
					edgesReconnectable={false}
					elementsSelectable={false}
					deleteKeyCode={null}
					selectionKeyCode={null}
					multiSelectionKeyCode={null}
					connectOnClick={false}
					zoomOnDoubleClick={false}
					proOptions={{ hideAttribution: true }}
				>
					<Background
						gap={16}
						className="bg-muted/20!"
						color="var(--border)"
					/>
					<AutomationFlowControls />
				</ReactFlow>
			</section>
			<details className="text-sm">
				<summary className="w-fit cursor-pointer rounded-sm py-1 text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">
					Flow as text
				</summary>
				<ul className="mt-2 space-y-1 text-foreground">
					{workflow.nodes.map((node) => {
						const next = workflow.edges.filter(
							(edge) => edge.source === node.id,
						);
						return (
							<li key={node.id} className="break-words">
								{node.label}
								{next.length
									? ` → ${next.map((edge) => labels.get(edge.target) ?? edge.target).join(", ")}`
									: " (end)"}
							</li>
						);
					})}
				</ul>
			</details>
		</div>
	);
}
