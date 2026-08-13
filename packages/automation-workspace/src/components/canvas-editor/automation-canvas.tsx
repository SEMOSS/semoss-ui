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
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Field,
	FieldLabel,
	Switch,
	Textarea,
	toast,
} from "@semoss/ui/next";
import type {
	AutomationConfigEntry,
	AutomationDocument,
	AutomationEdge,
	AutomationGraph,
	AutomationNode,
	AutomationNodeResult,
	AutomationNodeType,
	AutomationRunDetail,
	AutomationRunSummary,
	AutomationToolContext,
	RunStatus,
	StepRunStatus,
} from "../../domain/automation.types";
import { NODE_TYPE_META } from "../../domain/automation-constants";
import type { AutomationRunData } from "../../domain/automation-display";
import {
	formatRelativeTime,
	formatRunDuration,
	formatTimestamp,
	getDisplayMeta,
	newStepId,
} from "../../domain/automation-display";
import {
	applyOutputTransform,
	validateNode,
} from "../../domain/automation-utils";
import { AutomationConfigTab } from "../form-editor/automation-config-tab";
import { HelpModal } from "../form-editor/help-modal";
import { NodeResultList } from "../form-editor/node-result-list";
import { OnboardingTour } from "../form-editor/onboarding-tour";
import { TemplateGallery } from "../form-editor/template-gallery";
import { StatusBadge } from "../status-badge";
import { AddNodeMenu } from "./add-node-menu";
import { AutomationDockLayout } from "./automation-dock-layout";
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

// ---- Helpers ----
function ensureTriggerNode(nodes: AutomationNode[]): AutomationNode[] {
	let withTrigger = nodes;
	if (!nodes.some((node) => node.type === "trigger")) {
		const triggerMeta = NODE_TYPE_META.find(
			(meta) => meta.type === "trigger",
		);
		if (!triggerMeta) return nodes;
		const triggerNode: AutomationNode = {
			id: `trigger-${crypto.randomUUID()}`,
			type: "trigger",
			label: "Start",
			position: { x: 0, y: 0 },
			outputVar: triggerMeta.defaultOutputVar,
			config: { ...triggerMeta.defaultConfig },
		};
		withTrigger = [triggerNode, ...nodes];
	}

	// Starter definitions created before canvas positioning did not include
	// `position`. Start every unpositioned node at the origin so layoutNodes()
	// can place the full workflow after the canvas mounts.
	return withTrigger.map((node) =>
		node.position ? node : { ...node, position: { x: 0, y: 0 } },
	);
}

const EMPTY_GRAPH: AutomationGraph = { nodes: [], edges: [] };

function defaultEdges(nodes: AutomationNode[]): AutomationEdge[] {
	return nodes.slice(0, -1).map((node, index) => ({
		id: `e-${node.id}-${nodes[index + 1].id}`,
		source: node.id,
		target: nodes[index + 1].id,
	}));
}

// ---- Component ----
export function AutomationCanvas({
	appId,
	mcpMode,
	mcpContext,
}: AutomationCanvasProps) {
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<TabId>("steps");
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
	const [steps, setSteps] = useState<AutomationNode[]>(() =>
		ensureTriggerNode(EMPTY_GRAPH.nodes),
	);
	const [graphEdges, setGraphEdges] = useState<AutomationEdge[]>([]);
	const [config, setConfig] = useState<AutomationConfigEntry[]>([]);
	const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
	const [nodeOutputs, setNodeOutputsState] = useState<Record<string, string>>(
		{},
	);
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
	const drawerOpen = editingStep !== null || showAddMenu;

	const [latestRunStatus, setLatestRunStatus] = useState<RunStatus | null>(
		null,
	);
	const [latestRunId, setLatestRunId] = useState<string | null>(null);
	const [_latestRunError, setLatestRunError] = useState<string | null>(null);
	const [latestRunResults, setLatestRunResults] = useState<
		AutomationNodeResult[]
	>([]);
	const [aiRunSummary, setAiRunSummary] = useState<string | null>(null);
	const [generatingAiSummary, setGeneratingAiSummary] = useState(false);
	const [runs, setRuns] = useState<AutomationRunSummary[]>([]);
	const [expandedHistoryRunId, setExpandedHistoryRunId] = useState<
		string | null
	>(null);
	const [expandedHistoryRun, setExpandedHistoryRun] =
		useState<AutomationRunDetail | null>(null);
	const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
	const [expandedHistoryNodes, setExpandedHistoryNodes] = useState<
		Set<string>
	>(new Set());
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

	const onConnect = useCallback((connection: Connection) => {
		if (
			!connection.source ||
			!connection.target ||
			connection.source === connection.target
		) {
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
	}, []);

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

	// ---- Data loading ----
	usePixel<AutomationDocument | null>(
		`GetAutomation(project=["${appId}"]);`,
		{
			data: null,
			onSuccess: (doc) => {
				const serverSteps = ensureTriggerNode(
					(doc?.graph ?? EMPTY_GRAPH).nodes,
				);
				const serverDescription = doc?.description ?? "";
				const draftKey = `automation-draft-${appId}`;
				const raw = localStorage.getItem(draftKey);
				if (raw && !mcpMode) {
					try {
						const draft = JSON.parse(raw) as {
							steps: AutomationNode[];
							edges?: AutomationEdge[];
							description: string;
							savedAt: number;
						};
						setSteps(draft.steps);
						setGraphEdges(draft.edges ?? defaultEdges(draft.steps));
						setDescription(draft.description);
						setIsDirty(true);
						setTimeout(() => {
							loadedRef.current = true;
						}, 0);
						toast.success(
							"Draft restored from your previous session",
							{
								description:
									"Your unsaved changes have been restored.",
							},
						);
						return;
					} catch {
						localStorage.removeItem(draftKey);
					}
				}
				setSteps(serverSteps);
				setGraphEdges(
					doc?.graph.edges?.length
						? doc.graph.edges
						: defaultEdges(serverSteps),
				);
				setDescription(serverDescription);
				setTimeout(() => {
					loadedRef.current = true;
				}, 0);
			},
			onError: () => {
				setSteps(ensureTriggerNode(EMPTY_GRAPH.nodes));
				setGraphEdges([]);
				setTimeout(() => {
					loadedRef.current = true;
				}, 0);
			},
		},
	);

	usePixel<AutomationConfigEntry[]>(
		`GetAutomationConfig(project=["${appId}"]);`,
		{
			data: [],
			onSuccess: (configList) => setConfig(configList ?? []),
		},
	);

	const {
		data: runsData,
		status: runsStatus,
		refresh: refreshRuns,
	} = usePixel<AutomationRunSummary[]>(
		`ListAutomationRuns(project=["${appId}"], limit=[25]);`,
		{
			data: [],
			onError: (_data, error) =>
				toast.error(
					`Failed to load run history: ${error.message ?? "Unknown error"}`,
				),
		},
	);
	const historyLoading = runsStatus === "INITIAL" || runsStatus === "LOADING";
	const hasRunnableSteps = steps.some((s) => s.type !== "trigger");

	useEffect(() => {
		setRuns(runsData ?? []);
		if (runsData) setLastRefreshed(new Date());
	}, [runsData]);

	// Draft persistence
	useEffect(() => {
		if (!loadedRef.current) return;
		const draft = {
			steps,
			edges: graphEdges,
			description,
			savedAt: Date.now(),
		};
		localStorage.setItem(
			`automation-draft-${appId}`,
			JSON.stringify(draft),
		);
		setIsDirty(true);
	}, [steps, graphEdges, description, appId]);

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
				(s) => s.type !== "trigger" && validateNode(s).length > 0,
			).length,
		[steps],
	);

	// ---- Callbacks ----
	const setNodeOutput = useCallback((outputVar: string, value: string) => {
		setNodeOutputsState((prev) => ({ ...prev, [outputVar]: value }));
	}, []);

	const handleDevModeChange = useCallback(
		(value: boolean) => {
			setDevMode(value);
			localStorage.setItem(`automation-devmode-${appId}`, String(value));
		},
		[appId],
	);

	const addStep = useCallback(
		(type: AutomationNodeType) => {
			const meta = NODE_TYPE_META.find((item) => item.type === type);
			if (!meta) return;
			const id = newStepId(type);
			const previousStep = steps[steps.length - 1];
			const newStep: AutomationNode = {
				id,
				type,
				position: {
					x: previousStep?.position.x ?? centerXRef.current,
					y: previousStep
						? previousStep.position.y +
							getNodeHeight(previousStep.id) +
							NODE_ARROW_GAP
						: 0,
				},
				label: getDisplayMeta(type).label,
				outputVar: `${meta.defaultOutputVar}_${steps.length + 1}`,
				config: { ...meta.defaultConfig },
			};
			setSteps((prev) => [...prev, newStep]);
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
			setActiveTab("steps");
		},
		[getNodeHeight, steps],
	);

	const updateStep = useCallback((updated: AutomationNode) => {
		setSteps((prev) =>
			prev.map((s) => (s.id === updated.id ? updated : s)),
		);
		if (validateNode(updated).length === 0) {
			setStepErrors((prev) => {
				const next = { ...prev };
				delete next[updated.id];
				return next;
			});
			setStepStatuses((prev) => {
				if (prev[updated.id] !== "error") return prev;
				const next = { ...prev };
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
		(index: number) => {
			const stepVars = steps
				.slice(0, index)
				.map((s) => s.outputVar)
				.filter(
					(value): value is string =>
						typeof value === "string" && value.length > 0,
				);
			const configVars = config.map((entry) => `config.${entry.key}`);
			return [...stepVars, ...configVars];
		},
		[steps, config],
	);

	const save = useCallback(async (): Promise<boolean> => {
		setSaving(true);
		try {
			const doc: AutomationDocument = {
				version: 1,
				...(description.trim()
					? { description: description.trim() }
					: {}),
				graph: { nodes: steps, edges: graphEdges },
			};
			const json = btoa(
				encodeURIComponent(JSON.stringify(doc)).replace(
					/%([0-9A-F]{2})/gi,
					(_, p1) => String.fromCharCode(parseInt(p1, 16)),
				),
			);
			const configJson = btoa(
				encodeURIComponent(JSON.stringify(config)).replace(
					/%([0-9A-F]{2})/gi,
					(_, p1) => String.fromCharCode(parseInt(p1, 16)),
				),
			);
			await Promise.all([
				runPixel(
					`SaveAutomation(project=["${appId}"], json=["${json}"]);`,
				),
				runPixel(
					`SaveAutomationConfig(project=["${appId}"], config=["${configJson}"]);`,
				),
			]);
			localStorage.removeItem(`automation-draft-${appId}`);
			setIsDirty(false);
			toast.success("Automation saved");
			return true;
		} catch (e) {
			toast.error(
				`Save failed: ${e instanceof Error ? e.message : "Unknown error"}`,
			);
			return false;
		} finally {
			setSaving(false);
		}
	}, [appId, config, description, graphEdges, steps]);

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
		setLatestRunId(null);
		setLatestRunError(null);
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setAiRunSummary(null);
	}, []);

	const applyRunData = useCallback(
		(runData: AutomationRunData) => {
			const nodeResultsMap = new Map(
				(runData.nodeResults ?? []).map((r) => [r.NODE_ID, r]),
			);
			const newStatuses: Record<string, StepRunStatus> = {};
			const newErrors: Record<string, string> = {};
			const newDurations: Record<string, number> = {};
			const newOutputs: Record<string, string> = {};
			for (const step of steps) {
				const r = nodeResultsMap.get(step.id);
				if (!r) continue;
				if (r.STATUS === "SUCCESS" || r.STATUS === "SKIPPED")
					newStatuses[step.id] = "success";
				else if (r.STATUS === "RUNNING")
					newStatuses[step.id] = "running";
				else if (r.STATUS === "FAILED") newStatuses[step.id] = "error";
				if (r.ERROR_MESSAGE) newErrors[step.id] = r.ERROR_MESSAGE;
				if (r.DURATION_MS != null)
					newDurations[step.id] = r.DURATION_MS;
				if (r.OUTPUT_PREVIEW && step.outputVar) {
					newOutputs[step.outputVar] = applyOutputTransform(
						r.OUTPUT_PREVIEW,
						step.outputTransform,
					);
				}
			}
			setStepStatuses((prev) => ({ ...prev, ...newStatuses }));
			setStepErrors((prev) => ({ ...prev, ...newErrors }));
			setStepDurations((prev) => ({ ...prev, ...newDurations }));
			setNodeOutputsState((prev) => ({ ...prev, ...newOutputs }));
			setLatestRunStatus(runData.STATUS);
			setLatestRunId(runData.RUN_ID ?? null);
			setLatestRunError(runData.ERROR_MESSAGE ?? null);
			setLatestRunResults(runData.nodeResults ?? []);
		},
		[steps],
	);

	const run = useCallback(async () => {
		if (steps.length === 0) return;
		const invalidSteps = steps.filter((s) => s.type !== "trigger");
		const validationErrors: Record<string, string> = {};
		for (const step of invalidSteps) {
			const errs = validateNode(step);
			if (errs.length > 0)
				validationErrors[step.id] = `${errs.join(". ")}.`;
		}
		if (Object.keys(validationErrors).length > 0) {
			setStepStatuses((prev) => {
				const next = { ...prev };
				for (const id of Object.keys(validationErrors))
					next[id] = "error";
				return next;
			});
			setStepErrors((prev) => ({ ...prev, ...validationErrors }));
			setActiveTab("steps");
			const count = Object.keys(validationErrors).length;
			toast.error(
				`Fix ${count} step${count > 1 ? "s" : ""} before running`,
			);
			return;
		}
		const saved = await save();
		if (!saved) return;
		setRunning(true);
		setAiRunSummary(null);
		setGeneratingAiSummary(false);
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setLatestRunStatus("RUNNING");
		setLatestRunId(null);
		setLatestRunError(null);
		setLatestRunResults([]);
		try {
			let localRunId: string | null = null;
			const { jobId } = await runPixelAsync(
				`TriggerAutomation(project=["${appId}"]);`,
			);
			for (let i = 0; i < 10; i++) {
				await new Promise<void>((resolve) => setTimeout(resolve, 300));
				try {
					const activeRes = await runPixel(
						`GetActiveAutomationRun(project=["${appId}"]);`,
					);
					const activeData = activeRes.pixelReturn?.[0]?.output as {
						RUN_ID?: string;
					} | null;
					if (activeData?.RUN_ID) {
						localRunId = activeData.RUN_ID;
						setLatestRunId(activeData.RUN_ID);
						break;
					}
				} catch {
					/* keep polling */
				}
			}
			let polling = true;
			while (polling) {
				const streamRes = await getPixelJobStreaming(jobId);
				for (const message of streamRes.message) {
					const msg = message as unknown as {
						stream_type?: string;
						data?: Partial<AutomationNodeResult> & {
							NODE_ID?: string;
						};
					};
					if (msg.stream_type !== "automation" || !msg.data?.NODE_ID)
						continue;
					const { data } = msg;
					const nodeId = data.NODE_ID as string;
					setStepStatuses((prev) => ({
						...prev,
						[nodeId]:
							data.STATUS === "FAILED"
								? "error"
								: data.STATUS === "RUNNING"
									? "running"
									: "success",
					}));
					if (data.DURATION_MS != null)
						setStepDurations((prev) => ({
							...prev,
							[nodeId]: data.DURATION_MS as number,
						}));
					if (data.ERROR_MESSAGE)
						setStepErrors((prev) => ({
							...prev,
							[nodeId]: data.ERROR_MESSAGE as string,
						}));
					setLatestRunResults((prev) => {
						const step = steps.find((s) => s.id === nodeId);
						const entry: AutomationNodeResult = {
							NODE_ID: nodeId,
							NODE_LABEL:
								data.NODE_LABEL ?? step?.label ?? nodeId,
							STATUS: (data.STATUS ??
								"RUNNING") as AutomationNodeResult["STATUS"],
							DURATION_MS: data.DURATION_MS ?? 0,
							OUTPUT_PREVIEW: data.OUTPUT_PREVIEW ?? null,
							ERROR_MESSAGE: data.ERROR_MESSAGE ?? null,
						};
						const idx = prev.findIndex((r) => r.NODE_ID === nodeId);
						if (idx === -1) return [...prev, entry];
						const next = [...prev];
						next[idx] = entry;
						return next;
					});
					if (data.OUTPUT_PREVIEW) {
						const step = steps.find((s) => s.id === nodeId);
						if (step?.outputVar)
							setNodeOutputsState((prev) => ({
								...prev,
								[step.outputVar]: applyOutputTransform(
									data.OUTPUT_PREVIEW as string,
									step.outputTransform,
								),
							}));
					}
				}
				if (
					streamRes.status === "ProgressComplete" ||
					streamRes.status === "Complete"
				) {
					polling = false;
				} else if (streamRes.status === "Error") {
					throw new Error("Automation run encountered an error");
				} else {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}
			const asyncResult = await getPixelAsyncResult(jobId);
			if (asyncResult.errors.length > 0) {
				const message = asyncResult.errors[0] ?? "Automation failed";
				setLatestRunStatus("FAILED");
				setLatestRunError(message);
				refreshRuns();
				if (localRunId) {
					setGeneratingAiSummary(true);
					runPixel(
						`GenerateRunSummary(project=["${appId}"], runId=["${localRunId}"]);`,
					)
						.then((res) => {
							const text = res.pixelReturn?.[0]?.output;
							if (typeof text === "string" && text.trim())
								setAiRunSummary(text.trim());
						})
						.catch(() => {})
						.finally(() => setGeneratingAiSummary(false));
				}
				return;
			}
			const runData = asyncResult.results[0]
				?.output as AutomationRunData | null;
			if (runData) applyRunData(runData);
			toast.success(runData?.summary ?? "Automation completed");
			refreshRuns();
			const completedRunId = runData?.RUN_ID ?? null;
			if (completedRunId) {
				setGeneratingAiSummary(true);
				runPixel(
					`GenerateRunSummary(project=["${appId}"], runId=["${completedRunId}"]);`,
				)
					.then((res) => {
						const text = res.pixelReturn?.[0]?.output;
						if (typeof text === "string" && text.trim())
							setAiRunSummary(text.trim());
					})
					.catch(() => {})
					.finally(() => setGeneratingAiSummary(false));
			}
		} catch (error) {
			const message = (error as Error).message ?? "Unknown error";
			setLatestRunStatus("FAILED");
			setLatestRunError(message);
		} finally {
			setRunning(false);
		}
	}, [appId, applyRunData, refreshRuns, save, steps]);

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

	const handleSuggestDescription = useCallback(async () => {
		if (suggestingDescription || !appId) return;
		setSuggestingDescription(true);
		try {
			const docJson = JSON.stringify({
				graph: { nodes: steps, edges: [] },
			});
			const contentB64 = btoa(
				unescape(
					encodeURIComponent(docJson).replace(
						/%([0-9A-F]{2})/gi,
						(_, p1) => String.fromCharCode(parseInt(p1, 16)),
					),
				),
			);
			const result = await runPixel(
				`ExplainAutomation(project=["${appId}"], content=["${contentB64}"]);`,
			);
			const text = result.pixelReturn?.[0]?.output as string | null;
			if (text?.trim()) setDescription(text.trim());
		} catch {
			/* silently fail */
		} finally {
			setSuggestingDescription(false);
		}
	}, [appId, steps, suggestingDescription]);

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
		async (runId: string) => {
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
			try {
				const response = await runPixel(
					`GetAutomationRun(project=["${appId}"], runId=["${runId}"]);`,
				);
				const detail = response.pixelReturn?.[0]
					?.output as AutomationRunDetail | null;
				if (detail) setExpandedHistoryRun(detail);
			} catch {
				toast.error("Failed to load run detail");
			} finally {
				setHistoryDetailLoading(false);
			}
		},
		[appId, expandedHistoryRunId],
	);

	const toggleHistoryNode = useCallback((nodeId: string) => {
		setExpandedHistoryNodes((prev) => {
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
			const nonTriggerSteps = steps.filter((s) => s.type !== "trigger");
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
							validateNode(step).length > 0 &&
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
							<span className="font-semibold">Automation</span>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setShowHelp(true)}
									className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted"
								>
									<HelpCircle className="h-3.5 w-3.5" />
									Help
								</button>
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
								{running && latestRunId ? (
									<Button
										size="sm"
										variant="destructive"
										onClick={() => {
											void runPixel(
												`CancelAutomationRun(project=["${appId}"], runId=["${latestRunId}"]);`,
											);
										}}
									>
										Cancel
									</Button>
								) : (
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
								)}
							</div>
						</div>
					</div>

					{/* ---- Tabs ---- */}
					<div className="border-b px-6">
						<div className="flex items-center gap-2 py-2">
							{[
								{ id: "steps", label: "Steps" },
								{ id: "history", label: "Automation History" },
								{ id: "config", label: "Config" },
							].map((tab) => {
								const isActive = activeTab === tab.id;
								return (
									<button
										key={tab.id}
										type="button"
										onClick={() =>
											setActiveTab(tab.id as TabId)
										}
										className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-sm transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
									>
										{tab.label}
										{tab.id === "steps" &&
											incompleteCount > 0 && (
												<span
													className={`rounded-full px-1.5 py-0.5 font-medium text-[10px] tabular-nums ${isActive ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-700"}`}
												>
													{incompleteCount}
												</span>
											)}
									</button>
								);
							})}
							{activeTab === "steps" && !showGenerationWizard && (
								<div className="ml-auto flex items-center gap-2">
									<button
										type="button"
										onClick={() =>
											setShowGenerationWizard(true)
										}
										disabled={running}
										className="rounded-full px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
									>
										Templates
									</button>
									<button
										data-tour="add-step"
										type="button"
										onClick={() => {
											setEditingStepId(null);
											setShowAddMenu(true);
										}}
										disabled={running}
										className="flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
									>
										<Plus className="h-3 w-3" />
										Add Step
									</button>
								</div>
							)}
						</div>
					</div>

					{/* ---- Content ---- */}
					<div className="flex-1 overflow-hidden">
						{/* Steps tab */}
						{activeTab === "steps" && (
							<AutomationDockLayout
								isNodeEditorOpen={drawerOpen}
								onNodeEditorClose={() => {
									setShowAddMenu(false);
									setEditingStepId(null);
								}}
								canvas={
									<div
										ref={canvasContainerRef}
										className="relative h-full"
									>
										{/* Template gallery (replaces canvas when blank) */}
										{showGenerationWizard && (
											<div className="h-full overflow-y-auto px-6 py-6">
												<div className="mx-auto max-w-3xl">
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

										{!showGenerationWizard && (
											<>
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
													nodeTypes={
														nodeTypes as never
													}
													nodesDraggable={
														canvasMode ===
														"interact"
													}
													nodesConnectable={
														canvasMode ===
															"interact" &&
														!running
													}
													panOnDrag={
														canvasMode === "pan"
													}
													panOnScroll={
														canvasMode !== "pan"
													}
													zoomOnPinch
													zoomOnScroll={
														canvasMode === "pan"
													}
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
														canvasMode ===
														"interact"
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
													onNodesChange={
														onRfNodesChange
													}
													onNodeDragStop={
														onNodeDragStop
													}
													onConnect={onConnect}
												>
													<Background
														variant={
															BackgroundVariant.Dots
														}
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
															setCanvasMode(
																"interact",
															)
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
											</>
										)}
									</div>
								}
								nodeEditor={
									showAddMenu ? (
										<div className="h-full overflow-y-auto p-4">
											<AddNodeMenu onSelect={addStep} />
										</div>
									) : editingStep?.type === "trigger" ? (
										<TriggerEditPanel
											description={description}
											devMode={devMode}
											appId={appId}
											step={editingStep}
											suggestingDescription={
												suggestingDescription
											}
											hasRunnableSteps={hasRunnableSteps}
											onDescriptionChange={setDescription}
											onDevModeChange={
												handleDevModeChange
											}
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
											upstreamVars={upstreamVarsFor(
												steps.indexOf(editingStep),
											)}
											nodeOutputs={nodeOutputs}
											runStatus={
												stepStatuses[editingStep.id]
											}
											runError={
												stepErrors[editingStep.id]
											}
											runDuration={
												stepDurations[editingStep.id]
											}
											runOutput={
												stepOutputPreviews[
													editingStep.id
												] ?? null
											}
											devMode={devMode}
											appId={appId}
											onUpdate={updateStep}
											onDelete={() =>
												deleteStep(editingStep.id)
											}
											onSetOutput={setNodeOutput}
										/>
									) : null
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
							<AutomationConfigTab
								config={config}
								onChange={(nextConfig) => {
									setConfig(nextConfig);
									setIsDirty(true);
								}}
							/>
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
	appId: string;
	step: AutomationNode;
	suggestingDescription: boolean;
	hasRunnableSteps: boolean;
	onDescriptionChange: (v: string) => void;
	onDevModeChange: (v: boolean) => void;
	onSuggestDescription: () => void;
	onClose: () => void;
}

function TriggerEditPanel({
	description,
	devMode,
	appId,
	step,
	suggestingDescription,
	hasRunnableSteps,
	onDescriptionChange,
	onDevModeChange,
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
								Unlock advanced options: output variables,
								transforms, step testing, Pixel preview.
							</p>
						</div>
						<Switch
							checked={devMode}
							onCheckedChange={onDevModeChange}
						/>
					</div>
					{devMode && (
						<div>
							<p className="mb-1 font-medium text-[11px] text-muted-foreground">
								Pixel reference
							</p>
							<pre className="whitespace-pre-wrap break-all rounded-lg border bg-muted/40 px-3 py-2 font-mono text-[11px]">
								{`TriggerAutomation(project=["${appId}"]);`}
							</pre>
							<p className="mt-1 text-[10px] text-muted-foreground">
								Step output variable:{" "}
								<code>{step.outputVar ?? "trigger_out"}</code>
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
