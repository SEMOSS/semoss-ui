import {
	CheckCircle,
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
	runPixel,
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
	STEP_TYPES,
} from "../../domain/automation-display";
import {
	applyOutputTransform,
	validateNode,
} from "../../domain/automation-utils";
import { StatusBadge } from "../status-badge";
import { AutomationConfigTab } from "./automation-config-tab";
import { AutomationStepEditorCard } from "./automation-step-editor-card";
import { ChatPanel } from "./chat-panel";
import { HelpModal } from "./help-modal";
import { NodeResultList } from "./node-result-list";
import { OnboardingTour } from "./onboarding-tour";
import { OutputPreview } from "./output-preview";
import { TemplateGallery } from "./template-gallery";
import { TriggerStepCard } from "./trigger-step-card";

interface AutomationFormEditorProps {
	/** The project/app ID for this automation. */
	appId: string;
	/** "edit" or "create" when opened by an MCP tool. */
	mcpMode?: "edit" | "create" | null;
	/** SMSS_INIT_TOOL context. Present only when mcpMode is set. */
	mcpContext?: AutomationToolContext;
}

type TabId = "steps" | "history" | "config";

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

export function AutomationFormEditor({
	appId,
	mcpMode,
	mcpContext,
}: AutomationFormEditorProps) {
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<TabId>("steps");
	const [description, setDescription] = useState("");
	const [devMode, setDevMode] = useState(
		() => localStorage.getItem(`automation-devmode-${appId}`) === "true",
	);
	const [generationPrompt, setGenerationPrompt] = useState("");
	const [generating, setGenerating] = useState(false);
	const [showGenerationWizard, setShowGenerationWizard] = useState(false);
	// Chat panel slides in from the right without hiding nodes
	const [showEditPanel, setShowEditPanel] = useState(false);
	// When true, the chat panel takes full width (used for template gallery "Build with AI" entry)
	const [chatFullscreen, setChatFullscreen] = useState(false);
	const [chatPrefilledInput, setChatPrefilledInput] = useState<
		string | undefined
	>(undefined);
	const [running, setRunning] = useState(false);
	const [stepStatuses, setStepStatuses] = useState<
		Record<string, StepRunStatus>
	>({});
	const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
	const [stepDurations, setStepDurations] = useState<Record<string, number>>(
		{},
	);
	const [steps, setSteps] = useState<AutomationNode[]>([]);
	const [config, setConfig] = useState<AutomationConfigEntry[]>([]);
	const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
	const [nodeOutputs, setNodeOutputsState] = useState<Record<string, string>>(
		{},
	);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [triggerExpanded, setTriggerExpanded] = useState(false);
	const [showTypePicker, setShowTypePicker] = useState(false);
	const [latestRunStatus, setLatestRunStatus] = useState<RunStatus | null>(
		null,
	);
	const [latestRunId, setLatestRunId] = useState<string | null>(null);
	const [_latestRunError, setLatestRunError] = useState<string | null>(null);
	const [latestRunResults, setLatestRunResults] = useState<
		AutomationNodeResult[]
	>([]);
	const [expandedResultNodes, setExpandedResultNodes] = useState<Set<string>>(
		new Set(),
	);
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

	const [isDirty, setIsDirty] = useState(false);
	const [mcpDone, setMcpDone] = useState(false);
	const [showRawJson, setShowRawJson] = useState(false);
	const [rawJsonText, setRawJsonText] = useState("");
	const [rawJsonError, setRawJsonError] = useState<string | null>(null);
	const [undoSnapshot, setUndoSnapshot] = useState<AutomationNode[] | null>(
		null,
	);
	const [suggestingDescription, setSuggestingDescription] = useState(false);
	const [updateLog, setUpdateLog] = useState<
		{ id: number; time: string; prompt: string }[]
	>([]);
	const [showHelp, setShowHelp] = useState(false);
	// Set to true after initial server data loads so draft writes don't fire on mount
	const loadedRef = useRef(false);
	const runBannerRef = useRef<HTMLDivElement>(null);

	const { status: automationStatus } = usePixel<AutomationDocument | null>(
		`GetAutomation(project=["${appId}"]);`,
		{
			data: null,
			onSuccess: (doc) => {
				const serverSteps = ensureTriggerNode(
					(doc?.graph ?? EMPTY_GRAPH).nodes,
				);
				const serverDescription = doc?.description ?? "";

				// Check for a localStorage draft saved after the server version.
				// Skip in MCP mode — always load fresh server state when opened via a tool.
				const draftKey = `automation-draft-${appId}`;
				const raw = localStorage.getItem(draftKey);
				if (raw && !mcpMode) {
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
						const hasSteps = draft.steps.some(
							(n) => n.type !== "trigger",
						);
						const wizardDismissed =
							sessionStorage.getItem(
								`automation-wizard-seen-${appId}`,
							) === "true";
						if (
							!mcpMode &&
							!hasSteps &&
							!draft.description.trim() &&
							!wizardDismissed
						) {
							setShowGenerationWizard(true);
						}
						if (mcpMode && mcpContext) {
							const prompt =
								mcpMode === "edit"
									? mcpContext.parameters?.instruction
									: mcpContext.parameters?.description;
							if (typeof prompt === "string" && prompt.trim()) {
								setGenerationPrompt(prompt.trim());
								if (mcpMode === "edit") setShowEditPanel(true);
							}
							if (mcpMode === "create")
								setShowGenerationWizard(true);
						}
						return;
					} catch {
						localStorage.removeItem(draftKey);
					}
				}

				setSteps(serverSteps);
				setDescription(serverDescription);
				setTimeout(() => {
					loadedRef.current = true;
				}, 0);
				// Only auto-show the wizard on a truly blank automation that hasn't been dismissed
				const hasSteps = serverSteps.some((n) => n.type !== "trigger");
				const wizardDismissed =
					sessionStorage.getItem(
						`automation-wizard-seen-${appId}`,
					) === "true";
				if (
					!mcpMode &&
					!hasSteps &&
					!serverDescription.trim() &&
					!wizardDismissed
				) {
					setShowGenerationWizard(true);
				}
				if (mcpMode && mcpContext) {
					const prompt =
						mcpMode === "edit"
							? mcpContext.parameters?.instruction
							: mcpContext.parameters?.description;
					if (typeof prompt === "string" && prompt.trim()) {
						setGenerationPrompt(prompt.trim());
						if (mcpMode === "edit") setShowEditPanel(true);
					}
					if (mcpMode === "create") setShowGenerationWizard(true);
				}
			},
			onError: () => {
				setSteps(ensureTriggerNode(EMPTY_GRAPH.nodes));
				setTimeout(() => {
					loadedRef.current = true;
				}, 0);
			},
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
			[automationStatus, automationConfigStatus].some(
				(status) => status === "INITIAL" || status === "LOADING",
			),
		[automationStatus, automationConfigStatus],
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

	const handleDevModeChange = useCallback(
		(value: boolean) => {
			setDevMode(value);
			localStorage.setItem(`automation-devmode-${appId}`, String(value));
		},
		[appId],
	);

	const incompleteCount = useMemo(
		() =>
			steps.filter(
				(s) => s.type !== "trigger" && validateNode(s).length > 0,
			).length,
		[steps],
	);

	const stepOutputPreviews = useMemo(
		() =>
			Object.fromEntries(
				latestRunResults
					.filter((r) => r.OUTPUT_PREVIEW != null)
					.map((r) => [r.NODE_ID, r.OUTPUT_PREVIEW as string]),
			),
		[latestRunResults],
	);

	const resultsByNodeId = useMemo(
		() => new Map(latestRunResults.map((r) => [r.NODE_ID, r])),
		[latestRunResults],
	);

	const loadTemplate = useCallback(
		(nodes: AutomationNode[], automationDescription: string) => {
			const fresh = ensureTriggerNode(nodes);
			setSteps(fresh);
			setDescription(automationDescription);
			sessionStorage.setItem(`automation-wizard-seen-${appId}`, "true");
			setShowGenerationWizard(false);
			const firstNonTrigger = fresh.find((n) => n.type !== "trigger");
			if (firstNonTrigger) setExpandedId(firstNonTrigger.id);
		},
		[appId],
	);

	const onStartBlank = useCallback(() => {
		sessionStorage.setItem(`automation-wizard-seen-${appId}`, "true");
		setShowGenerationWizard(false);
		setGenerationPrompt("");
	}, [appId]);

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
			// silently fail — user's description field is unchanged
		} finally {
			setSuggestingDescription(false);
		}
	}, [appId, steps, suggestingDescription]);

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
		// Clear any stale run state for the deleted node so a new node at the same
		// visual position doesn't inherit error/success styling from the old run.
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
	}, [appId, config, description, steps]);

	// Cmd+S / Ctrl+S keyboard shortcut
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

	const generate = useCallback(async () => {
		if (!generationPrompt.trim()) return;
		setGenerating(true);
		const wasEditPanel = showEditPanel;
		try {
			const encodedPrompt = btoa(
				encodeURIComponent(generationPrompt.trim()).replace(
					/%([0-9A-F]{2})/gi,
					(_, p1) => String.fromCharCode(parseInt(p1, 16)),
				),
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
					encodeURIComponent(JSON.stringify(currentDoc)).replace(
						/%([0-9A-F]{2})/gi,
						(_, p1) => String.fromCharCode(parseInt(p1, 16)),
					),
				);
				pixel = `BuildAutomation(project=["${appId}"], description=["${encodedPrompt}"], currentDoc=["${encodedDoc}"]);`;
			} else {
				pixel = `BuildAutomation(project=["${appId}"], description=["${encodedPrompt}"]);`;
			}
			const result = await runPixel(pixel);
			const raw = result.pixelReturn?.[0]?.output as string | null;
			if (!raw) throw new Error("No response from AI");
			let doc: AutomationDocument;
			try {
				doc = JSON.parse(raw) as AutomationDocument;
			} catch {
				throw new Error(
					"AI returned an unreadable response — please try again.",
				);
			}
			const generated = ensureTriggerNode(
				(doc?.graph ?? EMPTY_GRAPH).nodes,
			);
			setUndoSnapshot([...steps]);
			setSteps(generated);
			if (doc.description) setDescription(doc.description);
			sessionStorage.setItem(`automation-wizard-seen-${appId}`, "true");
			setShowGenerationWizard(false);
			setShowEditPanel(false);
			if (mcpMode === "edit") {
				setUpdateLog((prev) => [
					...prev,
					{
						id: Date.now(),
						time: new Date().toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						}),
						prompt: generationPrompt.trim(),
					},
				]);
			}
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
	}, [appId, description, generationPrompt, mcpMode, showEditPanel, steps]);

	/** Clears all run status indicators from step cards and hides the run summary banner. */
	const dismissRun = useCallback(() => {
		setLatestRunResults([]);
		setLatestRunStatus(null);
		setLatestRunId(null);
		setLatestRunError(null);
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setAiRunSummary(null);
		setExpandedResultNodes(new Set());
	}, []);

	/** Applies a pre-parsed AutomationDocument produced by the chat panel's BuildAutomation call. */
	const handleChatGenerated = useCallback(
		(doc: AutomationDocument, _chatDescription: string) => {
			const generated = ensureTriggerNode(
				(doc?.graph ?? EMPTY_GRAPH).nodes,
			);
			setUndoSnapshot([...steps]);
			setSteps(generated);
			if (doc.description) setDescription(doc.description);
			sessionStorage.setItem(`automation-wizard-seen-${appId}`, "true");
			setShowGenerationWizard(false);
			// Exit fullscreen chat — panel shrinks to split view so user can see the generated steps
			setChatFullscreen(false);
			// Clear stale run state — the automation just changed so old results are invalid
			dismissRun();
			toast.success(
				"Automation generated — review each step, then save when ready.",
			);
		},
		[appId, dismissRun, steps],
	);

	/** Opens the chat panel pre-filled with context about a failed step so the user can ask for a fix. */
	const handleAiFix = useCallback(
		(nodeId: string, errorMessage: string) => {
			const step = steps.find((s) => s.id === nodeId);
			const label = step?.label ?? "a step";
			setChatPrefilledInput(
				`Step "${label}" failed with this error:\n${errorMessage}\n\nPlease fix this step. Analyze the error, determine what needs to change, then provide the corrected automation design with the fix applied. Include your plan and the build signal in the same response.`,
			);
			setShowEditPanel(true);
		},
		[steps],
	);

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
		setAiRunSummary(null);
		setGeneratingAiSummary(false);
		setExpandedId(null);
		setTriggerExpanded(false);
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setLatestRunStatus("RUNNING");
		setLatestRunId(null);
		setLatestRunError(null);
		setLatestRunResults([]);
		setExpandedResultNodes(new Set());

		try {
			// Track the run ID locally so it's available in failure branches where the
			// latestRunId state value may not have flushed yet.
			let localRunId: string | null = null;

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
							if (typeof text === "string" && text.trim()) {
								setAiRunSummary(text.trim());
							}
						})
						.catch(() => {
							/* fall back to "Run failed." in banner */
						})
						.finally(() => setGeneratingAiSummary(false));
				}
				return;
			}
			const runData = asyncResult.results[0]
				?.output as AutomationRunData | null;
			if (runData) {
				applyRunData(runData);
			}
			toast.success(runData?.summary ?? "Automation completed");
			refreshRuns();

			// Generate AI summary async — non-blocking, best-effort
			const completedRunId = runData?.RUN_ID ?? null;
			if (completedRunId) {
				setGeneratingAiSummary(true);
				runPixel(
					`GenerateRunSummary(project=["${appId}"], runId=["${completedRunId}"]);`,
				)
					.then((res) => {
						const text = res.pixelReturn?.[0]?.output;
						if (typeof text === "string" && text.trim()) {
							setAiRunSummary(text.trim());
						}
					})
					.catch(() => {
						// Silently ignore — summary is optional
					})
					.finally(() => setGeneratingAiSummary(false));
			}
		} catch (error) {
			const message = (error as Error).message ?? "Unknown error";
			setLatestRunStatus("FAILED");
			setLatestRunError(message);
		} finally {
			setRunning(false);
		}
	}, [appId, applyRunData, isDirty, refreshRuns, save, steps]);

	const handleDoneReturnToChat = useCallback(async () => {
		if (saving || generating) return;
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
		generating,
		mcpContext,
		isDirty,
		save,
		steps,
		description,
		appId,
		mcpMode,
	]);

	// Scroll the run summary banner into view when a run completes
	useEffect(() => {
		if (!running && latestRunStatus && latestRunStatus !== "RUNNING") {
			runBannerRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	}, [running, latestRunStatus]);

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
				const response = await runPixel(
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

	// Focused edit view — shown when the EditAutomation / QuickEditAutomation MCP tool opens this editor.
	if (mcpMode === "edit" && mcpContext) {
		const nonTriggerSteps = steps.filter((n) => n.type !== "trigger");
		return (
			<div className="flex h-full flex-col bg-background">
				<div className="border-b px-6 py-4">
					<p className="font-semibold text-lg leading-tight">
						{description || "Automation"}
					</p>
					<p className="mt-0.5 text-muted-foreground text-xs">
						{nonTriggerSteps.length} step
						{nonTriggerSteps.length !== 1 ? "s" : ""}
						{isDirty && (
							<span className="ml-2 text-amber-600">
								· unsaved changes
							</span>
						)}
					</p>
				</div>
				<div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
					<div className="mx-auto max-w-3xl space-y-4">
						{nonTriggerSteps.length === 0 && (
							<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-10 text-center text-muted-foreground text-sm">
								No steps yet — describe what to build in the
								panel below.
							</div>
						)}
						{nonTriggerSteps.map((step, index, arr) => (
							<AutomationStepEditorCard
								key={step.id}
								step={step}
								index={index}
								isExpanded={expandedId === step.id}
								isFirst={index === 0}
								isLast={index === arr.length - 1}
								upstreamVars={upstreamVarsFor(
									steps.indexOf(step),
								)}
								nodeOutputs={nodeOutputs}
								runStatus={stepStatuses[step.id]}
								runError={stepErrors[step.id]}
								runDuration={stepDurations[step.id]}
								runOutput={stepOutputPreviews[step.id] ?? null}
								onToggle={() =>
									setExpandedId((prev) =>
										prev === step.id ? null : step.id,
									)
								}
								onUpdate={updateStep}
								onDelete={() => deleteStep(step.id)}
								onMoveUp={() => moveStep(step.id, -1)}
								onMoveDown={() => moveStep(step.id, 1)}
								onSetOutput={setNodeOutput}
								devMode={devMode}
								isIncomplete={validateNode(step).length > 0}
								appId={appId}
							/>
						))}
						<div className="rounded-xl border bg-muted/30 px-4 py-4">
							<div className="mb-3 flex items-center gap-1.5">
								<Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
								<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
									Refine with AI
								</span>
							</div>
							{updateLog.length > 0 && (
								<div className="mb-3 max-h-32 overflow-y-auto rounded-lg border bg-background/60 px-3 py-2">
									<div className="flex flex-col gap-1">
										{updateLog.map((entry, i) => (
											<div
												key={entry.id}
												className="flex items-start gap-2 text-xs"
											>
												<span className="shrink-0 text-muted-foreground tabular-nums">
													{entry.time}
												</span>
												<span className="text-foreground/70">
													{entry.prompt}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
							<Textarea
								value={generationPrompt}
								onChange={(e) =>
									setGenerationPrompt(e.target.value)
								}
								placeholder="Describe a change… e.g. 'Filter the query to the last 30 days' or 'Add a step to send a summary email'"
								className="mb-3 min-h-[80px] resize-none text-sm"
								disabled={generating}
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										(e.metaKey || e.ctrlKey)
									) {
										void generate();
									}
								}}
							/>
							<div className="flex items-center gap-3">
								<Button
									size="sm"
									onClick={() => void generate()}
									disabled={
										generating || !generationPrompt.trim()
									}
								>
									{generating ? (
										<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									) : (
										<Wand2 className="mr-1.5 h-3.5 w-3.5" />
									)}
									{generating ? "Updating…" : "Update"}
								</Button>
								{generating && (
									<span className="text-muted-foreground text-xs">
										Applying changes…
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-end gap-2 border-t bg-background/95 px-6 py-3 backdrop-blur-sm">
					<Button
						size="sm"
						onClick={() => void handleDoneReturnToChat()}
						disabled={saving || generating}
					>
						{saving ? (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						) : (
							<CheckCircle className="mr-1.5 h-3.5 w-3.5" />
						)}
						Save — Return to Chat
					</Button>
				</div>
			</div>
		);
	}

	// Focused create view — uses the GenerationWizard UI then full expandable step cards.
	if (mcpMode === "create" && mcpContext) {
		const nonTriggerSteps = steps.filter((n) => n.type !== "trigger");
		const hasGenerated = nonTriggerSteps.length > 0;
		return (
			<div className="flex h-full flex-col bg-background">
				<div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
					<div className="mx-auto max-w-3xl space-y-4">
						{(showGenerationWizard || !hasGenerated) && (
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
									Describe it in plain language and AI will
									build a starter workflow.
									<br />
									Tip: mention engine names or IDs for best
									results.
								</p>
								<Textarea
									value={generationPrompt}
									onChange={(e) =>
										setGenerationPrompt(e.target.value)
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
								<Button
									size="sm"
									onClick={() => void generate()}
									disabled={
										generating || !generationPrompt.trim()
									}
								>
									{generating ? (
										<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									) : (
										<Sparkles className="mr-1.5 h-3.5 w-3.5" />
									)}
									{generating
										? "Generating…"
										: hasGenerated
											? "Regenerate"
											: "Generate"}
								</Button>
							</div>
						)}
						{!showGenerationWizard &&
							hasGenerated &&
							nonTriggerSteps.map((step, index, arr) => (
								<AutomationStepEditorCard
									key={step.id}
									step={step}
									index={index}
									isExpanded={expandedId === step.id}
									isFirst={index === 0}
									isLast={index === arr.length - 1}
									upstreamVars={upstreamVarsFor(
										steps.indexOf(step),
									)}
									nodeOutputs={nodeOutputs}
									runStatus={stepStatuses[step.id]}
									runError={stepErrors[step.id]}
									runDuration={stepDurations[step.id]}
									runOutput={
										stepOutputPreviews[step.id] ?? null
									}
									onToggle={() =>
										setExpandedId((prev) =>
											prev === step.id ? null : step.id,
										)
									}
									onUpdate={updateStep}
									onDelete={() => deleteStep(step.id)}
									onMoveUp={() => moveStep(step.id, -1)}
									onMoveDown={() => moveStep(step.id, 1)}
									onSetOutput={setNodeOutput}
									devMode={devMode}
									isIncomplete={validateNode(step).length > 0}
									appId={appId}
								/>
							))}
						{!showGenerationWizard && hasGenerated && (
							<button
								type="button"
								onClick={() => setShowGenerationWizard(true)}
								className="flex w-full items-center justify-center gap-2 py-2 text-muted-foreground text-sm hover:text-foreground"
							>
								<Wand2 className="h-3.5 w-3.5" />
								Refine / Regenerate
							</button>
						)}
					</div>
				</div>
				<div className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-end gap-2 border-t bg-background/95 px-6 py-3 backdrop-blur-sm">
					<Button
						size="sm"
						onClick={() => void handleDoneReturnToChat()}
						disabled={saving || generating || !hasGenerated}
					>
						{saving ? (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						) : (
							<CheckCircle className="mr-1.5 h-3.5 w-3.5" />
						)}
						Save — Return to Chat
					</Button>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="flex h-full overflow-hidden">
				{/* Main editor — hidden when the chat panel is in fullscreen mode */}
				{!chatFullscreen && (
					<div className="flex min-w-0 flex-1 flex-col bg-background">
						<div className="border-b px-6 py-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<span className="font-semibold">
										Automation
									</span>
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
									<div className="relative" data-tour="save">
										<Button
											size="sm"
											variant="outline"
											onClick={() => void save()}
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
									)}
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
								</div>
							</div>
						)}

						<div className="border-b px-6">
							<div className="flex items-center gap-2 py-2">
								{[
									{ id: "steps", label: "Steps" },
									{
										id: "history",
										label: "Automation History",
									},
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
											className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-sm transition-colors ${
												isActive
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:bg-muted hover:text-foreground"
											}`}
										>
											{tab.label}
											{tab.id === "steps" &&
												incompleteCount > 0 && (
													<span
														className={`rounded-full px-1.5 py-0.5 font-medium text-[10px] tabular-nums ${
															isActive
																? "bg-white/20 text-white"
																: "bg-amber-500/15 text-amber-700"
														}`}
													>
														{incompleteCount}
													</span>
												)}
										</button>
									);
								})}
							</div>
						</div>

						<div className="flex-1 overflow-hidden">
							{activeTab === "steps" && (
								<div className="h-full overflow-y-auto px-6 py-6">
									<div className="mx-auto max-w-3xl space-y-4">
										{/* Template gallery / AI wizard — shown once on a blank automation */}
										{showGenerationWizard && (
											<TemplateGallery
												onSelectTemplate={loadTemplate}
												onStartBlank={onStartBlank}
												onBuildWithAi={() => {
													// Keep wizard hidden but show chat fullscreen
													// so the user builds via AI before seeing the editor
													setShowGenerationWizard(
														false,
													);
													setChatFullscreen(true);
													setShowEditPanel(true);
												}}
											/>
										)}

										{/* Guided tour — fixed-position popovers, anchored via data-tour attributes */}
										{!showGenerationWizard && (
											<OnboardingTour appId={appId} />
										)}

										{/* Running banner */}
										{!showGenerationWizard && running && (
											<div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-primary text-xs">
												<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
												Running…
											</div>
										)}

										{/* Run summary banner — shown after run completes, dismissed to clear all status */}
										{!showGenerationWizard &&
											!running &&
											latestRunStatus &&
											latestRunStatus !== "RUNNING" && (
												<div
													ref={runBannerRef}
													className={`flex items-start justify-between rounded-lg border px-3 py-2 text-xs ${
														latestRunStatus ===
														"SUCCESS"
															? "border-emerald-300/50 bg-emerald-50 dark:bg-emerald-900/20"
															: "border-destructive/30 bg-destructive/5"
													}`}
												>
													<div className="flex flex-1 flex-col gap-1">
														{latestRunStatus ===
														"SUCCESS" ? (
															<span className="font-medium text-emerald-700 dark:text-emerald-400">
																{generatingAiSummary &&
																!aiRunSummary
																	? "Summarizing run…"
																	: (aiRunSummary ??
																		"Run completed successfully.")}
															</span>
														) : (
															<span className="font-medium text-destructive">
																{generatingAiSummary &&
																!aiRunSummary
																	? "Summarizing run…"
																	: (aiRunSummary ??
																		"Run failed.")}
															</span>
														)}
													</div>
													<div className="ml-3 flex shrink-0 items-center gap-3">
														{latestRunStatus ===
															"FAILED" && (
															<button
																type="button"
																onClick={() => {
																	const failedResult =
																		latestRunResults.find(
																			(
																				r,
																			) =>
																				r.ERROR_MESSAGE,
																		);
																	if (
																		failedResult
																	)
																		handleAiFix(
																			failedResult.NODE_ID,
																			failedResult.ERROR_MESSAGE!,
																		);
																}}
																className="flex items-center gap-0.5 font-medium text-primary underline hover:text-primary/80"
															>
																<Sparkles className="h-3 w-3" />
																AI Fix
															</button>
														)}
														<button
															type="button"
															onClick={dismissRun}
															className="text-muted-foreground hover:text-foreground"
															aria-label="Dismiss"
														>
															✕
														</button>
													</div>
												</div>
											)}

										{/* Undo banner — shown after AI rewrites steps */}
										{!showGenerationWizard &&
											undoSnapshot && (
												<div className="flex items-center justify-between rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs dark:bg-amber-900/20">
													<span className="text-amber-700 dark:text-amber-400">
														AI updated your
														automation.
													</span>
													<div className="flex items-center gap-3">
														<button
															type="button"
															onClick={() => {
																setSteps(
																	undoSnapshot,
																);
																setUndoSnapshot(
																	null,
																);
															}}
															className="font-medium text-amber-700 underline hover:text-amber-900 dark:text-amber-400"
														>
															Undo
														</button>
														<button
															type="button"
															onClick={() =>
																setUndoSnapshot(
																	null,
																)
															}
															className="text-amber-600 hover:text-amber-900 dark:text-amber-400"
															aria-label="Dismiss"
														>
															✕
														</button>
													</div>
												</div>
											)}

										{/* Trigger node — always first, never deleteable */}
										{!showGenerationWizard &&
											steps
												.filter(
													(s) => s.type === "trigger",
												)
												.map((triggerStep) => (
													<TriggerStepCard
														key={triggerStep.id}
														step={triggerStep}
														isExpanded={
															triggerExpanded
														}
														appId={appId}
														description={
															description
														}
														onDescriptionChange={
															setDescription
														}
														suggestingDescription={
															suggestingDescription
														}
														onSuggestDescription={
															hasRunnableSteps
																? () =>
																		void handleSuggestDescription()
																: undefined
														}
														devMode={devMode}
														onDevModeChange={
															handleDevModeChange
														}
														onToggle={() =>
															setTriggerExpanded(
																(prev) => !prev,
															)
														}
													/>
												))}

										{/* Non-trigger steps */}
										{!showGenerationWizard &&
											steps.filter(
												(s) => s.type !== "trigger",
											).length === 0 && (
												<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-12 text-center">
													<p className="font-semibold text-sm">
														No steps yet
													</p>
													<p className="mt-2 text-muted-foreground text-xs leading-relaxed">
														Steps are the actions
														your automation takes —
														query a database, ask an
														AI, search documents,
														and more.
														<br />
														Click{" "}
														<span className="font-medium text-foreground">
															Add Step
														</span>{" "}
														below to build your
														first step.
													</p>
													<div className="mt-5 flex items-center justify-center gap-4">
														<button
															type="button"
															onClick={() =>
																setShowEditPanel(
																	true,
																)
															}
															className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 font-medium text-[11px] text-primary hover:bg-primary/10"
														>
															<Sparkles className="h-3 w-3" />
															Build with AI
														</button>
														<button
															type="button"
															onClick={() => {
																sessionStorage.removeItem(
																	`automation-wizard-seen-${appId}`,
																);
																setShowGenerationWizard(
																	true,
																);
															}}
															className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
														>
															← Start over with a
															template
														</button>
													</div>
												</div>
											)}

										{!showGenerationWizard &&
											steps
												.filter(
													(s) => s.type !== "trigger",
												)
												.map(
													(
														step,
														index,
														nonTriggerArr,
													) => {
														const stepResult =
															resultsByNodeId.get(
																step.id,
															);
														const hasOutput =
															!!stepResult?.OUTPUT_PREVIEW;
														const hasError =
															!!stepResult?.ERROR_MESSAGE;
														const showResult = !!(
															hasOutput ||
															hasError
														);
														return (
															<div key={step.id}>
																<AutomationStepEditorCard
																	step={step}
																	index={
																		index
																	}
																	isExpanded={
																		expandedId ===
																		step.id
																	}
																	isFirst={
																		index ===
																		0
																	}
																	isLast={
																		index ===
																		nonTriggerArr.length -
																			1
																	}
																	upstreamVars={upstreamVarsFor(
																		steps.indexOf(
																			step,
																		),
																	)}
																	nodeOutputs={
																		nodeOutputs
																	}
																	runStatus={
																		stepStatuses[
																			step
																				.id
																		]
																	}
																	runError={
																		stepErrors[
																			step
																				.id
																		]
																	}
																	runDuration={
																		stepDurations[
																			step
																				.id
																		]
																	}
																	runOutput={
																		stepOutputPreviews[
																			step
																				.id
																		] ??
																		null
																	}
																	onToggle={() => {
																		if (
																			running
																		)
																			return;
																		setExpandedId(
																			(
																				previous,
																			) =>
																				previous ===
																				step.id
																					? null
																					: step.id,
																		);
																	}}
																	onUpdate={
																		updateStep
																	}
																	onDelete={() =>
																		deleteStep(
																			step.id,
																		)
																	}
																	onMoveUp={() =>
																		moveStep(
																			step.id,
																			-1,
																		)
																	}
																	onMoveDown={() =>
																		moveStep(
																			step.id,
																			1,
																		)
																	}
																	onSetOutput={
																		setNodeOutput
																	}
																	devMode={
																		devMode
																	}
																	isIncomplete={
																		validateNode(
																			step,
																		)
																			.length >
																		0
																	}
																	appId={
																		appId
																	}
																	locked={
																		running
																	}
																/>
																{showResult && (
																	<div className="-mt-3 overflow-hidden rounded-b-2xl border-x border-b bg-muted/20 px-4 pt-5 pb-4">
																		{hasError && (
																			<div className="mb-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
																				<div className="flex items-start justify-between gap-2">
																					<span className="font-medium">
																						Step
																						failed
																					</span>
																					<button
																						type="button"
																						onClick={() =>
																							handleAiFix(
																								step.id,
																								stepResult?.ERROR_MESSAGE ??
																									"",
																							)
																						}
																						className="flex shrink-0 items-center gap-0.5 text-primary/80 hover:text-primary"
																					>
																						<Sparkles className="h-3 w-3" />
																						AI
																						Fix
																					</button>
																				</div>
																				<pre className="mt-1.5 max-h-[120px] overflow-y-auto whitespace-pre-wrap break-all font-sans opacity-80">
																					{stepResult?.ERROR_MESSAGE ??
																						""}
																				</pre>
																			</div>
																		)}
																		{hasOutput && (
																			<OutputPreview
																				value={
																					stepResult!
																						.OUTPUT_PREVIEW!
																				}
																				expanded={expandedResultNodes.has(
																					step.id,
																				)}
																				onToggle={() =>
																					toggleResultNode(
																						step.id,
																					)
																				}
																				nodeType={
																					step.type
																				}
																			/>
																		)}
																	</div>
																)}
															</div>
														);
													},
												)}

										{!showGenerationWizard &&
										!showTypePicker ? (
											<button
												data-tour="add-step"
												type="button"
												onClick={() =>
													setShowTypePicker(true)
												}
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
															Select a step to add
															to the automation.
														</p>
													</div>
													<Button
														size="sm"
														variant="ghost"
														className="h-8 px-2 text-xs"
														onClick={() =>
															setShowTypePicker(
																false,
															)
														}
													>
														Cancel
													</Button>
												</div>
												<div className="grid gap-3 md:grid-cols-2">
													{STEP_TYPES.map(
														(stepType) => {
															const Icon =
																stepType.icon;
															return (
																<button
																	key={
																		stepType.type
																	}
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
																			{
																				stepType.label
																			}
																		</span>
																		<span className="block text-[11px] text-muted-foreground">
																			{
																				stepType.description
																			}
																		</span>
																	</span>
																</button>
															);
														},
													)}
												</div>
											</div>
										) : null}
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
													Review recent automation
													runs and inspect per-node
													outputs.
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
													Each time the automation
													runs, results appear here so
													you can review what
													happened.
													<br />
													Click{" "}
													<span className="font-medium text-foreground">
														Run
													</span>{" "}
													in the top toolbar to run it
													now.
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
																	key={
																		runItem.RUN_ID
																	}
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
																					onAiFix={
																						handleAiFix
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
												Store reusable values like API
												keys or URLs. Reference them in
												any step as{" "}
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
										{devMode && (
											<div className="rounded-2xl border bg-card px-5 py-4 shadow-sm">
												<div className="flex items-center justify-between">
													<div>
														<h3 className="font-semibold text-sm">
															Raw JSON
														</h3>
														<p className="text-[11px] text-muted-foreground">
															View and edit the
															automation document
															directly.
														</p>
													</div>
													<Button
														size="sm"
														variant="outline"
														className="h-7 text-xs"
														onClick={() => {
															if (!showRawJson) {
																const doc: AutomationDocument =
																	{
																		version: 1,
																		description:
																			description.trim() ||
																			undefined,
																		graph: {
																			nodes: steps,
																			edges: [],
																		},
																	};
																setRawJsonText(
																	JSON.stringify(
																		doc,
																		null,
																		2,
																	),
																);
																setRawJsonError(
																	null,
																);
															}
															setShowRawJson(
																(prev) => !prev,
															);
														}}
													>
														{showRawJson
															? "Hide JSON"
															: "View JSON"}
													</Button>
												</div>
												{showRawJson && (
													<div className="mt-3 flex flex-col gap-2">
														<Textarea
															value={rawJsonText}
															onChange={(e) => {
																setRawJsonText(
																	e.target
																		.value,
																);
																setRawJsonError(
																	null,
																);
															}}
															className="min-h-[200px] resize-y font-mono text-xs"
														/>
														{rawJsonError && (
															<p className="text-[11px] text-destructive">
																{rawJsonError}
															</p>
														)}
														<div className="flex gap-2">
															<Button
																size="sm"
																className="text-xs"
																onClick={() => {
																	try {
																		const parsed =
																			JSON.parse(
																				rawJsonText,
																			) as {
																				graph?: {
																					nodes?: AutomationNode[];
																				};
																				description?: string;
																			};
																		if (
																			!Array.isArray(
																				parsed
																					?.graph
																					?.nodes,
																			)
																		)
																			throw new Error(
																				"Invalid format: graph.nodes must be an array",
																			);
																		const nodes =
																			parsed
																				.graph
																				.nodes as AutomationNode[];
																		for (const n of nodes) {
																			if (
																				!n.id ||
																				!n.type
																			)
																				throw new Error(
																					`Node missing required fields (id, type)`,
																				);
																		}
																		setSteps(
																			nodes,
																		);
																		if (
																			typeof parsed.description ===
																			"string"
																		)
																			setDescription(
																				parsed.description,
																			);
																		setShowRawJson(
																			false,
																		);
																	} catch (err) {
																		setRawJsonError(
																			(
																				err as Error
																			)
																				.message,
																		);
																	}
																}}
															>
																Apply
															</Button>
															<Button
																size="sm"
																variant="ghost"
																className="text-xs"
																onClick={() =>
																	setShowRawJson(
																		false,
																	)
																}
															>
																Cancel
															</Button>
														</div>
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				)}{" "}
				{/* end !chatFullscreen */}
				<ChatPanel
					appId={appId}
					open={showEditPanel}
					onClose={() => {
						setShowEditPanel(false);
						setChatFullscreen(false);
						setChatPrefilledInput(undefined);
					}}
					onGenerated={handleChatGenerated}
					prefilledInput={chatPrefilledInput}
					stepsCount={
						steps.filter((s) => s.type !== "trigger").length
					}
					currentDocBase64={
						steps.length > 0
							? btoa(
									unescape(
										encodeURIComponent(
											JSON.stringify({
												graph: {
													nodes: steps,
													edges: [],
												},
											}),
										),
									),
								)
							: undefined
					}
					fullscreen={chatFullscreen}
				/>
			</div>

			{!showGenerationWizard && !chatFullscreen && (
				<button
					type="button"
					onClick={() => {
						setChatFullscreen(false);
						setShowEditPanel((v) => !v);
					}}
					className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
					title={showEditPanel ? "Close AI panel" : "Build with AI"}
				>
					<Wand2 className="h-5 w-5" />
				</button>
			)}

			<HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
		</>
	);
}
