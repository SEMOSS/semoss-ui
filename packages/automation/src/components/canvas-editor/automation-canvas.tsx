import {
	Background,
	BackgroundVariant,
	type Connection,
	type Edge,
	MarkerType,
	type Node,
	ReactFlow,
	type ReactFlowInstance,
	SelectionMode,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { encodeTextToBase64 } from "@semoss/utility/encoding";

import "@xyflow/react/dist/style.css";
import {
	CheckCircle,
	Code2,
	Layers3,
	Loader2,
	Lock,
	Play,
	RefreshCw,
	Save,
	Scan,
	Workflow,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
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
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useTheme,
} from "@semoss/ui/next";
import { getAutomationRun, listAutomationRuns } from "../../api";
import { AutomationContext } from "../../contexts/automation.context";
import type {
	AutomationEdge,
	AutomationExecutedDefinition,
	AutomationNode,
	AutomationNodeResult,
	AutomationNodeTrace,
	AutomationRunDetail,
	AutomationToolContext,
	RoutingConfig,
	RunStatus,
	StepRunStatus,
} from "../../domain/automation.types";
import {
	type AutomationInspectorAction,
	type AutomationInspectorSnapshot,
	type AutomationScopeEntry,
	declaredAutomationScopeEntries,
	inferNestedAutomationScopeEntries,
} from "../../domain/automation-inspector";
import { getAutomationNodeDefinition } from "../../domain/automation-node-catalog";
import { normalizeAutomationErrorMessage } from "../../domain/automation-utils";
import type {
	AutomationNodeGroup,
	AutomationWorkflowDocument,
	AutomationWorkflowNodeType,
	TriggerBinding,
} from "../../domain/automation-workflow.types";
import type { CanvasWorkflowDocument } from "../../domain/automation-workflow-adapter";
import {
	canvasDocumentFromWorkflow,
	canvasDocumentToWorkflow,
	createCanvasWorkflowNode,
	createInitialCanvasWorkflowDocument,
	getCanvasNodeSources,
	validateCanvasWorkflowConnections,
	validateCanvasWorkflowNode,
} from "../../domain/automation-workflow-adapter";
import { OnboardingTour } from "../form-editor/onboarding-tour";
import { AddNodeMenu } from "./add-node-menu";
import { AutomationDockLayout } from "./automation-dock-layout";
import { DeletableEdge } from "./deletable-edge";
import { getFlowStrokeColor, LOOP_PATH_HIGHLIGHT_COLOR } from "./flow-colors";
import {
	insertLoopBodyNode,
	type LoopBodyInsertionPoint,
	layoutLoopBodyNodes,
	removeLoopBodyNode,
} from "./loop-body-graph";
import { getLoopBodyScope } from "./loop-scope";
import { AutomationNode as AutomationNodeCard } from "./nodes/automation-node";
import { AutomationNodeGroupFrame } from "./nodes/automation-node-group";
import { BranchNode } from "./nodes/branch-node";
import { LoopNode } from "./nodes/loop-node";
import { TriggerNode } from "./nodes/trigger-node";
import type { AutomationTraceSnapshot } from "./tabs/runs-tab";
import { UndoBanner } from "./undo-banner";

const nodeTypes = {
	trigger: TriggerNode,
	automation: AutomationNodeCard,
	branch: BranchNode,
	loop: LoopNode,
	nodeGroup: AutomationNodeGroupFrame,
} as const;

const CHANGE_HIGHLIGHT_DURATION_MS = 2500;

type ChangeHighlight = { all: true } | { all: false; stepIds: Set<string> };

function isStepHighlighted(
	highlight: ChangeHighlight | null,
	stepId: string,
): boolean {
	if (!highlight) return false;
	if (highlight.all === true) return true;
	return highlight.stepIds.has(stepId);
}

function canAddToLoop(type: AutomationWorkflowNodeType): boolean {
	if (type === "trigger.start" || type === "control.loop") {
		return false;
	}
	return getAutomationNodeDefinition(type)?.category !== "agent";
}

function replaceOutputVariableReferences<T>(
	value: T,
	previousName: string,
	nextName: string,
): T {
	if (typeof value === "string") {
		return value.replaceAll(`\${${previousName}}`, `\${${nextName}}`) as T;
	}
	if (Array.isArray(value)) {
		return value.map((item) =>
			replaceOutputVariableReferences(item, previousName, nextName),
		) as T;
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(
				([key, item]) => [
					key,
					key === "pythonSource"
						? item
						: replaceOutputVariableReferences(
								item,
								previousName,
								nextName,
							),
				],
			),
		) as T;
	}
	return value;
}

function customSourceReferencesOutput(
	step: AutomationNode,
	outputVariable: string,
): boolean {
	if (step.workflowCodeMode !== "custom") return false;
	const source = step.workflowConfig?.pythonSource;
	if (typeof source !== "string") return false;
	return (
		source.includes(`\${${outputVariable}}`) ||
		source.includes(`scope["${outputVariable}"]`) ||
		source.includes(`scope['${outputVariable}']`) ||
		source.includes(`scope.get("${outputVariable}"`) ||
		source.includes(`scope.get('${outputVariable}'`)
	);
}

function automationValueReferencesOutput(
	value: unknown,
	outputVariable: string,
): boolean {
	if (typeof value === "string") {
		return value.includes(`\${${outputVariable}}`);
	}
	if (Array.isArray(value)) {
		return value.some((item) =>
			automationValueReferencesOutput(item, outputVariable),
		);
	}
	if (value && typeof value === "object") {
		return Object.values(value).some((item) =>
			automationValueReferencesOutput(item, outputVariable),
		);
	}
	return false;
}

function automationNodeReferencesOutput(
	node: AutomationNode,
	outputVariable: string,
): boolean {
	return (
		automationValueReferencesOutput(node.config, outputVariable) ||
		automationValueReferencesOutput(node.workflowConfig, outputVariable) ||
		customSourceReferencesOutput(node, outputVariable) ||
		(node.body?.nodes.some((bodyNode) =>
			automationNodeReferencesOutput(bodyNode, outputVariable),
		) ??
			false)
	);
}

function uniqueOutputVar(preferred: string, steps: AutomationNode[]): string {
	const taken = new Set(steps.map((step) => step.outputVar));
	if (!taken.has(preferred)) return preferred;
	const base = preferred.replace(/_\d+$/, "");
	let suffix = 2;
	while (taken.has(`${base}_${suffix}`)) suffix += 1;
	return `${base}_${suffix}`;
}

const edgeTypes = {
	deletable: DeletableEdge,
} as const;

// ---- Layout constants ----
const NODE_WIDTH = 280;
const TRIGGER_NODE_WIDTH = 120;
const LOOP_EXPANDED_WIDTH = 640;
const LOOP_BODY_OFFSET_X = 24;
const LOOP_BODY_OFFSET_Y = 148;
const LOOP_BODY_RIGHT_PADDING = 48;
const DEFAULT_NODE_HEIGHT = 120;
const NODE_COLUMN_GAP = 100;
const NODE_LANE_GAP = 40;
const FIRST_BRANCH_ROUTE_OFFSET = 24;

function canvasNodeHeight(node: AutomationNode): number {
	if (node.type !== "branch") return DEFAULT_NODE_HEIGHT;
	return 88 + ((node.config as RoutingConfig).clauses.length - 1) * 48;
}

function canvasNodeDimensions(
	node: AutomationNode,
	isExpandedLoop: boolean,
): { width: number; height: number } {
	if (node.type === "trigger") {
		return { width: TRIGGER_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
	}
	if (node.type !== "loop") {
		return {
			width: NODE_WIDTH,
			height: canvasNodeHeight(node),
		};
	}
	const body = node.body ?? { nodes: [], edges: [] };
	if (!isExpandedLoop) {
		const previewCount = Math.min(body.nodes.length, 3);
		const previewHeight =
			body.nodes.length === 0
				? 48
				: previewCount * 42 +
					16 +
					Math.max(0, previewCount - 1) * 6 +
					(body.nodes.length > previewCount ? 22 : 0);
		return { width: NODE_WIDTH, height: 176 + previewHeight };
	}
	const bodyNodes =
		body.nodes.length > 1 &&
		body.nodes.every(
			(bodyNode) =>
				bodyNode.position.x === 0 && bodyNode.position.y === 0,
		)
			? layoutLoopBodyNodes(body)
			: body.nodes;
	const right = Math.max(
		LOOP_EXPANDED_WIDTH - LOOP_BODY_OFFSET_X,
		...bodyNodes.map((bodyNode) => bodyNode.position.x + NODE_WIDTH),
	);
	const bottom = Math.max(
		120,
		...bodyNodes.map(
			(bodyNode) => bodyNode.position.y + canvasNodeHeight(bodyNode),
		),
	);
	return {
		width: Math.max(
			LOOP_EXPANDED_WIDTH,
			right + LOOP_BODY_OFFSET_X + LOOP_BODY_RIGHT_PADDING,
		),
		height: Math.max(360, LOOP_BODY_OFFSET_Y + bottom + 64),
	};
}

function branchRouteIndex(step: AutomationNode, handle: string): number {
	if (step.type !== "branch") return 0;
	const clauses = (
		step.config as import("../../domain/automation.types").RoutingConfig
	).clauses;
	if (handle === `else-${step.id}`) return clauses.length;
	const prefix = `case-${step.id}-`;
	if (!handle.startsWith(prefix)) return 0;
	const clauseId = handle.slice(prefix.length);
	const index = clauses.findIndex((clause) => clause.id === clauseId);
	return index < 0 ? 0 : index;
}

function downstreamControlNodeIds(
	startIds: string[],
	edges: AutomationEdge[],
): Set<string> {
	const downstreamIds = new Set(startIds);
	const pendingIds = [...startIds];
	while (pendingIds.length > 0) {
		const sourceId = pendingIds.pop();
		if (!sourceId) continue;
		for (const edge of edges) {
			if (edge.kind !== "control" || edge.source !== sourceId) continue;
			if (downstreamIds.has(edge.target)) continue;
			downstreamIds.add(edge.target);
			pendingIds.push(edge.target);
		}
	}
	return downstreamIds;
}

/** IDs of every control edge on some path from the trigger to `targetId`. */
function ancestorControlEdgeIds(
	targetId: string,
	edges: AutomationEdge[],
): Set<string> {
	const incomingByTarget = new Map<string, AutomationEdge[]>();
	for (const edge of edges) {
		if (edge.kind !== "control") continue;
		const list = incomingByTarget.get(edge.target) ?? [];
		list.push(edge);
		incomingByTarget.set(edge.target, list);
	}

	const edgeIds = new Set<string>();
	const visited = new Set<string>([targetId]);
	const pendingIds = [targetId];
	while (pendingIds.length > 0) {
		const currentId = pendingIds.pop();
		if (!currentId) continue;
		for (const edge of incomingByTarget.get(currentId) ?? []) {
			edgeIds.add(edge.id);
			if (visited.has(edge.source)) continue;
			visited.add(edge.source);
			pendingIds.push(edge.source);
		}
	}
	return edgeIds;
}

// ---- Types ----

/** Inputs supported by the Automation workflow canvas. */
export interface AutomationCanvasProps {
	/** SEMOSS Automation project identifier. */
	appId: string;
	/** Prevents graph and configuration changes when true. */
	readOnly?: boolean;
	/** Optional MCP host mode for the standalone Automation surface. */
	mcpMode?: "edit" | "create" | "trigger" | null;
	/** Tool context supplied when the canvas is hosted by Playground. */
	mcpContext?: AutomationToolContext;
	/** Opens the activity produced by an agent node. */
	onViewAgentRun: (trace: AutomationNodeTrace) => void;
	/** Durable run update received from an external agent activity surface. */
	externalRunUpdate?: AutomationRunDetail | null;
	/** Fired whenever the live run/trace state changes, for a host rendering its own trace panel
	 * (e.g. `RunsTab`) alongside this canvas instead of embedding it in a separate iframe. */
	onTraceChange?: (snapshot: AutomationTraceSnapshot) => void;
	/** Fired whenever the selected step's inspector state changes, for a host rendering its own
	 * inspector panel (e.g. `InspectorTab`) alongside this canvas. */
	onInspectorChange?: (snapshot: AutomationInspectorSnapshot) => void;
	/** Fired after a run completes/refreshes, so a host's separately-rendered run history view
	 * knows to refetch. */
	onHistoryChanged?: () => void;
	/** Keeps host-owned run panels in sync when the canvas leaves historical mode. */
	onExitHistoricalView?: () => void;
}

/** Imperative surface for hosts that render the inspector/schedule UI outside this canvas
 * (e.g. as a sibling dock panel) and need to feed actions back in without postMessage. */
export interface AutomationCanvasHandle {
	applyInspectorAction: (action: AutomationInspectorAction) => void;
	prepareSchedule: () => Promise<boolean>;
	refresh: (change?: { toolName: string; changedStepIds: string[] }) => void;
	/** Renders a past run's snapshot read-only in place of the live editable graph. */
	viewHistoricalRun: (run: AutomationRunDetail) => void;
	/** Returns the canvas to the live editable graph. */
	exitHistoricalView: () => void;
	/** Applies a saved file-editor tab's content onto its node's in-memory pythonSource, so a
	 * later Save can't clobber it with the stale copy the canvas loaded with. Looks the step up
	 * by id rather than going through `applyInspectorAction`, since the saved tab is not
	 * necessarily the step currently open in the inspector. No-ops for an unknown/removed step. */
	syncPythonSource: (stepId: string, source: string) => void;
}

type TriggerAutomationOutput = AutomationRunDetail;

interface AutomationNodeStreamData {
	kind?: string;
	RUN_ID?: string;
	NODE_ID?: string;
	NODE_LABEL?: string;
	STATUS?: AutomationNodeResult["STATUS"];
	DURATION_MS?: number;
	OUTPUT_PREVIEW?: string | null;
	ERROR_MESSAGE?: string | null;
	trace?: AutomationNodeResult["trace"];
	PARENT_NODE_ID?: string;
	ITERATION_INDEX?: number;
	DEFINITION_VERSION?: number;
	DEFINITION_HASH?: string;
	DEFINITION_SNAPSHOT?: string;
}

interface CanvasWorkflowDraft {
	steps: AutomationNode[];
	edges: AutomationEdge[];
	nodeGroups?: AutomationNodeGroup[];
	description: string;
	triggerBindings: TriggerBinding[];
	/** Revision the draft was based on, used to prevent stale saves. */
	baseRevision: string | null;
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

/**
 * Parses the graph a past run executed from its snapshot, or null when the run did not record
 * one or it cannot be read.
 */
function historicalDocumentFor(
	run: AutomationRunDetail,
): CanvasWorkflowDocument | null {
	if (!run.DEFINITION_SNAPSHOT) return null;
	try {
		return canvasDocumentFromWorkflow(
			JSON.parse(run.DEFINITION_SNAPSHOT) as AutomationWorkflowDocument,
		);
	} catch {
		return null;
	}
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
					"name" in global &&
					typeof global.name === "string"
						? global.name
						: null,
				)
				.filter((name): name is string => name !== null)
		: [];
	const incoming = new Map<string, string[]>();

	for (const edge of edges) {
		if (edge.kind === "control") {
			const parents = incoming.get(edge.target) ?? [];
			parents.push(edge.source);
			incoming.set(edge.target, parents);
		}
	}

	const outputVars: string[] = [];
	const visited = new Set<string>();
	const queue = [...(incoming.get(targetId) ?? [])];
	while (queue.length > 0) {
		const currentId = queue.shift();
		if (!currentId || visited.has(currentId)) continue;
		visited.add(currentId);
		const step = byId.get(currentId);
		if (
			step?.workflowType !== "trigger.start" &&
			typeof step?.outputVar === "string" &&
			step.outputVar.length > 0
		) {
			outputVars.unshift(step.outputVar);
		}
		for (const parent of incoming.get(currentId) ?? []) {
			queue.push(parent);
		}
	}

	return [...triggerGlobals, ...outputVars];
}

// ---- Component ----
export const AutomationCanvasContent = forwardRef<
	AutomationCanvasHandle,
	AutomationCanvasProps
>(function AutomationCanvasContent(
	{
		appId,
		readOnly = false,
		mcpMode,
		mcpContext,
		onViewAgentRun,
		externalRunUpdate,
		onTraceChange,
		onInspectorChange,
		onHistoryChanged,
		onExitHistoricalView,
	},
	ref,
) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const edgeColor = isDark ? "#475569" : "#94a3b8";
	const dotColor = isDark ? "#334155" : "#94a3b8";

	const [saving, setSaving] = useState(false);
	const [confirmReload, setConfirmReload] = useState(false);
	const [deleteDownstreamStepId, setDeleteDownstreamStepId] = useState<
		string | null
	>(null);
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
	const [nodeGroups, setNodeGroups] = useState<AutomationNodeGroup[]>([]);
	const [collapsedNodeGroupIds, setCollapsedNodeGroupIds] = useState<
		Set<string>
	>(() => new Set());
	const [expandedLoopIds, setExpandedLoopIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [scopeVariablesByNode, setScopeVariablesByNode] = useState<
		Record<string, AutomationScopeEntry[]>
	>({});
	const [triggerBindings, setTriggerBindings] = useState<TriggerBinding[]>(
		() => createInitialCanvasWorkflowDocument().triggerBindings,
	);
	const [workflowRefreshToken, setWorkflowRefreshToken] = useState(0);
	// Transient highlight applied to node cards right after an Assistant tool changes the
	// automation — cleared automatically a few seconds later (or replaced by the next change).
	const [changeHighlight, setChangeHighlight] =
		useState<ChangeHighlight | null>(null);
	const changeHighlightTimeoutRef = useRef<ReturnType<
		typeof setTimeout
	> | null>(null);
	useEffect(
		() => () => {
			if (changeHighlightTimeoutRef.current) {
				clearTimeout(changeHighlightTimeoutRef.current);
			}
		},
		[],
	);
	const [showAddMenu, setShowAddMenu] = useState(false);
	const [addAfterStepId, setAddAfterStepId] = useState<string | null>(null);
	const [addAfterHandle, setAddAfterHandle] = useState<string | null>(null);
	const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

	// Drawer state — which step is being edited
	const [editingStepId, setEditingStepId] = useState<string | null>(null);
	const [selectedNodeGroupId, setSelectedNodeGroupId] = useState<
		string | null
	>(null);
	const [selectedBodyNodeId, setSelectedBodyNodeId] = useState<
		string | undefined
	>();
	const [latestRunStatus, setLatestRunStatus] = useState<RunStatus | null>(
		null,
	);
	const [latestRunResults, setLatestRunResults] = useState<
		AutomationNodeResult[]
	>([]);
	const [scopeSampleResults, setScopeSampleResults] = useState<
		AutomationNodeResult[]
	>([]);
	const [latestRunDefinition, setLatestRunDefinition] =
		useState<AutomationExecutedDefinition | null>(null);
	const [activeRun, setActiveRun] = useState<AutomationRunDetail | null>(
		null,
	);
	// DB-backed run id for the in-progress run, used to poll GetAutomationRun as a
	// fallback in case the live progress stream drops an update (see the periodic
	// reconciliation effect below).
	const [liveRunId, setLiveRunId] = useState<string | null>(null);
	const [aiRunSummary, setAiRunSummary] = useState<string | null>(null);
	const [generatingAiSummary, setGeneratingAiSummary] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	// A save can be followed by Run before React commits another render. Keep the
	// concurrency token synchronous so that follow-up saves use the new revision.
	const definitionRevisionRef = useRef<string | null>(null);
	const [mcpDone, setMcpDone] = useState(false);
	const [undoSnapshot, setUndoSnapshot] = useState<AutomationNode[] | null>(
		null,
	);
	const [addingToLoopId, setAddingToLoopId] = useState<string | null>(null);
	const [loopBodyInsertionPoint, setLoopBodyInsertionPoint] =
		useState<LoopBodyInsertionPoint | null>(null);
	const [isNodeGroupDialogOpen, setIsNodeGroupDialogOpen] = useState(false);
	const [editingNodeGroupId, setEditingNodeGroupId] = useState<string | null>(
		null,
	);
	const [nodeGroupName, setNodeGroupName] = useState("");
	/** A historical run currently being viewed read-only on the canvas, in place of the live editable graph. */
	const [historicalRun, setHistoricalRun] =
		useState<AutomationRunDetail | null>(null);
	const historicalDoc = useMemo(
		() => (historicalRun ? historicalDocumentFor(historicalRun) : null),
		[historicalRun],
	);
	const viewingHistory = historicalDoc !== null;
	const displaySteps = useMemo(
		() => (historicalDoc ? ensureTriggerNode(historicalDoc.steps) : steps),
		[historicalDoc, steps],
	);
	const displayEdges = historicalDoc ? historicalDoc.edges : graphEdges;
	const displayNodeGroups = historicalDoc?.nodeGroups ?? nodeGroups;
	const selectedNodeGroup =
		displayNodeGroups.find((group) => group.id === selectedNodeGroupId) ??
		null;
	const expandedNodeOffsets = useMemo(() => {
		const offsets = new Map<string, number>();
		for (const loopId of expandedLoopIds) {
			const downstreamIds = downstreamControlNodeIds(
				[loopId],
				displayEdges,
			);
			const loop = displaySteps.find((step) => step.id === loopId);
			const expandedWidth = loop
				? canvasNodeDimensions(loop, true).width
				: LOOP_EXPANDED_WIDTH;
			for (const nodeId of downstreamIds) {
				if (nodeId === loopId) continue;
				offsets.set(
					nodeId,
					(offsets.get(nodeId) ?? 0) + (expandedWidth - NODE_WIDTH),
				);
			}
		}
		return offsets;
	}, [displayEdges, displaySteps, expandedLoopIds]);
	const setLoopExpanded = useCallback((nodeId: string, expanded: boolean) => {
		setExpandedLoopIds((current) => {
			const next = new Set(current);
			if (expanded) next.add(nodeId);
			else next.delete(nodeId);
			return next;
		});
	}, []);
	const displayResults = useMemo(
		() =>
			historicalRun
				? (historicalRun.nodeResults ?? [])
				: latestRunResults,
		[historicalRun, latestRunResults],
	);
	const scopeResults = useMemo(
		() =>
			historicalRun || latestRunResults.length > 0
				? displayResults
				: scopeSampleResults,
		[
			displayResults,
			historicalRun,
			latestRunResults.length,
			scopeSampleResults,
		],
	);
	const { displayStatuses, displayErrors, displayDurations } = useMemo(() => {
		if (!historicalRun) {
			return {
				displayStatuses: stepStatuses,
				displayErrors: stepErrors,
				displayDurations: stepDurations,
			};
		}
		const statuses: Record<string, StepRunStatus> = {};
		const errors: Record<string, string> = {};
		const durations: Record<string, number> = {};
		for (const result of historicalRun.nodeResults ?? []) {
			statuses[result.NODE_ID] =
				result.STATUS === "FAILED"
					? "error"
					: result.STATUS === "RUNNING"
						? "running"
						: result.STATUS === "WAITING_FOR_INPUT"
							? "waiting"
							: result.STATUS === "SUCCESS"
								? "success"
								: "idle";
			if (result.ERROR_MESSAGE) {
				errors[result.NODE_ID] = normalizeAutomationErrorMessage(
					result.ERROR_MESSAGE,
				);
			}
			if (typeof result.DURATION_MS === "number") {
				durations[result.NODE_ID] = result.DURATION_MS;
			}
		}
		return {
			displayStatuses: statuses,
			displayErrors: errors,
			displayDurations: durations,
		};
	}, [historicalRun, stepStatuses, stepErrors, stepDurations]);
	const viewHistoricalRun = useCallback((run: AutomationRunDetail) => {
		// Read-only history mode requires the graph the run executed. Without a usable
		// snapshot the canvas would stay editable while painted with that run's node
		// statuses, so refuse the mode rather than show a live graph as a past run.
		if (!historicalDocumentFor(run)) {
			toast.error(
				"This run did not record the graph it executed, so it cannot be opened on the canvas.",
			);
			return;
		}
		setEditingStepId(null);
		setHistoricalRun(run);
	}, []);
	const exitHistoricalView = useCallback(() => setHistoricalRun(null), []);
	const handleExitHistoricalView = useCallback(() => {
		exitHistoricalView();
		onExitHistoricalView?.();
	}, [exitHistoricalView, onExitHistoricalView]);
	const hasRunnableSteps = steps.some(
		(step) => step.workflowType !== "trigger.start",
	);
	const stepDisplayOrder = useMemo(
		() => getStepDisplayOrder(displaySteps, displayEdges),
		[displayEdges, displaySteps],
	);
	const editingStep = useMemo(
		() => displaySteps.find((s) => s.id === editingStepId) ?? null,
		[displaySteps, editingStepId],
	);
	const selectedLoopBodyStep = useMemo(
		() =>
			editingStep?.type === "loop" && selectedBodyNodeId
				? (editingStep.body?.nodes.find(
						(node) => node.id === selectedBodyNodeId,
					) ?? null)
				: null,
		[editingStep, selectedBodyNodeId],
	);
	/** Edges on the path from the trigger to the selected node, highlighted blue. */
	const highlightedPathEdgeIds = useMemo(
		() =>
			editingStepId
				? ancestorControlEdgeIds(editingStepId, displayEdges)
				: new Set<string>(),
		[editingStepId, displayEdges],
	);
	/** Steps on that same path (including the selected step), highlighted blue. */
	const highlightedPathNodeIds = useMemo(() => {
		if (!editingStepId) return new Set<string>();
		const nodeIds = new Set<string>([editingStepId]);
		for (const edge of displayEdges) {
			if (!highlightedPathEdgeIds.has(edge.id)) continue;
			nodeIds.add(edge.source);
			nodeIds.add(edge.target);
		}
		return nodeIds;
	}, [editingStepId, displayEdges, highlightedPathEdgeIds]);
	const selectedLoopBodyPath = useMemo(() => {
		const empty = {
			edgeIds: new Set<string>(),
			nodeIds: new Set<string>(),
		};
		if (!selectedBodyNodeId) return empty;
		const loop = displaySteps.find((step) =>
			step.body?.nodes.some((node) => node.id === selectedBodyNodeId),
		);
		if (!loop?.body) return empty;
		const edgeIds = ancestorControlEdgeIds(
			selectedBodyNodeId,
			loop.body.edges,
		);
		const nodeIds = new Set<string>([selectedBodyNodeId]);
		for (const edge of loop.body.edges) {
			if (!edgeIds.has(edge.id)) continue;
			nodeIds.add(edge.source);
			nodeIds.add(edge.target);
		}
		return { edgeIds, nodeIds };
	}, [displaySteps, selectedBodyNodeId]);

	useEffect(() => {
		onTraceChange?.({
			running,
			latestRunStatus,
			aiRunSummary,
			generatingAiSummary,
			steps,
			results: latestRunResults,
			executedDefinition: latestRunDefinition,
			activeRun,
		});
	}, [
		activeRun,
		aiRunSummary,
		generatingAiSummary,
		latestRunResults,
		latestRunDefinition,
		latestRunStatus,
		onTraceChange,
		running,
		steps,
	]);

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
		onHistoryChanged?.();
	}, [onHistoryChanged]);

	const loadedRef = useRef(false);
	const skipDraftPersistenceRef = useRef(true);
	const initialLayoutAppliedRef = useRef(false);
	const [workflowLoaded, setWorkflowLoaded] = useState(false);

	// React Flow state
	const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState<Node>([]);
	const [rfEdges, setRfEdges] = useEdgesState<Edge>([]);
	const selectedNodeIdsRef = useRef(new Set<string>());
	const [groupSelectionIds, setGroupSelectionIds] = useState<Set<string>>(
		() => new Set(),
	);
	const handleRfNodesChange = useCallback(
		(changes: Parameters<typeof onRfNodesChange>[0]) => {
			onRfNodesChange(changes);
			for (const change of changes) {
				if (change.type !== "select") continue;
				if (change.id.startsWith("node-group-")) continue;
				if (change.selected) {
					selectedNodeIdsRef.current.add(change.id);
				} else {
					selectedNodeIdsRef.current.delete(change.id);
				}
			}
		},
		[onRfNodesChange],
	);
	const canvasContainerRef = useRef<HTMLDivElement>(null);
	const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
	const [canvasInitialized, setCanvasInitialized] = useState(false);
	const initialViewFittedRef = useRef(false);
	const loadedGraphStructureRef = useRef<{
		appId: string;
		signature: string;
	} | null>(null);
	const restoredActiveRunForProjectRef = useRef<string | null>(null);

	const refresh = useCallback(
		(
			change?: { toolName: string; changedStepIds: string[] },
			discardDraft = false,
		) => {
			// An automatic refresh must never destroy work in progress, so it backs
			// off and says so. A refresh the user asked for confirms first and then
			// arrives here with discardDraft set.
			if (isDirty && !discardDraft) {
				toast.error(
					"The automation changed outside the editor. Your unsaved draft was preserved; save it before refreshing.",
				);
				return;
			}

			localStorage.removeItem(`automation-draft-${appId}`);
			setEditingStepId(null);
			setWorkflowRefreshToken((value) => value + 1);

			if (change) {
				if (changeHighlightTimeoutRef.current) {
					clearTimeout(changeHighlightTimeoutRef.current);
				}
				setChangeHighlight(
					change.changedStepIds.length > 0
						? {
								all: false,
								stepIds: new Set(change.changedStepIds),
							}
						: { all: true },
				);
				changeHighlightTimeoutRef.current = setTimeout(() => {
					setChangeHighlight(null);
					changeHighlightTimeoutRef.current = null;
				}, CHANGE_HIGHLIGHT_DURATION_MS);
			}
		},
		[appId, isDirty],
	);

	/**
	 * Re-reads the saved automation from the server, for when a person or an agent
	 * has edited it outside this canvas. Reloading replaces the local draft, so a
	 * dirty canvas confirms before discarding it.
	 */
	const reloadFromServer = useCallback(() => {
		if (isDirty) {
			setConfirmReload(true);
			return;
		}
		refresh({ toolName: "reload", changedStepIds: [] });
	}, [isDirty, refresh]);

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
			if (readOnly || viewingHistory) return;
			if (
				!connection.source ||
				!connection.target ||
				connection.source === connection.target
			) {
				return;
			}
			const sourceLoop = steps.find((step) =>
				step.body?.nodes.some((node) => node.id === connection.source),
			);
			const targetLoop = steps.find((step) =>
				step.body?.nodes.some((node) => node.id === connection.target),
			);
			if (sourceLoop || targetLoop) {
				if (!sourceLoop || sourceLoop.id !== targetLoop?.id) {
					toast.error(
						"Connections must stay within the same loop or the main workflow.",
					);
					return;
				}
				const body = sourceLoop.body ?? { nodes: [], edges: [] };
				const sourceHandle =
					connection.sourceHandle ?? `out-${connection.source}`;
				if (
					body.edges.some(
						(edge) =>
							edge.kind === "control" &&
							edge.source === connection.source &&
							(edge.sourceHandle ?? `out-${edge.source}`) ===
								sourceHandle,
					)
				) {
					toast.error(
						"This output is already connected. Parallel execution is not supported yet.",
					);
					return;
				}
				if (
					body.edges.some(
						(edge) =>
							edge.source === connection.source &&
							edge.target === connection.target,
					)
				) {
					return;
				}
				if (
					createsCycle(
						body.edges,
						connection.source,
						connection.target,
					)
				) {
					toast.error("Loop steps must remain an acyclic graph.");
					return;
				}
				const edge: AutomationEdge = {
					id: `loop-${sourceLoop.id}-${crypto.randomUUID()}`,
					source: connection.source,
					target: connection.target,
					sourceHandle,
					targetHandle:
						connection.targetHandle ?? `in-${connection.target}`,
					kind: "control",
				};
				setSteps((previous) =>
					previous.map((step) =>
						step.id === sourceLoop.id
							? {
									...step,
									body: {
										...body,
										edges: [...body.edges, edge],
									},
								}
							: step,
					),
				);
				setIsDirty(true);
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
				const sourceHandle =
					connection.sourceHandle ?? `out-${connection.source}`;
				if (
					previous.some(
						(edge) =>
							edge.kind === "control" &&
							edge.source === connection.source &&
							(edge.sourceHandle ?? `out-${edge.source}`) ===
								sourceHandle,
					)
				) {
					toast.error(
						"This output is already connected. Parallel execution is not supported yet.",
					);
					return previous;
				}
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
						sourceHandle,
						targetHandle:
							connection.targetHandle ??
							`in-${connection.target}`,
						kind: "control",
					},
				];
			});
		},
		[readOnly, steps, viewingHistory],
	);

	const deleteEdge = useCallback((edgeId: string) => {
		setGraphEdges((previous) =>
			previous.filter((edge) => edge.id !== edgeId),
		);
	}, []);
	const deleteLoopBodyEdge = useCallback((loopId: string, edgeId: string) => {
		setSteps((previous) =>
			previous.map((step) =>
				step.id === loopId && step.body
					? {
							...step,
							body: {
								...step.body,
								edges: step.body.edges.filter(
									(edge) => edge.id !== edgeId,
								),
							},
						}
					: step,
			),
		);
		setIsDirty(true);
	}, []);

	const moveNodeIntoLoop = useCallback(
		(nodeId: string, loopId: string) => {
			if (readOnly || viewingHistory) return;
			const node = steps.find((step) => step.id === nodeId);
			const loop = steps.find(
				(step) => step.id === loopId && step.type === "loop",
			);
			if (!node || !loop || node.id === loop.id) return;
			if (
				node.type === "trigger" ||
				node.type === "loop" ||
				(node.type === "branch" &&
					graphEdges.some((edge) => edge.source === nodeId))
			) {
				toast.error(
					node.type === "branch"
						? "Disconnect this decision's outgoing routes before moving it into a loop."
						: "Triggers and nested loops cannot be moved into a loop group.",
				);
				return;
			}
			if (
				graphEdges.some(
					(edge) =>
						(edge.source === nodeId || edge.target === nodeId) &&
						edge.kind === "data",
				)
			) {
				toast.error(
					"Reconnect data links before moving this step into a loop.",
				);
				return;
			}
			const body = loop.body ?? { nodes: [], edges: [] };
			if (
				body.nodes.some(
					(bodyNode) => bodyNode.outputVar === node.outputVar,
				) ||
				steps.some(
					(step) =>
						step.id !== nodeId && step.outputVar === node.outputVar,
				) ||
				(node.outputVar &&
					steps.some(
						(candidate) =>
							candidate.id !== nodeId &&
							automationNodeReferencesOutput(
								candidate,
								node.outputVar,
							),
					))
			) {
				toast.error(
					"Resolve output-variable conflicts or references before moving this step into the loop.",
				);
				return;
			}
			const terminalNodes = body.nodes.filter(
				(bodyNode) =>
					!body.edges.some(
						(edge) =>
							edge.kind === "control" &&
							edge.source === bodyNode.id,
					),
			);
			const nextBody = {
				nodes: [...body.nodes, { ...node, position: { x: 0, y: 0 } }],
				edges: [
					...body.edges,
					...terminalNodes.map((terminal, index) => ({
						id: `loop-${terminal.id}-${node.id}-${index}`,
						kind: "control" as const,
						source: terminal.id,
						target: node.id,
						sourceHandle:
							terminal.type === "branch"
								? `else-${terminal.id}`
								: `out-${terminal.id}`,
						targetHandle: `in-${node.id}`,
					})),
				],
			};
			const positionedNextBody = {
				...nextBody,
				nodes: layoutLoopBodyNodes(nextBody),
			};
			setSteps((previous) =>
				previous
					.filter((step) => step.id !== nodeId)
					.map((step) =>
						step.id === loopId
							? { ...step, body: positionedNextBody }
							: step,
					),
			);
			setNodeGroups((previous) =>
				previous
					.map((group) => ({
						...group,
						nodeIds: group.nodeIds.filter((id) => id !== nodeId),
					}))
					.filter((group) => group.nodeIds.length > 0),
			);
			const seenEdges = new Set<string>();
			setGraphEdges(
				graphEdges.flatMap((edge) => {
					const source =
						edge.source === nodeId ? loopId : edge.source;
					const target =
						edge.target === nodeId ? loopId : edge.target;
					if (source === target) return [];
					const sourceHandle =
						edge.source === nodeId
							? `out-${loopId}`
							: edge.sourceHandle;
					const targetHandle =
						edge.target === nodeId
							? `in-${loopId}`
							: edge.targetHandle;
					const key = `${source}:${sourceHandle}:${target}:${targetHandle}`;
					if (seenEdges.has(key)) return [];
					seenEdges.add(key);
					return [
						{ ...edge, source, target, sourceHandle, targetHandle },
					];
				}),
			);
			setLoopExpanded(loopId, true);
			setEditingStepId(loopId);
			setSelectedBodyNodeId(nodeId);
			setIsDirty(true);
		},
		[graphEdges, readOnly, setLoopExpanded, steps, viewingHistory],
	);

	const moveBodyNodeOut = useCallback(
		(
			loopId: string,
			nodeId: string,
			dropPosition?: { x: number; y: number },
		): boolean => {
			if (readOnly || viewingHistory) return false;
			const loop = steps.find(
				(step) => step.id === loopId && step.type === "loop",
			);
			const node = loop?.body?.nodes.find(
				(bodyNode) => bodyNode.id === nodeId,
			);
			if (!loop?.body || !node) return false;
			if (node.type === "branch" || node.type === "loop") {
				toast.error(
					"Move routing and loop steps out after simplifying them.",
				);
				return false;
			}
			if (
				loop.body.edges.some(
					(edge) =>
						(edge.source === nodeId || edge.target === nodeId) &&
						edge.kind === "data",
				) ||
				graphEdges.some(
					(edge) => edge.source === loopId && edge.kind === "data",
				)
			) {
				toast.error(
					"Reconnect data links before moving this step out of the loop.",
				);
				return false;
			}
			const remainingBodyNodes = loop.body.nodes.filter(
				(bodyNode) => bodyNode.id !== nodeId,
			);
			const incomingBodyEdges = loop.body.edges.filter(
				(edge) => edge.kind === "control" && edge.target === nodeId,
			);
			const outgoingBodyEdges = loop.body.edges.filter(
				(edge) => edge.kind === "control" && edge.source === nodeId,
			);
			if (incomingBodyEdges.length > 1 || outgoingBodyEdges.length > 1) {
				toast.error(
					"Reconnect this step's multiple routes before moving it out of the loop.",
				);
				return false;
			}
			if (
				steps.some((step) => step.outputVar === node.outputVar) ||
				(node.outputVar &&
					(steps
						.filter((step) => step.id !== loopId)
						.some((step) =>
							automationNodeReferencesOutput(
								step,
								node.outputVar,
							),
						) ||
						remainingBodyNodes.some((bodyNode) =>
							automationNodeReferencesOutput(
								bodyNode,
								node.outputVar,
							),
						)))
			) {
				toast.error(
					"Resolve output-variable conflicts or references before moving this step out of the loop.",
				);
				return false;
			}
			const outgoingEdges = graphEdges.filter(
				(edge) => edge.source === loopId && edge.kind === "control",
			);
			const nextEdges: AutomationEdge[] = [
				{
					id: `e-${loopId}-${nodeId}-${crypto.randomUUID()}`,
					kind: "control",
					source: loopId,
					target: nodeId,
					sourceHandle: `out-${loopId}`,
					targetHandle: `in-${nodeId}`,
				},
				...outgoingEdges.map((edge, index) => ({
					...edge,
					id: `e-${nodeId}-${edge.target}-${index}`,
					source: nodeId,
					sourceHandle: `out-${nodeId}`,
				})),
			];
			const body = removeLoopBodyNode(loop.body, nodeId);
			setSteps((previous) => [
				...previous.map((step) =>
					step.id === loopId ? { ...step, body } : step,
				),
				{
					...node,
					position: dropPosition
						? {
								x:
									dropPosition.x -
									(expandedNodeOffsets.get(nodeId) ?? 0),
								y: dropPosition.y,
							}
						: {
								x:
									loop.position.x +
									NODE_WIDTH +
									NODE_COLUMN_GAP,
								y: loop.position.y,
							},
				},
			]);
			setGraphEdges((previous) => [
				...previous.filter(
					(edge) =>
						!outgoingEdges.some(
							(outgoing) => outgoing.id === edge.id,
						),
				),
				...nextEdges,
			]);
			setSelectedBodyNodeId(undefined);
			setEditingStepId(nodeId);
			setIsDirty(true);
			toast.success(
				"Moved step out of loop; it now runs after the loop.",
			);
			return true;
		},
		[expandedNodeOffsets, graphEdges, readOnly, steps, viewingHistory],
	);

	const layoutNodes = useCallback(
		(
			nodes: AutomationNode[],
			edges: AutomationEdge[],
		): AutomationNode[] => {
			const stepIds = new Set(nodes.map((node) => node.id));
			const incoming = new Map<string, string[]>();
			for (const node of nodes) {
				incoming.set(node.id, []);
			}
			for (const edge of edges) {
				if (!stepIds.has(edge.source) || !stepIds.has(edge.target))
					continue;
				if (edge.kind !== "control") continue;
				incoming.get(edge.target)?.push(edge.source);
			}

			const depth = new Map<string, number>();
			const ordered = getControlOrderedSteps(nodes, edges);
			for (const node of ordered) {
				const parents = incoming.get(node.id) ?? [];
				depth.set(
					node.id,
					parents.length === 0
						? 0
						: Math.max(
								...parents.map(
									(parent) => depth.get(parent) ?? 0,
								),
							) + 1,
				);
			}

			const columns = new Map<number, AutomationNode[]>();
			for (const node of ordered) {
				const column = depth.get(node.id) ?? 0;
				columns.set(column, [...(columns.get(column) ?? []), node]);
			}

			const positions = new Map<string, { x: number; y: number }>();
			const orderedColumns = [...columns.entries()].sort(
				([left], [right]) => left - right,
			);
			const canvasHeight =
				canvasContainerRef.current?.clientHeight ?? 600;
			const laneHeights: number[] = [];
			for (const columnNodes of columns.values()) {
				columnNodes.forEach((node, lane) => {
					laneHeights[lane] = Math.max(
						laneHeights[lane] ?? 0,
						getNodeHeight(node.id),
					);
				});
			}
			const totalHeight =
				laneHeights.reduce((total, height) => total + height, 0) +
				NODE_LANE_GAP * Math.max(0, laneHeights.length - 1);
			const firstLaneY = Math.max(0, (canvasHeight - totalHeight) / 2);
			const columnOffsets = new Map<number, number>();
			let nextColumnX = 0;
			for (const [column, columnNodes] of orderedColumns) {
				columnOffsets.set(column, nextColumnX);
				nextColumnX +=
					Math.max(
						...columnNodes.map(
							(node) => canvasNodeDimensions(node, false).width,
						),
					) + NODE_COLUMN_GAP;
			}
			for (const [column, columnNodes] of orderedColumns) {
				let y = firstLaneY;
				for (const node of columnNodes) {
					const lane = columnNodes.indexOf(node);
					const nodeHeight = getNodeHeight(node.id);
					positions.set(node.id, {
						x: columnOffsets.get(column) ?? 0,
						y:
							y +
							((laneHeights[lane] ?? nodeHeight) - nodeHeight) /
								2,
					});
					y += (laneHeights[lane] ?? nodeHeight) + NODE_LANE_GAP;
				}
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
		setCollapsedNodeGroupIds(new Set());
		definitionRevisionRef.current = null;
		initialLayoutAppliedRef.current = false;
		skipDraftPersistenceRef.current = true;
		initialViewFittedRef.current = false;
		void runPixel(`GetAutomation(project=${JSON.stringify([appId])});`)
			.then((response) => {
				if (cancelled) return;
				const output = response.pixelReturn?.[0]?.output as
					| (AutomationWorkflowDocument & {
							nodeSources?: Record<string, string>;
							revision?: string;
							scopeVariables?: Record<
								string,
								AutomationScopeEntry[]
							>;
					  })
					| undefined;
				definitionRevisionRef.current = output?.revision ?? null;
				setScopeVariablesByNode(output?.scopeVariables ?? {});
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
						definitionRevisionRef.current =
							typeof draft.baseRevision === "string"
								? draft.baseRevision
								: (output?.revision ?? null);
						setSteps(ensureTriggerNode(draft.steps));
						setGraphEdges(draft.edges);
						setNodeGroups(draft.nodeGroups ?? []);
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
				setNodeGroups(saved.nodeGroups ?? []);
				setDescription(saved.description);
				setTriggerBindings(saved.triggerBindings);
				setIsDirty(false);
			})
			.catch((error: Error) => {
				if (!cancelled) {
					toast.error(
						normalizeAutomationErrorMessage(error.message) ||
							"Unable to load this Python automation.",
					);
					const initial = createInitialCanvasWorkflowDocument();
					setSteps(initial.steps);
					setGraphEdges(initial.edges);
					setNodeGroups(initial.nodeGroups ?? []);
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

		let frame = 0;
		let attempts = 0;
		const applyInitialLayout = () => {
			const width = canvasContainerRef.current?.clientWidth ?? 0;
			if (width === 0 && attempts < 20) {
				attempts += 1;
				frame = requestAnimationFrame(applyInitialLayout);
				return;
			}
			if (width === 0) return;

			initialLayoutAppliedRef.current = true;
			initialViewFittedRef.current = false;
			// One flag for one state update: the draft effect consumes a single skip per
			// run, so raising both here would leave the second set and swallow the
			// user's first real edit.
			skipDraftPersistenceRef.current = true;
			setSteps((previous) => layoutNodes(previous, graphEdges));
		};

		frame = requestAnimationFrame(applyInitialLayout);
		return () => cancelAnimationFrame(frame);
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
			nodeGroups,
			description,
			triggerBindings,
			baseRevision: definitionRevisionRef.current,
			savedAt: Date.now(),
		};
		localStorage.setItem(
			`automation-draft-${appId}`,
			JSON.stringify(draft),
		);
		setIsDirty(true);
	}, [
		steps,
		graphEdges,
		nodeGroups,
		description,
		triggerBindings,
		appId,
		readOnly,
	]);

	// ---- Derived values ----
	const stepOutputPreviews = useMemo(
		() =>
			Object.fromEntries(
				displayResults
					.filter((r) => r.OUTPUT_PREVIEW != null)
					.map((r) => [r.NODE_ID, r.OUTPUT_PREVIEW as string]),
			),
		[displayResults],
	);

	const validationIssues = useMemo(
		() =>
			steps.flatMap((step) => {
				if (step.workflowType === "trigger.start") return [];
				const issues = [
					...validateCanvasWorkflowNode(step, steps),
					...validateCanvasWorkflowConnections(step, graphEdges),
				];
				return issues.length > 0 ? [{ step, issues }] : [];
			}),
		[graphEdges, steps],
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
			if (readOnly || viewingHistory) return;
			setDevMode(value);
			localStorage.setItem(`automation-devmode-${appId}`, String(value));
		},
		[appId, readOnly, viewingHistory],
	);

	const fitWorkflow = useCallback(() => {
		reactFlowInstanceRef.current?.fitView({
			padding: 0.2,
			duration: 250,
			maxZoom: 1,
		});
	}, []);

	const addStep = useCallback(
		(type: AutomationWorkflowNodeType) => {
			if (readOnly || viewingHistory) return;
			if (addingToLoopId) {
				const loop = steps.find(
					(step) =>
						step.id === addingToLoopId && step.type === "loop",
				);
				if (!loop) return;
				const allNodes = steps.flatMap((step) => [
					step,
					...(step.body?.nodes ?? []),
				]);
				const newStep = createCanvasWorkflowNode(type, allNodes.length);
				newStep.outputVar = uniqueOutputVar(
					newStep.outputVar,
					allNodes,
				);
				const body = loop.body ?? { nodes: [], edges: [] };
				const bodyIsUnpositioned = body.nodes.every(
					(node) => node.position.x === 0 && node.position.y === 0,
				);
				const positionedBody =
					bodyIsUnpositioned && body.nodes.length > 1
						? { ...body, nodes: layoutLoopBodyNodes(body) }
						: body;
				if (loopBodyInsertionPoint) {
					newStep.position = { x: 0, y: 0 };
				}
				const terminalNodes = positionedBody.nodes.filter(
					(node) =>
						!positionedBody.edges.some(
							(edge) =>
								edge.kind === "control" &&
								edge.source === node.id,
						),
				);
				let nextBody: {
					nodes: AutomationNode[];
					edges: AutomationEdge[];
				};
				if (loopBodyInsertionPoint) {
					nextBody = insertLoopBodyNode(
						positionedBody,
						newStep,
						loopBodyInsertionPoint,
					);
				} else {
					newStep.position =
						terminalNodes.length > 0
							? {
									x:
										Math.max(
											...terminalNodes.map(
												(node) => node.position.x,
											),
										) + 260,
									y: terminalNodes[0].position.y,
								}
							: { x: 0, y: 0 };
					const nextBodyEdges: AutomationEdge[] = [
						...positionedBody.edges,
						...terminalNodes.map((node, index) => ({
							id: `loop-${node.id}-${newStep.id}-${index}`,
							kind: "control" as const,
							source: node.id,
							target: newStep.id,
							sourceHandle:
								node.type === "branch"
									? `else-${node.id}`
									: `out-${node.id}`,
							targetHandle: `in-${newStep.id}`,
						})),
					];
					nextBody = {
						nodes: [...positionedBody.nodes, newStep],
						edges: nextBodyEdges,
					};
				}
				nextBody = {
					...nextBody,
					nodes: layoutLoopBodyNodes(nextBody),
				};
				setSteps((previous) =>
					previous.map((step) =>
						step.id === loop.id
							? {
									...step,
									body: nextBody,
								}
							: step,
					),
				);
				setIsDirty(true);
				setShowAddMenu(false);
				setAddingToLoopId(null);
				setLoopBodyInsertionPoint(null);
				setEditingStepId(loop.id);
				setSelectedBodyNodeId(newStep.id);
				return;
			}
			const previousStep = addAfterStepId
				? steps.find((step) => step.id === addAfterStepId)
				: undefined;
			const newStep = createCanvasWorkflowNode(type, steps.length);
			newStep.outputVar = uniqueOutputVar(newStep.outputVar, steps);
			const id = newStep.id;
			if (previousStep) {
				const targetX =
					previousStep.position.x +
					canvasNodeDimensions(previousStep, false).width +
					NODE_COLUMN_GAP;
				// Find siblings already connected from this node (+ handle)
				const sourceHandle = addAfterHandle ?? `out-${previousStep.id}`;
				const siblingIds = graphEdges
					.filter(
						(e) =>
							e.source === previousStep.id &&
							e.sourceHandle === sourceHandle,
					)
					.map((e) => e.target);
				const siblingNodes = steps.filter((s) =>
					siblingIds.includes(s.id),
				);
				const routeIndex = branchRouteIndex(previousStep, sourceHandle);
				let targetY =
					previousStep.position.y +
					routeIndex * (DEFAULT_NODE_HEIGHT + NODE_LANE_GAP) -
					(routeIndex === 0 && previousStep.type === "branch"
						? FIRST_BRANCH_ROUTE_OFFSET
						: 0);
				if (siblingNodes.length > 0) {
					const maxY = Math.max(
						...siblingNodes.map((s) => s.position.y),
					);
					const bottomHeight = getNodeHeight(
						siblingNodes.find((s) => s.position.y === maxY)?.id ??
							"",
					);
					targetY = maxY + bottomHeight + NODE_LANE_GAP;
				}
				newStep.position = { x: targetX, y: targetY };
			} else {
				const viewport = reactFlowInstanceRef.current?.getViewport();
				const container = canvasContainerRef.current;
				const cx = container?.clientWidth
					? container.clientWidth / 2
					: 400;
				const cy = container?.clientHeight
					? container.clientHeight / 2
					: 300;
				newStep.position = {
					x: (cx - (viewport?.x ?? 0)) / (viewport?.zoom ?? 1),
					y: (cy - (viewport?.y ?? 0)) / (viewport?.zoom ?? 1),
				};
			}
			setSteps((previous) => [...previous, newStep]);
			if (previousStep) {
				const sourceHandle = addAfterHandle ?? `out-${previousStep.id}`;
				setGraphEdges((previous) => [
					...previous,
					{
						id: `e-${previousStep.id}-${id}`,
						source: previousStep.id,
						target: id,
						sourceHandle,
						targetHandle: `in-${id}`,
						kind: "control",
					},
				]);
			}
			setShowAddMenu(false);
			setAddingToLoopId(null);
			setLoopBodyInsertionPoint(null);
			setAddAfterStepId(null);
			setAddAfterHandle(null);
			setEditingStepId(id);
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(fitWorkflow);
			});
		},
		[
			addingToLoopId,
			loopBodyInsertionPoint,
			addAfterStepId,
			addAfterHandle,
			fitWorkflow,
			getNodeHeight,
			graphEdges,
			readOnly,
			steps,
			viewingHistory,
		],
	);

	const updateStep = useCallback(
		(updated: AutomationNode) => {
			const parentLoop = steps.find((step) =>
				step.body?.nodes.some((node) => node.id === updated.id),
			);
			if (parentLoop?.body) {
				const parentLoopId = parentLoop.id;
				setSteps((previous) =>
					previous.map((step) =>
						step.id === parentLoopId && step.body
							? {
									...step,
									body: {
										...step.body,
										nodes: step.body.nodes.map((node) =>
											node.id === updated.id
												? updated
												: node,
										),
									},
								}
							: step,
					),
				);
				setIsDirty(true);
				return;
			}
			const currentStep = steps.find((step) => step.id === updated.id);
			const previousOutputVariable = currentStep?.outputVar ?? "";
			const outputVariableChanged =
				previousOutputVariable !== updated.outputVar;
			if (outputVariableChanged) {
				if (
					steps.some(
						(step) =>
							step.id !== updated.id &&
							step.outputVar === updated.outputVar,
					)
				) {
					toast.error("Output variables must be unique.");
					return;
				}
				const customReference = steps.find(
					(step) =>
						step.id !== updated.id &&
						customSourceReferencesOutput(
							step,
							previousOutputVariable,
						),
				);
				if (customReference) {
					toast.error(
						`Update the custom Python in “${customReference.label}” before renaming this output variable.`,
					);
					return;
				}
			}
			const currentClauses =
				currentStep?.type === "branch"
					? (
							currentStep.config as import("../../domain/automation.types").RoutingConfig
						).clauses
					: [];
			const updatedClauses =
				updated.type === "branch"
					? (
							updated.config as import("../../domain/automation.types").RoutingConfig
						).clauses
					: [];
			const routeCountChange =
				updatedClauses.length - currentClauses.length;
			const elseStartIds = graphEdges
				.filter(
					(edge) =>
						edge.kind === "control" &&
						edge.source === updated.id &&
						edge.sourceHandle === `else-${updated.id}`,
				)
				.map((edge) => edge.target);
			const repositionedElsePathIds =
				routeCountChange === 0
					? new Set<string>()
					: downstreamControlNodeIds(elseStartIds, graphEdges);
			setSteps((previous) =>
				previous.map((step) => {
					if (step.id === updated.id) return updated;
					const renamedStep = outputVariableChanged
						? {
								...step,
								config: replaceOutputVariableReferences(
									step.config,
									previousOutputVariable,
									updated.outputVar,
								),
								workflowConfig: replaceOutputVariableReferences(
									step.workflowConfig,
									previousOutputVariable,
									updated.outputVar,
								),
							}
						: step;
					if (!repositionedElsePathIds.has(step.id)) {
						return renamedStep;
					}
					return {
						...renamedStep,
						position: {
							...renamedStep.position,
							y:
								renamedStep.position.y +
								routeCountChange *
									(DEFAULT_NODE_HEIGHT + NODE_LANE_GAP),
						},
					};
				}),
			);
			if (updated.type === "branch") {
				const validHandles = new Set([
					`else-${updated.id}`,
					...(
						updated.config as import("../../domain/automation.types").RoutingConfig
					).clauses.map(
						(clause) => `case-${updated.id}-${clause.id}`,
					),
				]);
				setGraphEdges((previous) =>
					previous.filter(
						(edge) =>
							edge.source !== updated.id ||
							!edge.sourceHandle?.startsWith("case-") ||
							validHandles.has(edge.sourceHandle),
					),
				);
			}
			if (validateCanvasWorkflowNode(updated, steps).length === 0) {
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
		},
		[graphEdges, steps],
	);

	const deleteStep = useCallback(
		(id: string, removeDownstream = false) => {
			const parentLoop = steps.find((step) =>
				step.body?.nodes.some((node) => node.id === id),
			);
			if (parentLoop) {
				setSteps((previous) =>
					previous.map((step) => {
						if (step.id !== parentLoop.id || !step.body)
							return step;
						const removedIds = removeDownstream
							? downstreamControlNodeIds([id], step.body.edges)
							: new Set([id]);
						return {
							...step,
							body: {
								nodes: step.body.nodes.filter(
									(node) => !removedIds.has(node.id),
								),
								edges: step.body.edges.filter(
									(edge) =>
										!removedIds.has(edge.source) &&
										!removedIds.has(edge.target),
								),
							},
						};
					}),
				);
				setSelectedBodyNodeId(undefined);
				setIsDirty(true);
				return;
			}
			const removedIds = removeDownstream
				? downstreamControlNodeIds([id], graphEdges)
				: new Set([id]);
			setSteps((prev) => prev.filter((step) => !removedIds.has(step.id)));
			setNodeGroups((previous) =>
				previous
					.map((group) => ({
						...group,
						nodeIds: group.nodeIds.filter(
							(nodeId) => !removedIds.has(nodeId),
						),
					}))
					.filter((group) => group.nodeIds.length > 0),
			);
			setGraphEdges((previous) =>
				previous.filter(
					(edge) =>
						!removedIds.has(edge.source) &&
						!removedIds.has(edge.target),
				),
			);
			setEditingStepId((prev) =>
				prev && removedIds.has(prev) ? null : prev,
			);
			setStepStatuses((prev) => {
				const next = { ...prev };
				for (const removedId of removedIds) delete next[removedId];
				return next;
			});
			setStepErrors((prev) => {
				const next = { ...prev };
				for (const removedId of removedIds) delete next[removedId];
				return next;
			});
			setStepDurations((prev) => {
				const next = { ...prev };
				for (const removedId of removedIds) delete next[removedId];
				return next;
			});
			setLatestRunResults((prev) =>
				prev.filter((result) => !removedIds.has(result.NODE_ID)),
			);
		},
		[graphEdges, steps],
	);

	const upstreamVarsFor = useCallback(
		(stepId: string) =>
			upstreamVariablesFor(displaySteps, displayEdges, stepId),
		[displayEdges, displaySteps],
	);
	const scopeEntriesFor = useCallback(
		(stepId: string): AutomationScopeEntry[] => {
			const serverEntries = scopeVariablesByNode[stepId];
			const baseEntries: AutomationScopeEntry[] =
				serverEntries ??
				["date", "triggered_at", "run_id"].map((name) => ({
					name,
					source: "runtime" as const,
					label: name,
					description: "Available from this node's run scope.",
					availability: "guaranteed" as const,
					pythonExpression: `scope[${JSON.stringify(name)}]`,
					templateExpression: `\${${name}}`,
				}));
			if (!serverEntries) {
				for (const name of upstreamVarsFor(stepId)) {
					const sourceStep = displaySteps.find(
						(step) => step.outputVar === name,
					);
					const stepNumber = sourceStep
						? (stepDisplayOrder.get(sourceStep.id) ?? 0) + 1
						: undefined;
					baseEntries.push({
						name,
						source: "node",
						label: sourceStep?.label ?? name,
						description: stepNumber
							? `Output from step ${stepNumber}.`
							: "Output from an earlier step.",
						availability: "guaranteed",
						pythonExpression: `scope[${JSON.stringify(name)}]`,
						templateExpression: `\${${name}}`,
						sourceNodeId: sourceStep?.id,
					});
				}
			}
			const nestedEntries = baseEntries.flatMap((entry) => {
				if (entry.source !== "node" || !entry.sourceNodeId) return [];
				const sourceStep = displaySteps.find(
					(step) => step.id === entry.sourceNodeId,
				);
				const definition = sourceStep?.workflowType
					? getAutomationNodeDefinition(sourceStep.workflowType)
					: undefined;
				const declared = definition
					? declaredAutomationScopeEntries(
							entry,
							definition.outputSchema,
						)
					: [];
				const output = scopeResults.find(
					(result) => result.NODE_ID === entry.sourceNodeId,
				);
				const observed = inferNestedAutomationScopeEntries(
					entry,
					output?.OUTPUT_VALUE ?? output?.OUTPUT_PREVIEW,
				);
				const merged = new Map(
					declared.map((declaredEntry) => [
						declaredEntry.name,
						declaredEntry,
					]),
				);
				for (const observedEntry of observed) {
					if (!merged.has(observedEntry.name)) {
						merged.set(observedEntry.name, observedEntry);
					}
				}
				return [...merged.values()];
			});
			return [...baseEntries, ...nestedEntries];
		},
		[
			displaySteps,
			scopeResults,
			scopeVariablesByNode,
			stepDisplayOrder,
			upstreamVarsFor,
		],
	);
	const templateVariablesFor = useCallback(
		(stepId: string): string[] =>
			scopeEntriesFor(stepId).map((entry) => entry.name),
		[scopeEntriesFor],
	);
	const inspectorContext = useMemo(() => {
		if (!editingStep) {
			return {
				step: null,
				upstreamVars: [] as string[],
				scopeEntries: [] as AutomationScopeEntry[],
			};
		}
		const upstreamVars = templateVariablesFor(editingStep.id);
		const scopeEntries = scopeEntriesFor(editingStep.id);
		if (!selectedLoopBodyStep) {
			return { step: editingStep, upstreamVars, scopeEntries };
		}
		const bodyScope = getLoopBodyScope({
			loop: editingStep,
			selectedNodeId: selectedLoopBodyStep.id,
			upstreamVars,
			scopeEntries,
		});
		return {
			step: selectedLoopBodyStep,
			upstreamVars: bodyScope.upstreamVars,
			scopeEntries: bodyScope.scopeEntries,
		};
	}, [
		editingStep,
		scopeEntriesFor,
		selectedLoopBodyStep,
		templateVariablesFor,
	]);

	useEffect(() => {
		const snapshot: AutomationInspectorSnapshot = {
			description,
			devMode,
			readOnly: readOnly || viewingHistory,
			editingStep: inspectorContext.step,
			editingNodeGroup: selectedNodeGroup,
			upstreamVars: inspectorContext.upstreamVars,
			scopeEntries: inspectorContext.scopeEntries,
			stepRunStatus: inspectorContext.step
				? displayStatuses[inspectorContext.step.id]
				: undefined,
			stepRunError: inspectorContext.step
				? displayErrors[inspectorContext.step.id]
				: undefined,
			stepRunOutput: inspectorContext.step
				? (stepOutputPreviews[inspectorContext.step.id] ?? null)
				: null,
			stepRunTrace: inspectorContext.step
				? displayResults.find(
						(result) =>
							result.NODE_ID === inspectorContext.step?.id,
					)?.trace
				: undefined,
		};
		onInspectorChange?.(snapshot);
	}, [
		description,
		devMode,
		readOnly,
		viewingHistory,
		inspectorContext,
		onInspectorChange,
		selectedNodeGroup,
		displayErrors,
		stepOutputPreviews,
		displayStatuses,
		displayResults,
	]);

	const applyInspectorAction = useCallback(
		(action: AutomationInspectorAction) => {
			if ((readOnly || viewingHistory) && action.type !== "close") return;
			switch (action.type) {
				case "update-step": {
					const isBodyStep = Boolean(
						editingStep?.type === "loop" &&
							action.step.id !== editingStep.id &&
							editingStep.body?.nodes.some(
								(node) => node.id === action.step.id,
							),
					);
					if (!isBodyStep || !editingStep) {
						updateStep(action.step);
						break;
					}
					updateStep({
						...editingStep,
						body: {
							...(editingStep.body ?? { nodes: [], edges: [] }),
							nodes: (editingStep.body?.nodes ?? []).map(
								(node) =>
									node.id === action.step.id
										? action.step
										: node,
							),
						},
					});
					break;
				}
				case "delete-step": {
					const isBodyStep = Boolean(
						editingStep?.type === "loop" &&
							editingStep.body?.nodes.some(
								(node) => node.id === action.stepId,
							),
					);
					if (!isBodyStep || !editingStep) {
						deleteStep(action.stepId);
						break;
					}
					const body = removeLoopBodyNode(
						editingStep.body ?? { nodes: [], edges: [] },
						action.stepId,
					);
					updateStep({ ...editingStep, body });
					setSelectedBodyNodeId(body.nodes[0]?.id);
					break;
				}
				case "update-node-group":
					setNodeGroups((previous) =>
						previous.map((group) =>
							group.id === action.group.id ? action.group : group,
						),
					);
					setIsDirty(true);
					break;
				case "delete-node-group":
					setNodeGroups((previous) =>
						previous.filter((group) => group.id !== action.groupId),
					);
					setCollapsedNodeGroupIds((previous) => {
						const next = new Set(previous);
						next.delete(action.groupId);
						return next;
					});
					setSelectedNodeGroupId(null);
					setIsDirty(true);
					break;
				case "update-description":
					setDescription(action.description);
					break;
				case "update-dev-mode":
					handleDevModeChange(action.devMode);
					break;
				case "close":
					if (selectedNodeGroupId) {
						setSelectedNodeGroupId(null);
					} else if (selectedBodyNodeId) {
						setSelectedBodyNodeId(undefined);
					} else {
						setEditingStepId(null);
					}
					break;
			}
		},
		[
			deleteStep,
			editingStep,
			handleDevModeChange,
			readOnly,
			selectedBodyNodeId,
			selectedNodeGroupId,
			updateStep,
			viewingHistory,
		],
	);

	const save = useCallback(async (): Promise<boolean> => {
		if (viewingHistory) {
			toast.error("Return to the editor before saving.");
			return false;
		}
		if (readOnly) {
			toast.error("You have read-only access to this automation.");
			return false;
		}
		const invalidSteps = steps.filter(
			(step) =>
				step.workflowType !== "trigger.start" &&
				validateCanvasWorkflowNode(step, steps).length > 0,
		);
		if (invalidSteps.length > 0) {
			const firstInvalidStep = invalidSteps[0];
			const firstIssue = validateCanvasWorkflowNode(
				firstInvalidStep,
				steps,
			)[0];
			setEditingStepId(firstInvalidStep.id);
			toast.error(
				`Cannot save: "${firstInvalidStep.label}" needs ${firstIssue ?? "required information"}.${invalidSteps.length > 1 ? ` Review ${invalidSteps.length - 1} other highlighted step${invalidSteps.length === 2 ? "" : "s"}.` : ""}`,
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
				nodeGroups,
			});
			const nodeSources = getCanvasNodeSources(steps);
			const definitionPayload = encodeTextToBase64(
				JSON.stringify(definition),
			);
			const nodeSourcesPayload = encodeTextToBase64(
				JSON.stringify(nodeSources),
			);
			const expectedRevisionArgument = definitionRevisionRef.current
				? `, expectedRevision=${JSON.stringify([definitionRevisionRef.current])}`
				: "";
			const response = await runPixel(
				`SaveAutomation(project=${JSON.stringify([appId])}, json=${JSON.stringify([definitionPayload])}, nodeSources=${JSON.stringify([nodeSourcesPayload])}${expectedRevisionArgument});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join("\n"));
			}
			const output = response.pixelReturn?.[0]?.output as
				| {
						nodeSources?: Record<string, string>;
						revision?: string;
						scopeVariables?: Record<string, AutomationScopeEntry[]>;
				  }
				| undefined;
			if (typeof output?.revision === "string") {
				definitionRevisionRef.current = output.revision;
			}
			setScopeVariablesByNode(output?.scopeVariables ?? {});
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
			const message =
				error instanceof Error
					? normalizeAutomationErrorMessage(error.message)
					: "Unknown error";
			toast.error(
				message.includes("Automation changed since it was loaded")
					? "Save blocked because this automation changed elsewhere. Your draft is still here; reload the saved workflow before reapplying it."
					: `Save failed: ${message}`,
			);
			return false;
		} finally {
			setSaving(false);
		}
	}, [
		appId,
		description,
		graphEdges,
		nodeGroups,
		readOnly,
		steps,
		triggerBindings,
		viewingHistory,
	]);

	const prepareSchedule = useCallback(
		async (): Promise<boolean> => !isDirty || save(),
		[isDirty, save],
	);

	const syncPythonSource = useCallback(
		(stepId: string, source: string) => {
			if (readOnly || viewingHistory) return;
			const step = steps.find((candidate) => candidate.id === stepId);
			if (step) {
				updateStep({
					...step,
					workflowCodeMode: "custom",
					workflowConfig: {
						...step.workflowConfig,
						pythonSource: source,
					},
				});
				return;
			}
			const parentLoop = steps.find((candidate) =>
				candidate.body?.nodes.some((node) => node.id === stepId),
			);
			if (!parentLoop?.body) return;
			updateStep({
				...parentLoop,
				body: {
					...parentLoop.body,
					nodes: parentLoop.body.nodes.map((node) =>
						node.id === stepId
							? {
									...node,
									workflowCodeMode: "custom",
									workflowConfig: {
										...node.workflowConfig,
										pythonSource: source,
									},
								}
							: node,
					),
				},
			});
		},
		[readOnly, steps, updateStep, viewingHistory],
	);

	useImperativeHandle(
		ref,
		() => ({
			applyInspectorAction,
			prepareSchedule,
			refresh,
			viewHistoricalRun,
			exitHistoricalView,
			syncPythonSource,
		}),
		[
			applyInspectorAction,
			prepareSchedule,
			refresh,
			viewHistoricalRun,
			exitHistoricalView,
			syncPythonSource,
		],
	);

	// Cmd+S / Ctrl+S
	useEffect(() => {
		if (readOnly || viewingHistory) return;
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				void save();
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [readOnly, save, viewingHistory]);

	const applyRunData = useCallback(
		(runData: TriggerAutomationOutput) => {
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
							: result.STATUS === "WAITING_FOR_INPUT"
								? "waiting"
								: result.STATUS === "SUCCESS"
									? "success"
									: "idle";
				if (result.ERROR_MESSAGE) {
					errors[step.id] = normalizeAutomationErrorMessage(
						result.ERROR_MESSAGE,
					);
				}
				if (typeof result.DURATION_MS === "number") {
					durations[step.id] = result.DURATION_MS;
				}
			}
			setStepStatuses(statuses);
			setStepErrors(errors);
			setStepDurations(durations);
			setLatestRunStatus(runData.STATUS);
			setRunning(runData.STATUS === "RUNNING");
			setLatestRunResults(nodeResults);
			setScopeSampleResults(nodeResults);
			setLatestRunDefinition({
				version: runData.DEFINITION_VERSION,
				hash: runData.DEFINITION_HASH,
				snapshot: runData.DEFINITION_SNAPSHOT,
			});
			setActiveRun(runData);
		},
		[steps],
	);

	useEffect(() => {
		if (
			!workflowLoaded ||
			restoredActiveRunForProjectRef.current === appId
		) {
			return;
		}
		restoredActiveRunForProjectRef.current = appId;
		setScopeSampleResults([]);
		let cancelled = false;
		void listAutomationRuns(appId, 20)
			.then((runs) => {
				const activeRun = runs.find(
					(run) =>
						run.STATUS === "WAITING_FOR_INPUT" ||
						run.STATUS === "RUNNING",
				);
				const scopeSampleRun =
					activeRun ??
					runs.find((run) => run.STATUS === "SUCCESS") ??
					runs[0];
				return scopeSampleRun
					? getAutomationRun(appId, scopeSampleRun.RUN_ID)
					: null;
			})
			.then((run) => {
				if (!cancelled && run) {
					if (
						run.STATUS === "WAITING_FOR_INPUT" ||
						run.STATUS === "RUNNING"
					) {
						applyRunData(run);
						setAiRunSummary(run.RESULT_SUMMARY ?? null);
						setLiveRunId(run.RUN_ID);
					} else {
						setScopeSampleResults(run.nodeResults ?? []);
					}
				}
			})
			.catch(() => {
				// Run history remains available if best-effort scope restoration fails.
			});
		return () => {
			cancelled = true;
		};
	}, [appId, applyRunData, workflowLoaded]);

	// The host holds this update indefinitely and applyRunData is rebuilt whenever steps
	// change, so without a guard every canvas edit would repaint the graph with an old run
	// and refetch history. Apply only when the update itself has moved on.
	const externalRunSignature = externalRunUpdate
		? [
				externalRunUpdate.RUN_ID,
				externalRunUpdate.STATUS,
				externalRunUpdate.COMPLETED_NODES ?? "",
				externalRunUpdate.COMPLETED_AT ?? "",
			].join(":")
		: null;
	const appliedExternalRunRef = useRef<string | null>(null);
	useEffect(() => {
		if (!externalRunUpdate) return;
		if (appliedExternalRunRef.current === externalRunSignature) return;
		appliedExternalRunRef.current = externalRunSignature;
		applyRunData(externalRunUpdate);
		setAiRunSummary(externalRunUpdate.RESULT_SUMMARY ?? null);
		setLiveRunId(externalRunUpdate.RUN_ID);
		notifyHistoryChanged();
	}, [
		applyRunData,
		externalRunUpdate,
		externalRunSignature,
		notifyHistoryChanged,
	]);

	const applyNodeProgress = useCallback(
		(progress: AutomationNodeStreamData) => {
			const { NODE_ID: nodeId, STATUS: status } = progress;
			const runId = progress.RUN_ID;
			if (runId) {
				setLiveRunId((previous) =>
					previous === runId ? previous : runId,
				);
			}
			if (!nodeId || !status) return;
			const stepStatus: StepRunStatus =
				status === "FAILED"
					? "error"
					: status === "RUNNING"
						? "running"
						: status === "WAITING_FOR_INPUT"
							? "waiting"
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
					[nodeId]: normalizeAutomationErrorMessage(errorMessage),
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
				if (progress.PARENT_NODE_ID) return previous;
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
					trace: progress.trace
						? {
								...progress.trace,
								automationRunId:
									progress.RUN_ID ??
									progress.trace.automationRunId ??
									existing?.trace?.automationRunId,
								nodeId:
									progress.trace.nodeId ??
									nodeId ??
									existing?.trace?.nodeId,
							}
						: existing?.trace,
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

	const applyRunStarted = useCallback((data: AutomationNodeStreamData) => {
		setLatestRunDefinition({
			version: data.DEFINITION_VERSION,
			hash: data.DEFINITION_HASH,
			snapshot: data.DEFINITION_SNAPSHOT,
		});
		if (data.RUN_ID) {
			setLiveRunId(data.RUN_ID);
		}
	}, []);

	// Fallback reconciliation: the live progress stream is best-effort and can drop an
	// update (observed with agent-run trace events). Re-fetch the DB-backed run detail
	// on an interval while running so the canvas self-heals within a few seconds even
	// if a stream event never arrives.
	useEffect(() => {
		if (!running || !liveRunId) return;
		let cancelled = false;
		const interval = window.setInterval(() => {
			getAutomationRun(appId, liveRunId)
				.then((detail) => {
					if (!cancelled) applyRunData(detail);
				})
				.catch(() => {
					// Best-effort; the live stream remains the primary source of truth.
				});
		}, 2500);
		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [running, liveRunId, appId, applyRunData]);

	const run = useCallback(async () => {
		if (viewingHistory) {
			toast.error("Return to the editor before running this automation.");
			return;
		}
		if (readOnly && mcpMode !== "trigger") {
			toast.error("You have read-only access to this automation.");
			return;
		}
		const invalidSteps = steps.filter(
			(step) =>
				step.workflowType !== "trigger.start" &&
				[
					...validateCanvasWorkflowNode(step, steps),
					...validateCanvasWorkflowConnections(step, graphEdges),
				].length > 0,
		);
		if (invalidSteps.length > 0) {
			const firstInvalidStep = invalidSteps[0];
			const firstIssue = [
				...validateCanvasWorkflowNode(firstInvalidStep, steps),
				...validateCanvasWorkflowConnections(
					firstInvalidStep,
					graphEdges,
				),
			][0];
			toast.error(
				`Cannot run: "${firstInvalidStep.label}" needs ${firstIssue ?? "required information"}.${invalidSteps.length > 1 ? ` Review ${invalidSteps.length - 1} other highlighted step${invalidSteps.length === 2 ? "" : "s"}.` : ""}`,
			);
			setActiveDockTab("validation");
			return;
		}
		// In trigger mode the automation is already saved — skip the save step.
		if (mcpMode !== "trigger" && !(await save())) return;

		setRunning(true);
		setAiRunSummary(null);
		setGeneratingAiSummary(false);
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setLatestRunStatus("RUNNING");
		setLatestRunResults([]);
		setLatestRunDefinition(null);
		setActiveRun(null);
		setLiveRunId(null);
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
					if (event.stream_type !== "automation" || !event.data) {
						continue;
					}
					if (event.data.kind === "run-start") {
						applyRunStarted(event.data);
					} else if (event.data.kind === "node-status") {
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
			// TriggerAutomation returns the durable result, while GetAutomationRun also
			// decorates live row-shaped outputs with their standard SEMOSS frame nouns.
			// Re-read the canonical detail once at completion so the result panel can
			// page the frame immediately instead of briefly falling back to raw JSON.
			const completedDetail = await getAutomationRun(
				appId,
				finalDetail.RUN_ID,
			).catch(() => finalDetail);
			applyRunData(completedDetail);
			setAiRunSummary(finalDetail.RESULT_SUMMARY ?? null);
			notifyHistoryChanged();
			if (finalDetail.STATUS === "SUCCESS") {
				toast.success(
					finalDetail.RESULT_SUMMARY ?? "Automation completed",
				);
			} else if (finalDetail.STATUS === "WAITING_FOR_INPUT") {
				toast.info(
					"The agent needs your input before this run can continue.",
				);
			} else {
				toast.error(
					finalDetail.ERROR_MESSAGE
						? normalizeAutomationErrorMessage(
								finalDetail.ERROR_MESSAGE,
							)
						: "Automation failed",
				);
			}
			if (mcpMode === "trigger" && mcpContext) {
				const succeeded =
					finalDetail.STATUS === "SUCCESS" ||
					finalDetail.STATUS === "WAITING_FOR_INPUT";
				const nodeResultLines = (finalDetail.nodeResults ?? []).map(
					(r) => {
						const dur =
							r.DURATION_MS != null
								? ` (${(r.DURATION_MS / 1000).toFixed(1)}s)`
								: "";
						const extra = r.OUTPUT_PREVIEW
							? ` → ${r.OUTPUT_PREVIEW}`
							: r.ERROR_MESSAGE
								? ` → Error: ${normalizeAutomationErrorMessage(r.ERROR_MESSAGE)}`
								: "";
						return `• ${r.NODE_LABEL}: ${r.STATUS}${dur}${extra}`;
					},
				);
				const baseSummary =
					finalDetail.RESULT_SUMMARY ??
					(succeeded
						? finalDetail.STATUS === "WAITING_FOR_INPUT"
							? "The automation is waiting for agent input in the editor."
							: "Automation completed successfully."
						: finalDetail.ERROR_MESSAGE
							? normalizeAutomationErrorMessage(
									finalDetail.ERROR_MESSAGE,
								)
							: "Automation failed.");
				const mcpResponse =
					nodeResultLines.length > 0
						? `${baseSummary}\n\nStep results:\n${nodeResultLines.join("\n")}`
						: baseSummary;
				window.parent.postMessage(
					{
						type: "SMSS_EXEC_TOOL",
						tool: {
							type: "MCP",
							id: mcpContext.id,
							name: mcpContext.name,
							message: mcpContext.message,
							roomId: mcpContext.roomId,
							response: mcpResponse,
							tool_status: succeeded ? "success" : "error",
							executedParameters: { ...mcpContext.parameters },
						},
					},
					window.location.origin,
				);
			}
		} catch (error) {
			const message =
				error instanceof Error
					? normalizeAutomationErrorMessage(error.message)
					: "Automation failed";
			setLatestRunStatus("FAILED");
			setAiRunSummary(null);
			toast.error(message);
			if (mcpMode === "trigger" && mcpContext) {
				window.parent.postMessage(
					{
						type: "SMSS_EXEC_TOOL",
						tool: {
							type: "MCP",
							id: mcpContext.id,
							name: mcpContext.name,
							message: mcpContext.message,
							roomId: mcpContext.roomId,
							response: message,
							tool_status: "error",
							executedParameters: { ...mcpContext.parameters },
						},
					},
					window.location.origin,
				);
			}
		} finally {
			setRunning(false);
		}
	}, [
		appId,
		applyNodeProgress,
		applyRunData,
		applyRunStarted,
		graphEdges,
		mcpContext,
		mcpMode,
		notifyHistoryChanged,
		readOnly,
		save,
		steps,
		viewingHistory,
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
		if (!displaySteps.length) return;

		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// Automations created before the canvas stored every node at the origin.
		// Lay those out once so subsequent drag positions can be persisted per node.
		// Skip while viewing a historical run — its snapshot positions are read-only.
		if (
			!viewingHistory &&
			steps.every(
				(step) => step.position.x === 0 && step.position.y === 0,
			)
		) {
			setSteps((previous) => layoutNodes(previous, graphEdges));
		}

		// An edge should only reflect its target's run status if its own source actually
		// ran — otherwise a branch/merge node's *other*, untaken edge into a shared target
		// lights up too, just because the target happened to run via the taken branch.
		const triggerStepId = displaySteps.find(
			(step) => step.workflowType === "trigger.start",
		)?.id;
		const hasStarted = (stepId: string): boolean =>
			stepId === triggerStepId ||
			(displayStatuses[stepId] !== undefined &&
				displayStatuses[stepId] !== "idle");
		const getEdgeStrokeColor = (edge: AutomationEdge): string =>
			getFlowStrokeColor(
				hasStarted(edge.source)
					? displayStatuses[edge.target]
					: undefined,
				highlightedPathEdgeIds.has(edge.id),
				edgeColor,
			);
		const getLoopBodyEdgeStrokeColor = (edge: AutomationEdge): string =>
			getFlowStrokeColor(
				hasStarted(edge.source)
					? displayStatuses[edge.target]
					: undefined,
				selectedLoopBodyPath.edgeIds.has(edge.id),
				edgeColor,
				LOOP_PATH_HIGHLIGHT_COLOR,
			);
		const selectedRootNodeIds = new Set(
			displaySteps
				.filter((step) => groupSelectionIds.has(step.id))
				.map((step) => step.id),
		);
		const isGroupSelection = (nodeId: string): boolean =>
			selectedRootNodeIds.has(nodeId);
		const visibleNodeGroups = displayNodeGroups;
		const collapsedNodeIds = new Set(
			visibleNodeGroups
				.filter((group) => collapsedNodeGroupIds.has(group.id))
				.flatMap((group) => {
					const members = displaySteps.filter((step) =>
						group.nodeIds.includes(step.id),
					);
					return members.flatMap((step) => [
						step.id,
						...(step.body?.nodes.map((node) => node.id) ?? []),
					]);
				}),
		);
		const collapsedGroupByNodeId = new Map<string, AutomationNodeGroup>();
		const collapsedGroupPorts = new Map<
			string,
			Array<{ id: string; type: "source" | "target" }>
		>();
		for (const group of visibleNodeGroups) {
			if (!collapsedNodeGroupIds.has(group.id)) continue;
			for (const nodeId of group.nodeIds) {
				if (!collapsedGroupByNodeId.has(nodeId)) {
					collapsedGroupByNodeId.set(nodeId, group);
				}
			}
		}
		for (const edge of displayEdges) {
			const sourceGroup = collapsedGroupByNodeId.get(edge.source);
			const targetGroup = collapsedGroupByNodeId.get(edge.target);
			if (sourceGroup?.id && sourceGroup.id === targetGroup?.id) continue;
			if (sourceGroup) {
				const ports = collapsedGroupPorts.get(sourceGroup.id) ?? [];
				ports.push({ id: `group-source-${edge.id}`, type: "source" });
				collapsedGroupPorts.set(sourceGroup.id, ports);
			}
			if (targetGroup) {
				const ports = collapsedGroupPorts.get(targetGroup.id) ?? [];
				ports.push({ id: `group-target-${edge.id}`, type: "target" });
				collapsedGroupPorts.set(targetGroup.id, ports);
			}
		}
		for (const group of visibleNodeGroups) {
			const members = displaySteps.filter((node) =>
				group.nodeIds.includes(node.id),
			);
			if (members.length === 0) continue;
			const isGroupCollapsed = collapsedNodeGroupIds.has(group.id);
			const positionedMembers = members.map((node) => ({
				...node,
				position: {
					x:
						node.position.x +
						(expandedNodeOffsets.get(node.id) ?? 0),
					y: node.position.y,
				},
			}));
			const left = Math.min(
				...positionedMembers.map((node) => node.position.x),
			);
			const top = Math.min(
				...positionedMembers.map((node) => node.position.y),
			);
			const right = Math.max(
				...positionedMembers.map(
					(node) =>
						node.position.x +
						canvasNodeDimensions(node, expandedLoopIds.has(node.id))
							.width,
				),
			);
			const bottom = Math.max(
				...positionedMembers.map(
					(node) =>
						node.position.y +
						canvasNodeDimensions(node, expandedLoopIds.has(node.id))
							.height,
				),
			);
			const padding = 28;
			newNodes.push({
				id: `node-group-${group.id}`,
				type: "nodeGroup",
				position: { x: left - padding, y: top - padding - 12 },
				data: {
					group,
					collapsed: isGroupCollapsed,
					members: members.slice(0, 3),
					memberCount: members.length,
					ports: (collapsedGroupPorts.get(group.id) ?? []).map(
						(port, index, ports) => ({
							...port,
							position: ((index + 1) / (ports.length + 1)) * 100,
						}),
					),
					onSelect: (groupId: string) => {
						setSelectedNodeGroupId(groupId);
						setEditingStepId(null);
						setSelectedBodyNodeId(undefined);
					},
					onToggle: (groupId: string) => {
						const viewport =
							reactFlowInstanceRef.current?.getViewport();
						initialViewFittedRef.current = true;
						const willCollapse =
							!collapsedNodeGroupIds.has(groupId);
						if (willCollapse) {
							const memberIds = new Set(
								visibleNodeGroups.find(
									(item) => item.id === groupId,
								)?.nodeIds ?? [],
							);
							for (const memberId of memberIds) {
								selectedNodeIdsRef.current.delete(memberId);
							}
							setGroupSelectionIds(
								(previous) =>
									new Set(
										[...previous].filter(
											(nodeId) => !memberIds.has(nodeId),
										),
									),
							);
							const expandedMemberLoops = new Set(
								displaySteps
									.filter(
										(step) =>
											memberIds.has(step.id) &&
											step.type === "loop",
									)
									.map((step) => step.id),
							);
							setExpandedLoopIds((previous) => {
								const next = new Set(previous);
								for (const loopId of expandedMemberLoops) {
									next.delete(loopId);
								}
								return next;
							});
							setRfNodes((previous) =>
								previous.map((node) =>
									memberIds.has(node.id)
										? { ...node, selected: false }
										: node,
								),
							);
						}
						setCollapsedNodeGroupIds((previous) => {
							const next = new Set(previous);
							if (next.has(groupId)) next.delete(groupId);
							else next.add(groupId);
							return next;
						});
						if (viewport) {
							window.requestAnimationFrame(() => {
								void reactFlowInstanceRef.current?.setViewport(
									viewport,
									{ duration: 0 },
								);
							});
						}
					},
				},
				selectable: false,
				focusable: false,
				draggable: false,
				zIndex: 0,
				style: {
					width: isGroupCollapsed
						? NODE_WIDTH
						: right - left + padding * 2,
					height: isGroupCollapsed
						? 72 +
							Math.min(members.length, 3) * 36 +
							(members.length > 3 ? 22 : 0)
						: bottom - top + padding * 2 + 12,
				},
			});
		}

		displaySteps.forEach((step) => {
			const expansionOffset = expandedNodeOffsets.get(step.id) ?? 0;
			const displayPosition = {
				x: step.position.x + expansionOffset,
				y: step.position.y,
			};
			const outgoingEdges = displayEdges.filter(
				(item) => item.source === step.id,
			);

			if (step.type === "trigger") {
				newNodes.push({
					id: step.id,
					type: "trigger",
					position: displayPosition,
					data: {
						label: description.trim() || "Start",
						devMode,
						triggerModes: Array.isArray(
							step.workflowConfig?.triggerModes,
						)
							? step.workflowConfig.triggerModes.filter(
									(
										mode,
									): mode is "schedule" | "event-based" =>
										mode === "schedule" ||
										mode === "event-based",
								)
							: step.workflowConfig?.triggerType === "schedule" ||
									step.workflowConfig?.triggerType ===
										"event-based"
								? [step.workflowConfig.triggerType]
								: [],
						runStatus:
							displayStatuses[step.id] ??
							(running ? "running" : undefined),
						pathHighlighted: highlightedPathNodeIds.has(step.id),
						groupSelectionActive: isGroupSelection(step.id),
						hasOutgoingControlEdge: outgoingEdges.some(
							(edge) => edge.kind === "control",
						),
					},
					draggable: true,
					style: { width: TRIGGER_NODE_WIDTH },
				});
			} else if (step.type === "branch") {
				const branchConfig = step.config as RoutingConfig;
				const handleColors: Record<string, string> = {};
				for (const clause of branchConfig.clauses) {
					const handleId = `case-${step.id}-${clause.id}`;
					const edge = outgoingEdges.find(
						(item) => item.sourceHandle === handleId,
					);
					handleColors[handleId] = edge
						? getEdgeStrokeColor(edge)
						: edgeColor;
				}
				const elseHandleId = `else-${step.id}`;
				const elseEdge = outgoingEdges.find(
					(item) => item.sourceHandle === elseHandleId,
				);
				handleColors[elseHandleId] = elseEdge
					? getEdgeStrokeColor(elseEdge)
					: edgeColor;

				newNodes.push({
					id: step.id,
					type: "branch",
					position: displayPosition,
					data: {
						step,
						index: stepDisplayOrder.get(step.id) ?? 0,
						runStatus: displayStatuses[step.id],
						runError: displayErrors[step.id],
						runDuration: displayDurations[step.id],
						isIncomplete:
							[
								...validateCanvasWorkflowNode(step, steps),
								...validateCanvasWorkflowConnections(
									step,
									graphEdges,
								),
							].length > 0 && !displayStatuses[step.id],
						locked: running || readOnly || viewingHistory,
						highlighted: isStepHighlighted(
							changeHighlight,
							step.id,
						),
						handleColors,
						pathHighlighted: highlightedPathNodeIds.has(step.id),
						groupSelectionActive: isGroupSelection(step.id),
					},
					style: { width: NODE_WIDTH },
				});
			} else if (step.type === "loop") {
				const body = step.body ?? { nodes: [], edges: [] };
				const isLoopExpanded = expandedLoopIds.has(step.id);
				const bodyNodesAreUnpositioned = body.nodes.every(
					(node) => node.position.x === 0 && node.position.y === 0,
				);
				const bodyNodes =
					bodyNodesAreUnpositioned && body.nodes.length > 1
						? layoutLoopBodyNodes(body)
						: body.nodes;
				const bodyLeft = LOOP_BODY_OFFSET_X;
				const bodyTop = LOOP_BODY_OFFSET_Y;
				const loopDimensions = canvasNodeDimensions(
					step,
					isLoopExpanded,
				);
				newNodes.push({
					id: step.id,
					type: "loop",
					position: displayPosition,
					zIndex: expandedLoopIds.has(step.id) ? 10 : 0,
					data: {
						step,
						index: stepDisplayOrder.get(step.id) ?? 0,
						runStatus: displayStatuses[step.id],
						runError: displayErrors[step.id],
						runDuration: displayDurations[step.id],
						runOutput: stepOutputPreviews[step.id] ?? null,
						hasOutgoingControlEdge: outgoingEdges.some(
							(edge) => edge.kind === "control",
						),
						isIncomplete:
							validateCanvasWorkflowNode(step, steps).length >
								0 && !displayStatuses[step.id],
						locked: running || readOnly || viewingHistory,
						highlighted: isStepHighlighted(
							changeHighlight,
							step.id,
						),
						pathHighlighted: highlightedPathNodeIds.has(step.id),
						groupSelectionActive: isGroupSelection(step.id),
						expanded: expandedLoopIds.has(step.id),
						onExpandedChange: (expanded: boolean) =>
							setLoopExpanded(step.id, expanded),
						onFocusExpanded: () => {
							window.requestAnimationFrame(() => {
								window.requestAnimationFrame(() => {
									reactFlowInstanceRef.current?.fitView({
										nodes: [{ id: step.id }],
										padding: 0.2,
										duration: 250,
										maxZoom: 1,
									});
								});
							});
						},
						onFocusCollapsed: () => {
							window.requestAnimationFrame(() => {
								window.requestAnimationFrame(() => {
									reactFlowInstanceRef.current?.fitView({
										padding: 0.2,
										duration: 250,
										maxZoom: 1,
									});
								});
							});
						},
						onAddBodyStep: () => {
							setAddingToLoopId(step.id);
							setLoopBodyInsertionPoint(null);
							setAddAfterStepId(null);
							setAddAfterHandle(null);
							setShowAddMenu(true);
						},
					},
					style: {
						width: loopDimensions.width,
						height: isLoopExpanded
							? loopDimensions.height
							: undefined,
						pointerEvents: isLoopExpanded ? "none" : "auto",
					},
				});
				if (isLoopExpanded && !collapsedNodeIds.has(step.id)) {
					bodyNodes.forEach((bodyNode, bodyIndex) => {
						const isBranch = bodyNode.type === "branch";
						const bodyOutgoingEdges = body.edges.filter(
							(edge) => edge.source === bodyNode.id,
						);
						const handleColors: Record<string, string> = {};
						if (isBranch) {
							const branchConfig =
								bodyNode.config as RoutingConfig;
							for (const clause of branchConfig.clauses) {
								const handleId = `case-${bodyNode.id}-${clause.id}`;
								const edge = bodyOutgoingEdges.find(
									(item) => item.sourceHandle === handleId,
								);
								handleColors[handleId] = edge
									? getLoopBodyEdgeStrokeColor(edge)
									: edgeColor;
							}
							const elseHandleId = `else-${bodyNode.id}`;
							const elseEdge = bodyOutgoingEdges.find(
								(item) => item.sourceHandle === elseHandleId,
							);
							handleColors[elseHandleId] = elseEdge
								? getLoopBodyEdgeStrokeColor(elseEdge)
								: edgeColor;
						}
						newNodes.push({
							id: bodyNode.id,
							type: isBranch ? "branch" : "automation",
							position: {
								x:
									displayPosition.x +
									bodyLeft +
									bodyNode.position.x,
								y:
									displayPosition.y +
									bodyTop +
									bodyNode.position.y,
							},
							zIndex: 12,
							data: {
								step: bodyNode,
								index: bodyIndex,
								runStatus: displayStatuses[bodyNode.id],
								runError: displayErrors[bodyNode.id],
								runDuration: displayDurations[bodyNode.id],
								runOutput:
									stepOutputPreviews[bodyNode.id] ?? null,
								hasOutgoingControlEdge: bodyOutgoingEdges.some(
									(edge) => edge.kind === "control",
								),
								runTrace: displayResults.find(
									(result) => result.NODE_ID === bodyNode.id,
								)?.trace,
								isIncomplete:
									validateCanvasWorkflowNode(
										bodyNode,
										body.nodes,
									).length > 0 &&
									!displayStatuses[bodyNode.id],
								locked: running || readOnly || viewingHistory,
								highlighted: isStepHighlighted(
									changeHighlight,
									bodyNode.id,
								),
								handleColors,
								pathHighlighted:
									selectedLoopBodyPath.nodeIds.has(
										bodyNode.id,
									),
								loopPathHighlighted:
									selectedLoopBodyPath.nodeIds.has(
										bodyNode.id,
									),
								onMoveOut:
									bodyNode.type === "branch" ||
									bodyNode.type === "loop"
										? undefined
										: () =>
												moveBodyNodeOut(
													step.id,
													bodyNode.id,
												),
							},
							style: { width: NODE_WIDTH },
						});
						bodyOutgoingEdges.forEach((edge, laneIndex) => {
							const strokeColor =
								getLoopBodyEdgeStrokeColor(edge);
							newEdges.push({
								...edge,
								id: `loop-${step.id}-${edge.id}`,
								sourceHandle:
									edge.sourceHandle ?? `out-${edge.source}`,
								targetHandle:
									edge.targetHandle ?? `in-${edge.target}`,
								type: "deletable",
								markerEnd: {
									type: MarkerType.ArrowClosed,
									width: 12,
									height: 12,
									color: strokeColor,
								},
								style: {
									stroke: strokeColor,
									strokeWidth: 1.5,
								},
								data: {
									onDelete:
										readOnly || viewingHistory
											? undefined
											: () =>
													deleteLoopBodyEdge(
														step.id,
														edge.id,
													),
									readOnly: readOnly || viewingHistory,
									hovered: edge.id === hoveredEdgeId,
									laneIndex,
									laneCount: bodyOutgoingEdges.length,
								},
							});
						});
					});
				}
			} else {
				const runTrace = displayResults.find(
					(result) => result.NODE_ID === step.id,
				)?.trace;
				newNodes.push({
					id: step.id,
					type: "automation",
					position: displayPosition,
					data: {
						step,
						index: stepDisplayOrder.get(step.id) ?? 0,
						runStatus: displayStatuses[step.id],
						runError: displayErrors[step.id],
						runDuration: displayDurations[step.id],
						runOutput: stepOutputPreviews[step.id] ?? null,
						runTrace,
						hasOutgoingControlEdge: outgoingEdges.some(
							(edge) => edge.kind === "control",
						),
						isIncomplete:
							validateCanvasWorkflowNode(step, steps).length >
								0 && !displayStatuses[step.id],
						locked: running || readOnly || viewingHistory,
						highlighted: isStepHighlighted(
							changeHighlight,
							step.id,
						),
						pathHighlighted: highlightedPathNodeIds.has(step.id),
						groupSelectionActive: isGroupSelection(step.id),
					},
					style: { width: NODE_WIDTH },
				});
			}

			outgoingEdges.forEach((edge, laneIndex) => {
				const sourceGroup = collapsedGroupByNodeId.get(edge.source);
				const targetGroup = collapsedGroupByNodeId.get(edge.target);
				if (sourceGroup && sourceGroup.id === targetGroup?.id) return;
				const renderedEdgeId =
					sourceGroup || targetGroup
						? `group-edge-${edge.id}`
						: edge.id;
				const strokeColor = getEdgeStrokeColor(edge);
				const isPathHighlighted = highlightedPathEdgeIds.has(edge.id);
				newEdges.push({
					...edge,
					id: renderedEdgeId,
					source: sourceGroup
						? `node-group-${sourceGroup.id}`
						: edge.source,
					target: targetGroup
						? `node-group-${targetGroup.id}`
						: edge.target,
					sourceHandle: sourceGroup
						? `group-source-${edge.id}`
						: edge.sourceHandle,
					targetHandle: targetGroup
						? `group-target-${edge.id}`
						: edge.targetHandle,
					type: "deletable",
					markerEnd: {
						type: MarkerType.ArrowClosed,
						width: 12,
						height: 12,
						color: strokeColor,
					},
					style: {
						stroke: strokeColor,
						strokeWidth: isPathHighlighted ? 2.5 : 1.5,
					},
					data: {
						onDelete: viewingHistory
							? undefined
							: () => deleteEdge(edge.id),
						readOnly: readOnly || viewingHistory,
						hovered: renderedEdgeId === hoveredEdgeId,
						laneIndex,
						laneCount: outgoingEdges.length,
					},
				});
			});
		});

		const renderedNodeIds = new Set(newNodes.map((node) => node.id));
		for (const selectedNodeId of selectedNodeIdsRef.current) {
			if (!renderedNodeIds.has(selectedNodeId)) {
				selectedNodeIdsRef.current.delete(selectedNodeId);
			}
		}
		for (const node of newNodes) {
			if (collapsedNodeIds.has(node.id)) {
				node.hidden = true;
			}
			if (
				node.type !== "nodeGroup" &&
				selectedNodeIdsRef.current.has(node.id)
			) {
				node.selected = true;
			}
		}
		setRfNodes(newNodes);
		setRfEdges(newEdges);
	}, [
		steps,
		groupSelectionIds,
		collapsedNodeGroupIds,
		displaySteps,
		displayNodeGroups,
		displayEdges,
		expandedLoopIds,
		expandedNodeOffsets,
		displayStatuses,
		displayErrors,
		displayDurations,
		displayResults,
		selectedLoopBodyPath,
		viewingHistory,
		stepOutputPreviews,
		description,
		devMode,
		running,
		readOnly,
		graphEdges,
		stepDisplayOrder,
		changeHighlight,
		deleteEdge,
		deleteLoopBodyEdge,
		edgeColor,
		hoveredEdgeId,
		highlightedPathEdgeIds,
		highlightedPathNodeIds,
		layoutNodes,
		setRfNodes,
		setRfEdges,
		moveBodyNodeOut,
		setLoopExpanded,
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
		const fitWorkflow = () => {
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
				frame = requestAnimationFrame(fitWorkflow);
				return;
			}
			if (!nodeElement) return;
			reactFlowInstanceRef.current?.fitView({
				padding: 0.2,
				duration: 250,
				maxZoom: 1.2,
			});
			initialViewFittedRef.current = true;
		};

		frame = requestAnimationFrame(fitWorkflow);
		return () => cancelAnimationFrame(frame);
	}, [canvasInitialized, rfNodes]);

	const moveNodeBetweenGroups = useCallback(
		(nodeId: string, targetGroupId?: string) => {
			const targetGroup = targetGroupId
				? nodeGroups.find((group) => group.id === targetGroupId)
				: undefined;
			if (targetGroupId && !targetGroup) return;
			const currentGroupIds = nodeGroups
				.filter((group) => group.nodeIds.includes(nodeId))
				.map((group) => group.id);
			if (
				(targetGroup &&
					currentGroupIds.length === 1 &&
					currentGroupIds[0] === targetGroup.id) ||
				(!targetGroup && currentGroupIds.length === 0)
			) {
				return;
			}
			const nextGroups = nodeGroups
				.map((group) => ({
					...group,
					nodeIds: group.nodeIds.filter((id) => id !== nodeId),
				}))
				.filter((group) => group.nodeIds.length > 0);
			if (targetGroup) {
				const existingGroup = nextGroups.find(
					(group) => group.id === targetGroup.id,
				);
				if (existingGroup) {
					existingGroup.nodeIds.push(nodeId);
				} else {
					nextGroups.push({ ...targetGroup, nodeIds: [nodeId] });
				}
			}
			setNodeGroups(nextGroups);
			setIsDirty(true);
		},
		[nodeGroups],
	);

	// ---- Persist canvas positions ----
	const onNodeDragStop = useCallback(
		(_event: React.MouseEvent, draggedNode: Node) => {
			if (readOnly || viewingHistory) return;
			const containingLoop = steps.find((step) =>
				step.body?.nodes.some((node) => node.id === draggedNode.id),
			);
			const nodeElements =
				canvasContainerRef.current?.querySelectorAll<HTMLElement>(
					".react-flow__node",
				);
			const draggedElement = Array.from(nodeElements ?? []).find(
				(element) => element.dataset.id === draggedNode.id,
			);
			const draggedRect = draggedElement?.getBoundingClientRect();
			let droppedIntoGroup = false;
			if (draggedRect) {
				const centerX = draggedRect.left + draggedRect.width / 2;
				const centerY = draggedRect.top + draggedRect.height / 2;
				const groupElements =
					canvasContainerRef.current?.querySelectorAll<HTMLElement>(
						"[data-group-id]",
					);
				const targetGroup = Array.from(groupElements ?? []).find(
					(element) => {
						const rect = element.getBoundingClientRect();
						return (
							centerX >= rect.left &&
							centerX <= rect.right &&
							centerY >= rect.top &&
							centerY <= rect.bottom
						);
					},
				);
				if (containingLoop?.body) {
					const loopElement = Array.from(
						canvasContainerRef.current?.querySelectorAll<HTMLElement>(
							".react-flow__node[data-id]",
						) ?? [],
					).find(
						(element) => element.dataset.id === containingLoop.id,
					);
					const loopRect = loopElement?.getBoundingClientRect();
					const remainsInsideLoop = Boolean(
						loopRect &&
							centerX >= loopRect.left &&
							centerX <= loopRect.right &&
							centerY >= loopRect.top &&
							centerY <= loopRect.bottom,
					);
					if (!remainsInsideLoop) {
						const movedOut = moveBodyNodeOut(
							containingLoop.id,
							draggedNode.id,
							draggedNode.position,
						);
						if (movedOut) {
							moveNodeBetweenGroups(
								draggedNode.id,
								targetGroup?.dataset.groupId,
							);
						}
						return;
					}
					const loopDisplayX =
						containingLoop.position.x +
						(expandedNodeOffsets.get(containingLoop.id) ?? 0);
					setSteps((previous) =>
						previous.map((step) =>
							step.id === containingLoop.id && step.body
								? {
										...step,
										body: {
											...step.body,
											nodes: step.body.nodes.map(
												(node) =>
													node.id === draggedNode.id
														? {
																...node,
																position: {
																	x: Math.max(
																		0,
																		draggedNode
																			.position
																			.x -
																			loopDisplayX -
																			LOOP_BODY_OFFSET_X,
																	),
																	y: Math.max(
																		0,
																		draggedNode
																			.position
																			.y -
																			containingLoop
																				.position
																				.y -
																			LOOP_BODY_OFFSET_Y,
																	),
																},
															}
														: node,
											),
										},
									}
								: step,
						),
					);
					setIsDirty(true);
					return;
				}
				if (draggedNode.type !== "loop") {
					const loopElements =
						canvasContainerRef.current?.querySelectorAll<HTMLElement>(
							"[data-loop-id]",
						);
					const targetLoop = Array.from(loopElements ?? []).find(
						(element) => {
							const rect = element.getBoundingClientRect();
							return (
								centerX >= rect.left &&
								centerX <= rect.right &&
								centerY >= rect.top &&
								centerY <= rect.bottom
							);
						},
					);
					const loopId = targetLoop?.dataset.loopId;
					if (loopId) {
						moveNodeIntoLoop(draggedNode.id, loopId);
						return;
					}
				}
				moveNodeBetweenGroups(
					draggedNode.id,
					targetGroup?.dataset.groupId,
				);
				droppedIntoGroup = Boolean(targetGroup);
			}
			setSteps((previousSteps) => {
				const positionedSteps = previousSteps.map((step) =>
					step.id === draggedNode.id
						? {
								...step,
								position: {
									x:
										draggedNode.position.x -
										(expandedNodeOffsets.get(step.id) ?? 0),
									y: draggedNode.position.y,
								},
							}
						: step,
				);
				return droppedIntoGroup
					? layoutNodes(positionedSteps, graphEdges)
					: positionedSteps;
			});
			setIsDirty(true);
		},
		[
			expandedNodeOffsets,
			moveNodeIntoLoop,
			moveNodeBetweenGroups,
			moveBodyNodeOut,
			steps,
			graphEdges,
			layoutNodes,
			readOnly,
			viewingHistory,
		],
	);

	const cleanUpLayout = useCallback(() => {
		initialViewFittedRef.current = false;
		if (readOnly || viewingHistory) return;
		setSteps((previous) => layoutNodes(previous, graphEdges));
		setIsDirty(true);
	}, [graphEdges, layoutNodes, readOnly, viewingHistory]);
	const selectedCanvasNodeIds = displaySteps
		.filter((step) => groupSelectionIds.has(step.id))
		.map((step) => step.id);
	const openNodeGroupDialog = useCallback(
		(group?: AutomationNodeGroup) => {
			setEditingNodeGroupId(group?.id ?? null);
			setNodeGroupName(group?.name ?? `Group ${nodeGroups.length + 1}`);
			setIsNodeGroupDialogOpen(true);
		},
		[nodeGroups.length],
	);
	const saveNodeGroup = useCallback(() => {
		const name = nodeGroupName.trim();
		if (!name) {
			toast.error("Enter a group name.");
			return;
		}
		if (editingNodeGroupId) {
			setNodeGroups((previous) =>
				previous.map((group) =>
					group.id === editingNodeGroupId
						? { ...group, name }
						: group,
				),
			);
		} else {
			if (selectedCanvasNodeIds.length < 2) {
				toast.error("Select at least two nodes to create a group.");
				return;
			}
			const groupedNodeIds = new Set(selectedCanvasNodeIds);
			setNodeGroups((previous) => [
				...previous
					.map((group) => ({
						...group,
						nodeIds: group.nodeIds.filter(
							(nodeId) => !groupedNodeIds.has(nodeId),
						),
					}))
					.filter((group) => group.nodeIds.length > 0),
				{
					id: `group-${crypto.randomUUID()}`,
					name,
					nodeIds: selectedCanvasNodeIds,
				},
			]);
			for (const nodeId of groupedNodeIds) {
				selectedNodeIdsRef.current.delete(nodeId);
			}
			setGroupSelectionIds(new Set());
			setRfNodes((previous) =>
				previous.map((node) =>
					groupedNodeIds.has(node.id)
						? { ...node, selected: false }
						: node,
				),
			);
		}
		setIsDirty(true);
		setIsNodeGroupDialogOpen(false);
		setEditingNodeGroupId(null);
	}, [editingNodeGroupId, nodeGroupName, selectedCanvasNodeIds, setRfNodes]);
	const openNode = useCallback(
		(nodeId: string, bodyNodeId?: string) => {
			const parentLoop = steps.find((step) =>
				step.body?.nodes.some((node) => node.id === nodeId),
			);
			setShowAddMenu(false);
			setEditingStepId(parentLoop?.id ?? nodeId);
			setSelectedBodyNodeId(
				bodyNodeId ?? (parentLoop ? nodeId : undefined),
			);
		},
		[steps],
	);
	const openLoopEditor = useCallback(
		(nodeId: string) => {
			setShowAddMenu(false);
			setLoopExpanded(nodeId, true);
			setEditingStepId(nodeId);
			setSelectedBodyNodeId(undefined);
		},
		[setLoopExpanded],
	);
	const addNodeAfter = useCallback(
		(nodeId: string, sourceHandle?: string) => {
			if (viewingHistory) return;
			const parentLoop = steps.find((step) =>
				step.body?.nodes.some((node) => node.id === nodeId),
			);
			if (parentLoop) {
				setEditingStepId(parentLoop.id);
				setSelectedBodyNodeId(nodeId);
				setAddingToLoopId(parentLoop.id);
				setLoopBodyInsertionPoint({
					sourceId: nodeId,
					sourceHandle: sourceHandle ?? `out-${nodeId}`,
				});
				setShowAddMenu(true);
				return;
			}
			setEditingStepId(null);
			setAddingToLoopId(null);
			setLoopBodyInsertionPoint(null);
			setAddAfterStepId(nodeId);
			setAddAfterHandle(sourceHandle ?? null);
			setShowAddMenu(true);
		},
		[steps, viewingHistory],
	);
	const automationContextValue = useMemo(
		() => ({
			nodes: displaySteps.flatMap((step) => [
				step,
				...(step.body?.nodes ?? []),
			]),
			readOnly,
			viewingHistory,
			running,
			openNode,
			openLoopEditor,
			deleteNode: deleteStep,
			deleteNodeAndDownstream: (nodeId: string) =>
				setDeleteDownstreamStepId(nodeId),
			addNodeAfter,
			updateNode: updateStep,
			viewAgentRun: onViewAgentRun,
		}),
		[
			addNodeAfter,
			deleteStep,
			displaySteps,
			onViewAgentRun,
			openLoopEditor,
			openNode,
			readOnly,
			running,
			updateStep,
			viewingHistory,
		],
	);

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
		<AutomationContext.Provider value={automationContextValue}>
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
									{/* Historical run banner — read-only snapshot in place of the live graph */}
									{viewingHistory && historicalRun && (
										<div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 border-b bg-muted/60 px-4 py-2 text-sm">
											<span className="text-muted-foreground">
												Viewing run from{" "}
												{new Date(
													historicalRun.STARTED_AT,
												).toLocaleString()}{" "}
												— read-only
											</span>
											<Button
												size="sm"
												variant="outline"
												onClick={
													handleExitHistoricalView
												}
											>
												Return to editor
											</Button>
										</div>
									)}
									{/* Undo banner above the canvas */}
									{undoSnapshot && (
										<div className="absolute inset-x-0 top-0 z-20 px-4 pt-3">
											<UndoBanner
												onUndo={() => {
													setSteps(undoSnapshot);
													setUndoSnapshot(null);
												}}
												onDismiss={() =>
													setUndoSnapshot(null)
												}
											/>
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
											!readOnly && !viewingHistory
										}
										nodesConnectable={
											!readOnly &&
											!viewingHistory &&
											!running
										}
										panOnDrag
										panOnScroll
										selectionOnDrag
										selectionKeyCode={null}
										selectionMode={SelectionMode.Partial}
										multiSelectionKeyCode="Shift"
										zoomOnPinch
										zoomOnScroll={false}
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
										onPaneContextMenu={(event) =>
											event.preventDefault()
										}
										onNodeClick={(_event, node) => {
											setShowAddMenu(false);
											if (node.type === "nodeGroup") {
												const group = (
													node.data as {
														group?: AutomationNodeGroup;
													}
												).group;
												if (group) {
													selectedNodeIdsRef.current.clear();
													setGroupSelectionIds(
														new Set(),
													);
													setSelectedNodeGroupId(
														group.id,
													);
													setEditingStepId(null);
													setSelectedBodyNodeId(
														undefined,
													);
												}
												return;
											}
											setSelectedNodeGroupId(null);
											const parentLoop = steps.find(
												(step) =>
													step.body?.nodes.some(
														(bodyNode) =>
															bodyNode.id ===
															node.id,
													),
											);
											if (!parentLoop) {
												const additive =
													_event.shiftKey ||
													_event.metaKey ||
													_event.ctrlKey;
												setGroupSelectionIds(
													(previous) => {
														const next = additive
															? new Set(previous)
															: new Set<string>();
														if (
															additive &&
															next.has(node.id)
														) {
															next.delete(
																node.id,
															);
														} else {
															next.add(node.id);
														}
														selectedNodeIdsRef.current =
															new Set(next);
														return next;
													},
												);
											} else if (
												!_event.shiftKey &&
												!_event.metaKey &&
												!_event.ctrlKey
											) {
												selectedNodeIdsRef.current.clear();
												setGroupSelectionIds(new Set());
											}
											setEditingStepId(
												parentLoop?.id ?? node.id,
											);
											setSelectedBodyNodeId(
												parentLoop
													? node.id
													: undefined,
											);
										}}
										onNodesChange={handleRfNodesChange}
										onSelectionEnd={() => {
											const rootIds = new Set(
												displaySteps
													.filter((step) =>
														selectedNodeIdsRef.current.has(
															step.id,
														),
													)
													.map((step) => step.id),
											);
											setGroupSelectionIds(rootIds);
										}}
										onNodeDragStop={onNodeDragStop}
										onPaneClick={() => {
											setShowAddMenu(false);
											setSelectedNodeGroupId(null);
											setEditingStepId(null);
											setSelectedBodyNodeId(undefined);
											selectedNodeIdsRef.current.clear();
											setGroupSelectionIds(new Set());
										}}
										onConnect={onConnect}
										onEdgeMouseEnter={(_e, edge) =>
											setHoveredEdgeId(edge.id)
										}
										onEdgeMouseLeave={() =>
											setHoveredEdgeId(null)
										}
									>
										<Background
											variant={BackgroundVariant.Dots}
											gap={20}
											size={1}
											color={dotColor}
										/>
									</ReactFlow>

									<div
										className={`absolute top-4 right-4 z-30 items-center gap-2 ${(readOnly && mcpMode !== "trigger") || viewingHistory ? "hidden" : "flex"}`}
									>
										{mcpMode !== "trigger" && (
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														size="sm"
														variant="outline"
														className="bg-background shadow-sm"
														onClick={
															reloadFromServer
														}
														disabled={
															saving || running
														}
														aria-label="Reload workflow"
													>
														<RefreshCw className="h-3.5 w-3.5" />
													</Button>
												</TooltipTrigger>
												<TooltipContent side="bottom">
													Reload the saved workflow
												</TooltipContent>
											</Tooltip>
										)}
										{!readOnly && (
											<Tooltip>
												<TooltipTrigger asChild>
													<span
														tabIndex={
															selectedCanvasNodeIds.length <
															2
																? 0
																: -1
														}
														className="inline-flex"
													>
														<Button
															size="sm"
															variant="outline"
															className="bg-background shadow-sm"
															disabled={
																selectedCanvasNodeIds.length <
																2
															}
															onClick={() =>
																openNodeGroupDialog()
															}
														>
															<Layers3
																className="mr-1.5 size-3.5"
																aria-hidden
															/>
															Create Group
														</Button>
													</span>
												</TooltipTrigger>
												<TooltipContent side="bottom">
													<span className="block">
														Shift-click nodes or
														Shift-drag a selection
														box.
													</span>
													<span className="block">
														Select at least two to
														create a group.
													</span>
												</TooltipContent>
											</Tooltip>
										)}
										{mcpMode !== "trigger" && (
											<div
												className="relative"
												data-tour="save"
											>
												<Button
													size="sm"
													variant="outline"
													className="bg-background shadow-sm"
													onClick={() =>
														void (mcpMode &&
														mcpContext
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
															<span className="-top-1 -right-1 absolute h-2 w-2 rounded-full bg-warning ring-1 ring-background" />
														)}
													</span>
													{mcpMode && mcpContext
														? "Save — Return to Chat"
														: "Save"}
												</Button>
											</div>
										)}
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

									{!readOnly && (
										<div className="absolute right-4 bottom-4 z-10 flex items-center overflow-hidden rounded-lg border bg-background shadow-sm">
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														type="button"
														aria-label="Zoom out"
														onClick={() => {
															void reactFlowInstanceRef.current?.zoomOut(
																{
																	duration: 150,
																},
															);
														}}
														className="flex size-8 items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														<ZoomOut
															className="size-4"
															aria-hidden
														/>
													</button>
												</TooltipTrigger>
												<TooltipContent side="top">
													Zoom out
												</TooltipContent>
											</Tooltip>
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														type="button"
														aria-label="Zoom in"
														onClick={() => {
															void reactFlowInstanceRef.current?.zoomIn(
																{
																	duration: 150,
																},
															);
														}}
														className="flex size-8 items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														<ZoomIn
															className="size-4"
															aria-hidden
														/>
													</button>
												</TooltipTrigger>
												<TooltipContent side="top">
													Zoom in
												</TooltipContent>
											</Tooltip>
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														type="button"
														aria-label="Zoom to fit workflow"
														onClick={fitWorkflow}
														className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														<Scan
															className="size-4"
															aria-hidden
														/>
													</button>
												</TooltipTrigger>
												<TooltipContent side="top">
													Zoom to fit workflow
												</TooltipContent>
											</Tooltip>
										</div>
									)}

									{!readOnly && (
										<div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														type="button"
														aria-label="Clean up node layout"
														onClick={cleanUpLayout}
														className="flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted"
													>
														<RefreshCw className="h-4 w-4" />
													</button>
												</TooltipTrigger>
												<TooltipContent side="top">
													Clean up layout
												</TooltipContent>
											</Tooltip>

											<div className="flex items-center gap-0.5 rounded-md bg-muted/60 p-0.5">
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															aria-pressed={
																!devMode
															}
															aria-label="Design mode"
															onClick={() =>
																handleDevModeChange(
																	false,
																)
															}
															className={`flex items-center justify-center rounded p-1.5 transition-colors ${!devMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
														>
															<Workflow className="h-4 w-4" />
														</button>
													</TooltipTrigger>
													<TooltipContent side="top">
														Design mode
													</TooltipContent>
												</Tooltip>
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															aria-pressed={
																devMode
															}
															aria-label="Dev mode"
															onClick={() =>
																handleDevModeChange(
																	true,
																)
															}
															className={`flex items-center justify-center rounded p-1.5 transition-colors ${devMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
														>
															<Code2 className="h-4 w-4" />
														</button>
													</TooltipTrigger>
													<TooltipContent side="top">
														Dev mode — Python source
														editors
													</TooltipContent>
												</Tooltip>
											</div>
										</div>
									)}
								</div>
							}
						/>
					</div>
				</div>
			</div>

			<Dialog open={confirmReload} onOpenChange={setConfirmReload}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Discard unsaved changes?</DialogTitle>
						<DialogDescription>
							Reloading reads the saved workflow from the server
							and replaces what is on this canvas. Your unsaved
							edits will be lost.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setConfirmReload(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => {
								setConfirmReload(false);
								refresh(
									{ toolName: "reload", changedStepIds: [] },
									true,
								);
							}}
						>
							Discard and reload
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteDownstreamStepId !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteDownstreamStepId(null);
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							Delete this step and everything after it?
						</DialogTitle>
						<DialogDescription>
							This removes every step reachable from the selected
							step. This action can be reviewed before saving.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDownstreamStepId(null)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (deleteDownstreamStepId) {
									deleteStep(deleteDownstreamStepId, true);
								}
								setDeleteDownstreamStepId(null);
							}}
						>
							Delete all
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isNodeGroupDialogOpen}
				onOpenChange={setIsNodeGroupDialogOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editingNodeGroupId
								? "Rename Group"
								: "Group nodes"}
						</DialogTitle>
						<DialogDescription>
							{editingNodeGroupId
								? "Update the title shown above this group."
								: `Create a visual group around ${selectedCanvasNodeIds.length} selected nodes.`}
						</DialogDescription>
					</DialogHeader>
					<Input
						aria-label="Group name"
						value={nodeGroupName}
						onChange={(event) =>
							setNodeGroupName(event.target.value)
						}
						placeholder="Group name"
						autoFocus
					/>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsNodeGroupDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={saveNodeGroup}>
							{editingNodeGroupId
								? "Rename Group"
								: "Create Group"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog
				open={!readOnly && showAddMenu}
				onOpenChange={(open) => {
					setShowAddMenu(open);
					if (!open) {
						setAddingToLoopId(null);
						setLoopBodyInsertionPoint(null);
					}
				}}
			>
				<DialogContent className="flex h-[80vh] max-w-3xl flex-col p-0">
					<DialogHeader className="sr-only">
						<DialogTitle>Add workflow node</DialogTitle>
					</DialogHeader>
					<AddNodeMenu
						onSelect={addStep}
						nodeFilter={addingToLoopId ? canAddToLoop : undefined}
						title={addingToLoopId ? "Add a loop step" : undefined}
						description={
							addingToLoopId
								? "Choose an action to include in the loop."
								: undefined
						}
					/>
				</DialogContent>
			</Dialog>
		</AutomationContext.Provider>
	);
});
