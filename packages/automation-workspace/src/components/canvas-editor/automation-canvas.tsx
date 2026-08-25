import {
	Background,
	BackgroundVariant,
	BaseEdge,
	type Connection,
	type Edge,
	EdgeLabelRenderer,
	type EdgeProps,
	getSmoothStepPath,
	MarkerType,
	type Node,
	ReactFlow,
	type ReactFlowInstance,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
	CheckCircle,
	Hand,
	HelpCircle,
	Loader2,
	Lock,
	MousePointer2,
	Play,
	RefreshCw,
	Save,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Switch,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type {
	AutomationEdge,
	AutomationNode,
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationToolContext,
	RunStatus,
	StepRunStatus,
} from "../../domain/automation.types";
import type {
	AutomationInspectorAction,
	AutomationInspectorSnapshot,
} from "../../domain/automation-inspector";
import type {
	AutomationWorkflowDocument,
	AutomationWorkflowNodeType,
	TriggerBinding,
} from "../../domain/automation-workflow.types";
import {
	canvasDocumentFromWorkflow,
	canvasDocumentToWorkflow,
	createCanvasWorkflowNode,
	createInitialCanvasWorkflowDocument,
	getCanvasNodeSources,
	validateCanvasWorkflowNode,
} from "../../domain/automation-workflow-adapter";
import { HelpModal } from "../form-editor/help-modal";
import { OnboardingTour } from "../form-editor/onboarding-tour";
import { AddNodeMenu } from "./add-node-menu";
import { AutomationDockLayout } from "./automation-dock-layout";
import { AutomationNode as AutomationNodeCard } from "./nodes/automation-node";
import { TriggerNode } from "./nodes/trigger-node";
import { RunBanner } from "./run-banner";
import { UndoBanner } from "./undo-banner";

// ---- React Flow custom node registry (must be outside component) ----
const nodeTypes = {
	trigger: TriggerNode,
	automation: AutomationNodeCard,
} as const;

interface DeletableEdgeData {
	onDelete: (edgeId: string) => void;
	readOnly?: boolean;
}

function DeletableEdge({
	id,
	sourceX,
	sourceY,
	sourcePosition,
	targetX,
	targetY,
	targetPosition,
	style,
	markerEnd,
	data,
}: EdgeProps<Edge<DeletableEdgeData>>) {
	const [edgePath, labelX, labelY] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	return (
		<>
			<BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
			<EdgeLabelRenderer>
				<button
					type="button"
					className={`nodrag nopan pointer-events-auto absolute size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:border-destructive/50 hover:text-destructive ${data?.readOnly ? "hidden" : "flex"}`}
					style={{
						transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
					}}
					onClick={() => data?.onDelete(id)}
					aria-label="Remove connection"
				>
					<X className="size-3" />
				</button>
			</EdgeLabelRenderer>
		</>
	);
}

const edgeTypes = {
	deletable: DeletableEdge,
} as const;

// ---- Layout constants ----
const NODE_WIDTH = 280;
const DEFAULT_NODE_HEIGHT = 120;
const NODE_ARROW_GAP = 40;

// ---- Types ----
interface AutomationCanvasProps {
	appId: string;
	readOnly?: boolean;
	mcpMode?: "edit" | "create" | null;
	mcpContext?: AutomationToolContext;
}

type TriggerAutomationOutput = AutomationRunDetail;

interface AutomationNodeStreamData {
	kind?: string;
	NODE_ID?: string;
	NODE_LABEL?: string;
	STATUS?: AutomationNodeResult["STATUS"];
	DURATION_MS?: number;
	OUTPUT_PREVIEW?: string | null;
	ERROR_MESSAGE?: string | null;
}

interface CanvasWorkflowDraft {
	steps: AutomationNode[];
	edges: AutomationEdge[];
	description: string;
	triggerBindings: TriggerBinding[];
	savedAt: number;
}

function isWorkflowDocument(
	value: unknown,
): value is AutomationWorkflowDocument {
	if (!value || typeof value !== "object") return false;
	const document = value as Partial<AutomationWorkflowDocument>;
	return (
		document.formatVersion === 2 &&
		Array.isArray(document.triggerBindings) &&
		Array.isArray(document.graph?.nodes) &&
		Array.isArray(document.graph?.edges)
	);
}

// ---- Helpers ----
function ensureTriggerNode(nodes: AutomationNode[]): AutomationNode[] {
	let withTrigger = nodes.map((node) =>
		node.type === "trigger" && !node.workflowType
			? {
					...node,
					workflowType: "trigger.start" as const,
					workflowConfig: {},
					workflowCodeMode: "generated" as const,
				}
			: node,
	);
	if (!withTrigger.some((node) => node.workflowType === "trigger.start")) {
		withTrigger = [
			createCanvasWorkflowNode("trigger.start", 0),
			...withTrigger,
		];
	}

	// Starter definitions created before canvas positioning did not include
	// `position`. Start every unpositioned node at the origin so layoutNodes()
	// can place the full workflow after the canvas mounts.
	return withTrigger.map((node) =>
		node.position ? node : { ...node, position: { x: 0, y: 0 } },
	);
}

function encodeBase64(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function createsCycle(
	edges: AutomationEdge[],
	source: string,
	target: string,
): boolean {
	const nodesToVisit = [target];
	const visited = new Set<string>();

	while (nodesToVisit.length > 0) {
		const current = nodesToVisit.pop();
		if (!current || visited.has(current)) continue;
		if (current === source) return true;
		visited.add(current);
		for (const edge of edges) {
			if (edge.source === current) nodesToVisit.push(edge.target);
		}
	}

	return false;
}

function getControlOrderedSteps(
	steps: AutomationNode[],
	edges: AutomationEdge[],
): AutomationNode[] {
	const byId = new Map(steps.map((step) => [step.id, step]));
	const stepIds = new Set(steps.map((step) => step.id));
	const originalOrder = new Map(steps.map((step, index) => [step.id, index]));
	const incomingCounts = new Map(steps.map((step) => [step.id, 0]));
	const outgoing = new Map<string, string[]>(
		steps.map((step) => [step.id, []]),
	);

	for (const edge of edges) {
		if (!stepIds.has(edge.source) || !stepIds.has(edge.target)) continue;
		outgoing.get(edge.source)?.push(edge.target);
		incomingCounts.set(
			edge.target,
			(incomingCounts.get(edge.target) ?? 0) + 1,
		);
	}

	const queue = steps
		.filter((step) => incomingCounts.get(step.id) === 0)
		.map((step) => step.id);
	const orderedIds: string[] = [];

	while (queue.length > 0) {
		queue.sort(
			(left, right) =>
				(originalOrder.get(left) ?? 0) -
				(originalOrder.get(right) ?? 0),
		);
		const current = queue.shift();
		if (!current) continue;
		orderedIds.push(current);
		for (const target of outgoing.get(current) ?? []) {
			const remaining = (incomingCounts.get(target) ?? 0) - 1;
			incomingCounts.set(target, remaining);
			if (remaining === 0) queue.push(target);
		}
	}

	const ordered = orderedIds
		.map((id) => byId.get(id))
		.filter((step): step is AutomationNode => step !== undefined);
	const orderedIdSet = new Set(orderedIds);
	return [...ordered, ...steps.filter((step) => !orderedIdSet.has(step.id))];
}

function getStepDisplayOrder(
	steps: AutomationNode[],
	edges: AutomationEdge[],
): Map<string, number> {
	return new Map(
		getControlOrderedSteps(steps, edges)
			.filter((step) => step.workflowType !== "trigger.start")
			.map((step, index) => [step.id, index]),
	);
}

function graphStructureSignature(
	steps: AutomationNode[],
	edges: AutomationEdge[],
): string {
	const nodeIds = steps.map((step) => step.id).sort();
	const edgeKeys = edges
		.map((edge) => `${edge.kind}:${edge.source}:${edge.target}`)
		.sort();
	return JSON.stringify([nodeIds, edgeKeys]);
}

function upstreamVariablesFor(
	steps: AutomationNode[],
	edges: AutomationEdge[],
	targetId: string,
): string[] {
	const byId = new Map(steps.map((step) => [step.id, step]));
	const trigger = steps.find((step) => step.workflowType === "trigger.start");
	const triggerGlobals = Array.isArray(trigger?.workflowConfig?.globals)
		? trigger.workflowConfig.globals
				.map((global) =>
					typeof global === "object" &&
					global !== null &&
					typeof global.name === "string"
						? global.name
						: null,
				)
				.filter((name): name is string => name !== null)
		: [];
	const incoming = new Map<string, string>();

	for (const edge of edges) {
		if (edge.kind === "control") incoming.set(edge.target, edge.source);
	}

	const outputVars: string[] = [];
	const visited = new Set<string>();
	let currentId = incoming.get(targetId);
	while (currentId && !visited.has(currentId)) {
		visited.add(currentId);
		const step = byId.get(currentId);
		if (
			step?.workflowType !== "trigger.start" &&
			typeof step?.outputVar === "string" &&
			step.outputVar.length > 0
		) {
			outputVars.unshift(step.outputVar);
		}
		currentId = incoming.get(currentId);
	}

	return [...triggerGlobals, ...outputVars];
}

// ---- Component ----
export function AutomationCanvas({
	appId,
	readOnly = false,
	mcpMode,
	mcpContext,
}: AutomationCanvasProps) {
	const [saving, setSaving] = useState(false);
	const [description, setDescription] = useState("");
	const [devMode, setDevMode] = useState(
		() => localStorage.getItem(`automation-devmode-${appId}`) === "true",
	);
	const [activeDockTab, setActiveDockTab] = useState<
		"inspector" | "validation"
	>("inspector");
	const [running, setRunning] = useState(false);
	const [stepStatuses, setStepStatuses] = useState<
		Record<string, StepRunStatus>
	>({});
	const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
	const [stepDurations, setStepDurations] = useState<Record<string, number>>(
		{},
	);
	const [steps, setSteps] = useState<AutomationNode[]>(
		() => createInitialCanvasWorkflowDocument().steps,
	);
	const [graphEdges, setGraphEdges] = useState<AutomationEdge[]>([]);
	const [triggerBindings, setTriggerBindings] = useState<TriggerBinding[]>(
		() => createInitialCanvasWorkflowDocument().triggerBindings,
	);
	const [workflowRefreshToken, setWorkflowRefreshToken] = useState(0);
	const [showAddMenu, setShowAddMenu] = useState(false);
	const [addAfterStepId, setAddAfterStepId] = useState<string | null>(null);

	// Drawer state — which step is being edited
	const [editingStepId, setEditingStepId] = useState<string | null>(null);
	const [canvasMode, setCanvasMode] = useState<"interact" | "pan">(
		"interact",
	);
	const editingStep = useMemo(
		() => steps.find((s) => s.id === editingStepId) ?? null,
		[steps, editingStepId],
	);
	const [latestRunStatus, setLatestRunStatus] = useState<RunStatus | null>(
		null,
	);
	const [latestRunResults, setLatestRunResults] = useState<
		AutomationNodeResult[]
	>([]);
	const [aiRunSummary, setAiRunSummary] = useState<string | null>(null);
	const [generatingAiSummary, setGeneratingAiSummary] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const [mcpDone, setMcpDone] = useState(false);
	const [undoSnapshot, setUndoSnapshot] = useState<AutomationNode[] | null>(
		null,
	);
	const [showHelp, setShowHelp] = useState(false);
	const hasRunnableSteps = steps.some(
		(step) => step.workflowType !== "trigger.start",
	);
	const stepDisplayOrder = useMemo(
		() => getStepDisplayOrder(steps, graphEdges),
		[graphEdges, steps],
	);

	useEffect(() => {
		const parentOrigin = new URLSearchParams(window.location.search).get(
			"parentOrigin",
		);
		if (!parentOrigin || window.parent === window) return;
		window.parent.postMessage(
			{
				type: "SEMOSS_AUTOMATION_TRACE",
				snapshot: {
					running,
					latestRunStatus,
					aiRunSummary,
					generatingAiSummary,
					steps,
					results: latestRunResults,
				},
			},
			parentOrigin,
		);
	}, [
		aiRunSummary,
		generatingAiSummary,
		latestRunResults,
		latestRunStatus,
		running,
		steps,
	]);

	useEffect(() => {
		const parentOrigin = new URLSearchParams(window.location.search).get(
			"parentOrigin",
		);
		if (!parentOrigin || window.parent === window) return;
		window.parent.postMessage(
			{
				type: "SEMOSS_AUTOMATION_DIRTY_STATE",
				projectId: appId,
				isDirty,
			},
			parentOrigin,
		);
	}, [appId, isDirty]);

	useEffect(() => {
		if (!isDirty) return;
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () =>
			window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty]);

	const notifyHistoryChanged = useCallback(() => {
		const parentOrigin = new URLSearchParams(window.location.search).get(
			"parentOrigin",
		);
		if (!parentOrigin || window.parent === window) return;
		window.parent.postMessage(
			{
				type: "SEMOSS_AUTOMATION_HISTORY_REFRESH",
				projectId: appId,
			},
			parentOrigin,
		);
	}, [appId]);

	useEffect(() => {
		if (editingStepId) setActiveDockTab("inspector");
	}, [editingStepId]);
	const loadedRef = useRef(false);
	const skipDraftPersistenceRef = useRef(true);
	const initialLayoutAppliedRef = useRef(false);
	const [workflowLoaded, setWorkflowLoaded] = useState(false);

	// React Flow state
	const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState<Node>([]);
	const [rfEdges, setRfEdges] = useEdgesState<Edge>([]);
	const canvasContainerRef = useRef<HTMLDivElement>(null);
	const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
	const [canvasInitialized, setCanvasInitialized] = useState(false);
	const centerXRef = useRef(0);
	const initialViewFittedRef = useRef(false);
	const loadedGraphStructureRef = useRef<{
		appId: string;
		signature: string;
	} | null>(null);

	useEffect(() => {
		const parentOrigin = new URLSearchParams(window.location.search).get(
			"parentOrigin",
		);
		const handleMessage = (event: MessageEvent<unknown>) => {
			if (
				event.source !== window.parent ||
				(parentOrigin !== null && event.origin !== parentOrigin) ||
				typeof event.data !== "object" ||
				event.data === null
			) {
				return;
			}
			const message = event.data as {
				type?: unknown;
				projectId?: unknown;
			};
			if (
				message.type !== "SEMOSS_AUTOMATION_REFRESH" ||
				message.projectId !== appId
			) {
				return;
			}
			if (isDirty) {
				toast.error(
					"The automation changed outside the editor. Your unsaved draft was preserved; save it before refreshing.",
				);
				return;
			}

			localStorage.removeItem(`automation-draft-${appId}`);
			setEditingStepId(null);
			setWorkflowRefreshToken((value) => value + 1);
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [appId, isDirty]);

	const getNodeHeight = useCallback((nodeId: string): number => {
		const nodeElements =
			canvasContainerRef.current?.querySelectorAll<HTMLElement>(
				".react-flow__node",
			);
		const nodeElement = Array.from(nodeElements ?? []).find(
			(element) => element.dataset.id === nodeId,
		);
		return nodeElement?.offsetHeight ?? DEFAULT_NODE_HEIGHT;
	}, []);

	const onConnect = useCallback(
		(connection: Connection) => {
			if (readOnly) return;
			if (
				!connection.source ||
				!connection.target ||
				connection.source === connection.target
			) {
				return;
			}
			const source = steps.find((step) => step.id === connection.source);
			const target = steps.find((step) => step.id === connection.target);
			if (!source || !target || target.type === "trigger") {
				toast.error(
					"Connections must flow from the trigger or an action.",
				);
				return;
			}
			setGraphEdges((previous) => {
				if (
					previous.some(
						(edge) =>
							edge.source === connection.source &&
							edge.target === connection.target,
					)
				) {
					return previous;
				}
				if (
					createsCycle(
						previous,
						connection.source as string,
						connection.target as string,
					)
				) {
					toast.error("Automations must remain an acyclic graph.");
					return previous;
				}
				return [
					...previous,
					{
						id: `e-${connection.source}-${connection.target}-${crypto.randomUUID()}`,
						source: connection.source,
						target: connection.target,
						sourceHandle:
							connection.sourceHandle ??
							`out-${connection.source}`,
						targetHandle:
							connection.targetHandle ??
							`in-${connection.target}`,
						kind: "control",
					},
				];
			});
		},
		[readOnly, steps],
	);

	const deleteEdge = useCallback((edgeId: string) => {
		setGraphEdges((previous) =>
			previous.filter((edge) => edge.id !== edgeId),
		);
	}, []);

	const layoutNodes = useCallback(
		(
			nodes: AutomationNode[],
			edges: AutomationEdge[],
		): AutomationNode[] => {
			const containerWidth =
				canvasContainerRef.current?.clientWidth ?? 900;
			const centerX = Math.max(
				0,
				Math.floor((containerWidth - NODE_WIDTH) / 2),
			);
			centerXRef.current = centerX;

			const positions = new Map<string, { x: number; y: number }>();
			let y = 0;
			for (const node of getControlOrderedSteps(nodes, edges)) {
				positions.set(node.id, { x: centerX, y });
				y += getNodeHeight(node.id) + NODE_ARROW_GAP;
			}
			return nodes.map((node) => ({
				...node,
				position: positions.get(node.id) ?? node.position,
			}));
		},
		[getNodeHeight],
	);

	// ---- Workflow definition loading ----
	useEffect(() => {
		let cancelled = false;
		loadedRef.current = false;
		setWorkflowLoaded(false);
		initialLayoutAppliedRef.current = false;
		skipDraftPersistenceRef.current = true;
		initialViewFittedRef.current = false;
		void runPixel(`GetAutomation(project=${JSON.stringify([appId])});`)
			.then((response) => {
				if (cancelled) return;
				const output = response.pixelReturn?.[0]?.output as
					| (AutomationWorkflowDocument & {
							nodeSources?: Record<string, string>;
					  })
					| undefined;
				const saved = isWorkflowDocument(output)
					? canvasDocumentFromWorkflow(output, output.nodeSources)
					: createInitialCanvasWorkflowDocument();
				const loadedSteps = ensureTriggerNode(saved.steps);
				const signature = graphStructureSignature(
					loadedSteps,
					saved.edges,
				);
				const previousStructure = loadedGraphStructureRef.current;
				const structureChanged =
					previousStructure?.appId === appId &&
					previousStructure.signature !== signature;
				loadedGraphStructureRef.current = { appId, signature };
				const rawDraft = localStorage.getItem(
					`automation-draft-${appId}`,
				);
				if (
					rawDraft &&
					!readOnly &&
					!mcpMode &&
					workflowRefreshToken === 0
				) {
					try {
						const draft = JSON.parse(
							rawDraft,
						) as CanvasWorkflowDraft;
						setSteps(ensureTriggerNode(draft.steps));
						setGraphEdges(draft.edges);
						setDescription(draft.description);
						setTriggerBindings(draft.triggerBindings);
						setIsDirty(true);
						toast.success(
							"Draft restored from your previous session",
						);
						return;
					} catch {
						localStorage.removeItem(`automation-draft-${appId}`);
					}
				}
				setSteps(
					structureChanged
						? layoutNodes(loadedSteps, saved.edges)
						: loadedSteps,
				);
				setGraphEdges(saved.edges);
				setDescription(saved.description);
				setTriggerBindings(saved.triggerBindings);
				setIsDirty(false);
			})
			.catch((error: Error) => {
				if (!cancelled) {
					toast.error(
						error.message ||
							"Unable to load this Python automation.",
					);
					const initial = createInitialCanvasWorkflowDocument();
					setSteps(initial.steps);
					setGraphEdges(initial.edges);
					setDescription(initial.description);
					setTriggerBindings(initial.triggerBindings);
				}
			})
			.finally(() => {
				if (!cancelled) {
					loadedRef.current = true;
					setWorkflowLoaded(true);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [appId, layoutNodes, mcpMode, readOnly, workflowRefreshToken]);

	useEffect(() => {
		if (
			!workflowLoaded ||
			!canvasInitialized ||
			initialLayoutAppliedRef.current ||
			steps.length === 0
		)
			return;
		initialLayoutAppliedRef.current = true;
		initialViewFittedRef.current = false;
		setSteps((previous) => layoutNodes(previous, graphEdges));
	}, [
		canvasInitialized,
		graphEdges,
		layoutNodes,
		steps.length,
		workflowLoaded,
	]);

	// Draft persistence
	useEffect(() => {
		if (!loadedRef.current || readOnly) return;
		if (skipDraftPersistenceRef.current) {
			skipDraftPersistenceRef.current = false;
			return;
		}
		const draft = {
			steps,
			edges: graphEdges,
			description,
			triggerBindings,
			savedAt: Date.now(),
		};
		localStorage.setItem(
			`automation-draft-${appId}`,
			JSON.stringify(draft),
		);
		setIsDirty(true);
	}, [steps, graphEdges, description, triggerBindings, appId, readOnly]);

	// ---- Derived values ----
	const stepOutputPreviews = useMemo(
		() =>
			Object.fromEntries(
				latestRunResults
					.filter((r) => r.OUTPUT_PREVIEW != null)
					.map((r) => [r.NODE_ID, r.OUTPUT_PREVIEW as string]),
			),
		[latestRunResults],
	);

	const validationIssues = useMemo(
		() =>
			steps.flatMap((step) => {
				if (step.workflowType === "trigger.start") return [];
				const issues = validateCanvasWorkflowNode(step);
				return issues.length > 0 ? [{ step, issues }] : [];
			}),
		[steps],
	);
	const incompleteCount = validationIssues.length;

	useEffect(() => {
		if (incompleteCount === 0 && activeDockTab === "validation") {
			setActiveDockTab("inspector");
		}
	}, [activeDockTab, incompleteCount]);

	// ---- Callbacks ----
	const handleDevModeChange = useCallback(
		(value: boolean) => {
			if (readOnly) return;
			setDevMode(value);
			localStorage.setItem(`automation-devmode-${appId}`, String(value));
		},
		[appId, readOnly],
	);

	const addStep = useCallback(
		(type: AutomationWorkflowNodeType) => {
			if (readOnly) return;
			const previousStep =
				steps.find((step) => step.id === addAfterStepId) ??
				steps[steps.length - 1];
			const newStep = createCanvasWorkflowNode(type, steps.length);
			const id = newStep.id;
			newStep.position = {
				x: previousStep?.position.x ?? centerXRef.current,
				y: previousStep
					? previousStep.position.y +
						getNodeHeight(previousStep.id) +
						NODE_ARROW_GAP
					: 0,
			};
			setSteps((previous) => [...previous, newStep]);
			if (previousStep) {
				setGraphEdges((previous) => [
					...previous,
					{
						id: `e-${previousStep.id}-${id}`,
						source: previousStep.id,
						target: id,
						sourceHandle: `out-${previousStep.id}`,
						targetHandle: `in-${id}`,
						kind: "control",
					},
				]);
			}
			setShowAddMenu(false);
			setAddAfterStepId(null);
			setEditingStepId(id);
		},
		[addAfterStepId, getNodeHeight, readOnly, steps],
	);

	const updateStep = useCallback((updated: AutomationNode) => {
		setSteps((previous) =>
			previous.map((step) => (step.id === updated.id ? updated : step)),
		);
		if (validateCanvasWorkflowNode(updated).length === 0) {
			setStepErrors((previous) => {
				const next = { ...previous };
				delete next[updated.id];
				return next;
			});
			setStepStatuses((previous) => {
				if (previous[updated.id] !== "error") return previous;
				const next = { ...previous };
				delete next[updated.id];
				return next;
			});
		}
	}, []);

	const deleteStep = useCallback((id: string) => {
		setSteps((prev) => prev.filter((s) => s.id !== id));
		setGraphEdges((previous) => {
			const predecessors = previous
				.filter((edge) => edge.target === id)
				.map((edge) => edge.source);
			const successors = previous
				.filter((edge) => edge.source === id)
				.map((edge) => edge.target);
			const remaining = previous.filter(
				(edge) => edge.source !== id && edge.target !== id,
			);

			for (const source of predecessors) {
				for (const target of successors) {
					if (
						source !== target &&
						!remaining.some(
							(edge) =>
								edge.source === source &&
								edge.target === target,
						)
					) {
						remaining.push({
							id: `e-${source}-${target}-${crypto.randomUUID()}`,
							source,
							target,
						});
					}
				}
			}
			return remaining;
		});
		setEditingStepId((prev) => (prev === id ? null : prev));
		setStepStatuses((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
		setStepErrors((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
		setStepDurations((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
		setLatestRunResults((prev) => prev.filter((r) => r.NODE_ID !== id));
	}, []);

	const upstreamVarsFor = useCallback(
		(stepId: string) => upstreamVariablesFor(steps, graphEdges, stepId),
		[graphEdges, steps],
	);

	useEffect(() => {
		const parentOrigin = new URLSearchParams(window.location.search).get(
			"parentOrigin",
		);
		if (!parentOrigin || window.parent === window) return;
		const snapshot: AutomationInspectorSnapshot = {
			description,
			devMode,
			editingStep,
			upstreamVars: editingStep ? upstreamVarsFor(editingStep.id) : [],
			stepRunStatus: editingStep
				? stepStatuses[editingStep.id]
				: undefined,
			stepRunError: editingStep ? stepErrors[editingStep.id] : undefined,
			stepRunOutput: editingStep
				? (stepOutputPreviews[editingStep.id] ?? null)
				: null,
		};
		window.parent.postMessage(
			{ type: "SEMOSS_AUTOMATION_INSPECTOR", snapshot },
			parentOrigin,
		);
	}, [
		description,
		devMode,
		editingStep,
		stepErrors,
		stepOutputPreviews,
		stepStatuses,
		upstreamVarsFor,
	]);

	useEffect(() => {
		const parentOrigin = new URLSearchParams(window.location.search).get(
			"parentOrigin",
		);
		const handleMessage = (event: MessageEvent<unknown>) => {
			if (
				event.source !== window.parent ||
				(parentOrigin !== null && event.origin !== parentOrigin) ||
				typeof event.data !== "object" ||
				event.data === null
			) {
				return;
			}
			const message = event.data as {
				type?: unknown;
				action?: AutomationInspectorAction;
			};
			if (
				message.type !== "SEMOSS_AUTOMATION_INSPECTOR_ACTION" ||
				!message.action
			) {
				return;
			}

			const action = message.action;
			if (readOnly && action.type !== "close") return;
			switch (action.type) {
				case "update-step":
					updateStep(action.step);
					break;
				case "delete-step":
					deleteStep(action.stepId);
					break;
				case "update-description":
					setDescription(action.description);
					break;
				case "update-dev-mode":
					handleDevModeChange(action.devMode);
					break;
				case "close":
					setEditingStepId(null);
					break;
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [deleteStep, handleDevModeChange, readOnly, updateStep]);

	const save = useCallback(async (): Promise<boolean> => {
		if (readOnly) {
			toast.error("You have read-only access to this automation.");
			return false;
		}
		const invalidSteps = steps.filter(
			(step) =>
				step.workflowType !== "trigger.start" &&
				validateCanvasWorkflowNode(step).length > 0,
		);
		if (invalidSteps.length > 0) {
			setEditingStepId(invalidSteps[0].id);
			toast.error(
				`Complete ${invalidSteps.length} step${invalidSteps.length === 1 ? "" : "s"} before saving`,
			);
			return false;
		}
		setSaving(true);
		try {
			const definition = canvasDocumentToWorkflow({
				description,
				triggerBindings,
				steps,
				edges: graphEdges,
			});
			const nodeSources = getCanvasNodeSources(steps);
			const definitionPayload = encodeBase64(JSON.stringify(definition));
			const nodeSourcesPayload = encodeBase64(
				JSON.stringify(nodeSources),
			);
			const response = await runPixel(
				`SaveAutomation(project=${JSON.stringify([appId])}, json=${JSON.stringify([definitionPayload])}, nodeSources=${JSON.stringify([nodeSourcesPayload])});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join("\n"));
			}
			const output = response.pixelReturn?.[0]?.output as
				| { nodeSources?: Record<string, string> }
				| undefined;
			if (output?.nodeSources) {
				skipDraftPersistenceRef.current = true;
				setSteps((previous) =>
					previous.map((step) => {
						const source = output.nodeSources?.[step.id];
						return typeof source === "string"
							? {
									...step,
									workflowConfig: {
										...step.workflowConfig,
										pythonSource: source,
									},
								}
							: step;
					}),
				);
			}
			localStorage.removeItem(`automation-draft-${appId}`);
			setIsDirty(false);
			toast.success("Automation saved");
			return true;
		} catch (error) {
			toast.error(
				`Save failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			return false;
		} finally {
			setSaving(false);
		}
	}, [appId, description, graphEdges, readOnly, steps, triggerBindings]);

	// Cmd+S / Ctrl+S
	useEffect(() => {
		if (readOnly) return;
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				void save();
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [readOnly, save]);

	const dismissRun = useCallback(() => {
		setLatestRunResults([]);
		setLatestRunStatus(null);
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setAiRunSummary(null);
	}, []);

	const applyRunData = useCallback(
		(runData: {
			STATUS: RunStatus;
			nodeResults?: AutomationNodeResult[];
		}) => {
			const nodeResults = runData.nodeResults ?? [];
			const resultByNodeId = new Map(
				nodeResults.map((result) => [result.NODE_ID, result]),
			);
			const statuses: Record<string, StepRunStatus> = {};
			const errors: Record<string, string> = {};
			const durations: Record<string, number> = {};
			for (const step of steps) {
				const result = resultByNodeId.get(step.id);
				if (!result) continue;
				statuses[step.id] =
					result.STATUS === "FAILED"
						? "error"
						: result.STATUS === "RUNNING"
							? "running"
							: result.STATUS === "SUCCESS"
								? "success"
								: "idle";
				if (result.ERROR_MESSAGE)
					errors[step.id] = result.ERROR_MESSAGE;
				if (typeof result.DURATION_MS === "number") {
					durations[step.id] = result.DURATION_MS;
				}
			}
			setStepStatuses(statuses);
			setStepErrors(errors);
			setStepDurations(durations);
			setLatestRunStatus(runData.STATUS);
			setLatestRunResults(nodeResults);
		},
		[steps],
	);

	const applyNodeProgress = useCallback(
		(progress: AutomationNodeStreamData) => {
			const { NODE_ID: nodeId, STATUS: status } = progress;
			if (!nodeId || !status) return;
			const stepStatus: StepRunStatus =
				status === "FAILED"
					? "error"
					: status === "RUNNING"
						? "running"
						: status === "SUCCESS"
							? "success"
							: "idle";
			setStepStatuses((previous) => ({
				...previous,
				[nodeId]: stepStatus,
			}));
			const errorMessage = progress.ERROR_MESSAGE;
			if (errorMessage) {
				setStepErrors((previous) => ({
					...previous,
					[nodeId]: errorMessage,
				}));
			}
			const durationMs = progress.DURATION_MS;
			if (typeof durationMs === "number") {
				setStepDurations((previous) => ({
					...previous,
					[nodeId]: durationMs,
				}));
			}
			setLatestRunResults((previous) => {
				const existing = previous.find(
					(result) => result.NODE_ID === nodeId,
				);
				const next: AutomationNodeResult = {
					NODE_ID: nodeId,
					NODE_LABEL:
						progress.NODE_LABEL ?? existing?.NODE_LABEL ?? nodeId,
					STATUS: status,
					DURATION_MS: durationMs ?? existing?.DURATION_MS ?? 0,
					OUTPUT_PREVIEW:
						progress.OUTPUT_PREVIEW ??
						existing?.OUTPUT_PREVIEW ??
						null,
					ERROR_MESSAGE:
						progress.ERROR_MESSAGE ??
						existing?.ERROR_MESSAGE ??
						null,
				};
				return existing
					? previous.map((result) =>
							result.NODE_ID === nodeId ? next : result,
						)
					: [...previous, next];
			});
		},
		[],
	);

	const run = useCallback(async () => {
		if (readOnly) {
			toast.error("You have read-only access to this automation.");
			return;
		}
		const invalidSteps = steps.filter(
			(step) =>
				step.workflowType !== "trigger.start" &&
				validateCanvasWorkflowNode(step).length > 0,
		);
		if (invalidSteps.length > 0) {
			toast.error(
				`Fix ${invalidSteps.length} step${invalidSteps.length === 1 ? "" : "s"} before running`,
			);
			setActiveDockTab("validation");
			return;
		}
		if (!(await save())) return;

		setRunning(true);
		setAiRunSummary(null);
		setGeneratingAiSummary(false);
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setLatestRunStatus("RUNNING");
		setLatestRunResults([]);
		try {
			const { jobId } = await runPixelAsync(
				`TriggerAutomation(project=${JSON.stringify([appId])});`,
			);
			if (!jobId) throw new Error("Automation did not return a job ID.");

			let complete = false;
			while (!complete) {
				const stream = await getPixelJobStreaming(jobId);
				for (const message of stream.message) {
					const event = message as unknown as {
						stream_type?: string;
						data?: AutomationNodeStreamData;
					};
					if (
						event.stream_type === "automation" &&
						event.data?.kind === "node-status"
					) {
						applyNodeProgress(event.data);
					}
				}

				if (
					stream.status === "Complete" ||
					stream.status === "ProgressComplete"
				) {
					complete = true;
				} else if (stream.status === "Error") {
					throw new Error("Automation job failed.");
				} else if (stream.status === "Canceled") {
					throw new Error("Automation job ended before completion.");
				} else {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}

			const asyncResult =
				await getPixelAsyncResult<[TriggerAutomationOutput]>(jobId);
			if (asyncResult.errors.length > 0) {
				throw new Error(asyncResult.errors.join(""));
			}
			const finalDetail = asyncResult.results[0]?.output;
			if (!finalDetail?.RUN_ID || !finalDetail.STATUS) {
				throw new Error(
					"Automation did not return completed run details.",
				);
			}
			applyRunData(finalDetail);
			setAiRunSummary(finalDetail.RESULT_SUMMARY ?? null);
			notifyHistoryChanged();
			if (finalDetail.STATUS === "SUCCESS") {
				toast.success(
					finalDetail.RESULT_SUMMARY ?? "Automation completed",
				);
			} else {
				toast.error(finalDetail.ERROR_MESSAGE ?? "Automation failed");
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Automation failed";
			setLatestRunStatus("FAILED");
			setAiRunSummary(null);
			toast.error(message);
		} finally {
			setRunning(false);
		}
	}, [
		appId,
		applyNodeProgress,
		applyRunData,
		notifyHistoryChanged,
		readOnly,
		save,
		steps,
	]);

	const handleDoneReturnToChat = useCallback(async () => {
		if (readOnly || saving) return;
		if (!mcpContext) return;
		if (isDirty) {
			const saved = await save();
			if (!saved) return;
		}
		const nodeCount = steps.filter((n) => n.type !== "trigger").length;
		const label = description.trim() || appId;
		const response = `Automation "${label}" ${mcpMode === "create" ? "created" : "updated"} successfully with ${nodeCount} step${nodeCount !== 1 ? "s" : ""}. Project ID: ${appId}`;
		window.parent.postMessage(
			{
				type: "SMSS_EXEC_TOOL",
				tool: {
					type: "MCP",
					id: mcpContext.id,
					name: mcpContext.name,
					message: mcpContext.message,
					roomId: mcpContext.roomId,
					response,
					tool_status: "success",
					executedParameters: {
						...mcpContext.parameters,
						projectId: appId,
					},
				},
			},
			window.location.origin,
		);
		setMcpDone(true);
	}, [
		saving,
		readOnly,
		mcpContext,
		isDirty,
		save,
		steps,
		description,
		appId,
		mcpMode,
	]);

	const _takeToValidationStep = useCallback((stepId: string) => {
		setShowAddMenu(false);
		setEditingStepId(stepId);
		setActiveDockTab("inspector");
		reactFlowInstanceRef.current?.fitView({
			nodes: [{ id: stepId }],
			padding: 0.5,
			duration: 250,
		});
	}, []);

	// ---- React Flow node/edge sync ----
	useEffect(() => {
		if (!steps.length) return;

		// Compute center x from container width so nodes appear horizontally centered
		const containerWidth = canvasContainerRef.current?.clientWidth ?? 900;
		const centerX = Math.max(
			0,
			Math.floor((containerWidth - NODE_WIDTH) / 2),
		);
		centerXRef.current = centerX;

		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// Automations created before the canvas stored every node at the origin.
		// Lay those out once so subsequent drag positions can be persisted per node.
		if (
			steps.every(
				(step) => step.position.x === 0 && step.position.y === 0,
			)
		) {
			setSteps((previous) => layoutNodes(previous, graphEdges));
		}

		steps.forEach((step) => {
			if (step.type === "trigger") {
				newNodes.push({
					id: step.id,
					type: "trigger",
					position: step.position,
					data: {
						label: description.trim() || "Start",
						devMode,
						isLast:
							!readOnly &&
							!graphEdges.some((edge) => edge.source === step.id),
						onEdit: readOnly
							? undefined
							: () => {
									setShowAddMenu(false);
									setEditingStepId(step.id);
								},
						onAdd: () => {
							setEditingStepId(null);
							setAddAfterStepId(step.id);
							setShowAddMenu(true);
						},
					},
					draggable: true,
					style: { width: NODE_WIDTH },
				});
			} else {
				newNodes.push({
					id: step.id,
					type: "automation",
					position: step.position,
					data: {
						step,
						index: stepDisplayOrder.get(step.id) ?? 0,
						runStatus: stepStatuses[step.id],
						runError: stepErrors[step.id],
						runDuration: stepDurations[step.id],
						runOutput: stepOutputPreviews[step.id] ?? null,
						isIncomplete:
							validateCanvasWorkflowNode(step).length > 0 &&
							!stepStatuses[step.id],
						locked: running || readOnly,
						isLast: !graphEdges.some(
							(edge) => edge.source === step.id,
						),
						onEdit: () => {
							setShowAddMenu(false);
							setEditingStepId(step.id);
						},
						onDelete: () => deleteStep(step.id),
						onAdd: () => {
							setEditingStepId(null);
							setAddAfterStepId(step.id);
							setShowAddMenu(true);
						},
					},
					style: { width: NODE_WIDTH },
				});
			}

			for (const edge of graphEdges.filter(
				(item) => item.source === step.id,
			)) {
				newEdges.push({
					...edge,
					type: "deletable",
					markerEnd: {
						type: MarkerType.ArrowClosed,
						width: 12,
						height: 12,
						color: "#94a3b8",
					},
					style: { stroke: "#94a3b8", strokeWidth: 1.5 },
					data: { onDelete: deleteEdge, readOnly },
				});
			}
		});

		setRfNodes(newNodes);
		setRfEdges(newEdges);
	}, [
		steps,
		stepStatuses,
		stepErrors,
		stepDurations,
		stepOutputPreviews,
		description,
		devMode,
		running,
		readOnly,
		graphEdges,
		stepDisplayOrder,
		deleteStep,
		deleteEdge,
		layoutNodes,
		setRfNodes,
		setRfEdges,
	]);

	useEffect(() => {
		const initialNode =
			rfNodes.find((node) => node.type === "trigger") ?? rfNodes[0];
		if (
			initialViewFittedRef.current ||
			!canvasInitialized ||
			!initialNode
		) {
			return;
		}

		let frame = 0;
		let attempts = 0;
		const fitStartNode = () => {
			const nodeElement = canvasContainerRef.current?.querySelector(
				`.react-flow__node[data-id="${initialNode.id}"]`,
			);
			if (
				(!nodeElement ||
					!(nodeElement instanceof HTMLElement) ||
					nodeElement.offsetWidth === 0 ||
					nodeElement.offsetHeight === 0) &&
				attempts < 10
			) {
				attempts += 1;
				frame = requestAnimationFrame(fitStartNode);
				return;
			}
			if (!nodeElement) return;
			reactFlowInstanceRef.current?.fitView({
				nodes: [{ id: initialNode.id }],
				padding: 0.8,
				duration: 250,
			});
			initialViewFittedRef.current = true;
		};

		frame = requestAnimationFrame(fitStartNode);
		return () => cancelAnimationFrame(frame);
	}, [canvasInitialized, rfNodes]);

	// ---- Persist canvas positions ----
	const onNodeDragStop = useCallback(
		(_event: React.MouseEvent, draggedNode: Node) => {
			if (readOnly) return;
			setSteps((previousSteps) =>
				previousSteps.map((step) =>
					step.id === draggedNode.id
						? { ...step, position: { ...draggedNode.position } }
						: step,
				),
			);
			setIsDirty(true);
		},
		[readOnly],
	);

	const cleanUpLayout = useCallback(() => {
		initialViewFittedRef.current = false;
		if (readOnly) return;
		setSteps((previous) => layoutNodes(previous, graphEdges));
		setIsDirty(true);
	}, [graphEdges, layoutNodes, readOnly]);

	if (mcpDone) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
				<span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
					<CheckCircle className="h-7 w-7 text-primary" />
				</span>
				<div>
					<p className="font-semibold text-base">Automation saved</p>
					<p className="mt-1 text-muted-foreground text-sm">
						You can close this panel to return to the chat.
					</p>
				</div>
			</div>
		);
	}

	// ---- Normal canvas view ----
	return (
		<>
			<div className="flex h-full overflow-hidden">
				<div className="flex min-w-0 flex-1 flex-col bg-background">
					{/* ---- Content ---- */}
					<div className="flex-1 overflow-hidden">
						<AutomationDockLayout
							canvas={
								<div
									ref={canvasContainerRef}
									className="relative h-full"
								>
									{readOnly && (
										<div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-muted-foreground text-xs shadow-sm">
											<Lock className="size-3.5" />
											Read-only
										</div>
									)}
									{/* Banners row above the canvas */}
									{(running ||
										(latestRunStatus &&
											latestRunStatus !== "RUNNING") ||
										undoSnapshot) && (
										<div className="absolute inset-x-0 top-0 z-20 space-y-2 px-4 pt-3">
											{running && (
												<div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-primary text-xs">
													<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
													Running…
												</div>
											)}
											{!running &&
												latestRunStatus &&
												latestRunStatus !==
													"RUNNING" && (
													<RunBanner
														status={latestRunStatus}
														aiSummary={aiRunSummary}
														generatingAiSummary={
															generatingAiSummary
														}
														onDismiss={dismissRun}
													/>
												)}
											{undoSnapshot && (
												<UndoBanner
													onUndo={() => {
														setSteps(undoSnapshot);
														setUndoSnapshot(null);
													}}
													onDismiss={() =>
														setUndoSnapshot(null)
													}
												/>
											)}
										</div>
									)}

									{/* Onboarding tour (fixed popovers) */}
									{!readOnly && (
										<OnboardingTour appId={appId} />
									)}

									{/* React Flow canvas */}
									{/* Suppress RF selection ring */}
									<style>{`.react-flow__node.selected{box-shadow:none!important;outline:none!important}`}</style>
									<ReactFlow
										nodes={rfNodes}
										edges={rfEdges}
										nodeTypes={nodeTypes as never}
										edgeTypes={edgeTypes as never}
										nodesDraggable={
											!readOnly &&
											canvasMode === "interact"
										}
										nodesConnectable={
											!readOnly &&
											canvasMode === "interact" &&
											!running
										}
										panOnDrag={canvasMode === "pan"}
										panOnScroll={canvasMode !== "pan"}
										zoomOnPinch
										zoomOnScroll={canvasMode === "pan"}
										minZoom={0.3}
										maxZoom={1.5}
										defaultEdgeOptions={{
											type: "smoothstep",
											animated: false,
										}}
										proOptions={{
											hideAttribution: true,
										}}
										className="h-full"
										onInit={(instance) => {
											reactFlowInstanceRef.current =
												instance;
											setCanvasInitialized(true);
										}}
										onNodeClick={
											canvasMode === "interact"
												? (_e, node) => {
														setShowAddMenu(false);
														setEditingStepId(
															node.id,
														);
													}
												: undefined
										}
										onNodesChange={onRfNodesChange}
										onNodeDragStop={onNodeDragStop}
										onPaneClick={() => {
											setShowAddMenu(false);
										}}
										onConnect={onConnect}
									>
										<Background
											variant={BackgroundVariant.Dots}
											gap={20}
											size={1}
											color="#cbd5e1"
										/>
									</ReactFlow>

									<div
										className={`absolute top-4 right-4 z-30 items-center gap-2 ${readOnly ? "hidden" : "flex"}`}
									>
										<div
											className="relative"
											data-tour="save"
										>
											<Button
												size="sm"
												variant="outline"
												className="bg-background shadow-sm"
												onClick={() =>
													void (mcpMode && mcpContext
														? handleDoneReturnToChat()
														: save())
												}
												disabled={saving}
											>
												<span className="relative mr-1.5">
													{saving ? (
														<Loader2 className="h-3.5 w-3.5 animate-spin" />
													) : (
														<Save className="h-3.5 w-3.5" />
													)}
													{isDirty && !saving && (
														<span className="-top-1 -right-1 absolute h-2 w-2 rounded-full bg-amber-500 ring-1 ring-background" />
													)}
												</span>
												{mcpMode && mcpContext
													? "Save — Return to Chat"
													: "Save"}
											</Button>
										</div>
										<Button
											data-tour="run"
											size="sm"
											className="shadow-sm"
											onClick={run}
											disabled={
												running || !hasRunnableSteps
											}
											title={
												!hasRunnableSteps
													? "Add at least one step before running"
													: undefined
											}
										>
											{running ? (
												<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
											) : (
												<Play className="mr-1.5 h-3.5 w-3.5" />
											)}
											Run
										</Button>
									</div>

									<div className="absolute bottom-4 left-4 z-10 flex items-center overflow-hidden rounded-lg border bg-background shadow-sm">
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													aria-label="Clean up node layout"
													onClick={cleanUpLayout}
													className={`${readOnly ? "hidden" : "flex"} items-center justify-center border-r p-2 text-muted-foreground transition-colors hover:bg-muted`}
												>
													<RefreshCw className="h-4 w-4" />
												</button>
											</TooltipTrigger>
											<TooltipContent side="top">
												Clean up layout
											</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													aria-label="Interact mode"
													onClick={() =>
														setCanvasMode(
															"interact",
														)
													}
													className={`flex items-center justify-center p-2 transition-colors ${canvasMode === "interact" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
												>
													<MousePointer2 className="h-4 w-4" />
												</button>
											</TooltipTrigger>
											<TooltipContent side="top">
												Interact mode — click nodes to
												edit (V)
											</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													aria-label="Pan mode"
													onClick={() =>
														setCanvasMode("pan")
													}
													className={`flex items-center justify-center p-2 transition-colors ${canvasMode === "pan" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
												>
													<Hand className="h-4 w-4" />
												</button>
											</TooltipTrigger>
											<TooltipContent side="top">
												Pan mode — drag to move canvas
												(H)
											</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex cursor-pointer items-center gap-1.5 border-l px-2 py-2 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground">
													<Switch
														checked={devMode}
														onCheckedChange={
															handleDevModeChange
														}
													/>
													Dev
												</div>
											</TooltipTrigger>
											<TooltipContent side="top">
												Show Python source editors on
												executable nodes
											</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													aria-label="Open automation help"
													onClick={() =>
														setShowHelp(true)
													}
													className="flex items-center gap-1.5 border-l px-2 py-2 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
												>
													<HelpCircle className="h-4 w-4" />
													Help
												</button>
											</TooltipTrigger>
											<TooltipContent side="top">
												Automation help
											</TooltipContent>
										</Tooltip>
									</div>
								</div>
							}
						/>
					</div>
				</div>
			</div>

			<Dialog
				open={!readOnly && showAddMenu}
				onOpenChange={setShowAddMenu}
			>
				<DialogContent className="flex h-[80vh] max-w-3xl flex-col p-0">
					<DialogHeader className="sr-only">
						<DialogTitle>Add workflow node</DialogTitle>
					</DialogHeader>
					<AddNodeMenu onSelect={addStep} />
				</DialogContent>
			</Dialog>

			{/* ---- Help modal ---- */}
			<HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
		</>
	);
}
