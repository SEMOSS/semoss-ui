import {
	ChevronDown,
	ChevronRight,
	Loader2,
	Play,
	Plus,
	RefreshCw,
	Save,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixelAsync,
} from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import { Button, toast } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { NODE_TYPE_META } from "../automation.constants";
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
} from "../automation.types";
import { applyOutputTransform } from "../automation-utils";
import { AutomationConfigTab } from "./automation-config-tab";
import type { AutomationRunData } from "./automation-editor-utils";
import {
	formatRunDuration,
	formatTimestamp,
	getDisplayMeta,
	newStepId,
	STEP_TYPES,
} from "./automation-editor-utils";
import { AutomationStepEditorCard } from "./automation-step-editor-card";
import { NodeResultList } from "./node-result-list";
import { StatusBadge } from "./status-badge";
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
	const { monolithStore } = useRootStore();
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<TabId>("steps");
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
	const [savingConfig, setSavingConfig] = useState(false);
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

	const { status: automationStatus } = usePixel<AutomationDocument | null>(
		`GetAutomation(project=["${appId}"]);`,
		{
			data: null,
			onSuccess: (doc) =>
				setSteps(ensureTriggerNode((doc?.graph ?? EMPTY_GRAPH).nodes)),
			onError: () => setSteps(ensureTriggerNode(EMPTY_GRAPH.nodes)),
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

	useEffect(() => {
		setRuns(runsData ?? []);
	}, [runsData]);

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
				graph: { nodes: steps, edges: [] },
			};
			const json = encodeURIComponent(JSON.stringify(doc));
			await monolithStore.runQuery(
				`SaveAutomation(project=["${appId}"], json=["${json}"]);`,
			);
			toast.success("Automation saved");
			return true;
		} catch {
			toast.error("Save failed");
			return false;
		} finally {
			setSaving(false);
		}
	}, [appId, steps, monolithStore]);

	const saveConfig = useCallback(async () => {
		setSavingConfig(true);
		try {
			const json = encodeURIComponent(JSON.stringify(config));
			await monolithStore.runQuery(
				`SaveAutomationConfig(project=["${appId}"], config=["${json}"]);`,
			);
			toast.success("Config saved");
		} catch {
			toast.error("Config save failed");
		} finally {
			setSavingConfig(false);
		}
	}, [appId, config, monolithStore]);

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
					const activeRes = await monolithStore.runQuery(
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
			toast.error(
				`Automation failed: ${(error as Error).message ?? "Unknown error"}`,
			);
			setLatestRunStatus("FAILED");
			setRunning(false);
		}
	}, [appId, applyRunData, refreshRuns, save, steps, monolithStore]);

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
				const response = await monolithStore.runQuery(
					`GetAutomationRun(project=["${appId}"], runId=["${runId}"]);`,
				);
				setExpandedHistoryRun(
					response.pixelReturn[0].output as AutomationRunDetail,
				);
			} finally {
				setHistoryDetailLoading(false);
			}
		},
		[appId, expandedHistoryRunId, monolithStore],
	);

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="border-b px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<span className="font-semibold">Automation</span>
					</div>
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={save}
							disabled={saving}
						>
							{saving ? (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							) : (
								<Save className="mr-1.5 h-3.5 w-3.5" />
							)}
							Save
						</Button>
						<Button size="sm" onClick={run} disabled={running}>
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
								onClick={() => setActiveTab(tab.id as TabId)}
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
							{/* Trigger node — always first, never deleteable */}
							{steps
								.filter((s) => s.type === "trigger")
								.map((triggerStep) => (
									<TriggerStepCard
										key={triggerStep.id}
										step={triggerStep}
										isExpanded={
											expandedId === triggerStep.id
										}
										appId={appId}
										onToggle={() =>
											setExpandedId((previous) =>
												previous === triggerStep.id
													? null
													: triggerStep.id,
											)
										}
									/>
								))}

							{/* Non-trigger steps */}
							{steps.filter((s) => s.type !== "trigger")
								.length === 0 && (
								<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-10 text-center">
									<Zap className="mx-auto h-10 w-10 text-muted-foreground/50" />
									<p className="mt-3 font-medium text-sm">
										No steps yet
									</p>
									<p className="mt-1 text-muted-foreground text-xs">
										Add a step below to get started.
									</p>
								</div>
							)}

							{steps
								.filter((s) => s.type !== "trigger")
								.map((step, index, nonTriggerArr) => (
									<AutomationStepEditorCard
										key={step.id}
										step={step}
										index={index}
										isExpanded={expandedId === step.id}
										isFirst={index === 0}
										isLast={
											index === nonTriggerArr.length - 1
										}
										enginesByType={enginesByType}
										projects={projects}
										upstreamVars={upstreamVarsFor(
											steps.indexOf(step),
										)}
										nodeOutputs={nodeOutputs}
										runStatus={stepStatuses[step.id]}
										runError={stepErrors[step.id]}
										runDuration={stepDurations[step.id]}
										onToggle={() =>
											setExpandedId((previous) =>
												previous === step.id
													? null
													: step.id,
											)
										}
										onUpdate={updateStep}
										onDelete={() => deleteStep(step.id)}
										onMoveUp={() => moveStep(step.id, -1)}
										onMoveDown={() => moveStep(step.id, 1)}
										onSetOutput={setNodeOutput}
									/>
								))}

							{!showTypePicker ? (
								<button
									type="button"
									onClick={() => setShowTypePicker(true)}
									className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-muted-foreground text-sm transition-colors hover:border-primary hover:text-primary"
								>
									<Plus className="h-4 w-4" />
									Add Step
								</button>
							) : (
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
														addStep(stepType.type)
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
							)}
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
														await monolithStore.runQuery(
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
									<p className="mt-1 text-[11px] text-muted-foreground">
										{latestRunId
											? `Run ID: ${latestRunId}`
											: "Run the automation to populate node results."}
									</p>
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
								<Button
									size="sm"
									variant="ghost"
									className="h-8 px-2 text-xs"
									onClick={refreshRuns}
								>
									<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
									Refresh
								</Button>
							</div>

							{historyLoading ? (
								<div className="flex h-40 items-center justify-center rounded-2xl border bg-card">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							) : runs.length === 0 ? (
								<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center text-muted-foreground text-sm">
									No runs yet — click "Run" to start.
								</div>
							) : (
								<div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
									<div className="min-w-[760px]">
										<div className="grid grid-cols-[160px_minmax(0,1.4fr)_120px_120px_140px] gap-4 border-b bg-muted/30 px-4 py-3 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
											<span>Status</span>
											<span>Started</span>
											<span>Duration</span>
											<span>Trigger</span>
											<span>Nodes Completed</span>
										</div>
										<div className="divide-y">
											{runs.map((runItem) => {
												const isExpanded =
													expandedHistoryRunId ===
													runItem.RUN_ID;
												return (
													<div key={runItem.RUN_ID}>
														<button
															type="button"
															onClick={() =>
																void selectHistoryRun(
																	runItem.RUN_ID,
																)
															}
															className="grid w-full grid-cols-[160px_minmax(0,1.4fr)_120px_120px_140px] gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/30"
														>
															<span>
																<StatusBadge
																	status={
																		runItem.STATUS
																	}
																/>
															</span>
															<span className="truncate text-muted-foreground">
																{formatTimestamp(
																	runItem.STARTED_AT,
																)}
															</span>
															<span className="text-muted-foreground">
																{formatRunDuration(
																	runItem.STARTED_AT,
																	runItem.COMPLETED_AT,
																)}
															</span>
															<span className="text-muted-foreground">
																{runItem.TRIGGER_TYPE ??
																	"—"}
															</span>
															<span className="flex items-center justify-between gap-2 text-muted-foreground">
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
							<div className="flex items-center justify-between gap-3">
								<div>
									<h2 className="font-semibold text-sm">
										Automation Config
									</h2>
									<p className="text-[11px] text-muted-foreground">
										Key-value pairs stored in this
										automation's SMSS. Reference them in
										node fields as{" "}
										<code className="rounded bg-muted px-1 font-mono">
											{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional literal display */}
											{"${config.KEY}"}
										</code>
										.
									</p>
								</div>
								<Button
									size="sm"
									variant="outline"
									onClick={saveConfig}
									disabled={savingConfig}
								>
									{savingConfig ? (
										<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									) : (
										<Save className="mr-1.5 h-3.5 w-3.5" />
									)}
									Save Config
								</Button>
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
	);
}
