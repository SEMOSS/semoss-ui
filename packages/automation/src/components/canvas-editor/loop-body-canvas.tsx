import {
	Background,
	BackgroundVariant,
	type Node,
	ReactFlow,
	type ReactFlowInstance,
	ReactFlowProvider,
	useNodesState,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import type { AutomationNodeBody } from "../../domain/automation.types";
import { getAutomationNodeDefinition } from "../../domain/automation-node-catalog";
import type { AutomationWorkflowNodeType } from "../../domain/automation-workflow.types";
import { createCanvasWorkflowNode } from "../../domain/automation-workflow-adapter";
import { AddNodeMenu } from "./add-node-menu";
import type { LoopBodyCanvasNodeData } from "./loop-body-canvas.types";
import {
	insertLoopBodyNode,
	type LoopBodyInsertionPoint,
} from "./loop-body-graph";
import { LoopBodyBranchNode } from "./nodes/loop-body-branch-node";
import { LoopBodyStepNode } from "./nodes/loop-body-step-node";

const loopBodyNodeTypes = {
	step: LoopBodyStepNode,
	branch: LoopBodyBranchNode,
} as const;

interface LoopBodyCanvasProps {
	body: AutomationNodeBody;
	loopOutputVar: string;
	selectedNodeId?: string | null;
	readOnly?: boolean;
	className?: string;
	onBodyChange: (body: AutomationNodeBody) => void;
	onNodeSelect?: (nodeId: string) => void;
}

function canAddToLoop(type: AutomationWorkflowNodeType): boolean {
	if (type === "trigger.start" || type === "control.loop") return false;
	return getAutomationNodeDefinition(type)?.category !== "agent";
}

/** Nested graph editor used by an expanded loop container and its inspector. */
export function LoopBodyCanvas({
	body,
	loopOutputVar,
	selectedNodeId = null,
	readOnly = false,
	className,
	onBodyChange,
	onNodeSelect,
}: LoopBodyCanvasProps) {
	const instanceRef = useRef<Pick<
		ReactFlowInstance<Node<LoopBodyCanvasNodeData>>,
		"fitView"
	> | null>(null);
	const [insertionPoint, setInsertionPoint] =
		useState<LoopBodyInsertionPoint | null>(null);
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const connectedSourceHandles = useMemo(
		() =>
			body.edges
				.filter((edge) => edge.kind === "control")
				.map((edge) => edge.sourceHandle ?? `out-${edge.source}`),
		[body.edges],
	);
	const graphNodes = useMemo<Node<LoopBodyCanvasNodeData>[]>(
		() =>
			body.nodes.map((node) => ({
				id: node.id,
				type: node.type === "branch" ? "branch" : "step",
				position: node.position,
				data: {
					node,
					connectedSourceHandles,
					readOnly,
					selected: selectedNodeId === node.id,
					onSelect: (nodeId) => onNodeSelect?.(nodeId),
					onAddAfter: (sourceId, sourceHandle) => {
						setInsertionPoint({ sourceId, sourceHandle });
						setIsPickerOpen(true);
					},
				},
			})),
		[
			body.nodes,
			connectedSourceHandles,
			onNodeSelect,
			readOnly,
			selectedNodeId,
		],
	);
	const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);

	useEffect(() => {
		setNodes(graphNodes);
	}, [graphNodes, setNodes]);

	useEffect(() => {
		if (!instanceRef.current || body.nodes.length === 0) return;
		window.requestAnimationFrame(() => {
			instanceRef.current?.fitView({ padding: 0.2, duration: 200 });
		});
	}, [body.nodes.length]);

	const openRootPicker = () => {
		setInsertionPoint(null);
		setIsPickerOpen(true);
	};

	const addNode = (type: AutomationWorkflowNodeType) => {
		const newNode = createCanvasWorkflowNode(type, body.nodes.length);
		const existingOutputVars = new Set(
			body.nodes.map((node) => node.outputVar),
		);
		let outputIndex = body.nodes.length + 1;
		while (existingOutputVars.has(`${loopOutputVar}_step_${outputIndex}`)) {
			outputIndex += 1;
		}
		newNode.outputVar = `${loopOutputVar}_step_${outputIndex}`;
		newNode.position = { x: 0, y: 0 };
		const nextBody = insertLoopBodyNode(
			body,
			newNode,
			insertionPoint ?? undefined,
		);
		onBodyChange(nextBody);
		onNodeSelect?.(newNode.id);
		setIsPickerOpen(false);
		setInsertionPoint(null);
	};

	return (
		<>
			<section
				className={cn(
					"nowheel nodrag nopan relative h-80 overflow-hidden rounded-xl border bg-muted/20",
					className,
				)}
				aria-label="Steps repeated by this loop"
				onPointerDown={(event) => event.stopPropagation()}
				onWheel={(event) => event.stopPropagation()}
			>
				{body.nodes.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
						<div>
							<p className="font-medium text-sm">
								No repeated steps yet
							</p>
							<p className="mt-1 text-muted-foreground text-xs">
								Add the first action that should run for every
								item or batch.
							</p>
						</div>
						{!readOnly && (
							<Button
								type="button"
								size="sm"
								onClick={openRootPicker}
							>
								<Plus className="size-4" aria-hidden />
								Add first step
							</Button>
						)}
					</div>
				) : (
					<ReactFlowProvider>
						<ReactFlow
							nodes={nodes}
							edges={body.edges.map((edge) => ({
								...edge,
								type: "smoothstep",
							}))}
							nodeTypes={loopBodyNodeTypes}
							onNodesChange={onNodesChange}
							onNodeDragStop={(_event, draggedNode) => {
								if (readOnly) return;
								onBodyChange({
									...body,
									nodes: body.nodes.map((node) =>
										node.id === draggedNode.id
											? {
													...node,
													position:
														draggedNode.position,
												}
											: node,
									),
								});
							}}
							onInit={(instance) => {
								instanceRef.current = instance;
								instance.fitView({ padding: 0.2 });
							}}
							nodesDraggable={!readOnly}
							nodesConnectable={false}
							elementsSelectable
							panOnDrag
							panOnScroll={false}
							zoomOnScroll={false}
							zoomOnPinch
							minZoom={0.7}
							maxZoom={1.4}
							proOptions={{ hideAttribution: true }}
							fitView
						>
							<Background
								variant={BackgroundVariant.Dots}
								gap={20}
								size={1}
							/>
						</ReactFlow>
					</ReactFlowProvider>
				)}
			</section>

			<Dialog
				open={isPickerOpen}
				onOpenChange={(open) => {
					setIsPickerOpen(open);
					if (!open) setInsertionPoint(null);
				}}
			>
				<DialogContent className="flex h-3/4 max-h-screen max-w-xl flex-col p-0">
					<DialogHeader className="sr-only">
						<DialogTitle>Add a loop step</DialogTitle>
						<DialogDescription>
							Choose the next node to run inside this loop.
						</DialogDescription>
					</DialogHeader>
					<AddNodeMenu
						onSelect={addNode}
						nodeFilter={canAddToLoop}
						title="Add a loop step"
						description={
							insertionPoint
								? "Insert a step at this point in the loop."
								: "Choose the first step repeated by this loop."
						}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}
