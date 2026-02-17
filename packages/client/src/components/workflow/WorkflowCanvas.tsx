import {
	Controls,
	type Edge,
	MiniMap,
	type Node,
	type OnConnect,
	type OnEdgesChange,
	type OnNodesChange,
	ReactFlow,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import "@xyflow/react/dist/style.css";

import { useWorkflowEditor } from "@/stores/workflow";
import type { StepType, WorkflowStep } from "@/types/workflow";
import { findEntrySteps } from "@/utility/workflow-dag";
import { ConditionalEdge, DefaultEdge } from "./edges";
import type { WorkflowNodeData } from "./nodes";
import { WorkflowNode } from "./nodes";

// ─── Type registrations ─────────────────────────────────────────
const nodeTypes = { workflow: WorkflowNode };
const edgeTypes = { default: DefaultEdge, conditional: ConditionalEdge };

// ─── Helpers ─────────────────────────────────────────────────────

function stepsToNodes(steps: WorkflowStep[], entryIds: Set<string>): Node[] {
	return steps.map((step) => ({
		id: step.stepId,
		type: "workflow",
		position: step.position,
		data: {
			stepId: step.stepId,
			type: step.type,
			name: step.name,
			description: step.description,
			isEntry: entryIds.has(step.stepId),
			source: (step.config as unknown as Record<string, unknown>)
				?.source as "engine" | "project" | undefined,
		} satisfies WorkflowNodeData,
	}));
}

function stepsToEdges(steps: WorkflowStep[]): Edge[] {
	const edges: Edge[] = [];

	for (const step of steps) {
		if (step.next) {
			for (const targetId of step.next) {
				edges.push({
					id: `${step.stepId}-next-${targetId}`,
					source: step.stepId,
					target: targetId,
					sourceHandle: "next",
					type: "default",
				});
			}
		}
		if (step.ifTrue) {
			for (const targetId of step.ifTrue) {
				edges.push({
					id: `${step.stepId}-ifTrue-${targetId}`,
					source: step.stepId,
					target: targetId,
					sourceHandle: "ifTrue",
					type: "conditional",
					data: { condition: "ifTrue" },
				});
			}
		}
		if (step.ifFalse) {
			for (const targetId of step.ifFalse) {
				edges.push({
					id: `${step.stepId}-ifFalse-${targetId}`,
					source: step.stepId,
					target: targetId,
					sourceHandle: "ifFalse",
					type: "conditional",
					data: { condition: "ifFalse" },
				});
			}
		}
	}

	return edges;
}

// ─── Component ───────────────────────────────────────────────────
export function WorkflowCanvas() {
	const { state, dispatch } = useWorkflowEditor();
	const { screenToFlowPosition } = useReactFlow();
	const steps = state.workflow.steps;

	const entryIds = useMemo(
		() => new Set(findEntrySteps(steps).map((s) => s.stepId)),
		[steps],
	);

	const initialNodes = useMemo(
		() => stepsToNodes(steps, entryIds),
		[steps, entryIds],
	);
	const initialEdges = useMemo(() => stepsToEdges(steps), [steps]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// Track whether changes are from external store updates
	const isExternalUpdate = useRef(false);

	// Sync store → flow when workflow steps change externally
	useEffect(() => {
		isExternalUpdate.current = true;
		setNodes(stepsToNodes(steps, entryIds));
		setEdges(stepsToEdges(steps));
	}, [steps, entryIds, setNodes, setEdges]);

	// Handle node position changes
	const handleNodesChange: OnNodesChange = useCallback(
		(changes) => {
			onNodesChange(changes);

			// Sync position changes back to store
			for (const change of changes) {
				if (
					change.type === "position" &&
					change.position &&
					!change.dragging
				) {
					dispatch({
						type: "MOVE_STEP",
						stepId: change.id,
						position: change.position,
					});
				}
			}
		},
		[onNodesChange, dispatch],
	);

	// Handle edge changes (deletions)
	const handleEdgesChange: OnEdgesChange = useCallback(
		(changes) => {
			onEdgesChange(changes);

			for (const change of changes) {
				if (change.type === "remove") {
					// Parse edge ID to get source, handleType, target
					// Edge IDs are formatted: sourceId-handleType-targetId
					// But stepIds are UUIDs with dashes, so we can't just split on "-"
					// Instead, find the edge from current edges
					const edge = edges.find((e) => e.id === change.id);
					if (edge) {
						const handleType = (edge.sourceHandle ?? "next") as
							| "next"
							| "ifTrue"
							| "ifFalse";
						dispatch({
							type: "DISCONNECT_STEPS",
							sourceId: edge.source,
							targetId: edge.target,
							handleType,
						});
					}
				}
			}
		},
		[onEdgesChange, edges, dispatch],
	);

	// Handle new connections
	const handleConnect: OnConnect = useCallback(
		(connection) => {
			if (!connection.source || !connection.target) return;

			const handleType = (connection.sourceHandle ?? "next") as
				| "next"
				| "ifTrue"
				| "ifFalse";

			dispatch({
				type: "CONNECT_STEPS",
				sourceId: connection.source,
				targetId: connection.target,
				handleType,
			});
		},
		[dispatch],
	);

	// Handle node selection
	const handleNodeClick = useCallback(
		(_: React.MouseEvent, node: Node) => {
			dispatch({ type: "SELECT_STEP", stepId: node.id });
		},
		[dispatch],
	);

	// Handle canvas click (deselect)
	const handlePaneClick = useCallback(() => {
		dispatch({ type: "SELECT_STEP", stepId: null });
	}, [dispatch]);

	// Handle drag-and-drop from palette
	const handleDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const handleDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();

			const stepType = event.dataTransfer.getData(
				"application/workflow-step-type",
			) as StepType;

			if (!stepType) return;

			const variant = event.dataTransfer.getData(
				"application/workflow-step-variant",
			);

			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			// Build config overrides for palette variants
			const configOverrides: Record<string, unknown> | undefined =
				variant === "project"
					? { source: "project", engineType: "" }
					: variant === "engine"
						? { source: "engine" }
						: undefined;

			dispatch({
				type: "ADD_STEP",
				stepType,
				position,
				name: variant === "project" ? "Use App" : undefined,
				configOverrides,
			});
		},
		[dispatch, screenToFlowPosition],
	);

	// Handle keyboard delete
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (
				(event.key === "Delete" || event.key === "Backspace") &&
				state.selectedStepId
			) {
				// Don't delete if user is typing in an input
				const tag = (event.target as HTMLElement).tagName;
				if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
					return;

				dispatch({
					type: "DELETE_STEP",
					stepId: state.selectedStepId,
				});
			}

			// Undo/Redo
			if ((event.metaKey || event.ctrlKey) && event.key === "z") {
				event.preventDefault();
				if (event.shiftKey) {
					dispatch({ type: "REDO" });
				} else {
					dispatch({ type: "UNDO" });
				}
			}
		},
		[state.selectedStepId, dispatch],
	);

	return (
		<div
			role="application"
			className="h-full flex-1"
			onKeyDown={handleKeyDown}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: canvas container needs focus for keyboard shortcuts
			tabIndex={0}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={handleNodesChange}
				onEdgesChange={handleEdgesChange}
				onConnect={handleConnect}
				onNodeClick={handleNodeClick}
				onPaneClick={handlePaneClick}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView
				deleteKeyCode={null} // We handle delete ourselves
				proOptions={{ hideAttribution: true }}
			>
				<Controls />
				<MiniMap
					nodeStrokeWidth={3}
					zoomable
					pannable
					className="!bg-gray-50"
				/>
			</ReactFlow>
		</div>
	);
}
