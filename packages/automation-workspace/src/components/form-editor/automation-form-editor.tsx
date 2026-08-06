import {
	ChevronDown,
	ChevronRight,
	HelpCircle,
	Loader2,
	Play,
	Plus,
	RefreshCw,
	Save,
	Sparkles,
	Wand2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixelAsync,
} from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import { Button, Textarea, toast } from "@semoss/ui/next";
import type {
	AutomationConfigEntry,
	AutomationDocument,
	AutomationGraph,
	AutomationNode,
	AutomationNodeResult,
	AutomationNodeType,
	AutomationRunDetail,
	AutomationRunSummary,
	EngineOption,
	ProjectOption,
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
	STEP_TYPES,
} from "../../domain/automation-display";
import {
	applyOutputTransform,
	validateNode,
} from "../../domain/automation-utils";
import { insight } from "../../semoss/client";
import { StatusBadge } from "../status-badge";
import { AutomationConfigTab } from "./automation-config-tab";
import { AutomationStepEditorCard } from "./automation-step-editor-card";
import { HelpModal } from "./help-modal";
import { NodeResultList } from "./node-result-list";
import { TriggerStepCard } from "./trigger-step-card";

interface AutomationFormEditorProps {
	appId: string;
}

type TabId = "steps" | "results" | "history" | "config";

/** Ensures the first node in the graph is always a trigger, injecting a default one if missing. */
function ensureTriggerNode(nodes: AutomationNode[]): AutomationNode[] {
	if (nodes.some((n) => n.type === "trigger")) {
		return nodes;
	}
	const triggerMeta = NODE_TYPE_META.find((m) => m.type === "trigger");
	if (!triggerMeta) {
		return nodes;
	}
	const triggerNode: AutomationNode = {
		id: `trigger-${crypto.randomUUID()}`,
		type: "trigger",
		label: "Start",
		position: { x: 0, y: 0 },
		outputVar: triggerMeta.defaultOutputVar,
		config: { ...triggerMeta.defaultConfig },
	};
	return [triggerNode, ...nodes];
}

const EMPTY_GRAPH: AutomationGraph = { nodes: [], edges: [] };

export function AutomationFormEditor({ appId }: AutomationFormEditorProps) {
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<TabId>("steps");
	const [description, setDescription] = useState("");
	const [devMode, setDevMode] = useState(false);
	const [generationPrompt, setGenerationPrompt] = useState("");
	const [generating, setGenerating] = useState(false);
	const [showGenerationWizard, setShowGenerationWizard] = useState(false);
	// Edit panel (wand) slides in from the right without hiding nodes
	const [showEditPanel, setShowEditPanel] = useState(false);
	const [running, setRunning] = useState(false);
	const [stepStatuses, setStepStatuses] = useState<
		Record<string, StepRunStatus>
	>({});
	const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
	const [stepDurations, setStepDurations] = useState<Record<string, number>>(
		{},
	);
	const [steps, setSteps] = useState<AutomationNode[]>([]);
	const [enginesByType, setEnginesByType] = useState<
		Record<string, EngineOption[]>
	>({});
	const [projects, setProjects] = useState<ProjectOption[]>([]);
	const [config, setConfig] = useState<AutomationConfigEntry[]>([]);
	const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
	const [nodeOutputs, setNodeOutputsState] = useState<Record<string, string>>(
		{},
	);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showTypePicker, setShowTypePicker] = useState(false);
	const [latestRunStatus, setLatestRunStatus] = useState<RunStatus | null>(
		null,
	);
	const [latestRunId, setLatestRunId] = useState<string | null>(null);
	const [latestRunError, setLatestRunError] = useState<string | null>(null);
	const [latestRunResults, setLatestRunResults] = useState<
		AutomationNodeResult[]
	>([]);
	const [expandedResultNodes, setExpandedResultNodes] = useState<Set<string>>(
		new Set(),
	);
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

	const [isDirty, setIsDirty] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	// Set to true after initial server data loads so draft writes don't fire on mount
	const loadedRef = useRef(false);

	const { status: automationStatus } = usePixel<AutomationDocument | null>(
		`GetAutomation(project=["${appId}"]);`,
		{
			data: null,
			onSuccess: (doc) => {
				const serverSteps = ensureTriggerNode(
					(doc?.graph ?? EMPTY_GRAPH).nodes,
				);
				const serverDescription = doc?.description ?? "";

				// Check for a localStorage draft saved after the server version
				const draftKey = `automation-draft-${appId}`;
				const raw = localStorage.getItem(draftKey);
				if (raw) {
					try {
						const draft = JSON.parse(raw) as {
							steps: AutomationNode[];
							description: string;
							savedAt: number;
						};
						// Auto-restore without blocking the thread; toast lets user discard if needed
						setSteps(draft.steps);
						setDescription(draft.description);
						setIsDirty(true);
						loadedRef.current = true;
						toast.success(
							"Draft restored from your previous session",
							{
								description:
									"Your unsaved changes have been restored.",
							},
						);
						const hasSteps = draft.steps.some(
							(n) => n.type !== "trigger",
						);
						const wizardDismissed =
							localStorage.getItem(
								`automation-wizard-seen-${appId}`,
							) === "true";
						if (
							!hasSteps &&
							!draft.description.trim() &&
							!wizardDismissed
						) {
							setShowGenerationWizard(true);
						}
						return;
					} catch {
						localStorage.removeItem(draftKey);
					}
				}

				setSteps(serverSteps);
				setDescription(serverDescription);
				loadedRef.current = true;
				// Only auto-show the wizard on a truly blank automation that hasn't been dismissed
				const hasSteps = serverSteps.some((n) => n.type !== "trigger");
				const wizardDismissed =
					localStorage.getItem(`automation-wizard-seen-${appId}`) ===
					"true";
				if (
					!hasSteps &&
					!serverDescription.trim() &&
					!wizardDismissed
				) {
					setShowGenerationWizard(true);
				}
			},
			onError: () => {
				setSteps(ensureTriggerNode(EMPTY_GRAPH.nodes));
				loadedRef.current = true;
			},
		},
	);

	const { status: enginesStatus } = usePixel<EngineOption[]>(
		`MyEngines(engineTypes=["DATABASE","MODEL","VECTOR","STORAGE","FUNCTION"], limit=[100]);`,
		{
			data: [],
			onSuccess: (engList) => {
				const byType: Record<string, EngineOption[]> = {};
				for (const engine of engList ?? []) {
					const type = (engine.engine_type ?? "").toUpperCase();
					if (!byType[type]) {
						byType[type] = [];
					}
					byType[type].push(engine);
				}
				setEnginesByType(byType);
			},
		},
	);

	const { status: projectsStatus } = usePixel<ProjectOption[]>(
		`MyProjects(limit=[100], offset=[0]);`,
		{
			data: [],
			onSuccess: (projectList) => setProjects(projectList ?? []),
		},
	);

	const { status: automationConfigStatus } = usePixel<
		AutomationConfigEntry[]
	>(`GetAutomationConfig(project=["${appId}"]);`, {
		data: [],
		onSuccess: (configList) => setConfig(configList ?? []),
	});

	const loading = useMemo(
		() =>
			[
				automationStatus,
				enginesStatus,
				projectsStatus,
				automationConfigStatus,
			].some((status) => status === "INITIAL" || status === "LOADING"),
		[
			automationStatus,
			enginesStatus,
			projectsStatus,
			automationConfigStatus,
		],
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

	// Persist draft to localStorage and mark dirty on every steps/description change
	useEffect(() => {
		if (!loadedRef.current) return;
		const draft = { steps, description, savedAt: Date.now() };
		localStorage.setItem(
			`automation-draft-${appId}`,
			JSON.stringify(draft),
		);
		setIsDirty(true);
	}, [steps, description, appId]);

	const setNodeOutput = useCallback((outputVar: string, value: string) => {
		setNodeOutputsState((previous) => ({
			...previous,
			[outputVar]: value,
		}));
	}, []);

	const addStep = useCallback(
		(type: AutomationNodeType) => {
			const meta = NODE_TYPE_META.find((item) => item.type === type);
			if (!meta) return;

			const id = newStepId(type);
			const newStep: AutomationNode = {
				id,
				type,
				position: { x: 0, y: 0 },
				label: getDisplayMeta(type).label,
				outputVar: `${meta.defaultOutputVar}_${steps.length + 1}`,
				config: { ...meta.defaultConfig },
			};

			setSteps((previous) => [...previous, newStep]);
			setExpandedId(id);
			setShowTypePicker(false);
			setActiveTab("steps");
		},
		[steps.length],
	);

	const updateStep = useCallback((updated: AutomationNode) => {
		setSteps((previous) =>
			previous.map((step) => (step.id === updated.id ? updated : step)),
		);
		// Clear any validation error for this step if it's now valid
		if (validateNode(updated).length === 0) {
			setStepErrors((prev) => {
				if (!prev[updated.id]) return prev;
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
		setSteps((previous) => previous.filter((step) => step.id !== id));
		setExpandedId((previous) => (previous === id ? null : previous));
	}, []);

	const moveStep = useCallback((id: string, direction: -1 | 1) => {
		setSteps((previous) => {
			const index = previous.findIndex((step) => step.id === id);
			if (index < 0) return previous;
			const nextIndex = index + direction;
			if (nextIndex < 0 || nextIndex >= previous.length) return previous;
			// Never swap a step past the trigger node
			if (previous[nextIndex]?.type === "trigger") return previous;
			const reordered = [...previous];
			[reordered[index], reordered[nextIndex]] = [
				reordered[nextIndex],
				reordered[index],
			];
			return reordered;
		});
	}, []);

	const save = useCallback(async (): Promise<boolean> => {
		setSaving(true);
		try {
			const doc: AutomationDocument = {
				version: 1,
				...(description.trim()
					? { description: description.trim() }
					: {}),
				graph: { nodes: steps, edges: [] },
			};
			const json = btoa(
				unescape(encodeURIComponent(JSON.stringify(doc))),
			);
			const configJson = btoa(
				unescape(encodeURIComponent(JSON.stringify(config))),
			);
			await Promise.all([
				insight.actions.run(
					`SaveAutomation(project=["${appId}"], json=["${json}"]);`,
				),
				insight.actions.run(
					`SaveAutomationConfig(project=["${appId}"], config=["${configJson}"]);`,
				),
			]);
			localStorage.removeItem(`automation-draft-${appId}`);
			setIsDirty(false);
			toast.success("Automation saved");
			return true;
		} catch {
			toast.error("Save failed");
			return false;
		} finally {
			setSaving(false);
		}
	}, [appId, config, description, steps]);

	const generate = useCallback(async () => {
		if (!generationPrompt.trim()) return;
		setGenerating(true);
		const wasEditPanel = showEditPanel;
		try {
			const encodedPrompt = btoa(
				unescape(encodeURIComponent(generationPrompt.trim())),
			);
			let pixel: string;
			if (wasEditPanel && steps.length > 0) {
				const currentDoc: AutomationDocument = {
					version: 1,
					...(description.trim()
						? { description: description.trim() }
						: {}),
					graph: { nodes: steps, edges: [] },
				};
				const encodedDoc = btoa(
					unescape(encodeURIComponent(JSON.stringify(currentDoc))),
				);
				pixel = `GenerateAutomation(project=["${appId}"], description=["${encodedPrompt}"], currentDoc=["${encodedDoc}"]);`;
			} else {
				pixel = `GenerateAutomation(project=["${appId}"], description=["${encodedPrompt}"]);`;
			}
			const result = await insight.actions.run(pixel);
			const raw = result.pixelReturn?.[0]?.output as string | null;
			if (!raw) throw new Error("No response from AI");
			const doc: AutomationDocument = JSON.parse(raw);
			const generated = ensureTriggerNode(
				(doc?.graph ?? EMPTY_GRAPH).nodes,
			);
			setSteps(generated);
			if (doc.description) setDescription(doc.description);
			localStorage.setItem(`automation-wizard-seen-${appId}`, "true");
			setShowGenerationWizard(false);
			setShowEditPanel(false);
			setGenerationPrompt("");
			toast.success(
				wasEditPanel
					? "Automation updated — review the changes, then save when ready."
					: "Automation generated — review each step, then save when ready.",
			);
		} catch (error) {
			toast.error(`Generation failed: ${(error as Error).message}`);
		} finally {
			setGenerating(false);
		}
	}, [appId, description, generationPrompt, showEditPanel, steps]);

	/** Merges live run data into per-step UI state (statuses, durations, outputs). Called once the sequential per-node run finishes. */
	const applyRunData = useCallback(
		(runData: AutomationRunData) => {
			const nodeResultsMap = new Map(
				(runData.nodeResults ?? []).map((nodeResult) => [
					nodeResult.NODE_ID,
					nodeResult,
				]),
			);

			const newStatuses: Record<string, StepRunStatus> = {};
			const newErrors: Record<string, string> = {};
			const newDurations: Record<string, number> = {};
			const newOutputs: Record<string, string> = {};

			for (const step of steps) {
				const nodeResult = nodeResultsMap.get(step.id);
				if (!nodeResult) continue;

				if (nodeResult.STATUS === "SUCCESS") {
					newStatuses[step.id] = "success";
				} else if (nodeResult.STATUS === "SKIPPED") {
					newStatuses[step.id] = "success";
				} else if (nodeResult.STATUS === "RUNNING") {
					newStatuses[step.id] = "running";
				} else if (nodeResult.STATUS === "FAILED") {
					newStatuses[step.id] = "error";
				}

				if (nodeResult.ERROR_MESSAGE) {
					newErrors[step.id] = nodeResult.ERROR_MESSAGE;
				}
				if (nodeResult.DURATION_MS != null) {
					newDurations[step.id] = nodeResult.DURATION_MS;
				}
				if (nodeResult.OUTPUT_PREVIEW && step.outputVar) {
					newOutputs[step.outputVar] = applyOutputTransform(
						nodeResult.OUTPUT_PREVIEW,
						step.outputTransform,
					);
				}
			}

			setStepStatuses((previous) => ({ ...previous, ...newStatuses }));
			setStepErrors((previous) => ({ ...previous, ...newErrors }));
			setStepDurations((previous) => ({ ...previous, ...newDurations }));
			setNodeOutputsState((previous) => ({ ...previous, ...newOutputs }));
			setLatestRunStatus(runData.STATUS);
			setLatestRunId(runData.RUN_ID ?? null);
			setLatestRunError(runData.ERROR_MESSAGE ?? null);
			setLatestRunResults(runData.nodeResults ?? []);
		},
		[steps],
	);

	const run = useCallback(async () => {
		if (steps.length === 0) return;

		// Validate required fields before touching the server
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
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setLatestRunStatus("RUNNING");
		setLatestRunId(null);
		setLatestRunError(null);
		setLatestRunResults([]);
		setExpandedResultNodes(new Set());
		setActiveTab("results");

		try {
			// Launch on a virtual thread via runPixelAsync — TriggerAutomation runs every node
			// in sequence server-side (same ordering/dependency guarantees as before), and
			// streams a progress event per node onto the job (see AutomationRunEngine —
			// mirrors HarnessToolExecutor's tool-call streaming). We poll that stream below for
			// live per-node status instead of firing separate per-node HTTP calls, which raced
			// (a node could start before the previous one's output was actually persisted).
			const { jobId } = await runPixelAsync(
				`TriggerAutomation(project=["${appId}"]);`,
			);

			// Poll AUTOMATION_ACTIVE_RUN briefly to surface the runId (for the header/cancel
			// button) as soon as it's claimed — independent of the node-progress stream below.
			for (let i = 0; i < 10; i++) {
				await new Promise<void>((resolve) => setTimeout(resolve, 300));
				try {
					const activeRes = await insight.actions.run(
						`GetActiveAutomationRun(project=["${appId}"]);`,
					);
					const activeData = activeRes.pixelReturn?.[0]?.output as {
						RUN_ID?: string;
					} | null;
					if (activeData?.RUN_ID) {
						setLatestRunId(activeData.RUN_ID);
						break;
					}
				} catch {
					// Transient — keep polling
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
					if (
						msg.stream_type !== "automation" ||
						!msg.data?.NODE_ID
					) {
						continue;
					}
					const { data } = msg;
					const nodeId = data.NODE_ID as string;

					setStepStatuses((previous) => ({
						...previous,
						[nodeId]:
							data.STATUS === "FAILED"
								? "error"
								: data.STATUS === "RUNNING"
									? "running"
									: "success",
					}));
					if (data.DURATION_MS != null) {
						setStepDurations((previous) => ({
							...previous,
							[nodeId]: data.DURATION_MS as number,
						}));
					}
					if (data.ERROR_MESSAGE) {
						setStepErrors((previous) => ({
							...previous,
							[nodeId]: data.ERROR_MESSAGE as string,
						}));
					}

					// Also feed the "Latest Run Results" panel (NodeResultList) live — it reads
					// from latestRunResults, which otherwise only gets its one and only update
					// from applyRunData() after the whole run finishes.
					setLatestRunResults((previous) => {
						const step = steps.find((s) => s.id === nodeId);
						const nextEntry: AutomationNodeResult = {
							NODE_ID: nodeId,
							NODE_LABEL:
								data.NODE_LABEL ?? step?.label ?? nodeId,
							STATUS: (data.STATUS ??
								"RUNNING") as AutomationNodeResult["STATUS"],
							DURATION_MS: data.DURATION_MS ?? 0,
							OUTPUT_PREVIEW: data.OUTPUT_PREVIEW ?? null,
							ERROR_MESSAGE: data.ERROR_MESSAGE ?? null,
						};
						const index = previous.findIndex(
							(r) => r.NODE_ID === nodeId,
						);
						if (index === -1) {
							return [...previous, nextEntry];
						}
						const next = [...previous];
						next[index] = nextEntry;
						return next;
					});

					if (data.OUTPUT_PREVIEW) {
						const step = steps.find((s) => s.id === nodeId);
						if (step?.outputVar) {
							setNodeOutputsState((previous) => ({
								...previous,
								[step.outputVar]: applyOutputTransform(
									data.OUTPUT_PREVIEW as string,
									step.outputTransform,
								),
							}));
						}
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

			// Job is confirmed complete (status checked above) — safe to fetch the final result.
			const asyncResult = await getPixelAsyncResult(jobId);
			if (asyncResult.errors.length > 0) {
				const message = asyncResult.errors[0] ?? "Automation failed";
				toast.error(message);
				setLatestRunStatus("FAILED");
				setLatestRunError(message);
				refreshRuns();
				setRunning(false);
				return;
			}
			const runData = asyncResult.results[0]
				?.output as AutomationRunData | null;
			if (runData) {
				applyRunData(runData);
			}
			toast.success(runData?.summary ?? "Automation completed");
			refreshRuns();
			setRunning(false);
		} catch (error) {
			const message = (error as Error).message ?? "Unknown error";
			toast.error(`Automation failed: ${message}`);
			setLatestRunStatus("FAILED");
			setLatestRunError(message);
			setRunning(false);
		}
	}, [appId, applyRunData, refreshRuns, save, steps]);

	/** Returns variable names available as inputs to the step at the given index: output vars from preceding steps plus all config keys. */
	const upstreamVarsFor = useCallback(
		(index: number) => {
			const stepVars = steps
				.slice(0, index)
				.map((step) => step.outputVar)
				.filter((v) => v.length > 0);
			const configVars = config.map((entry) => `config.${entry.key}`);
			return [...stepVars, ...configVars];
		},
		[steps, config],
	);

	const toggleResultNode = useCallback((nodeId: string) => {
		setExpandedResultNodes((previous) => {
			const next = new Set(previous);
			if (next.has(nodeId)) {
				next.delete(nodeId);
			} else {
				next.add(nodeId);
			}
			return next;
		});
	}, []);

	const toggleHistoryNode = useCallback((nodeId: string) => {
		setExpandedHistoryNodes((previous) => {
			const next = new Set(previous);
			if (next.has(nodeId)) {
				next.delete(nodeId);
			} else {
				next.add(nodeId);
			}
			return next;
		});
	}, []);

	const selectHistoryRun = useCallback(
		async (runId: string) => {
			if (expandedHistoryRunId === runId) {
				setExpandedHistoryRunId(null);
				setExpandedHistoryRun(null);
				setExpandedHistoryNodes(new Set());
				return;
			}

			setExpandedHistoryRunId(runId);
			setExpandedHistoryRun(null);
			setExpandedHistoryNodes(new Set());
			setHistoryDetailLoading(true);

			try {
				const response = await insight.actions.run(
					`GetAutomationRun(project=["${appId}"], runId=["${runId}"]);`,
				);
				const detail = response.pixelReturn?.[0]
					?.output as AutomationRunDetail | null;
				if (detail) {
					setExpandedHistoryRun(detail);
				}
			} catch {
				toast.error("Failed to load run detail");
			} finally {
				setHistoryDetailLoading(false);
			}
		},
		[appId, expandedHistoryRunId],
	);

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<>
			<div className="flex h-full flex-col bg-background">
				<div className="border-b px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<span className="font-semibold">Automation</span>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setShowHelp(true)}
								className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted"
								title="Open automation reference"
							>
								<HelpCircle className="h-3.5 w-3.5" />
								Help
							</button>
							<div className="relative">
								<Button
									size="sm"
									variant="outline"
									onClick={save}
									disabled={saving}
									className=""
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
									Save
								</Button>
							</div>
							<Button
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

				{running && (
					<div className="border-b bg-primary/5 px-6 py-3">
						<div className="flex items-center gap-3">
							<Loader2 className="h-4 w-4 animate-spin text-primary" />
							<span className="font-medium text-primary text-sm">
								Running automation...
							</span>
							<div className="ml-auto flex items-center gap-2">
								<div className="h-1.5 w-48 overflow-hidden rounded-full bg-primary/20">
									<div className="h-full w-[60%] animate-pulse rounded-full bg-primary" />
								</div>
							</div>
						</div>
					</div>
				)}

				<div className="border-b px-6">
					<div className="flex items-center gap-2 py-2">
						{[
							{ id: "steps", label: "Steps" },
							{ id: "results", label: "Run Results" },
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
									className={`rounded-full px-3 py-1.5 font-medium text-sm transition-colors ${
										isActive
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}
								>
									{tab.label}
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex-1 overflow-hidden">
					{activeTab === "steps" && (
						<div className="h-full overflow-y-auto px-6 py-6">
							<div className="mx-auto max-w-3xl space-y-4">
								{/* AI Generation wizard — shown once on a blank automation */}
								{showGenerationWizard && (
									<div className="rounded-2xl border bg-gradient-to-b from-primary/5 to-card px-6 py-8 text-center shadow-sm">
										<div className="mb-4 flex justify-center">
											<span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
												<Sparkles className="h-6 w-6 text-primary" />
											</span>
										</div>
										<h2 className="mb-1 font-semibold text-base">
											What should this automation do?
										</h2>
										<p className="mb-5 text-muted-foreground text-xs leading-relaxed">
											Describe it in plain language and AI
											will build a starter workflow.
											<br />
											Tip: mention engine names or IDs for
											best results.
										</p>
										<Textarea
											value={generationPrompt}
											onChange={(e) =>
												setGenerationPrompt(
													e.target.value,
												)
											}
											placeholder="e.g. Query the claims database for open cases, summarize them with AI, and save the results"
											className="mb-4 min-h-[80px] resize-none text-sm"
											onKeyDown={(e) => {
												if (
													e.key === "Enter" &&
													(e.metaKey || e.ctrlKey)
												) {
													void generate();
												}
											}}
										/>
										<div className="flex items-center justify-center gap-3">
											<Button
												size="sm"
												onClick={() => void generate()}
												disabled={
													generating ||
													!generationPrompt.trim()
												}
											>
												{generating ? (
													<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												) : (
													<Sparkles className="mr-1.5 h-3.5 w-3.5" />
												)}
												{generating
													? "Generating…"
													: "Generate"}
											</Button>
											<button
												type="button"
												onClick={() => {
													localStorage.setItem(
														`automation-wizard-seen-${appId}`,
														"true",
													);
													setShowGenerationWizard(
														false,
													);
													setGenerationPrompt("");
												}}
												className="text-muted-foreground text-sm hover:text-foreground hover:underline"
											>
												Start blank
											</button>
										</div>
									</div>
								)}

								{/* Trigger node — always first, never deleteable */}
								{!showGenerationWizard &&
									steps
										.filter((s) => s.type === "trigger")
										.map((triggerStep) => (
											<TriggerStepCard
												key={triggerStep.id}
												step={triggerStep}
												isExpanded={
													expandedId ===
													triggerStep.id
												}
												appId={appId}
												description={description}
												onDescriptionChange={
													setDescription
												}
												devMode={devMode}
												onDevModeChange={setDevMode}
												onToggle={() =>
													setExpandedId((previous) =>
														previous ===
														triggerStep.id
															? null
															: triggerStep.id,
													)
												}
											/>
										))}

								{/* Non-trigger steps */}
								{!showGenerationWizard &&
									steps.filter((s) => s.type !== "trigger")
										.length === 0 && (
										<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-12 text-center">
											<p className="font-semibold text-sm">
												No steps yet
											</p>
											<p className="mt-2 text-muted-foreground text-xs leading-relaxed">
												Steps are the actions your
												automation takes — query a
												database, ask an AI, search
												documents, and more.
												<br />
												Click{" "}
												<span className="font-medium text-foreground">
													Add Step
												</span>{" "}
												below to build your first step.
											</p>
										</div>
									)}

								{!showGenerationWizard &&
									steps
										.filter((s) => s.type !== "trigger")
										.map((step, index, nonTriggerArr) => (
											<AutomationStepEditorCard
												key={step.id}
												step={step}
												index={index}
												isExpanded={
													expandedId === step.id
												}
												isFirst={index === 0}
												isLast={
													index ===
													nonTriggerArr.length - 1
												}
												enginesByType={enginesByType}
												projects={projects}
												upstreamVars={upstreamVarsFor(
													steps.indexOf(step),
												)}
												nodeOutputs={nodeOutputs}
												runStatus={
													stepStatuses[step.id]
												}
												runError={stepErrors[step.id]}
												runDuration={
													stepDurations[step.id]
												}
												onToggle={() =>
													setExpandedId((previous) =>
														previous === step.id
															? null
															: step.id,
													)
												}
												onUpdate={updateStep}
												onDelete={() =>
													deleteStep(step.id)
												}
												onMoveUp={() =>
													moveStep(step.id, -1)
												}
												onMoveDown={() =>
													moveStep(step.id, 1)
												}
												onSetOutput={setNodeOutput}
												devMode={devMode}
												appId={appId}
											/>
										))}

								{!showGenerationWizard && !showTypePicker ? (
									<button
										type="button"
										onClick={() => setShowTypePicker(true)}
										className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-muted-foreground text-sm transition-colors hover:border-primary hover:text-primary"
									>
										<Plus className="h-4 w-4" />
										Add Step
									</button>
								) : !showGenerationWizard ? (
									<div className="rounded-2xl border bg-card p-5 shadow-sm">
										<div className="mb-4 flex items-center justify-between gap-3">
											<div>
												<p className="font-medium text-sm">
													Choose step type
												</p>
												<p className="text-[11px] text-muted-foreground">
													Select a step to add to the
													automation.
												</p>
											</div>
											<Button
												size="sm"
												variant="ghost"
												className="h-8 px-2 text-xs"
												onClick={() =>
													setShowTypePicker(false)
												}
											>
												Cancel
											</Button>
										</div>
										<div className="grid gap-3 md:grid-cols-2">
											{STEP_TYPES.map((stepType) => {
												const Icon = stepType.icon;
												return (
													<button
														key={stepType.type}
														type="button"
														onClick={() =>
															addStep(
																stepType.type,
															)
														}
														className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-muted/40"
													>
														<span
															className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${stepType.color}`}
														>
															<Icon className="h-5 w-5" />
														</span>
														<span className="space-y-1">
															<span className="block font-medium text-sm">
																{stepType.label}
															</span>
															<span className="block text-[11px] text-muted-foreground">
																{
																	stepType.description
																}
															</span>
														</span>
													</button>
												);
											})}
										</div>
									</div>
								) : null}
							</div>
						</div>
					)}

					{activeTab === "results" && (
						<div className="h-full overflow-y-auto px-6 py-6">
							<div className="space-y-4">
								<div className="flex flex-col gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<h2 className="font-semibold text-sm">
												Latest Run Results
											</h2>
											{latestRunStatus && (
												<StatusBadge
													status={latestRunStatus}
												/>
											)}
											{running && latestRunId && (
												<Button
													size="sm"
													variant="destructive"
													className="ml-auto h-7 px-2 text-xs"
													onClick={async () => {
														try {
															await insight.actions.run(
																`CancelAutomationRun(project=["${appId}"], runId=["${latestRunId}"]);`,
															);
															toast.success(
																"Cancel requested",
															);
														} catch {
															toast.error(
																"Failed to send cancel request",
															);
														}
													}}
												>
													Cancel Run
												</Button>
											)}
										</div>
										{!latestRunId && (
											<p className="mt-1 text-[11px] text-muted-foreground">
												Run the automation to see
												results here.
											</p>
										)}
										{latestRunId && devMode && (
											<p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
												{latestRunId}
											</p>
										)}
									</div>
									{latestRunError && (
										<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive">
											{latestRunError}
										</div>
									)}
								</div>

								<NodeResultList
									steps={steps}
									results={latestRunResults}
									expandedNodes={expandedResultNodes}
									onToggleNode={toggleResultNode}
								/>
							</div>
						</div>
					)}

					{activeTab === "history" && (
						<div className="h-full overflow-y-auto px-6 py-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<h2 className="font-semibold text-sm">
											Automation History
										</h2>
										<p className="text-[11px] text-muted-foreground">
											Review recent automation runs and
											inspect per-node outputs.
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
											<br />
											Click{" "}
											<span className="font-medium text-foreground">
												Run
											</span>{" "}
											in the top toolbar to run it now.
										</p>
									</div>
								) : (
									<div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
										<div className="min-w-[900px]">
											<div className="grid grid-cols-[120px_120px_100px_minmax(0,1fr)_100px] gap-4 border-b bg-muted/30 px-4 py-3 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
												<span>Status</span>
												<span>Started</span>
												<span>Duration</span>
												<span>Summary</span>
												<span title="Number of steps completed out of total steps">
													Progress
												</span>
											</div>
											<div className="divide-y">
												{runs.map((runItem) => {
													const isExpanded =
														expandedHistoryRunId ===
														runItem.RUN_ID;
													return (
														<div
															key={runItem.RUN_ID}
														>
															<button
																type="button"
																onClick={() =>
																	void selectHistoryRun(
																		runItem.RUN_ID,
																	)
																}
																className="grid w-full grid-cols-[120px_120px_100px_minmax(0,1fr)_100px] gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/30"
															>
																<span>
																	<StatusBadge
																		status={
																			runItem.STATUS
																		}
																	/>
																</span>
																<span
																	className="truncate text-muted-foreground text-xs"
																	title={formatTimestamp(
																		runItem.STARTED_AT,
																	)}
																>
																	{formatRelativeTime(
																		runItem.STARTED_AT,
																	)}
																</span>
																<span className="text-muted-foreground text-xs">
																	{formatRunDuration(
																		runItem.STARTED_AT,
																		runItem.COMPLETED_AT,
																	)}
																</span>
																<span className="truncate text-muted-foreground text-xs">
																	{runItem.RESULT_SUMMARY ??
																		(runItem.ERROR_MESSAGE
																			? runItem.ERROR_MESSAGE
																			: "—")}
																</span>
																<span className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
																	<span>
																		{runItem.COMPLETED_NODES ??
																			0}
																		/
																		{runItem.TOTAL_NODES ??
																			0}
																	</span>
																	{isExpanded ? (
																		<ChevronDown className="h-4 w-4 shrink-0" />
																	) : (
																		<ChevronRight className="h-4 w-4 shrink-0" />
																	)}
																</span>
															</button>

															{isExpanded && (
																<div className="border-t bg-muted/10 px-4 py-4">
																	{runItem.ERROR_MESSAGE && (
																		<div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive">
																			{
																				runItem.ERROR_MESSAGE
																			}
																		</div>
																	)}
																	{historyDetailLoading ? (
																		<div className="flex h-24 items-center justify-center">
																			<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
																		</div>
																	) : expandedHistoryRun ? (
																		<NodeResultList
																			steps={
																				steps
																			}
																			results={
																				expandedHistoryRun.nodeResults
																			}
																			expandedNodes={
																				expandedHistoryNodes
																			}
																			onToggleNode={
																				toggleHistoryNode
																			}
																		/>
																	) : null}
																</div>
															)}
														</div>
													);
												})}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{activeTab === "config" && (
						<div className="h-full overflow-y-auto px-6 py-6">
							<div className="mx-auto max-w-3xl space-y-4">
								<div>
									<h2 className="font-semibold text-sm">
										Variables
									</h2>
									<p className="text-[11px] text-muted-foreground">
										Store reusable values like API keys or
										URLs. Reference them in any step as{" "}
										<code className="rounded bg-muted px-1 font-mono">
											{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional literal display */}
											{"${config.NAME}"}
										</code>
										. Variables are saved with the
										automation.
									</p>
								</div>
								<AutomationConfigTab
									config={config}
									onChange={setConfig}
								/>
							</div>
						</div>
					)}
				</div>
			</div>

			{!showGenerationWizard && (
				<button
					type="button"
					onClick={() => {
						setShowEditPanel(true);
					}}
					className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
					title="Edit with AI"
				>
					<Wand2 className="h-5 w-5" />
				</button>
			)}

			{/* AI edit panel — slides in from the right, nodes stay visible */}
			<div
				className={`fixed inset-y-0 right-0 z-40 flex w-[380px] flex-col border-l bg-background shadow-2xl transition-transform duration-300 ${
					showEditPanel ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between border-b px-5 py-4">
					<div className="flex items-center gap-2">
						<Wand2 className="h-4 w-4 text-primary" />
						<span className="font-semibold text-sm">
							Edit with AI
						</span>
					</div>
					<button
						type="button"
						onClick={() => {
							setShowEditPanel(false);
						}}
						className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
						aria-label="Close AI edit panel"
					>
						<svg
							className="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							aria-hidden="true"
						>
							<path
								d="M18 6L6 18M6 6l12 12"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>
				<div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
					<p className="text-muted-foreground text-xs leading-relaxed">
						Describe what you'd like to add or change. AI will
						update the existing steps and preserve everything else.
						<br />
						<br />
						Tip: reference specific steps by name, or mention engine
						names or IDs for best results.
					</p>
					<Textarea
						value={generationPrompt}
						onChange={(e) => setGenerationPrompt(e.target.value)}
						placeholder="e.g. Add a step to email the results, or swap the database query to filter by open status only"
						className="min-h-[120px] resize-none text-sm"
						onKeyDown={(e) => {
							if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
								void generate();
							}
						}}
					/>
					<div className="flex items-center gap-3">
						<Button
							size="sm"
							onClick={() => void generate()}
							disabled={generating || !generationPrompt.trim()}
							className="flex-1"
						>
							{generating ? (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							) : (
								<Wand2 className="mr-1.5 h-3.5 w-3.5" />
							)}
							{generating ? "Updating…" : "Update"}
						</Button>
						<button
							type="button"
							onClick={() => setShowEditPanel(false)}
							className="text-muted-foreground text-sm hover:text-foreground hover:underline"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
			{showEditPanel && (
				// biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop — click-outside dismiss, not a focusable control
				<div
					role="presentation"
					className="fixed inset-0 z-30 bg-black/10"
					onClick={() => setShowEditPanel(false)}
					onKeyDown={() => setShowEditPanel(false)}
				/>
			)}

			<HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
		</>
	);
}
