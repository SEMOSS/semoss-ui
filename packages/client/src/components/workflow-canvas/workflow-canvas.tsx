import {
	addEdge,
	Background,
	BackgroundVariant,
	type Connection,
	Controls,
	type Edge,
	type EdgeChange,
	type Node,
	type NodeChange,
	Panel,
	ReactFlow,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	EngineOption,
	ProjectOption,
	RunStatus,
	WorkflowDocument,
	WorkflowEdge,
	WorkflowGraph,
	WorkflowNode,
	WorkflowNodeResult,
	WorkflowNodeType,
} from "@/pages/workflow/workflow.types";
import { NODE_TYPE_META } from "@/pages/workflow/workflow.types";
import {
	WorkflowNodeCard,
	type WorkflowNodeData,
} from "../workflow-workspace/nodes/node-card";
import { NodeSettingsPanel } from "../workflow-workspace/nodes/node-settings-panel";
import { WorkflowRunsTab } from "../workflow-workspace/workflow-runs-tab";
import {
	buildPixelPreview,
	isNodeReady,
	toRFEdge,
	toRFNode,
} from "../workflow-workspace/workflow-utils";
import { WorkflowWorkspaceContext } from "../workflow-workspace/workflow-workspace-context";
import { autoLayout, needsLayout } from "./layout";
import { NodePalettePanel } from "./node-palette-panel";
import { WorkflowCanvasToolbar } from "./workflow-canvas-toolbar";
import { WorkflowEdge as WorkflowEdgeRenderer } from "./workflow-edge";

const RUN_POLL_INTERVAL_MS = 3000;

interface WorkflowRunData {
	STATUS: RunStatus;
	RUN_ID?: string;
	TOTAL_NODES?: number;
	COMPLETED_NODES?: number;
	FAILED_NODE_ID?: string;
	nodeResults?: WorkflowNodeResult[];
	ERROR_MESSAGE?: string;
}

// Stable references outside the component so ReactFlow never remounts nodes/edges
const NODE_TYPES = { workflowNode: WorkflowNodeCard };
const EDGE_TYPES = { workflowEdge: WorkflowEdgeRenderer };

// Minimal API surface we need from useReactFlow (avoids generic complexity)
interface FlowApi {
	screenToFlowPosition: (pos: { x: number; y: number }) => {
		x: number;
		y: number;
	};
	setCenter: (
		x: number,
		y: number,
		opts?: { duration?: number; zoom?: number },
	) => void;
	getZoom: () => number;
}

// Syncs the ReactFlow API into a ref so the parent canvas can call it.
// Must be rendered inside <ReactFlow> since useReactFlow() requires its provider.
function FlowController({
	apiRef,
}: {
	apiRef: React.MutableRefObject<FlowApi | null>;
}) {
	const { screenToFlowPosition, setCenter, getZoom } = useReactFlow();
	// Assign every render — ref assignment is synchronous and won't trigger loops
	apiRef.current = { screenToFlowPosition, setCenter, getZoom };
	return null;
}

interface WorkflowCanvasProps {
	appId: string;
}

export function WorkflowCanvas({ appId }: WorkflowCanvasProps) {
	const { monolithStore } = useRootStore();

	// ─── workflow data: source of truth for configs + positions ──────────────────
	const [wfNodes, setWfNodes] = useState<WorkflowNode[]>([]);
	const [wfEdges, setWfEdges] = useState<WorkflowEdge[]>([]);
	// Ref lets context callbacks always read latest wfNodes without re-creating
	const wfNodesRef = useRef<WorkflowNode[]>([]);
	wfNodesRef.current = wfNodes;
	const wfEdgesRef = useRef<WorkflowEdge[]>([]);
	wfEdgesRef.current = wfEdges;

	// ─── ReactFlow state ──────────────────────────────────────────────────────────
	const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState<
		Node<WorkflowNodeData>
	>([]);
	const [rfEdges, setRfEdges, onRfEdgesChange] = useEdgesState<Edge>([]);

	// ─── UI state ─────────────────────────────────────────────────────────────────
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [settingsNodeId, setSettingsNodeId] = useState<string | null>(null);
	const [nodeOutputs, setNodeOutputsState] = useState<Record<string, string>>(
		{},
	);
	const [testOutputs, setTestOutputsState] = useState<
		Record<string, string | null>
	>({});
	const [showFloatingWarnings, setShowFloatingWarnings] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const [rightTab, setRightTab] = useState<"history" | "settings">("history");
	// Used to skip the initial data-load when tracking dirty state
	const prevWfNodesRef = useRef<WorkflowNode[] | null>(null);
	const prevWfEdgesRef = useRef<WorkflowEdge[] | null>(null);
	const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// ─── run state ────────────────────────────────────────────────────────────────
	const [running, setRunning] = useState(false);
	const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
	const pollTokenRef = useRef<{ cancelled: boolean } | null>(null);

	// ─── engines / projects ───────────────────────────────────────────────────────
	const [enginesByType, setEnginesByType] = useState<
		Record<string, EngineOption[]>
	>({});
	const [projects, setProjects] = useState<ProjectOption[]>([]);

	// ─── ReactFlow API + canvas container refs ────────────────────────────────────
	const rfApiRef = useRef<FlowApi | null>(null);
	const canvasContainerRef = useRef<HTMLDivElement>(null);

	// ─── stable openSettings for toRFNode calls ───────────────────────────────────
	const openSettings = useCallback((id: string) => {
		setSettingsNodeId(id);
		setRightTab("settings");
	}, []);
	const openSettingsRef = useRef(openSettings);
	openSettingsRef.current = openSettings;

	// ─── load on mount ────────────────────────────────────────────────────────────
	useEffect(() => {
		Promise.all([
			monolithStore.runQuery<[WorkflowDocument]>(
				`GetWorkflow(project=["${appId}"])`,
			),
			monolithStore.runQuery(
				`MyEngines(engineTypes=["DATABASE","MODEL","VECTOR","STORAGE","FUNCTION"], limit=[100]);`,
			),
			monolithStore.runQuery(`MyProjects(limit=[100], offset=[0]);`),
		])
			.then(([wfRes, engRes, projRes]) => {
				const doc = wfRes.pixelReturn[0]
					.output as WorkflowDocument | null;
				const raw: WorkflowGraph = doc?.graph ?? {
					nodes: [],
					edges: [],
				};
				let nodes = raw.nodes;
				let edges = raw.edges;

				// Seed brand-new workflows with a Trigger → LLM Call starter
				if (nodes.length === 0) {
					const triggerMeta = NODE_TYPE_META.find(
						(m) => m.type === "trigger",
					);
					const modelMeta = NODE_TYPE_META.find(
						(m) => m.type === "model-engine",
					);
					if (triggerMeta && modelMeta) {
						const triggerId = `trigger-${crypto.randomUUID()}`;
						const modelId = `model-engine-${crypto.randomUUID()}`;
						nodes = [
							{
								id: triggerId,
								type: "trigger",
								label: "Start",
								outputVar: triggerMeta.defaultOutputVar,
								config: {
									...triggerMeta.defaultConfig,
								} as unknown as WorkflowNode["config"],
								position: { x: 50, y: 200 },
							},
							{
								id: modelId,
								type: "model-engine",
								label: "LLM Call",
								outputVar: `${modelMeta.defaultOutputVar}_1`,
								config: {
									...modelMeta.defaultConfig,
								} as unknown as WorkflowNode["config"],
								position: { x: 390, y: 200 },
							},
						];
						edges = [
							{
								id: `e-${triggerId}-${modelId}`,
								source: triggerId,
								target: modelId,
							},
						];
					}
				}

				// Infer a linear chain when no edges were saved (legacy documents)
				if (edges.length === 0 && nodes.length > 1) {
					edges = nodes.slice(0, -1).map((n, i) => ({
						id: `e-${n.id}-${nodes[i + 1].id}`,
						source: n.id,
						target: nodes[i + 1].id,
					}));
				}

				// Assign positions when all nodes sit at the origin
				if (needsLayout(nodes)) {
					nodes = autoLayout(nodes, edges);
				}

				setWfNodes(nodes);
				setWfEdges(edges);
				setRfNodes(
					nodes.map((wn) => toRFNode(wn, openSettingsRef.current)),
				);
				setRfEdges(edges.map(toRFEdge));

				// Build engine map
				const engList =
					(engRes.pixelReturn[0].output as EngineOption[]) ?? [];
				const byType: Record<string, EngineOption[]> = {};
				for (const engine of engList) {
					const t = (engine.engine_type ?? "").toUpperCase();
					if (!byType[t]) byType[t] = [];
					byType[t].push(engine);
				}
				setEnginesByType(byType);

				const projectList =
					(projRes.pixelReturn[0].output as ProjectOption[]) ?? [];
				setProjects(projectList);
			})
			.finally(() => setLoading(false));

		return () => {
			if (pollTokenRef.current) pollTokenRef.current.cancelled = true;
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only
	}, [appId]);

	// ─── context: getWfNode ───────────────────────────────────────────────────────
	// Uses ref so context value reference stays stable between renders
	const getWfNode = useCallback(
		(id: string) => wfNodesRef.current.find((n) => n.id === id),
		[],
	);

	// ─── context: onNodeUpdate ────────────────────────────────────────────────────
	const onNodeUpdate = useCallback(
		(updated: WorkflowNode) => {
			// If config changed, invalidate any cached test output for this node
			setTestOutputsState((prev) => {
				if (!prev[updated.id]) return prev;
				const old = wfNodesRef.current.find((n) => n.id === updated.id);
				if (
					!old ||
					JSON.stringify(old.config) ===
						JSON.stringify(updated.config)
				)
					return prev;
				return { ...prev, [updated.id]: null };
			});
			setWfNodes((prev) =>
				prev.map((n) => (n.id === updated.id ? updated : n)),
			);
			// Keep RF node data in sync so the card re-renders with new values
			setRfNodes((prev) =>
				prev.map((n) => {
					if (n.id !== updated.id) return n;
					return {
						...n,
						data: {
							...n.data,
							label: updated.label,
							outputVar: updated.outputVar,
							config: updated.config as unknown as Record<
								string,
								unknown
							>,
							nodeType: updated.type,
						},
					};
				}),
			);
		},
		[setRfNodes],
	);

	// ─── context: deleteNode ──────────────────────────────────────────────────────
	const deleteNode = useCallback(
		(id: string) => {
			setWfNodes((prev) => prev.filter((n) => n.id !== id));
			setRfNodes((prev) => prev.filter((n) => n.id !== id));
			setWfEdges((prev) =>
				prev.filter((e) => e.source !== id && e.target !== id),
			);
			setRfEdges((prev) =>
				prev.filter((e) => e.source !== id && e.target !== id),
			);
			setSettingsNodeId((prev) => (prev === id ? null : prev));
		},
		[setRfNodes, setRfEdges],
	);

	// ─── context: setNodeOutput ───────────────────────────────────────────────────
	const setNodeOutput = useCallback((outputVar: string, value: string) => {
		setNodeOutputsState((prev) => ({ ...prev, [outputVar]: value }));
	}, []);

	const setTestOutput = useCallback(
		(nodeId: string, output: string | null) => {
			setTestOutputsState((prev) => ({ ...prev, [nodeId]: output }));
		},
		[],
	);

	// ─── cycle detection ──────────────────────────────────────────────────────────
	const wouldCreateCycle = useCallback(
		(sourceId: string, targetId: string): boolean => {
			const outMap = new Map<string, string[]>();
			for (const e of wfEdgesRef.current) {
				if (!outMap.has(e.source)) outMap.set(e.source, []);
				outMap.get(e.source)?.push(e.target);
			}
			const visited = new Set<string>();
			const queue = [targetId];
			while (queue.length > 0) {
				const curr = queue.shift()!;
				if (curr === sourceId) return true;
				if (visited.has(curr)) continue;
				visited.add(curr);
				for (const next of outMap.get(curr) ?? []) queue.push(next);
			}
			return false;
		},
		[],
	);

	// ─── RF: handle node changes (drag positions) ─────────────────────────────────
	const handleNodesChange = useCallback(
		(changes: NodeChange<Node<WorkflowNodeData>>[]) => {
			onRfNodesChange(changes);
			// Sync drag-end positions back to wfNodes so Save picks them up
			for (const change of changes) {
				if (
					change.type === "position" &&
					!change.dragging &&
					change.position
				) {
					const { id, position } = change;
					setWfNodes((prev) =>
						prev.map((n) => (n.id === id ? { ...n, position } : n)),
					);
				}
			}
		},
		[onRfNodesChange],
	);

	// ─── RF: handle edge changes (deletion) ──────────────────────────────────────
	const handleEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			onRfEdgesChange(changes);
			const removedIds = changes
				.filter((c) => c.type === "remove")
				.map((c) => c.id);
			if (removedIds.length > 0) {
				setWfEdges((prev) =>
					prev.filter((e) => !removedIds.includes(e.id)),
				);
			}
		},
		[onRfEdgesChange],
	);

	// ─── RF: new connection ───────────────────────────────────────────────────────
	const onConnect = useCallback(
		(params: Connection) => {
			const src = params.source ?? "";
			const tgt = params.target ?? "";
			if (!src || !tgt || src === tgt) return;
			// Prevent duplicate connections
			if (
				wfEdgesRef.current.some(
					(e) => e.source === src && e.target === tgt,
				)
			)
				return;
			// Prevent cycles
			if (wouldCreateCycle(src, tgt)) {
				toast.error("This connection would create a cycle");
				return;
			}
			const edge: WorkflowEdge = {
				id: `e-${src}-${tgt}`,
				source: src,
				target: tgt,
				sourceHandle: params.sourceHandle ?? undefined,
				targetHandle: params.targetHandle ?? undefined,
			};
			setWfEdges((prev) => [...prev, edge]);
			setRfEdges((prev) => addEdge(toRFEdge(edge), prev));
		},
		[setRfEdges, wouldCreateCycle],
	);

	// ─── palette: add node ────────────────────────────────────────────────────────
	const addNode = useCallback(
		(type: WorkflowNodeType) => {
			const meta = NODE_TYPE_META.find((m) => m.type === type);
			if (!meta) return;
			const id = `${type}-${crypto.randomUUID()}`;

			// Place new node at the center of the visible canvas area
			let position = { x: 400, y: 200 };
			const rfApi = rfApiRef.current;
			const container = canvasContainerRef.current;
			if (rfApi && container) {
				const rect = container.getBoundingClientRect();
				position = rfApi.screenToFlowPosition({
					x: rect.left + rect.width / 2,
					y: rect.top + rect.height / 2,
				});
			}

			const newWfNode: WorkflowNode = {
				id,
				type,
				label: meta.label,
				outputVar: `${meta.defaultOutputVar}_${wfNodesRef.current.length + 1}`,
				config: {
					...(meta.defaultConfig as unknown as Record<
						string,
						unknown
					>),
				} as unknown as WorkflowNode["config"],
				position,
			};
			setWfNodes((prev) => [...prev, newWfNode]);
			setRfNodes((prev) => [
				...prev,
				toRFNode(newWfNode, openSettingsRef.current),
			]);

			// Pan to the new node so it's clearly visible
			if (rfApi) {
				setTimeout(() => {
					rfApi.setCenter(position.x, position.y, {
						duration: 350,
						zoom: Math.max(rfApi.getZoom(), 0.75),
					});
				}, 50);
			}
		},
		[setRfNodes],
	);

	// ─── upstreamVars: BFS backward through edges ────────────────────────────────
	const buildAncestorSet = (nodeId: string): Set<string> => {
		const edges = wfEdgesRef.current;
		const inMap = new Map<string, string[]>();
		for (const e of edges) {
			if (!inMap.has(e.target)) inMap.set(e.target, []);
			inMap.get(e.target)?.push(e.source);
		}
		const ancestors = new Set<string>();
		const queue = [nodeId];
		let head = 0;
		while (head < queue.length) {
			const curr = queue[head++];
			for (const src of inMap.get(curr) ?? []) {
				if (!ancestors.has(src)) {
					ancestors.add(src);
					queue.push(src);
				}
			}
		}
		return ancestors;
	};

	const upstreamVarsFor = useCallback(
		(nodeId: string): string[] => {
			const ancestors = buildAncestorSet(nodeId);
			const vars: string[] = [];
			for (const n of wfNodesRef.current) {
				if (!ancestors.has(n.id)) continue;
				if (n.outputVar) vars.push(n.outputVar);
				// set-variable nodes expose their declared names directly into scope
				if (n.type === "set-variable") {
					const declared =
						(n.config as { variables?: Record<string, string> })
							?.variables ?? {};
					vars.push(...Object.keys(declared).filter(Boolean));
				}
			}
			return [...new Set(vars)];
		},
		// biome-ignore lint/correctness/useExhaustiveDependencies: using ref
		[wfEdges],
	);

	/** Variable names declared by upstream set-variable nodes — used as key picker in SetVariableForm. */
	const upstreamSetVarNamesFor = useCallback(
		(nodeId: string): string[] => {
			const ancestors = buildAncestorSet(nodeId);
			const names = new Set<string>();
			for (const n of wfNodesRef.current) {
				if (!ancestors.has(n.id) || n.type !== "set-variable") continue;
				const vars =
					(n.config as { variables?: Record<string, string> })
						?.variables ?? {};
				for (const k of Object.keys(vars)) {
					if (k) names.add(k);
				}
			}
			return [...names];
		},
		// biome-ignore lint/correctness/useExhaustiveDependencies: using ref
		[wfEdges],
	);

	// ─── save ─────────────────────────────────────────────────────────────────────
	const save = useCallback(async () => {
		setSaving(true);
		try {
			const nodesWithPixel = wfNodesRef.current.map((wn) => ({
				...wn,
				builtPixel: buildPixelPreview(wn),
			}));
			const doc: WorkflowDocument = {
				version: 1,
				graph: { nodes: nodesWithPixel, edges: wfEdgesRef.current },
			};
			const json = encodeURIComponent(JSON.stringify(doc));
			await monolithStore.runQuery(
				`SaveWorkflow(project=["${appId}"], json=["${json}"]);`,
			);
			setIsDirty(false);
			toast.success("Workflow saved");
		} catch {
			toast.error("Save failed");
		} finally {
			setSaving(false);
		}
	}, [appId, monolithStore]);

	// ─── dirty tracking & auto-save ───────────────────────────────────────────────
	useEffect(() => {
		// Skip the very first render (initial data load) by checking prev refs
		if (
			prevWfNodesRef.current === null &&
			prevWfEdgesRef.current === null
		) {
			prevWfNodesRef.current = wfNodes;
			prevWfEdgesRef.current = wfEdges;
			return;
		}
		prevWfNodesRef.current = wfNodes;
		prevWfEdgesRef.current = wfEdges;
		setIsDirty(true);
	}, [wfNodes, wfEdges]);

	useEffect(() => {
		if (!isDirty || saving) return;
		if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
		autoSaveTimerRef.current = setTimeout(save, 5000);
		return () => {
			if (autoSaveTimerRef.current)
				clearTimeout(autoSaveTimerRef.current);
		};
	}, [wfNodes, wfEdges, isDirty, saving, save]);

	useEffect(() => {
		if (!isDirty) return;
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault();
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [isDirty]);

	// ─── run / poll ───────────────────────────────────────────────────────────────
	const applyRunData = useCallback((runData: WorkflowRunData) => {
		const newOutputs: Record<string, string> = {};
		for (const result of runData.nodeResults ?? []) {
			const node = wfNodesRef.current.find(
				(n) => n.id === result.NODE_ID,
			);
			if (result.OUTPUT_PREVIEW && node?.outputVar) {
				newOutputs[node.outputVar] = result.OUTPUT_PREVIEW;
			}
		}
		if (Object.keys(newOutputs).length > 0) {
			setNodeOutputsState((prev) => ({ ...prev, ...newOutputs }));
		}
		setRunStatus(runData.STATUS);
	}, []);

	const pollRun = useCallback(
		async (runId: string, token: { cancelled: boolean }) => {
			while (!token.cancelled) {
				await new Promise<void>((r) =>
					setTimeout(r, RUN_POLL_INTERVAL_MS),
				);
				if (token.cancelled) return;
				try {
					const response = await monolithStore.runQuery(
						`GetWorkflowRun(project=["${appId}"], runId=["${runId}"]);`,
					);
					const runData = response.pixelReturn?.[0]
						?.output as WorkflowRunData | null;
					if (!runData || token.cancelled) continue;
					applyRunData(runData);
					if (runData.STATUS !== "RUNNING") {
						if (runData.STATUS === "SUCCESS")
							toast.success("Workflow completed");
						else if (runData.STATUS === "FAILED")
							toast.error(
								runData.ERROR_MESSAGE ?? "Workflow failed",
							);
						else if (runData.STATUS === "CANCELLED")
							toast.info("Workflow cancelled");
						setRunning(false);
						return;
					}
				} catch (error) {
					if (token.cancelled) return;
					toast.error(
						`Lost connection: ${(error as Error).message ?? "Unknown error"}`,
					);
					setRunning(false);
					return;
				}
			}
		},
		[appId, applyRunData, monolithStore],
	);

	// ─── floating node detection ─────────────────────────────────────────────────
	const floatingNodeIds = useMemo<Set<string>>(() => {
		const trigger = wfNodes.find((n) => n.type === "trigger");
		if (!trigger || wfNodes.length <= 1) return new Set();
		const outMap = new Map<string, string[]>();
		for (const e of wfEdges) {
			if (!outMap.has(e.source)) outMap.set(e.source, []);
			outMap.get(e.source)?.push(e.target);
		}
		const reachable = new Set<string>();
		const queue = [trigger.id];
		while (queue.length > 0) {
			const curr = queue.shift()!;
			if (reachable.has(curr)) continue;
			reachable.add(curr);
			for (const next of outMap.get(curr) ?? []) queue.push(next);
		}
		const floating = new Set<string>();
		for (const n of wfNodes) {
			if (n.type !== "trigger" && !reachable.has(n.id))
				floating.add(n.id);
		}
		return floating;
	}, [wfNodes, wfEdges]);

	// Directly stamp floatingWarning into the Zustand store so ReactFlow re-renders cards
	useEffect(() => {
		setRfNodes((prev) =>
			prev.map((n) => ({
				...n,
				data: {
					...n.data,
					floatingWarning:
						showFloatingWarnings && floatingNodeIds.has(n.id),
				},
			})),
		);
	}, [showFloatingWarnings, floatingNodeIds, setRfNodes]);

	// Clear the warning flag once all floating nodes are resolved
	useEffect(() => {
		if (showFloatingWarnings && floatingNodeIds.size === 0) {
			setShowFloatingWarnings(false);
		}
	}, [floatingNodeIds, showFloatingWarnings]);

	const run = useCallback(async () => {
		if (wfNodesRef.current.length === 0) return;
		// Check floating nodes first so they always get highlighted regardless of config state
		const triggerNode = wfNodesRef.current.find(
			(n) => n.type === "trigger",
		);
		if (triggerNode) {
			const outMap = new Map<string, string[]>();
			for (const e of wfEdgesRef.current) {
				if (!outMap.has(e.source)) outMap.set(e.source, []);
				outMap.get(e.source)?.push(e.target);
			}
			const reachable = new Set<string>([triggerNode.id]);
			const queue = [triggerNode.id];
			while (queue.length > 0) {
				const curr = queue.shift()!;
				for (const next of outMap.get(curr) ?? []) {
					if (!reachable.has(next)) {
						reachable.add(next);
						queue.push(next);
					}
				}
			}
			const floating = wfNodesRef.current.filter(
				(n) => n.type !== "trigger" && !reachable.has(n.id),
			);
			if (floating.length > 0) {
				setShowFloatingWarnings(true);
				toast.error(
					`Disconnected from trigger: ${floating.map((n) => `"${n.label}"`).join(", ")}`,
				);
				return;
			}
		}
		const unready = wfNodesRef.current
			.filter((n) => n.type !== "trigger")
			.filter((n) => !isNodeReady(n));
		if (unready.length > 0) {
			toast.error(
				`Configure before running: ${unready.map((n) => `"${n.label}"`).join(", ")}`,
			);
			return;
		}
		if (pollTokenRef.current) pollTokenRef.current.cancelled = true;
		setRunning(true);
		setRunStatus(null);
		try {
			const result = await monolithStore.runQuery(
				`TriggerWorkflow(project=["${appId}"], manual=["true"]);`,
			);
			const runData = result.pixelReturn?.[0]
				?.output as WorkflowRunData | null;
			if (!runData) {
				toast.error("Workflow run returned no data");
				setRunning(false);
				return;
			}
			applyRunData(runData);
			if (runData.STATUS === "RUNNING" && runData.RUN_ID) {
				const token = { cancelled: false };
				pollTokenRef.current = token;
				pollRun(runData.RUN_ID, token);
				return;
			}
			if (runData.STATUS === "FAILED")
				toast.error(runData.ERROR_MESSAGE ?? "Workflow failed");
			setRunning(false);
		} catch (error) {
			toast.error(
				`Workflow failed: ${(error as Error).message ?? "Unknown error"}`,
			);
			setRunning(false);
		}
	}, [appId, applyRunData, pollRun, monolithStore]);

	// ─── accumulated test scope ───────────────────────────────────────────────────
	// Maps outputVar → value across all tested nodes + actual run outputs.
	// Used so individual node tests can reference each other's results via ${var}.
	const testScope = useMemo<Record<string, string>>(() => {
		const scope: Record<string, string> = { ...nodeOutputs };
		for (const node of wfNodes) {
			const raw = testOutputs[node.id];
			if (raw != null && node.outputVar) {
				scope[node.outputVar] = raw;
			}
		}
		return scope;
	}, [wfNodes, testOutputs, nodeOutputs]);

	// ─── context value ────────────────────────────────────────────────────────────
	const contextValue = useMemo(
		() => ({
			enginesByType,
			getWfNode,
			onNodeUpdate,
			deleteNode,
			openSettings,
			nodeOutputs,
			setNodeOutput,
			testOutputs,
			setTestOutput,
			testScope,
		}),
		[
			enginesByType,
			getWfNode,
			onNodeUpdate,
			deleteNode,
			openSettings,
			nodeOutputs,
			setNodeOutput,
			testOutputs,
			setTestOutput,
			testScope,
		],
	);

	const settingsNode = settingsNodeId
		? wfNodes.find((n) => n.id === settingsNodeId)
		: null;

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<WorkflowWorkspaceContext.Provider value={contextValue}>
			<div className="flex h-full flex-col overflow-hidden">
				<WorkflowCanvasToolbar
					saving={saving}
					isDirty={isDirty}
					running={running}
					runStatus={runStatus}
					onSave={save}
					onRun={run}
				/>
				<div className="relative flex flex-1 overflow-hidden">
					<NodePalettePanel onAdd={addNode} />
					<div ref={canvasContainerRef} className="flex-1">
						<ReactFlow
							nodes={rfNodes}
							edges={rfEdges}
							nodeTypes={NODE_TYPES}
							edgeTypes={EDGE_TYPES}
							onNodesChange={handleNodesChange}
							onEdgesChange={handleEdgesChange}
							onConnect={onConnect}
							fitView
							proOptions={{ hideAttribution: true }}
							panOnScroll
							zoomOnScroll={false}
						>
							<FlowController apiRef={rfApiRef} />
							<Background
								variant={BackgroundVariant.Dots}
								gap={16}
								size={1}
								className="opacity-30"
							/>
							<Controls />
							<Panel
								position="bottom-left"
								style={{ marginLeft: "44px" }}
							>
								<p className="select-none px-2 py-1 text-[10px] text-muted-foreground/60">
									scroll: pan · shift+scroll: horizontal ·
									ctrl+scroll: zoom
								</p>
							</Panel>
						</ReactFlow>
					</div>
					{/* right sidebar: History + Settings tabs */}
					<div className="flex h-full w-[400px] shrink-0 flex-col border-l bg-background">
						<div className="flex shrink-0 border-b">
							<button
								type="button"
								onClick={() => setRightTab("history")}
								className={`flex-1 py-2.5 font-medium text-xs transition-colors ${
									rightTab === "history"
										? "border-primary border-b-2 text-primary"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								History
							</button>
							<button
								type="button"
								onClick={() =>
									settingsNode && setRightTab("settings")
								}
								className={`flex-1 py-2.5 font-medium text-xs transition-colors ${
									!settingsNode
										? "cursor-not-allowed text-muted-foreground/40"
										: rightTab === "settings"
											? "border-primary border-b-2 text-primary"
											: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Settings
							</button>
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto">
							{rightTab === "history" && (
								<WorkflowRunsTab
									appId={appId}
									onTrigger={run}
									triggering={running}
								/>
							)}
							{rightTab === "settings" && settingsNode && (
								<NodeSettingsPanel
									node={settingsNode}
									appId={appId}
									upstreamVars={upstreamVarsFor(
										settingsNode.id,
									)}
									knownVarNames={upstreamSetVarNamesFor(
										settingsNode.id,
									)}
									enginesByType={enginesByType}
									projects={projects}
									onUpdate={onNodeUpdate}
									onClose={() => {
										setSettingsNodeId(null);
										setRightTab("history");
									}}
								/>
							)}
							{rightTab === "settings" && !settingsNode && (
								<div className="flex flex-col items-center gap-2 py-16 text-center">
									<p className="text-muted-foreground text-sm">
										No node selected
									</p>
									<p className="text-muted-foreground/70 text-xs">
										Click a node's settings icon to
										configure it.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</WorkflowWorkspaceContext.Provider>
	);
}
