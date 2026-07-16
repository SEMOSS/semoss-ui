import {
	Bot,
	ChevronDown,
	ChevronRight,
	Database,
	Loader2,
	Play,
	Plus,
	RefreshCw,
	Save,
	Workflow,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	EngineOption,
	ProjectOption,
	RunStatus,
	StepRunStatus,
	WorkflowDocument,
	WorkflowGraph,
	WorkflowNode,
	WorkflowNodeResult,
	WorkflowNodeType,
	WorkflowRunDetail,
	WorkflowRunSummary,
} from "@/pages/workflow/workflow.types";
import { NODE_TYPE_META } from "@/pages/workflow/workflow.types";
import { buildPixelPreview } from "../workflow-workspace/workflow-utils";
import { NodeResultList } from "./node-result-list";
import type { WorkflowRunData } from "./workflow-editor-utils";
import {
	FOR_EACH_TYPE,
	formatRunDuration,
	formatTimestamp,
	getDisplayMeta,
	newStepId,
	RUN_POLL_INTERVAL_MS,
	STEP_TYPES,
} from "./workflow-editor-utils";
import { StatusBadge } from "./workflow-status";
import { WorkflowStepEditorCard } from "./workflow-step-editor-card";

interface WorkflowFormEditorProps {
	appId: string;
}

export function WorkflowFormEditor({ appId }: WorkflowFormEditorProps) {
	const { monolithStore } = useRootStore();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<
		"steps" | "results" | "history" | "trigger"
	>("steps");
	const [running, setRunning] = useState(false);
	const [stepStatuses, setStepStatuses] = useState<
		Record<string, StepRunStatus>
	>({});
	const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
	const [stepDurations, setStepDurations] = useState<Record<string, number>>(
		{},
	);
	const [steps, setSteps] = useState<WorkflowNode[]>([]);
	const [triggerMode, setTriggerMode] = useState<"manual" | "schedule">(
		"manual",
	);
	const [cronExpr, setCronExpr] = useState("0 0 6 * * ?");
	const [enginesByType, setEnginesByType] = useState<
		Record<string, EngineOption[]>
	>({});
	const [projects, setProjects] = useState<ProjectOption[]>([]);
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
		WorkflowNodeResult[]
	>([]);
	const [expandedResultNodes, setExpandedResultNodes] = useState<Set<string>>(
		new Set(),
	);
	const [runs, setRuns] = useState<WorkflowRunSummary[]>([]);
	const [historyLoading, setHistoryLoading] = useState(true);
	const [expandedHistoryRunId, setExpandedHistoryRunId] = useState<
		string | null
	>(null);
	const [expandedHistoryRun, setExpandedHistoryRun] =
		useState<WorkflowRunDetail | null>(null);
	const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
	const [expandedHistoryNodes, setExpandedHistoryNodes] = useState<
		Set<string>
	>(new Set());

	const fetchRuns = useCallback(() => {
		setHistoryLoading(true);
		monolithStore
			.runQuery(`ListWorkflowRuns(project=["${appId}"], limit=[25]);`)
			.then((response) => {
				const list =
					(response.pixelReturn[0].output as WorkflowRunSummary[]) ??
					[];
				setRuns(list);
			})
			.catch((error: Error) => {
				toast.error(
					`Failed to load run history: ${error.message ?? "Unknown error"}`,
				);
			})
			.finally(() => setHistoryLoading(false));
	}, [appId, monolithStore]);

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
				const graph: WorkflowGraph = doc?.graph ?? {
					nodes: [],
					edges: [],
				};
				setSteps(graph.nodes);

				const engList =
					(engRes.pixelReturn[0].output as EngineOption[]) ?? [];
				const byType: Record<string, EngineOption[]> = {};
				for (const engine of engList) {
					const type = (engine.engine_type ?? "").toUpperCase();
					if (!byType[type]) {
						byType[type] = [];
					}
					byType[type].push(engine);
				}
				setEnginesByType(byType);

				const projectList =
					(projRes.pixelReturn[0].output as ProjectOption[]) ?? [];
				setProjects(projectList);
			})
			.finally(() => setLoading(false));

		fetchRuns();
	}, [appId, fetchRuns, monolithStore]);

	const setNodeOutput = useCallback((outputVar: string, value: string) => {
		setNodeOutputsState((previous) => ({
			...previous,
			[outputVar]: value,
		}));
	}, []);

	const addStep = useCallback(
		(type: WorkflowNodeType) => {
			const runtimeType =
				getDisplayMeta(type).runtimeType ??
				(type === FOR_EACH_TYPE ? "fan-out" : type);
			const meta = NODE_TYPE_META.find(
				(item) => item.type === runtimeType,
			);
			if (!meta) return;

			const id = newStepId(runtimeType);
			const newStep: WorkflowNode = {
				id,
				type: runtimeType,
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

	const updateStep = useCallback((updated: WorkflowNode) => {
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
		const jobId = `workflow_${appId}`;
		try {
			const stepsWithPixel = steps.map((step) => ({
				...step,
				builtPixel: buildPixelPreview(step),
			}));
			const doc: WorkflowDocument = {
				version: 1,
				graph: { nodes: stepsWithPixel, edges: [] },
			};
			const json = encodeURIComponent(JSON.stringify(doc));
			await monolithStore.runQuery(
				`SaveWorkflow(project=["${appId}"], json=["${json}"]);`,
			);

			if (triggerMode === "schedule" && cronExpr) {
				const recipe = `TriggerWorkflow(project=\\"${appId}\\")`;
				await monolithStore.runQuery(
					`ScheduleJob(jobName=["${jobId}"], jobGroup=["${appId}"], cronExpression=["${cronExpr}"], recipe=["${recipe}"]);`,
				);
				toast.success("Workflow saved and scheduled");
			} else {
				await monolithStore
					.runQuery(
						`RemoveJobFromDB(jobId=["${jobId}"], jobGroup=["${appId}"]);`,
					)
					.catch(() => {});
				toast.success("Workflow saved");
			}
			return true;
		} catch {
			toast.error("Save failed");
			return false;
		} finally {
			setSaving(false);
		}
	}, [appId, steps, triggerMode, cronExpr, monolithStore]);

	// Tracks the in-flight poll loop so we can cancel it on unmount or when a new run starts.
	const pollTokenRef = useRef<{ cancelled: boolean } | null>(null);

	useEffect(() => {
		return () => {
			if (pollTokenRef.current) {
				pollTokenRef.current.cancelled = true;
			}
		};
	}, []);

	const applyRunData = useCallback(
		(runData: WorkflowRunData) => {
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
				} else if (nodeResult.STATUS === "CANCELLED") {
					newStatuses[step.id] = "error";
				} else if (nodeResult.STATUS === "INTERRUPTED") {
					newStatuses[step.id] = "error";
				}

				if (nodeResult.ERROR_MESSAGE) {
					newErrors[step.id] = nodeResult.ERROR_MESSAGE;
				}
				if (nodeResult.DURATION_MS != null) {
					newDurations[step.id] = nodeResult.DURATION_MS;
				}
				if (nodeResult.OUTPUT_PREVIEW && step.outputVar) {
					newOutputs[step.outputVar] = nodeResult.OUTPUT_PREVIEW;
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

	// Always holds the latest applyRunData so pollRun can call it without capturing
	// a stale closure — the poll loop starts once and must not be restarted every
	// time steps changes.
	const applyRunDataRef = useRef(applyRunData);
	useEffect(() => {
		applyRunDataRef.current = applyRunData;
	}, [applyRunData]);

	// Polls GetWorkflowRun until the run leaves RUNNING status. TriggerWorkflow now returns
	// immediately (execution happens on a background thread server-side), so this is the only
	// way the FE learns about progress/completion for a manual run.
	const pollRun = useCallback(
		async (runId: string, token: { cancelled: boolean }) => {
			while (!token.cancelled) {
				await new Promise((resolve) =>
					setTimeout(resolve, RUN_POLL_INTERVAL_MS),
				);
				if (token.cancelled) return;

				try {
					const response = await monolithStore.runQuery(
						`GetWorkflowRun(project=["${appId}"], runId=["${runId}"]);`,
					);
					const runData = response.pixelReturn?.[0]
						?.output as WorkflowRunData | null;
					if (!runData || token.cancelled) continue;

					applyRunDataRef.current(runData);

					if (runData.STATUS !== "RUNNING") {
						if (runData.STATUS === "SUCCESS") {
							toast.success("Workflow completed");
						} else if (runData.STATUS === "FAILED") {
							toast.error(
								runData.ERROR_MESSAGE ?? "Workflow failed",
							);
						} else if (runData.STATUS === "CANCELLED") {
							toast.error("Workflow was cancelled");
						}
						setRunning(false);
						fetchRuns();
						return;
					}
				} catch (error) {
					if (token.cancelled) return;
					toast.error(
						`Lost connection while polling run status: ${
							(error as Error).message ?? "Unknown error"
						}`,
					);
					setRunning(false);
					return;
				}
			}
		},
		[appId, fetchRuns, monolithStore],
	);

	const run = useCallback(async () => {
		if (steps.length === 0) return;
		const saved = await save();
		if (!saved) return;
		if (pollTokenRef.current) {
			pollTokenRef.current.cancelled = true;
		}
		setRunning(true);
		setStepStatuses({});
		setStepErrors({});
		setStepDurations({});
		setLatestRunStatus(null);
		setLatestRunId(null);
		setLatestRunError(null);
		setLatestRunResults([]);
		setExpandedResultNodes(new Set());

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
			setActiveTab("results");

			if (runData.STATUS === "RUNNING" && runData.RUN_ID) {
				const token = { cancelled: false };
				pollTokenRef.current = token;
				pollRun(runData.RUN_ID, token);
				return;
			}

			// Run already reached a terminal status synchronously (e.g. validation failure
			// before the background executor was even started).
			if (runData.STATUS === "FAILED") {
				toast.error(runData.ERROR_MESSAGE ?? "Workflow failed");
			}
			fetchRuns();
			setRunning(false);
		} catch (error) {
			toast.error(
				`Workflow failed: ${(error as Error).message ?? "Unknown error"}`,
			);
			setRunning(false);
		}
	}, [appId, applyRunData, fetchRuns, pollRun, save, steps, monolithStore]);

	const upstreamVarsFor = useCallback(
		(index: number) => {
			return steps
				.slice(0, index)
				.map((step) => step.outputVar)
				.filter(Boolean);
		},
		[steps],
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
					`GetWorkflowRun(project=["${appId}"], runId=["${runId}"]);`,
				);
				setExpandedHistoryRun(
					response.pixelReturn[0].output as WorkflowRunDetail,
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
						<Workflow className="h-5 w-5 text-muted-foreground" />
						<span className="font-semibold">Workflow</span>
						{triggerMode === "schedule" && (
							<span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
								Scheduled: {cronExpr || "not set"}
							</span>
						)}
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

			{/* Running progress banner */}
			{running && (
				<div className="border-b bg-primary/5 px-6 py-3">
					<div className="flex items-center gap-3">
						<Loader2 className="h-4 w-4 animate-spin text-primary" />
						<span className="font-medium text-primary text-sm">
							Running workflow...
						</span>
						<div className="ml-auto flex items-center gap-2">
							<div className="h-1.5 w-48 overflow-hidden rounded-full bg-primary/20">
								<div
									className="h-full animate-pulse rounded-full bg-primary"
									style={{ width: "60%" }}
								/>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="border-b px-6">
				<div className="flex items-center gap-2 py-2">
					{[
						{ id: "steps", label: "Steps" },
						{ id: "trigger", label: "Trigger" },
						{ id: "results", label: "Run Results" },
						{ id: "history", label: "History" },
					].map((tab) => {
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() =>
									setActiveTab(
										tab.id as
											| "steps"
											| "results"
											| "history"
											| "trigger",
									)
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
				{activeTab === "trigger" && (
					<div className="h-full overflow-y-auto px-6 py-6">
						<div className="mx-auto max-w-3xl space-y-6">
							<div>
								<h2 className="font-semibold text-lg">
									Trigger Configuration
								</h2>
								<p className="mt-1 text-muted-foreground text-sm">
									Configure how this workflow is triggered —
									manually or on a schedule.
								</p>
							</div>

							<div className="space-y-6 rounded-xl border bg-card p-6">
								<Field>
									<FieldLabel>Trigger Mode</FieldLabel>
									<Select
										value={triggerMode}
										onValueChange={(value) =>
											setTriggerMode(
												value as "manual" | "schedule",
											)
										}
									>
										<SelectTrigger className="h-10 w-full max-w-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="manual">
												Manual (on demand)
											</SelectItem>
											<SelectItem value="schedule">
												Scheduled (cron job)
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>

								{triggerMode === "schedule" && (
									<>
										<Field>
											<FieldLabel>
												Cron Expression
											</FieldLabel>
											<Input
												className="h-10 max-w-xs font-mono"
												value={cronExpr}
												onChange={(event) =>
													setCronExpr(
														event.target.value,
													)
												}
												placeholder="0 0 6 * * ?"
											/>
											<p className="mt-1.5 text-muted-foreground text-xs">
												Format: seconds minutes hours
												day-of-month month day-of-week
											</p>
										</Field>

										<div className="rounded-lg border bg-muted/40 p-4">
											<p className="font-medium text-sm">
												Common Patterns
											</p>
											<div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
												{[
													{
														label: "Every day at 6 AM",
														value: "0 0 6 * * ?",
													},
													{
														label: "Every hour",
														value: "0 0 * * * ?",
													},
													{
														label: "Every 15 minutes",
														value: "0 */15 * * * ?",
													},
													{
														label: "Weekdays at 8 AM",
														value: "0 0 8 ? * MON-FRI",
													},
													{
														label: "Every Sunday midnight",
														value: "0 0 0 ? * SUN",
													},
													{
														label: "First of month at 2 AM",
														value: "0 0 2 1 * ?",
													},
												].map((preset) => (
													<button
														key={preset.value}
														type="button"
														onClick={() =>
															setCronExpr(
																preset.value,
															)
														}
														className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors hover:border-primary hover:bg-accent"
													>
														<span>
															{preset.label}
														</span>
														<span className="font-mono text-muted-foreground">
															{preset.value}
														</span>
													</button>
												))}
											</div>
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				)}

				{activeTab === "steps" && (
					<div className="h-full overflow-y-auto px-6 py-6">
						<div className="mx-auto max-w-3xl space-y-4">
							{steps.length === 0 && (
								<div className="space-y-6">
									<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-10 text-center">
										<Workflow className="mx-auto h-10 w-10 text-muted-foreground/50" />
										<p className="mt-3 font-medium text-sm">
											No steps yet
										</p>
										<p className="mt-1 text-muted-foreground text-xs">
											Add steps below or start from a
											template.
										</p>
									</div>

									{/* Template picker */}
									<div className="rounded-xl border bg-card p-5">
										<p className="font-medium text-sm">
											Start from a template
										</p>
										<p className="mt-0.5 text-muted-foreground text-xs">
											Pre-built workflows for common
											patterns
										</p>
										<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
											{[
												{
													id: "sync-etl",
													name: "Database Sync",
													description:
														"Query source DB → insert to target",
													icon: Database,
													color: "text-blue-600",
												},
												{
													id: "ingest-embed-index",
													name: "Document Ingestion",
													description:
														"Download → embed → vector index",
													icon: Bot,
													color: "text-purple-600",
												},
												{
													id: "llm-enrichment",
													name: "LLM Enrichment",
													description:
														"Classify records with AI",
													icon: Zap,
													color: "text-amber-600",
												},
											].map((tmpl) => (
												<button
													key={tmpl.id}
													type="button"
													onClick={async () => {
														try {
															await monolithStore.runQuery(
																`CreateWorkflowFromTemplate(project=["${appId}"], templateId=["${tmpl.id}"]);`,
															);
															toast.success(
																`Created from "${tmpl.name}" template`,
															);
															// Reload workflow
															const res =
																await monolithStore.runQuery(
																	`GetWorkflow(project=["${appId}"]);`,
																);
															const doc = res
																.pixelReturn?.[0]
																?.output as WorkflowDocument | null;
															if (
																doc?.graph
																	?.nodes
															) {
																setSteps(
																	doc.graph
																		.nodes,
																);
															}
														} catch {
															toast.error(
																"Failed to create from template",
															);
														}
													}}
													className="flex flex-col items-start rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-accent"
												>
													<tmpl.icon
														className={`h-6 w-6 ${tmpl.color}`}
													/>
													<span className="mt-2 font-medium text-sm">
														{tmpl.name}
													</span>
													<span className="mt-0.5 text-muted-foreground text-xs">
														{tmpl.description}
													</span>
												</button>
											))}
										</div>
									</div>
								</div>
							)}

							{steps.map((step, index) => (
								<WorkflowStepEditorCard
									key={step.id}
									step={step}
									index={index}
									isExpanded={expandedId === step.id}
									isFirst={index === 0}
									isLast={index === steps.length - 1}
									enginesByType={enginesByType}
									projects={projects}
									upstreamVars={upstreamVarsFor(index)}
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
												workflow.
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
									</div>
									<p className="mt-1 text-[11px] text-muted-foreground">
										{latestRunId
											? `Run ID: ${latestRunId}`
											: "Run the workflow to populate node results."}
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
										Workflow History
									</h2>
									<p className="text-[11px] text-muted-foreground">
										Review recent workflow runs and inspect
										per-node outputs.
									</p>
								</div>
								<Button
									size="sm"
									variant="ghost"
									className="h-8 px-2 text-xs"
									onClick={fetchRuns}
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
			</div>
		</div>
	);
}
