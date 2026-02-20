import {
	addEdge,
	Background,
	type Connection,
	Controls,
	MiniMap,
	type Node,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@xyflow/react/dist/style.css";
import {
	ArrowLeft,
	Code2,
	FormInput,
	GraduationCap,
	LayoutGrid,
	Save,
	Sparkles,
	Upload,
} from "lucide-react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { ContextualHints } from "@/components/contextual-hints";
import { ExampleTemplates } from "@/components/example-templates";
import { nodeTypes } from "@/components/flow-nodes";
import { GuidedTour } from "@/components/guided-tour";
import { NodePalette } from "@/components/node-palette";
import { SimpleRuleBuilder } from "@/components/simple-rule-builder";
import { ValidationPanel } from "@/components/validation-panel";
import { ruleStore } from "@/stores/rule-store";
import { flowToJsonLogic } from "@/utility/flow-to-json-logic";
import { parseJsonLogicToFlow } from "@/utility/json-logic-parser";
import { nodesToConfig } from "@/utility/nodes-to-config";

export const VisualizeRulesPage = observer(() => {
	const { ruleId } = useParams<{ ruleId: string }>();
	const navigate = useNavigate();
	const selectedRule = ruleStore.selectedRule;
	const parsedRule = ruleStore.parsedRule;

	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [showJsonDialog, setShowJsonDialog] = useState(false);
	const [showTourDialog, setShowTourDialog] = useState(false);
	const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
	const [mode, setMode] = useState<"simple" | "visual">("simple");

	// Reconstruct JSON from current node/edge state
	const reconstructedJson = useMemo(() => {
		return flowToJsonLogic(nodes, edges);
	}, [nodes, edges]);

	// Parse nodes to config for SimpleRuleBuilder
	const simpleConfig = useMemo(() => {
		return nodesToConfig(nodes, edges);
	}, [nodes, edges]);

	const handleNodeUpdate = useCallback(
		(nodeId: string, data: Record<string, unknown>) => {
			setNodes((nds) =>
				nds.map((node) =>
					node.id === nodeId
						? { ...node, data: { ...node.data, ...data } }
						: node,
				),
			);
		},
		[setNodes],
	);

	useEffect(() => {
		if (!parsedRule) return;
		const { nodes: flowNodes, edges: flowEdges } =
			parseJsonLogicToFlow(parsedRule);
		const nodesWithCallbacks = flowNodes.map((node) => ({
			...node,
			data: {
				...node.data,
				onUpdate: handleNodeUpdate,
			},
		}));
		setNodes(nodesWithCallbacks);
		setEdges(flowEdges);
	}, [parsedRule, handleNodeUpdate, setNodes, setEdges]);

	useEffect(() => {
		if (!selectedRule && ruleId) {
			console.warn("No rule in store, redirecting to rules page");
		}
	}, [selectedRule, ruleId]);

	const onConnect = useCallback(
		(connection: Connection) => {
			// Auto-label edges based on node types
			const sourceNode = nodes.find((n) => n.id === connection.source);
			const targetNode = nodes.find((n) => n.id === connection.target);

			if (!sourceNode || !targetNode) return;

			// VALIDATION: Prevent invalid connections
			const sourceLabel = (sourceNode.data.label as string) || "";

			// 1. Don't allow result nodes as inputs to conditions
			if (sourceNode.type === "result") {
				console.warn(
					"Cannot connect FROM a result node - results are outputs only",
				);
				return;
			}

			// 2. Don't allow result nodes as operands for comparisons
			if (
				targetNode.type === "result" &&
				sourceNode.type === "operator" &&
				["==", "!=", ">", "<", ">=", "<="].includes(sourceLabel)
			) {
				console.warn(
					"Cannot connect comparison operators directly to results - connect to another result node or use IF block",
				);
				return;
			}

			let label: string | null | undefined;

			// Handle IF node connections
			if (sourceNode.type === "if") {
				// IF node's output handles already have IDs "true" or "false"
				label = connection.sourceHandle || "true";
			}
			// If connecting an operator/condition to a result node, label as "true"
			else if (
				sourceNode.type === "operator" &&
				targetNode.type === "result"
			) {
				// Check if this is first or second connection to the result
				const existingConnections = edges.filter(
					(e) => e.target === connection.target,
				);
				label = existingConnections.length === 0 ? "true" : "else";
			}

			// AUTO-CLEANUP: Remove extra connections from binary operators
			if (
				sourceNode.type === "operator" &&
				[
					"==",
					"!=",
					">",
					"<",
					">=",
					"<=",
					"Equals (==)",
					"Not Equals (!=)",
					"Greater Than (>)",
					"Less Than (<)",
					"Greater or Equal (>=)",
					"Less or Equal (<=)",
				].includes(sourceLabel)
			) {
				const existingOutgoing = edges.filter(
					(e) =>
						e.source === connection.source &&
						nodes.find((n) => n.id === e.target)?.type !== "result",
				);

				// If already has 2 operands, remove the oldest one
				if (existingOutgoing.length >= 2) {
					console.log(
						`Binary operator already has ${existingOutgoing.length} operands, removing oldest`,
					);
					setEdges((eds) => {
						// Remove the first (oldest) operand connection
						const filtered = eds.filter(
							(e) => e.id !== existingOutgoing[0].id,
						);
						// Add the new connection
						return addEdge({ ...connection, label }, filtered);
					});
					return;
				}
			}

			setEdges((eds) => addEdge({ ...connection, label }, eds));
		},
		[setEdges, nodes, edges],
	);

	const handleAddNode = useCallback(
		(node: Node) => {
			const nodeWithCallback = {
				...node,
				data: {
					...node.data,
					onUpdate: handleNodeUpdate,
				},
			};
			setNodes((nds) => [...nds, nodeWithCallback]);
		},
		[setNodes, handleNodeUpdate],
	);

	const handleLoadJson = () => {
		// TODO: Implement JSON loading
		console.log("Load JSON clicked");
	};

	const handleLoadTemplate = useCallback(
		(templateNodes: Node[], templateEdges: Edge[]) => {
			// Add onUpdate callback to template nodes
			const nodesWithCallbacks = templateNodes.map((node) => ({
				...node,
				data: {
					...node.data,
					onUpdate: handleNodeUpdate,
				},
			}));
			setNodes(nodesWithCallbacks);
			setEdges(templateEdges);
		},
		[handleNodeUpdate, setNodes, setEdges],
	);

	const handleGenerateFromSimple = useCallback(
		(generatedNodes: Node[], generatedEdges: Edge[]) => {
			// Add onUpdate callback to generated nodes
			const nodesWithCallbacks = generatedNodes.map((node) => ({
				...node,
				data: {
					...node.data,
					onUpdate: handleNodeUpdate,
				},
			}));
			setNodes(nodesWithCallbacks);
			setEdges(generatedEdges);
		},
		[handleNodeUpdate, setNodes, setEdges],
	);

	const handleSaveRule = () => {
		// TODO: Implement save rule
		console.log("Save Rule clicked");
	};

	if (!selectedRule || !parsedRule) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="font-bold text-3xl">Visualize Rules</h1>
					<p className="text-muted-foreground">
						Edit and visualize rule {ruleId}
					</p>
				</div>
				<Alert variant="destructive">
					<AlertDescription>
						No rule selected or invalid rule format. Please select a
						rule from the Rules page.
					</AlertDescription>
				</Alert>
				<Button onClick={() => navigate("/rules")}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Rules
				</Button>
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100vh-8rem)] flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b bg-background px-6 py-3">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate("/rules")}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Rules
					</Button>
					<div className="h-6 w-px bg-border" />
					<div>
						<h1 className="font-semibold text-lg">
							Visual Rule Builder
						</h1>
						<p className="text-muted-foreground text-xs">
							{mode === "simple"
								? "Build rules with a simple form"
								: `${nodes.length} nodes, ${edges.length} connections`}
						</p>
					</div>
					<div className="h-6 w-px bg-border" />
					{/* Mode Toggle */}
					<div className="flex rounded-lg border bg-muted p-1">
						<button
							type="button"
							onClick={() => setMode("simple")}
							className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-sm transition-colors ${
								mode === "simple"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<FormInput className="h-4 w-4" />
							Simple Mode
						</button>
						<button
							type="button"
							onClick={() => setMode("visual")}
							className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-sm transition-colors ${
								mode === "visual"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<LayoutGrid className="h-4 w-4" />
							Visual Mode
						</button>
					</div>
				</div>
				<div className="flex gap-2">
					{mode === "visual" && (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowTourDialog(true)}
								className="border-purple-200 text-purple-600 hover:bg-purple-50"
							>
								<GraduationCap className="mr-2 h-4 w-4" />
								Tutorial
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowTemplatesDialog(true)}
								className="border-purple-200 text-purple-600 hover:bg-purple-50"
							>
								<Sparkles className="mr-2 h-4 w-4" />
								Examples
							</Button>
						</>
					)}{" "}
					<Button
						variant="outline"
						size="sm"
						onClick={handleLoadJson}
					>
						<Upload className="mr-2 h-4 w-4" />
						Load from JSON
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowJsonDialog(true)}
					>
						<Code2 className="mr-2 h-4 w-4" />
						Show JSON
					</Button>
					<Button size="sm" onClick={handleSaveRule}>
						<Save className="mr-2 h-4 w-4" />
						Save Rule
					</Button>
				</div>
			</div>

			{/* Mode-specific content */}
			{mode === "simple" ? (
				<SimpleRuleBuilder
					key={`${selectedRule?.rule_id || "new"}-${mode}-${nodes.length}-${edges.length}`}
					initialConfig={simpleConfig}
					onGenerateNodes={handleGenerateFromSimple}
					onShowVisual={() => setMode("visual")}
				/>
			) : (
				<>
					{/* Contextual Hints */}
					<div className="border-b bg-linear-to-r from-blue-50 to-purple-50 px-6 py-3">
						<ContextualHints nodes={nodes} edges={edges} />
					</div>

					{/* Validation Panel */}
					<div className="border-b bg-muted/30 px-6 py-2">
						<ValidationPanel nodes={nodes} edges={edges} />
					</div>

					{/* Main content with sidebar and canvas */}
					<div className="flex flex-1 overflow-hidden">
						<NodePalette onAddNode={handleAddNode} />
						<div className="flex-1">
							<ReactFlow
								nodes={nodes}
								edges={edges.map((edge) => ({
									...edge,
									style: {
										stroke:
											edge.label === "true"
												? "#22c55e"
												: edge.label === "false"
													? "#f97316"
													: edge.label === "else"
														? "#f59e0b"
														: "#94a3b8",
										strokeWidth: 2,
									},
								}))}
								onNodesChange={onNodesChange}
								onEdgesChange={onEdgesChange}
								onConnect={onConnect}
								nodeTypes={nodeTypes}
								defaultEdgeOptions={{
									type: "smoothstep",
									animated: true,
									labelStyle: { display: "none" },
									labelBgStyle: { display: "none" },
								}}
								fitView
								attributionPosition="bottom-left"
							>
								<Background />
								<Controls />
								<MiniMap
									nodeColor={(node) => {
										switch (node.type) {
											case "operator":
												return "#3b82f6";
											case "value":
												return "#22c55e";
											case "result":
												return "#a855f7";
											case "startEnd":
												return "#6b7280";
											default:
												return "#9ca3af";
										}
									}}
								/>
							</ReactFlow>
						</div>
					</div>
				</>
			)}

			{/* JSON Dialog */}
			<Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Rule JSON</DialogTitle>
					</DialogHeader>
					<pre className="max-h-96 overflow-auto rounded bg-muted p-4 text-sm">
						{JSON.stringify(reconstructedJson, null, 2)}
					</pre>
				</DialogContent>
			</Dialog>

			{/* Guided Tour Dialog */}
			<GuidedTour
				open={showTourDialog}
				onOpenChange={setShowTourDialog}
			/>

			{/* Example Templates Dialog */}
			<ExampleTemplates
				open={showTemplatesDialog}
				onOpenChange={setShowTemplatesDialog}
				onLoadTemplate={handleLoadTemplate}
			/>
		</div>
	);
});
