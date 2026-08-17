import {
	Background,
	BackgroundVariant,
	type Connection,
	type Edge,
	MarkerType,
	type Node,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
	CheckCircle,
	Hand,
	HelpCircle,
	Loader2,
	MousePointer2,
	Play,
	Plus,
	RefreshCw,
	Save,
	Sparkles,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
	Button,
	Field,
	FieldLabel,
	Switch,
	Textarea,
	toast,
} from "@semoss/ui/next";
import type {
	AutomationEdge,
	AutomationNode,
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunSummary,
	AutomationToolContext,
	RunStatus,
	StepRunStatus,
} from "../../domain/automation.types";
import type { AutomationRunData } from "../../domain/automation-display";
import {
	formatRelativeTime,
	formatRunDuration,
	formatTimestamp,
	getDisplayMeta,
} from "../../domain/automation-display";
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
	getWorkflowNodeDefinition,
	validateCanvasWorkflowNode,
} from "../../domain/automation-workflow-adapter";
import { HelpModal } from "../form-editor/help-modal";
import { NodeResultList } from "../form-editor/node-result-list";
import { OnboardingTour } from "../form-editor/onboarding-tour";
import { TemplateGallery } from "../form-editor/template-gallery";
import { StatusBadge } from "../status-badge";
import { AddNodeMenu } from "./add-node-menu";
import { AutomationDockLayout } from "./automation-dock-layout";
import { AutomationHistoryPanel } from "./automation-history-panel";
import { NodeEditDrawer } from "./node-edit-drawer";
import { AutomationNode as AutomationNodeCard } from "./nodes/automation-node";
import { TriggerNode } from "./nodes/trigger-node";
import { RunBanner } from "./run-banner";
import { UndoBanner } from "./undo-banner";

// ---- React Flow custom node registry (must be outside component) ----
const nodeTypes = {
	trigger: TriggerNode,
	automation: AutomationNodeCard,
} as const;

// ---- Layout constants ----
const NODE_WIDTH = 480;
const DEFAULT_NODE_HEIGHT = 120;
const NODE_ARROW_GAP = 40;

// ---- Types ----
interface AutomationCanvasProps {
	appId: string;
	mcpMode?: "edit" | "create" | null;
	mcpContext?: AutomationToolContext;
}

type TabId = "steps" | "history" | "config";

interface TriggerAutomationOutput extends Partial<AutomationRunData> {
	STATUS?: RunStatus;
	status?: RunStatus;
}

interface CanvasWorkflowDraft {
	steps: AutomationNode[];
	edges: AutomationEdge[];
	description: string;
	source: string;
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

function defaultEdges(nodes: AutomationNode[]): AutomationEdge[] {
	return nodes.slice(0, -1).map((node, index) => ({
		id: `e-${node.id}-${nodes[index + 1].id}`,
		source: node.id,
		target: nodes[index + 1].id,
	}));
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

// ---- Component ----
export function AutomationCanvas({
	appId,
	mcpMode,
	mcpContext,
}: AutomationCanvasProps) {
	const [saving, setSaving] = useState(false);
	const [activeTab] = useState<TabId>("steps");
	const [description, setDescription] = useState("");
	const [devMode, setDevMode] = useState(
		() => localStorage.getItem(`automation-devmode-${appId}`) === "true",
	);
	const [showGenerationWizard, setShowGenerationWizard] = useState(false);
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
	const [source, setSource] = useState(
		() => createInitialCanvasWorkflowDocument().source,
	);
	const [triggerBindings, setTriggerBindings] = useState<TriggerBinding[]>(
		() => createInitialCanvasWorkflowDocument().triggerBindings,
	);
	const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
	const [showAddMenu, setShowAddMenu] = useState(false);

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
	const [runs, setRuns] = useState<AutomationRunSummary[]>([]);
	const [runDetails, setRunDetails] = useState<
		Record<string, AutomationRunDetail>
	>({});
	const [expandedHistoryRunId, setExpandedHistoryRunId] = useState<
		string | null
	>(null);
	const [expandedHistoryRun, setExpandedHistoryRun] =
		useState<AutomationRunDetail | null>(null);
	const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
	const [expandedHistoryNodes, setExpandedHistoryNodes] = useState<
		Set<string>
	>(new Set());
	const [expandedTraceNodes, setExpandedTraceNodes] = useState<Set<string>>(
		new Set(),
	);
	const [showExecutedDefinition, setShowExecutedDefinition] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const [mcpDone, setMcpDone] = useState(false);
	const [undoSnapshot, setUndoSnapshot] = useState<AutomationNode[] | null>(
		null,
	);
	const [suggestingDescription, setSuggestingDescription] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const loadedRef = useRef(false);

	// React Flow state
	const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState<Node>([]);
	const [rfEdges, setRfEdges] = useEdgesState<Edge>([]);
	const canvasContainerRef = useRef<HTMLDivElement>(null);
	const centerXRef = useRef(0);

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
						sourceHandle: connection.sourceHandle ?? undefined,
						targetHandle: connection.targetHandle ?? undefined,
					},
				];
			});
		},
		[steps],
	);

	const layoutNodes = useCallback(
		(nodes: AutomationNode[]): AutomationNode[] => {
			const containerWidth =
				canvasContainerRef.current?.clientWidth ?? 900;
			const centerX = Math.max(
				0,
				Math.floor((containerWidth - NODE_WIDTH) / 2),
			);
			centerXRef.current = centerX;

			let y = 0;
			return nodes.map((node) => {
				const positionedNode = {
					...node,
					position: { x: centerX, y },
				};
				y += getNodeHeight(node.id) + NODE_ARROW_GAP;
				return positionedNode;
			});
		},
		[getNodeHeight],
	);

	// ---- Workflow definition loading ----
	useEffect(() => {
		let cancelled = false;
		loadedRef.current = false;
		void runPixel(`GetAutomation(project=["${appId}"]);`)
			.then((response) => {
				if (cancelled) return;
				const output = response.pixelReturn?.[0]?.output as
					| (AutomationWorkflowDocument & { source?: string })
					| undefined;
				const saved = isWorkflowDocument(output)
					? canvasDocumentFromWorkflow(
							output,
							output.source ??
								createInitialCanvasWorkflowDocument().source,
						)
					: createInitialCanvasWorkflowDocument();
				const rawDraft = localStorage.getItem(
					`automation-draft-${appId}`,
				);
				if (rawDraft && !mcpMode) {
					try {
						const draft = JSON.parse(
							rawDraft,
						) as CanvasWorkflowDraft;
						setSteps(ensureTriggerNode(draft.steps));
						setGraphEdges(draft.edges);
						setDescription(draft.description);
						setSource(draft.source);
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
				setSteps(ensureTriggerNode(saved.steps));
				setGraphEdges(saved.edges);
				setDescription(saved.description);
				setSource(saved.source);
				setTriggerBindings(saved.triggerBindings);
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
					setSource(initial.source);
					setTriggerBindings(initial.triggerBindings);
				}
			})
			.finally(() => {
				if (!cancelled) loadedRef.current = true;
			});
		return () => {
			cancelled = true;
		};
	}, [appId, mcpMode]);

	const historyLoading = false;
	const hasRunnableSteps = steps.some(
		(step) => step.workflowType !== "trigger.start",
	);
	const refreshRuns = useCallback(() => setLastRefreshed(new Date()), []);

	// Draft persistence
	useEffect(() => {
		if (!loadedRef.current) return;
		const draft = {
			steps,
			edges: graphEdges,
			description,
			source,
			triggerBindings,
			savedAt: Date.now(),
		};
		localStorage.setItem(
			`automation-draft-${appId}`,
			JSON.stringify(draft),
		);
		setIsDirty(true);
	}, [steps, graphEdges, description, source, triggerBindings, appId]);

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

	const incompleteCount = useMemo(
		() =>
			steps.filter(
				(step) =>
					step.workflowType !== "trigger.start" &&
					validateCanvasWorkflowNode(step).length > 0,
			).length,
		[steps],
	);

	// ---- Callbacks ----
	const handleDevModeChange = useCallback(
		(value: boolean) => {
			setDevMode(value);
			localStorage.setItem(`automation-devmode-${appId}`, String(value));
		},
		[appId],
	);

	const addStep = useCallback(
		(type: AutomationWorkflowNodeType) => {
			const previousStep = steps[steps.length - 1];
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
					},
				]);
			}
			setShowAddMenu(false);
			setEditingStepId(id);
		},
		[getNodeHeight, steps],
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
		(index: number) =>
			steps
				.slice(0, index)
				.map((step) => step.outputVar)
				.filter(
					(value): value is string =>
						typeof value === "string" && value.length > 0,
				),
		[steps],
	);

	const save = useCallback(async (): Promise<boolean> => {
		setSaving(true);
		try {
			const definition = canvasDocumentToWorkflow({
				description,
				triggerBindings,
				steps,
				edges: graphEdges,
			});
			await runPixel(
				`SaveAutomation(project=["${appId}"], json=["${encodeBase64(JSON.stringify(definition))}"], source=["${encodeBase64(source)}"]);`,
			);
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
	}, [appId, description, graphEdges, source, steps, triggerBindings]);

	// Cmd+S / Ctrl+S
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				void save();
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [save]);

	const dismissRun = useCallback(() => {
		setLatestRunResults([]);
		setLatestRunStatus(null);
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setAiRunSummary(null);
	}, []);

	const applyRunData = useCallback(
		(runData: AutomationRunData) => {
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
							: "success";
				if (result.ERROR_MESSAGE)
					errors[step.id] = result.ERROR_MESSAGE;
				durations[step.id] = result.DURATION_MS;
			}
			setStepStatuses(statuses);
			setStepErrors(errors);
			setStepDurations(durations);
			setLatestRunStatus(runData.STATUS);
			setLatestRunResults(nodeResults);
		},
		[steps],
	);

	const run = useCallback(async () => {
		const invalidSteps = steps.filter(
			(step) =>
				step.workflowType !== "trigger.start" &&
				validateCanvasWorkflowNode(step).length > 0,
		);
		if (invalidSteps.length > 0) {
			setStepStatuses(
				Object.fromEntries(
					invalidSteps.map((step) => [step.id, "error"] as const),
				),
			);
			setStepErrors(
				Object.fromEntries(
					invalidSteps.map((step) => [
						step.id,
						validateCanvasWorkflowNode(step).join(". "),
					]),
				),
			);
			toast.error(
				`Fix ${invalidSteps.length} step${invalidSteps.length === 1 ? "" : "s"} before running`,
			);
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
			const response = await runPixel(
				`TriggerAutomation(project=["${appId}"]);`,
			);
			const output = response.pixelReturn?.[0]
				?.output as TriggerAutomationOutput | null;
			const status = output?.STATUS ?? output?.status ?? "SUCCESS";
			const runId = output?.RUN_ID ?? crypto.randomUUID();
			const nodeResults =
				output?.nodeResults ??
				steps.map(
					(step): AutomationNodeResult => ({
						NODE_ID: step.id,
						NODE_LABEL: step.label,
						STATUS: status === "FAILED" ? "FAILED" : "SUCCESS",
						DURATION_MS: 0,
						OUTPUT_PREVIEW: null,
						ERROR_MESSAGE:
							status === "FAILED"
								? (output?.ERROR_MESSAGE ?? "Automation failed")
								: null,
					}),
				);
			const runData: AutomationRunData = {
				STATUS: status,
				RUN_ID: runId,
				nodeResults,
				ERROR_MESSAGE: output?.ERROR_MESSAGE,
				summary: output?.summary,
			};
			applyRunData(runData);
			setAiRunSummary(runData.summary ?? null);
			const completedAt = new Date().toISOString();
			const summary: AutomationRunSummary = {
				RUN_ID: runId,
				PROJECT_ID: appId,
				STARTED_AT: completedAt,
				COMPLETED_AT: completedAt,
				STATUS: status,
				RESULT_SUMMARY: runData.summary,
			};
			setRuns((previous) => [summary, ...previous]);
			setRunDetails((previous) => ({
				...previous,
				[runId]: { ...summary, nodeResults },
			}));
			setLastRefreshed(new Date());
			if (status === "SUCCESS") {
				toast.success(runData.summary ?? "Automation completed");
			} else {
				toast.error(runData.ERROR_MESSAGE ?? "Automation failed");
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
	}, [appId, applyRunData, save, steps]);

	const handleDoneReturnToChat = useCallback(async () => {
		if (saving) return;
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
	}, [saving, mcpContext, isDirty, save, steps, description, appId, mcpMode]);

	const handleSuggestDescription = useCallback(() => {
		if (suggestingDescription) return;
		setSuggestingDescription(true);
		const labels = steps
			.filter((step) => step.workflowType !== "trigger.start")
			.map(
				(step) =>
					step.label ??
					(step.workflowType
						? getWorkflowNodeDefinition(step.workflowType)?.label
						: undefined),
			)
			.filter((label): label is string => Boolean(label));
		setDescription(
			labels.length > 0
				? `Automation that runs ${labels.join(", ")}.`
				: "Python automation workflow.",
		);
		setSuggestingDescription(false);
	}, [steps, suggestingDescription]);

	const loadTemplate = useCallback(
		(nodes: AutomationNode[], automationDescription: string) => {
			const fresh = ensureTriggerNode(nodes);
			setSteps(fresh);
			setGraphEdges(defaultEdges(fresh));
			setDescription(automationDescription);
			sessionStorage.setItem(`automation-wizard-seen-${appId}`, "true");
			setShowGenerationWizard(false);
		},
		[appId],
	);

	const onStartBlank = useCallback(() => {
		sessionStorage.setItem(`automation-wizard-seen-${appId}`, "true");
		setShowGenerationWizard(false);
	}, [appId]);

	const selectHistoryRun = useCallback(
		(runId: string) => {
			if (expandedHistoryRunId === runId) {
				setExpandedHistoryRunId(null);
				setExpandedHistoryRun(null);
				setExpandedHistoryNodes(new Set());
				setShowExecutedDefinition(false);
				return;
			}
			setExpandedHistoryRunId(runId);
			setExpandedHistoryRun(null);
			setExpandedHistoryNodes(new Set());
			setShowExecutedDefinition(false);
			setHistoryDetailLoading(true);
			setExpandedHistoryRun(runDetails[runId] ?? null);
			setHistoryDetailLoading(false);
		},
		[expandedHistoryRunId, runDetails],
	);

	const toggleHistoryNode = useCallback((nodeId: string) => {
		setExpandedHistoryNodes((prev) => {
			const next = new Set(prev);
			if (next.has(nodeId)) next.delete(nodeId);
			else next.add(nodeId);
			return next;
		});
	}, []);

	const toggleTraceNode = useCallback((nodeId: string) => {
		setExpandedTraceNodes((prev) => {
			const next = new Set(prev);
			if (next.has(nodeId)) next.delete(nodeId);
			else next.add(nodeId);
			return next;
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
			setSteps(layoutNodes);
		}

		steps.forEach((step, i) => {
			const nonTriggerSteps = steps.filter(
				(step) => step.workflowType !== "trigger.start",
			);
			const ntIndex = nonTriggerSteps.findIndex((s) => s.id === step.id);

			if (step.type === "trigger") {
				newNodes.push({
					id: step.id,
					type: "trigger",
					position: step.position,
					data: {
						label: description.trim() || "Start",
						devMode,
						isLast: i === steps.length - 1,
						onEdit: () => {
							setShowAddMenu(false);
							setEditingStepId(step.id);
						},
						onAdd: () => {
							setEditingStepId(null);
							setShowAddMenu(true);
						},
					},
					draggable: false,
					style: { width: NODE_WIDTH },
				});
			} else {
				newNodes.push({
					id: step.id,
					type: "automation",
					position: step.position,
					data: {
						step,
						index: ntIndex,
						runStatus: stepStatuses[step.id],
						runError: stepErrors[step.id],
						runDuration: stepDurations[step.id],
						runOutput: stepOutputPreviews[step.id] ?? null,
						isIncomplete:
							validateCanvasWorkflowNode(step).length > 0 &&
							!stepStatuses[step.id],
						locked: running,
						isLast: i === steps.length - 1,
						onEdit: () => {
							setShowAddMenu(false);
							setEditingStepId(step.id);
						},
						onDelete: () => deleteStep(step.id),
						onAdd: () => {
							setEditingStepId(null);
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
					type: "smoothstep",
					markerEnd: {
						type: MarkerType.ArrowClosed,
						width: 12,
						height: 12,
						color: "#94a3b8",
					},
					style: { stroke: "#94a3b8", strokeWidth: 1.5 },
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
		graphEdges,
		deleteStep,
		layoutNodes,
		setRfNodes,
		setRfEdges,
	]);

	// ---- Persist canvas positions ----
	const onNodeDragStop = useCallback(
		(_event: React.MouseEvent, draggedNode: Node) => {
			if (draggedNode.type !== "automation") return;
			setSteps((previousSteps) =>
				previousSteps.map((step) =>
					step.id === draggedNode.id
						? { ...step, position: { ...draggedNode.position } }
						: step,
				),
			);
			setIsDirty(true);
		},
		[],
	);

	const cleanUpLayout = useCallback(() => {
		setSteps(layoutNodes);
		setIsDirty(true);
	}, [layoutNodes]);

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
					{/* ---- Header ---- */}
					<div className="border-b px-6 py-4">
						<div className="flex items-center justify-between">
							<div>
								<span className="font-semibold">
									Automation studio
								</span>
								<p className="mt-0.5 text-[11px] text-muted-foreground">
									Compose a clear, repeatable action graph.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setShowHelp(true)}
									className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted"
								>
									<HelpCircle className="h-3.5 w-3.5" />
									Help
								</button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										setShowGenerationWizard(true)
									}
									disabled={running}
								>
									Templates
								</Button>
								<Button
									data-tour="add-step"
									size="sm"
									variant="outline"
									onClick={() => {
										setEditingStepId(null);
										setShowAddMenu(true);
									}}
									disabled={running}
								>
									<Plus className="mr-1.5 h-3.5 w-3.5" />
									Add step
								</Button>
								<div className="relative" data-tour="save">
									<Button
										size="sm"
										variant="outline"
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
									onClick={run}
									disabled={running || !hasRunnableSteps}
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
						</div>
					</div>

					{/* ---- Content ---- */}
					<div className="flex-1 overflow-hidden">
						{/* Steps tab */}
						{activeTab === "steps" && (
							<AutomationDockLayout
								workflow={
									<div className="h-full overflow-y-auto p-3">
										<div className="mb-3 flex items-center justify-between px-1">
											<div>
												<p className="font-semibold text-sm">
													Workflow score
												</p>
												<p className="text-[11px] text-muted-foreground">
													{
														steps.filter(
															(step) =>
																step.workflowType !==
																"trigger.start",
														).length
													}{" "}
													action
													{steps.filter(
														(step) =>
															step.workflowType !==
															"trigger.start",
													).length === 1
														? ""
														: "s"}{" "}
													in this graph
												</p>
											</div>
											{incompleteCount > 0 && (
												<span className="rounded-full bg-amber-500/15 px-2 py-1 font-medium text-[10px] text-amber-700">
													{incompleteCount} to finish
												</span>
											)}
										</div>
										<div className="space-y-1">
											{steps.map((step) => {
												const meta = getDisplayMeta(
													step.type,
												);
												const workflowDefinition =
													step.workflowType
														? getWorkflowNodeDefinition(
																step.workflowType,
															)
														: undefined;
												const Icon = meta.icon;
												const selected =
													editingStepId === step.id;
												const incomplete =
													step.workflowType !==
														"trigger.start" &&
													validateCanvasWorkflowNode(
														step,
													).length > 0;
												return (
													<button
														key={step.id}
														type="button"
														aria-pressed={selected}
														onClick={() => {
															setShowAddMenu(
																false,
															);
															setEditingStepId(
																step.id,
															);
														}}
														className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${selected ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
													>
														<span
															className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted ${meta.color}`}
														>
															<Icon className="h-3.5 w-3.5" />
														</span>
														<span className="min-w-0 flex-1">
															<span className="block truncate font-medium text-xs">
																{step.label ||
																	meta.label}
															</span>
															<span className="block truncate text-[10px] text-muted-foreground">
																{step.workflowType ===
																"trigger.start"
																	? "Manual trigger"
																	: (workflowDefinition?.label ??
																		meta.label)}
															</span>
														</span>
														{incomplete && (
															<span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
														)}
													</button>
												);
											})}
										</div>
										<Button
											size="sm"
											variant="outline"
											className="mt-3 w-full"
											disabled={running}
											onClick={() => {
												setEditingStepId(null);
												setShowAddMenu(true);
											}}
										>
											<Plus className="mr-1.5 h-3.5 w-3.5" />
											Add action
										</Button>
									</div>
								}
								guidance={
									<div className="h-full overflow-y-auto p-4">
										<div className="space-y-4">
											<div>
												<p className="font-semibold text-sm">
													Choreograph the essentials
												</p>
												<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
													Start with a manual trigger,
													then add actions and connect
													their dependencies.
												</p>
											</div>
											<div className="rounded-xl border bg-muted/30 p-3">
												<p className="font-medium text-xs">
													Supported execution model
												</p>
												<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
													Trigger and action nodes
													form an acyclic graph. Every
													connection represents a
													runtime dependency.
												</p>
											</div>
											<div className="rounded-xl border border-dashed p-3">
												<p className="font-medium text-xs">
													Developer workflows
												</p>
												<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
													Use the Add Node catalog for
													wait actions and custom
													Python steps.
												</p>
											</div>
											<div className="space-y-2">
												<Button
													size="sm"
													className="w-full"
													disabled={running}
													onClick={() => {
														setEditingStepId(null);
														setShowAddMenu(true);
													}}
												>
													<Plus className="mr-1.5 h-3.5 w-3.5" />
													Add step
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="w-full"
													disabled={running}
													onClick={() =>
														setShowGenerationWizard(
															true,
														)
													}
												>
													Browse templates
												</Button>
											</div>
										</div>
									</div>
								}
								config={
									<div className="h-full overflow-y-auto p-4">
										<p className="font-semibold text-sm">
											Node configuration
										</p>
										<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
											Select a node to configure its
											engine, operation, inputs, and
											outputs in the Inspector.
										</p>
									</div>
								}
								inspector={
									showAddMenu ? (
										<div className="h-full overflow-y-auto p-4">
											<AddNodeMenu onSelect={addStep} />
										</div>
									) : editingStep?.type === "trigger" ? (
										<TriggerEditPanel
											description={description}
											devMode={devMode}
											source={source}
											suggestingDescription={
												suggestingDescription
											}
											hasRunnableSteps={hasRunnableSteps}
											onDescriptionChange={setDescription}
											onDevModeChange={
												handleDevModeChange
											}
											onSourceChange={setSource}
											onSuggestDescription={() =>
												void handleSuggestDescription()
											}
											onClose={() =>
												setEditingStepId(null)
											}
										/>
									) : editingStep ? (
										<NodeEditDrawer
											step={editingStep}
											appId={appId}
											upstreamVars={upstreamVarsFor(
												steps.indexOf(editingStep),
											)}
											runStatus={
												stepStatuses[editingStep.id]
											}
											runError={
												stepErrors[editingStep.id]
											}
											runOutput={
												stepOutputPreviews[
													editingStep.id
												] ?? null
											}
											devMode={devMode}
											source={source}
											onSourceChange={setSource}
											onUpdate={updateStep}
											onDelete={() =>
												deleteStep(editingStep.id)
											}
										/>
									) : (
										<div className="flex h-full flex-col items-center justify-center px-6 text-center">
											<p className="font-semibold text-sm">
												Select a step
											</p>
											<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
												Choose the trigger or an action
												on the canvas to inspect and
												edit its configuration.
											</p>
										</div>
									)
								}
								validation={
									<div className="h-full overflow-y-auto p-4">
										<div className="space-y-4">
											<div className="rounded-xl border bg-muted/30 p-3">
												<p className="font-semibold text-sm">
													{incompleteCount > 0
														? "Needs attention"
														: "Ready to run"}
												</p>
												<p className="mt-1 text-[11px] text-muted-foreground">
													{incompleteCount > 0
														? `${incompleteCount} action${incompleteCount === 1 ? "" : "s"} need configuration.`
														: hasRunnableSteps
															? "All action fields pass local authoring checks."
															: "Add an action to create a runnable automation."}
												</p>
											</div>
											{steps
												.filter(
													(step) =>
														step.workflowType !==
															"trigger.start" &&
														validateCanvasWorkflowNode(
															step,
														).length > 0,
												)
												.map((step) => (
													<button
														key={step.id}
														type="button"
														onClick={() => {
															setShowAddMenu(
																false,
															);
															setEditingStepId(
																step.id,
															);
														}}
														className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-left hover:bg-amber-500/10"
													>
														<p className="font-medium text-xs">
															{step.label ||
																getDisplayMeta(
																	step.type,
																).label}
														</p>
														<p className="mt-1 text-[11px] text-muted-foreground">
															{validateCanvasWorkflowNode(
																step,
															).join(". ")}
														</p>
													</button>
												))}
											<div className="rounded-xl border border-dashed p-3">
												<p className="font-medium text-xs">
													Graph contract
												</p>
												<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
													The canvas accepts trigger
													and action DAGs only. Cycles
													and links into the trigger
													are blocked.
												</p>
											</div>
										</div>
									</div>
								}
								trace={
									<div className="h-full overflow-y-auto p-4">
										<div className="mx-auto max-w-3xl space-y-3">
											<div className="flex items-center justify-between">
												<div>
													<p className="font-semibold text-sm">
														Live run trace
													</p>
													<p className="text-[11px] text-muted-foreground">
														Observe action progress
														and outputs as they
														arrive.
													</p>
												</div>
												{running && (
													<span className="flex items-center gap-1.5 text-[11px] text-primary">
														<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
														Running
													</span>
												)}
											</div>
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
											<NodeResultList
												steps={steps}
												results={latestRunResults}
												expandedNodes={
													expandedTraceNodes
												}
												onToggleNode={toggleTraceNode}
											/>
										</div>
									</div>
								}
								history={
									<AutomationHistoryPanel
										steps={steps}
										runs={runs}
										loading={historyLoading}
										lastRefreshed={lastRefreshed}
										expandedRunId={expandedHistoryRunId}
										expandedRun={expandedHistoryRun}
										detailLoading={historyDetailLoading}
										expandedNodes={expandedHistoryNodes}
										showExecutedDefinition={
											showExecutedDefinition
										}
										onRefresh={refreshRuns}
										onSelectRun={(runId) =>
											void selectHistoryRun(runId)
										}
										onToggleNode={toggleHistoryNode}
										onToggleExecutedDefinition={() =>
											setShowExecutedDefinition(
												(previous) => !previous,
											)
										}
									/>
								}
								onInspectorClose={() => {
									setShowAddMenu(false);
									setEditingStepId(null);
								}}
								canvas={
									<div
										ref={canvasContainerRef}
										className="relative h-full"
									>
										{/* Banners row above the canvas */}
										{(running ||
											(latestRunStatus &&
												latestRunStatus !==
													"RUNNING") ||
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
															status={
																latestRunStatus
															}
															aiSummary={
																aiRunSummary
															}
															generatingAiSummary={
																generatingAiSummary
															}
															onDismiss={
																dismissRun
															}
														/>
													)}
												{undoSnapshot && (
													<UndoBanner
														onUndo={() => {
															setSteps(
																undoSnapshot,
															);
															setUndoSnapshot(
																null,
															);
														}}
														onDismiss={() =>
															setUndoSnapshot(
																null,
															)
														}
													/>
												)}
											</div>
										)}

										{/* Onboarding tour (fixed popovers) */}
										<OnboardingTour appId={appId} />

										{/* React Flow canvas */}
										{/* Suppress RF selection ring */}
										<style>{`.react-flow__node.selected{box-shadow:none!important;outline:none!important}`}</style>
										<ReactFlow
											nodes={rfNodes}
											edges={rfEdges}
											nodeTypes={nodeTypes as never}
											nodesDraggable={
												canvasMode === "interact"
											}
											nodesConnectable={
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
											onNodeClick={
												canvasMode === "interact"
													? (_e, node) => {
															setShowAddMenu(
																false,
															);
															setEditingStepId(
																node.id,
															);
														}
													: undefined
											}
											onNodesChange={onRfNodesChange}
											onNodeDragStop={onNodeDragStop}
											onConnect={onConnect}
										>
											<Background
												variant={BackgroundVariant.Dots}
												gap={20}
												size={1}
												color="#cbd5e1"
											/>
										</ReactFlow>

										{/* Mode toggle — bottom left of canvas */}
										<div className="absolute bottom-4 left-4 z-10 flex items-center overflow-hidden rounded-lg border bg-background shadow-sm">
											<button
												type="button"
												aria-label="Clean up node layout"
												title="Clean up layout — restore execution order"
												onClick={cleanUpLayout}
												className="flex items-center justify-center border-r p-2 text-muted-foreground transition-colors hover:bg-muted"
											>
												<RefreshCw className="h-4 w-4" />
											</button>
											<button
												type="button"
												title="Interact mode — click nodes to edit (V)"
												onClick={() =>
													setCanvasMode("interact")
												}
												className={`flex items-center justify-center p-2 transition-colors ${canvasMode === "interact" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
											>
												<MousePointer2 className="h-4 w-4" />
											</button>
											<button
												type="button"
												title="Pan mode — drag to move canvas (H)"
												onClick={() =>
													setCanvasMode("pan")
												}
												className={`flex items-center justify-center p-2 transition-colors ${canvasMode === "pan" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
											>
												<Hand className="h-4 w-4" />
											</button>
										</div>
										{!hasRunnableSteps &&
											!showGenerationWizard && (
												<div className="absolute inset-0 z-10 flex items-center justify-center p-6">
													<div className="max-w-sm rounded-2xl border bg-card/95 p-6 text-center shadow-lg backdrop-blur">
														<p className="font-semibold text-base">
															Begin your
															automation
														</p>
														<p className="mt-2 text-muted-foreground text-xs leading-relaxed">
															Add an action to the
															manual trigger, or
															start from a tested
															template. This
															workspace currently
															authors action DAGs
															only.
														</p>
														<div className="mt-4 flex justify-center gap-2">
															<Button
																size="sm"
																onClick={() => {
																	setEditingStepId(
																		null,
																	);
																	setShowAddMenu(
																		true,
																	);
																}}
															>
																<Plus className="mr-1.5 h-3.5 w-3.5" />
																Add step
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() =>
																	setShowGenerationWizard(
																		true,
																	)
																}
															>
																Templates
															</Button>
														</div>
													</div>
												</div>
											)}
										{showGenerationWizard && (
											<div className="absolute inset-0 z-30 overflow-y-auto bg-background/95 p-6 backdrop-blur">
												<div className="mx-auto max-w-3xl">
													<div className="mb-3 flex justify-end">
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																setShowGenerationWizard(
																	false,
																)
															}
														>
															<X className="mr-1.5 h-3.5 w-3.5" />
															Keep current
															workflow
														</Button>
													</div>
													<TemplateGallery
														onSelectTemplate={
															loadTemplate
														}
														onStartBlank={
															onStartBlank
														}
													/>
												</div>
											</div>
										)}
									</div>
								}
							/>
						)}

						{/* History tab */}
						{activeTab === "history" && (
							<div className="h-full overflow-y-auto px-6 py-6">
								<div className="mx-auto max-w-3xl space-y-4">
									<div className="flex items-center justify-between gap-3">
										<div>
											<h2 className="font-semibold text-sm">
												Automation History
											</h2>
											<p className="text-[11px] text-muted-foreground">
												Review recent automation runs
												and inspect per-node outputs.
											</p>
										</div>
										<div className="flex flex-col items-end gap-0.5">
											<Button
												size="sm"
												variant="ghost"
												className="h-8 px-2 text-xs"
												onClick={refreshRuns}
											>
												<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
												Refresh
											</Button>
											{lastRefreshed && (
												<span className="text-[10px] text-muted-foreground/60">
													Updated{" "}
													{formatRelativeTime(
														lastRefreshed.toISOString(),
													)}
												</span>
											)}
										</div>
									</div>
									{historyLoading ? (
										<div className="flex h-40 items-center justify-center rounded-2xl border bg-card">
											<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
										</div>
									) : runs.length === 0 ? (
										<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
											<p className="font-semibold text-sm">
												No runs yet
											</p>
											<p className="mt-2 text-muted-foreground text-xs leading-relaxed">
												Each time the automation runs,
												results appear here so you can
												review what happened.
											</p>
										</div>
									) : (
										<div className="divide-y rounded-2xl border bg-card">
											{runs.map((run) => {
												const isExpanded =
													expandedHistoryRunId ===
													run.RUN_ID;
												return (
													<div key={run.RUN_ID}>
														<button
															type="button"
															onClick={() =>
																void selectHistoryRun(
																	run.RUN_ID,
																)
															}
															className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
														>
															<StatusBadge
																status={
																	run.STATUS
																}
															/>
															<div className="flex-1 space-y-0.5">
																<p className="font-medium text-xs">
																	{formatTimestamp(
																		run.STARTED_AT,
																	)}
																</p>
																{run.COMPLETED_AT && (
																	<p className="text-[11px] text-muted-foreground">
																		{formatRunDuration(
																			run.STARTED_AT,
																			run.COMPLETED_AT,
																		)}
																	</p>
																)}
															</div>
															{isExpanded ? (
																<X className="h-3.5 w-3.5 text-muted-foreground" />
															) : (
																<Play className="h-3.5 w-3.5 text-muted-foreground" />
															)}
														</button>
														{isExpanded && (
															<div className="border-t bg-muted/20 px-4 py-4">
																{historyDetailLoading ? (
																	<div className="flex h-20 items-center justify-center">
																		<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
																	</div>
																) : expandedHistoryRun ? (
																	<div className="space-y-4">
																		{expandedHistoryRun.DEFINITION_HASH && (
																			<div className="rounded-lg border bg-background px-3 py-2 text-[11px]">
																				<div className="flex items-center justify-between gap-3">
																					<span className="text-muted-foreground">
																						Executed
																						definition
																						{expandedHistoryRun.DEFINITION_VERSION !=
																						null
																							? ` v${expandedHistoryRun.DEFINITION_VERSION}`
																							: ""}
																					</span>
																					<Button
																						size="sm"
																						variant="ghost"
																						className="h-7 px-2 text-[11px]"
																						onClick={() =>
																							setShowExecutedDefinition(
																								(
																									previous,
																								) =>
																									!previous,
																							)
																						}
																					>
																						{showExecutedDefinition
																							? "Hide definition"
																							: "View definition"}
																					</Button>
																				</div>
																				<p className="mt-1 break-all font-mono text-muted-foreground">
																					SHA-256:{" "}
																					{
																						expandedHistoryRun.DEFINITION_HASH
																					}
																				</p>
																				{showExecutedDefinition &&
																					expandedHistoryRun.DEFINITION_SNAPSHOT && (
																						<pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-[10px] leading-relaxed">
																							{
																								expandedHistoryRun.DEFINITION_SNAPSHOT
																							}
																						</pre>
																					)}
																			</div>
																		)}
																		<NodeResultList
																			steps={
																				steps
																			}
																			results={
																				expandedHistoryRun.nodeResults ??
																				[]
																			}
																			expandedNodes={
																				expandedHistoryNodes
																			}
																			onToggleNode={
																				toggleHistoryNode
																			}
																		/>
																	</div>
																) : null}
															</div>
														)}
													</div>
												);
											})}
										</div>
									)}
								</div>
							</div>
						)}

						{/* Config tab */}
						{activeTab === "config" && (
							<div className="p-6 text-muted-foreground text-sm">
								Node configuration is managed in the Inspector.
								in the Inspector.
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ---- Help modal ---- */}
			<HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
		</>
	);
}

// ---- Trigger edit panel (inline component) ----
interface TriggerEditPanelProps {
	description: string;
	devMode: boolean;
	source: string;
	suggestingDescription: boolean;
	hasRunnableSteps: boolean;
	onDescriptionChange: (v: string) => void;
	onDevModeChange: (v: boolean) => void;
	onSourceChange: (source: string) => void;
	onSuggestDescription: () => void;
	onClose: () => void;
}

function TriggerEditPanel({
	description,
	devMode,
	source,
	suggestingDescription,
	hasRunnableSteps,
	onDescriptionChange,
	onDevModeChange,
	onSourceChange,
	onSuggestDescription,
	onClose,
}: TriggerEditPanelProps) {
	return (
		<div className="flex h-full flex-col bg-background">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
						<Play className="h-3.5 w-3.5 text-emerald-600" />
					</span>
					<span className="font-semibold text-sm">Trigger</span>
				</div>
				<Button
					size="sm"
					variant="ghost"
					className="h-8 w-8 p-0"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex-1 overflow-y-auto px-4 py-4">
				<div className="space-y-4">
					<Field>
						<div className="flex items-center justify-between">
							<FieldLabel className="text-xs">
								Description
							</FieldLabel>
							{hasRunnableSteps && (
								<button
									type="button"
									onClick={onSuggestDescription}
									disabled={suggestingDescription}
									className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary disabled:opacity-50"
								>
									{suggestingDescription ? (
										<Loader2 className="h-3 w-3 animate-spin" />
									) : (
										<Sparkles className="h-3 w-3" />
									)}
									Suggest
								</button>
							)}
						</div>
						<Textarea
							className="resize-none text-sm"
							rows={3}
							value={description}
							onChange={(e) =>
								onDescriptionChange(e.target.value)
							}
							placeholder="Describe what this automation does…"
						/>
					</Field>
					<div className="flex items-center justify-between rounded-lg border px-3 py-2">
						<div>
							<p className="font-medium text-sm">Dev Mode</p>
							<p className="text-[11px] text-muted-foreground">
								View and edit the Python source artifact used by
								the automation.
							</p>
						</div>
						<Switch
							checked={devMode}
							onCheckedChange={onDevModeChange}
						/>
					</div>
					{devMode && (
						<Field>
							<p className="mb-1 font-medium text-[11px] text-muted-foreground">
								Python source artifact
							</p>
							<Textarea
								className="min-h-48 font-mono text-xs"
								rows={12}
								value={source}
								onChange={(event) =>
									onSourceChange(event.target.value)
								}
							/>
						</Field>
					)}
				</div>
			</div>
		</div>
	);
}
