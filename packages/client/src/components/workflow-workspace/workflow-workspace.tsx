import {
	addEdge,
	Background,
	type Connection,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
	CheckCircle,
	Loader2,
	Play,
	Save,
	Settings,
	XCircle,
} from "lucide-react";
import { type FC, useCallback, useEffect, useId, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useRootStore, useWorkspace } from "@/hooks";
import { WorkflowNodeCard, type WorkflowNodeData } from "./nodes/node-card";
import { NodePalette } from "./nodes/node-palette";
import type {
	EngineOption,
	WorkflowDocument,
	WorkflowEdge,
	WorkflowNode,
	WorkflowNodeConfig,
	WorkflowRunDetail,
} from "./workflow.types";
import { WorkflowWorkspaceContext } from "./workflow-workspace-context";

const NODE_TYPES = { workflowNode: WorkflowNodeCard };

type RFWorkflowNode = Node<WorkflowNodeData>;

function wfNodeToRF(wfNode: WorkflowNode): RFWorkflowNode {
	return {
		id: wfNode.id,
		type: "workflowNode",
		position: wfNode.position ?? { x: 200, y: 200 },
		data: { wfNode },
	};
}

function rfNodeToWf(rfNode: RFWorkflowNode): WorkflowNode {
	return {
		...rfNode.data.wfNode,
		position: rfNode.position,
	};
}

function wfEdgeToRF(wfEdge: WorkflowEdge): Edge {
	return {
		id: wfEdge.id,
		source: wfEdge.source,
		target: wfEdge.target,
	};
}

/** Escape double-quotes and backslashes for embedding in a Pixel string literal */
function escapePixel(s: string): string {
	return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Replace ${nodeId} tokens with known outputs */
function substituteVars(
	template: string,
	outputs: Record<string, string>,
): string {
	return template.replace(/\$\{([^}]+)\}/g, (_, key) => outputs[key] ?? "");
}

/**
 * Build the executable pixel for a node using the same logic as
 * WorkflowExecutorReactor.buildPixel, substituting ${nodeId} vars from
 * already-known outputs before sending to the server.
 */
function assembleNodePixel(
	wfNode: WorkflowNode,
	nodeOutputs: Record<string, string>,
): string | null {
	const cfg = wfNode.config as unknown as Record<
		string,
		string | number | undefined
	>;
	let pixel: string | null = null;

	switch (wfNode.type) {
		case "trigger":
			return null;

		case "custom-pixel": {
			const p = (cfg.pixel as string) || "";
			pixel = p || null;
			break;
		}

		case "model-engine": {
			const engineId = cfg.engineId as string;
			const prompt = cfg.promptTemplate as string;
			if (!engineId || !prompt) return null;
			let px = `LLMChat(engine=["${engineId}"], command=["${escapePixel(prompt)}"]`;
			if (cfg.systemMessage) {
				px += `, systemMessage=["${escapePixel(cfg.systemMessage as string)}"]`;
			}
			if (cfg.paramValues) {
				px += `, paramValues=[${cfg.paramValues}]`;
			}
			px += ");";
			pixel = px;
			break;
		}

		case "database-engine": {
			const engineId = cfg.engineId as string;
			const query = cfg.expression as string;
			if (!engineId || !query) return null;
			pixel = `DatabaseQuery(engine=["${engineId}"], query=["${escapePixel(query)}"]);`;
			break;
		}

		case "vector-engine": {
			const engineId = cfg.engineId as string;
			const expression = cfg.expression as string;
			if (!engineId || !expression) return null;
			const limit = cfg.limit ? `, limit=[${cfg.limit}]` : "";
			pixel = `VectorDatabaseQuery(engine=["${engineId}"], command=["${escapePixel(expression)}"]${limit});`;
			break;
		}

		case "storage-engine": {
			const engineId = cfg.engineId as string;
			const operation = (cfg.operation as string) || "list";
			const path = (cfg.path as string) || "/";
			if (!engineId) return null;
			if (operation === "read") {
				pixel = `StorageGet(engine=["${engineId}"], path=["${escapePixel(path)}"]);`;
			} else {
				pixel = `StorageList(engine=["${engineId}"], path=["${escapePixel(path)}"]);`;
			}
			break;
		}

		case "function-engine": {
			const engineId = cfg.engineId as string;
			if (!engineId) return null;
			const params = cfg.paramsExpression as string;
			pixel = `FunctionEngine(engine=["${engineId}"]${params ? `, parameters=[${params}]` : ""});`;
			break;
		}

		case "transform": {
			const expression = cfg.expression as string;
			pixel = expression || null;
			break;
		}

		default:
			return null;
	}

	if (!pixel) return null;
	return substituteVars(pixel, nodeOutputs);
}

/** Inner canvas — must be inside ReactFlowProvider */
const WorkflowCanvas: FC = () => {
	const insight = useInsight();
	const { monolithStore } = useRootStore();
	const { workspace } = useWorkspace();
	const appId = workspace.appId;
	const rfInstance = useReactFlow();

	const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFWorkflowNode>(
		[],
	);
	const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

	const [enginesByType, setEnginesByType] = useState<
		Record<string, EngineOption[]>
	>({});
	const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
	const [settingsPanelNodeId, setSettingsPanelNodeId] = useState<
		string | null
	>(null);
	const [runDetail, setRunDetail] = useState<WorkflowRunDetail | null>(null);
	const [nodeOutputs, setNodeOutputs] = useState<Record<string, string>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [isRunning, setIsRunning] = useState(false);

	// Derived: keep wfNodes in sync with rfNodes
	const [wfNodes, setWfNodes] = useState<WorkflowNode[]>([]);
	useEffect(() => {
		setWfNodes(rfNodes.map((rf) => rfNodeToWf(rf)));
	}, [rfNodes]);

	// Load workflow on mount
	useEffect(() => {
		if (!insight.isReady || !appId) return;
		monolithStore
			.runQuery<[string]>(
				`GetWorkflow(project=["${appId}"]);`,
				workspace.insightId,
			)
			.then(({ errors, pixelReturn }) => {
				if (errors.length > 0) return;
				try {
					const doc: WorkflowDocument = JSON.parse(
						pixelReturn[0].output,
					);
					setRfNodes((doc.nodes ?? []).map((n) => wfNodeToRF(n)));
					setRfEdges((doc.edges ?? []).map((e) => wfEdgeToRF(e)));
				} catch (_) {
					// empty / malformed JSON — start fresh
				}
			})
			.catch((err) => {
				console.error("Failed to load workflow:", err);
			});
	}, [
		insight.isReady,
		appId,
		workspace.insightId,
		monolithStore,
		setRfNodes,
		setRfEdges,
	]);

	// Load all engine types in a single batched pixel call
	useEffect(() => {
		if (!insight.isReady) return;
		const engineTypes = [
			"MODEL",
			"DATABASE",
			"VECTOR",
			"STORAGE",
			"FUNCTION",
		];
		const batchPixel = engineTypes
			.map((et) => `MyEngines(engineTypes=["${et}"]);`)
			.join("");

		monolithStore
			.runQuery(batchPixel, workspace.insightId)
			.then(({ pixelReturn }) => {
				const map: Record<string, EngineOption[]> = {};
				engineTypes.forEach((et, i) => {
					const out = pixelReturn[i]?.output;
					map[et] = Array.isArray(out) ? (out as EngineOption[]) : [];
				});
				setEnginesByType(map);
			})
			.catch((err) => {
				console.error("Failed to load engines:", err);
			});
	}, [insight.isReady, workspace.insightId, monolithStore]);

	const onConnect = useCallback(
		(connection: Connection) =>
			setRfEdges((eds) =>
				addEdge(
					{
						...connection,
						id: `e-${connection.source}-${connection.target}`,
					},
					eds,
				),
			),
		[setRfEdges],
	);

	const onDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			const type = event.dataTransfer.getData(
				"application/workflow-node-type",
			);
			if (!type) return;

			const position = rfInstance.screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			const id = crypto.randomUUID();
			const newWfNode: WorkflowNode = {
				id,
				type: type as WorkflowNode["type"],
				label: type
					.split("-")
					.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
					.join(" "),
				config: {} as WorkflowNodeConfig,
				position,
			};

			setRfNodes((prev) => [...prev, wfNodeToRF(newWfNode)]);
		},
		[rfInstance, setRfNodes],
	);

	const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const getWfNode = useCallback(
		(id: string) => wfNodes.find((n) => n.id === id),
		[wfNodes],
	);

	const onNodeUpdate = useCallback(
		(updated: WorkflowNode) => {
			setRfNodes((prev) =>
				prev.map((rf) =>
					rf.id === updated.id
						? { ...rf, data: { wfNode: updated } }
						: rf,
				),
			);
		},
		[setRfNodes],
	);

	const toggleExpand = useCallback((id: string) => {
		setExpandedNodeId((cur) => (cur === id ? null : id));
	}, []);

	const deleteNode = useCallback(
		(id: string) => {
			setRfNodes((prev) => prev.filter((rf) => rf.id !== id));
			setRfEdges((prev) =>
				prev.filter((e) => e.source !== id && e.target !== id),
			);
			setExpandedNodeId((cur) => (cur === id ? null : cur));
			setNodeOutputs((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
		},
		[setRfNodes, setRfEdges],
	);

	const openSettings = useCallback((id: string) => {
		setSettingsPanelNodeId(id);
	}, []);

	/** Run a single node by assembling + executing its pixel */
	const runNode = useCallback(
		async (nodeId: string) => {
			const wfNode = wfNodes.find((n) => n.id === nodeId);
			if (!wfNode) return;

			const pixel = assembleNodePixel(wfNode, nodeOutputs);
			if (!pixel) {
				toast.error(
					`Node "${wfNode.label}": fill in all required fields before running`,
				);
				return;
			}

			try {
				const { errors, pixelReturn } = await monolithStore.runQuery(
					pixel,
					workspace.insightId,
				);

				if (errors.length > 0) {
					toast.error(
						`Node "${wfNode.label}" error: ${errors.join(", ")}`,
					);
					return;
				}

				const raw = pixelReturn[0]?.output;
				const output =
					typeof raw === "string"
						? raw
						: JSON.stringify(raw, null, 2);

				setNodeOutputs((prev) => ({ ...prev, [nodeId]: output }));
			} catch (e) {
				toast.error(`Node run failed: ${(e as Error).message}`);
				throw e;
			}
		},
		[wfNodes, nodeOutputs, monolithStore, workspace.insightId],
	);

	const saveWorkflow = async () => {
		setIsSaving(true);
		try {
			const doc: WorkflowDocument = {
				version: "1.0",
				nodes: wfNodes,
				edges: rfEdges.map((e) => ({
					id: e.id,
					source: e.source,
					target: e.target,
				})),
			};
			const encoded = encodeURIComponent(JSON.stringify(doc));
			const { errors } = await monolithStore.runQuery(
				`SaveWorkflow(project=["${appId}"], json=["<encode>${encoded}</encode>"]);`,
				workspace.insightId,
			);
			if (errors.length > 0) throw new Error(errors.join(", "));
			toast.success("Workflow saved");
		} catch (e) {
			toast.error(`Save failed: ${(e as Error).message}`);
		} finally {
			setIsSaving(false);
		}
	};

	const runWorkflow = async () => {
		await saveWorkflow();
		setIsRunning(true);
		setRunDetail(null);
		try {
			const { errors, pixelReturn } = await monolithStore.runQuery<
				[WorkflowRunDetail]
			>(`WorkflowExecutor(project=["${appId}"]);`, workspace.insightId);
			if (errors.length > 0) throw new Error(errors.join(", "));
			const result = pixelReturn[0]
				.output as unknown as WorkflowRunDetail;
			setRunDetail(result);

			// Populate nodeOutputs from the run so per-node output refs work
			if (result?.nodeResults) {
				const outputs: Record<string, string> = {};
				for (const nr of result.nodeResults) {
					if (nr.output) outputs[nr.nodeId] = nr.output;
				}
				setNodeOutputs((prev) => ({ ...prev, ...outputs }));
			}

			const hasErrors = result?.nodeResults?.some(
				(r) => r.status === "error",
			);
			if (hasErrors) {
				toast.error("Workflow completed with errors — check run panel");
			} else {
				toast.success("Workflow run complete");
			}
		} catch (e) {
			toast.error(`Run failed: ${(e as Error).message}`);
		} finally {
			setIsRunning(false);
		}
	};

	const settingNode = settingsPanelNodeId
		? wfNodes.find((n) => n.id === settingsPanelNodeId)
		: null;

	return (
		<WorkflowWorkspaceContext.Provider
			value={{
				enginesByType,
				expandedNodeId,
				nodeOutputs,
				getWfNode,
				onNodeUpdate,
				deleteNode,
				openSettings,
				toggleExpand,
				runNode,
			}}
		>
			<div className="flex h-full w-full flex-col">
				{/* Toolbar */}
				<div className="flex shrink-0 items-center gap-2 border-border border-b bg-background px-4 py-2">
					<span className="font-semibold text-sm">
						Workflow Builder
					</span>
					<div className="ml-auto flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={isSaving || isRunning}
							onClick={saveWorkflow}
						>
							{isSaving ? (
								<Loader2 className="mr-1.5 size-3.5 animate-spin" />
							) : (
								<Save className="mr-1.5 size-3.5" />
							)}
							Save
						</Button>
						<Button
							size="sm"
							disabled={isRunning || isSaving}
							onClick={runWorkflow}
						>
							{isRunning ? (
								<Loader2 className="mr-1.5 size-3.5 animate-spin" />
							) : (
								<Play className="mr-1.5 size-3.5" />
							)}
							Run All
						</Button>
					</div>
				</div>

				{/* Main area: palette + canvas + optional run panel */}
				<div className="flex min-h-0 flex-1">
					<NodePalette />

					<section
						aria-label="Workflow canvas"
						className="flex-1"
						onDrop={onDrop}
						onDragOver={onDragOver}
					>
						<ReactFlow
							nodes={rfNodes}
							edges={rfEdges}
							nodeTypes={NODE_TYPES}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							onConnect={onConnect}
							fitView
							deleteKeyCode="Delete"
						>
							<Background />
							<Controls />
							<MiniMap />
						</ReactFlow>
					</section>

					{runDetail && (
						<RunResultsPanel
							detail={runDetail}
							onClose={() => setRunDetail(null)}
						/>
					)}
				</div>
			</div>

			{/* Settings side sheet */}
			<Sheet
				open={!!settingNode}
				onOpenChange={(open) => {
					if (!open) setSettingsPanelNodeId(null);
				}}
			>
				<SheetContent side="right" className="w-96 overflow-y-auto">
					<SheetHeader>
						<SheetTitle className="flex items-center gap-2">
							<Settings className="size-4" />
							{settingNode?.label ?? "Node Settings"}
						</SheetTitle>
					</SheetHeader>
					{settingNode && (
						<SettingsPanel
							key={settingNode.id}
							wfNode={settingNode}
							onUpdate={(updated) => {
								onNodeUpdate(updated);
								setSettingsPanelNodeId(null);
							}}
						/>
					)}
				</SheetContent>
			</Sheet>
		</WorkflowWorkspaceContext.Provider>
	);
};

/** Full settings panel — standalone component, only mounted when settingNode exists */
const SettingsPanel: FC<{
	wfNode: WorkflowNode;
	onUpdate: (updated: WorkflowNode) => void;
}> = ({ wfNode, onUpdate }) => {
	const cfg = wfNode.config as unknown as Record<string, string>;
	const [label, setLabel] = useState(wfNode.label);
	const [localCfg, setLocalCfg] = useState<Record<string, string>>(cfg);

	const nodeLabelId = useId();
	const pixelId = useId();
	const promptId = useId();
	const expressionId = useId();

	const set = (key: string, val: string) =>
		setLocalCfg((prev) => ({ ...prev, [key]: val }));

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex flex-col gap-1">
				<label htmlFor={nodeLabelId} className="font-medium text-xs">
					Node label
				</label>
				<input
					id={nodeLabelId}
					className="rounded border border-border px-2 py-1 text-sm"
					value={label}
					onChange={(e) => setLabel(e.target.value)}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-muted-foreground text-xs">
					Type: {wfNode.type}
				</span>
			</div>
			{"pixel" in localCfg && (
				<div className="flex flex-col gap-1">
					<label htmlFor={pixelId} className="font-medium text-xs">
						Custom Pixel
					</label>
					<Textarea
						id={pixelId}
						className="font-mono text-xs"
						rows={6}
						value={localCfg.pixel ?? ""}
						onChange={(e) => set("pixel", e.target.value)}
					/>
				</div>
			)}
			{"promptTemplate" in localCfg && (
				<div className="flex flex-col gap-1">
					<label htmlFor={promptId} className="font-medium text-xs">
						Prompt template
					</label>
					<Textarea
						id={promptId}
						className="font-mono text-xs"
						rows={6}
						value={localCfg.promptTemplate ?? ""}
						onChange={(e) => set("promptTemplate", e.target.value)}
					/>
				</div>
			)}
			{"expression" in localCfg && (
				<div className="flex flex-col gap-1">
					<label
						htmlFor={expressionId}
						className="font-medium text-xs"
					>
						Expression
					</label>
					<Textarea
						id={expressionId}
						className="font-mono text-xs"
						rows={4}
						value={localCfg.expression ?? ""}
						onChange={(e) => set("expression", e.target.value)}
					/>
				</div>
			)}
			<Button
				onClick={() =>
					onUpdate({
						...wfNode,
						label,
						config: localCfg as unknown as WorkflowNodeConfig,
					})
				}
			>
				Apply
			</Button>
		</div>
	);
};

/** Panel showing per-node run results from a full workflow run */
const RunResultsPanel: FC<{
	detail: WorkflowRunDetail;
	onClose: () => void;
}> = ({ detail, onClose }) => (
	<div className="flex w-80 shrink-0 flex-col border-border border-l bg-background">
		<div className="flex items-center justify-between border-border border-b px-3 py-2">
			<span className="font-semibold text-sm">Run Results</span>
			<button
				type="button"
				onClick={onClose}
				className="text-muted-foreground text-xs hover:text-foreground"
			>
				✕
			</button>
		</div>
		<div className="flex-1 overflow-y-auto p-2">
			<div className="mb-2 flex items-center gap-1.5">
				{detail.status === "success" ? (
					<CheckCircle className="size-4 text-green-600" />
				) : (
					<XCircle className="size-4 text-destructive" />
				)}
				<span className="text-muted-foreground text-xs">
					Run {detail.runId} · {detail.startedAt}
				</span>
			</div>
			<div className="flex flex-col gap-2">
				{(detail.nodeResults ?? []).map((nr) => (
					<div
						key={nr.nodeId}
						className="rounded border border-border p-2 text-xs"
					>
						<div className="flex items-center justify-between">
							<span className="font-medium">{nr.nodeId}</span>
							<span
								className={
									nr.status === "success"
										? "text-green-600"
										: nr.status === "error"
											? "text-destructive"
											: "text-muted-foreground"
								}
							>
								{nr.status} · {nr.elapsedMs}ms
							</span>
						</div>
						{nr.error && (
							<p className="mt-1 text-destructive">{nr.error}</p>
						)}
						{nr.output && (
							<pre className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap break-words rounded bg-muted p-1 text-[10px]">
								{nr.output}
							</pre>
						)}
					</div>
				))}
			</div>
		</div>
	</div>
);

/** Public export — wraps canvas in ReactFlowProvider */
export const WorkflowWorkspace: FC = () => (
	<ReactFlowProvider>
		<WorkflowCanvas />
	</ReactFlowProvider>
);
