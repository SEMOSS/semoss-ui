import { Check, ChevronDown, Info, Loader2, Play, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Separator,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	CustomPixelConfig,
	DatabaseEngineConfig,
	EmailConfig,
	EngineOption,
	ForEachConfig,
	FunctionEngineConfig,
	HttpRequestConfig,
	ModelEngineConfig,
	NodeConfig,
	NotificationConfig,
	ParallelConfig,
	ProjectOption,
	RetryConfig,
	SetVariableConfig,
	StorageEngineConfig,
	SwitchConfig,
	TriggerConfig,
	TryCatchConfig,
	VectorEngineConfig,
	WaitConfig,
	WhileLoopConfig,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";
import { ConditionalStepForm } from "../../workflow-form-editor/forms/conditional-form";
import { CustomPixelForm } from "../../workflow-form-editor/forms/custom-pixel-form";
import { DatabaseEngineForm } from "../../workflow-form-editor/forms/database-engine-form";
import { EmailForm } from "../../workflow-form-editor/forms/email-form";
import { ForEachForm } from "../../workflow-form-editor/forms/for-each-form";
import { FunctionEngineForm } from "../../workflow-form-editor/forms/function-engine-form";
import { HttpRequestForm } from "../../workflow-form-editor/forms/http-request-form";
import { ModelEngineForm } from "../../workflow-form-editor/forms/model-engine-form";
import { NotificationForm } from "../../workflow-form-editor/forms/notification-form";
import { ParallelForm } from "../../workflow-form-editor/forms/parallel-form";
import { RetryForm } from "../../workflow-form-editor/forms/retry-form";
import { SetVariableForm } from "../../workflow-form-editor/forms/set-variable-form";
import {
	OutputPreview,
	OutputTransformSection,
	outputVarHint,
} from "../../workflow-form-editor/forms/shared";
import { StorageEngineForm } from "../../workflow-form-editor/forms/storage-engine-form";
import { SubWorkflowStepForm } from "../../workflow-form-editor/forms/sub-workflow-form";
import { SwitchForm } from "../../workflow-form-editor/forms/switch-form";
import { TransformStepForm } from "../../workflow-form-editor/forms/transform-form";
import { TriggerForm } from "../../workflow-form-editor/forms/trigger-form";
import { TryCatchForm } from "../../workflow-form-editor/forms/try-catch-form";
import { VectorEngineForm } from "../../workflow-form-editor/forms/vector-engine-form";
import { WaitForm } from "../../workflow-form-editor/forms/wait-form";
import { WhileLoopForm } from "../../workflow-form-editor/forms/while-loop-form";
import {
	applyOutputTransform,
	buildPixelPreview,
	extractVarRefs,
	isNodeReady,
	substituteVars,
	TRANSFORM_ENABLED,
} from "../workflow-utils";
import { useWorkflowWorkspaceContext } from "../workflow-workspace-context";

/** Nodes where outputVar is hidden — they don't produce a meaningful downstream value. */
const NO_OUTPUT_VAR_TYPES = new Set(["trigger", "wait", "set-variable"]);

/**
 * Nodes that cannot be tested in isolation — either they run directly in the
 * workflow engine (no pixel reactor) or they are container/flow-control nodes
 * that execute sub-graphs only as part of a full run.
 *
 * Testable via pixel: database-engine, model-engine, vector-engine,
 * storage-engine, function-engine, custom-pixel, email, sub-workflow.
 */
const NO_PIXEL_TEST_TYPES = new Set([
	"http-request",
	"notification",
	"for-each",
	"while-loop",
	"try-catch",
	"conditional",
	"switch",
	"retry",
	"parallel",
	"wait",
	"set-variable",
	"transform",
]);

// ─── main settings panel ──────────────────────────────────────────────────────

interface NodeSettingsPanelProps {
	node: WorkflowNode;
	appId: string;
	upstreamVars: string[];
	knownVarNames?: string[];
	enginesByType: Record<string, EngineOption[]>;
	projects: ProjectOption[];
	onUpdate: (updated: WorkflowNode) => void;
	onClose: () => void;
}

export function NodeSettingsPanel({
	node,
	appId,
	upstreamVars,
	knownVarNames = [],
	enginesByType,
	projects,
	onUpdate,
	onClose,
}: NodeSettingsPanelProps) {
	const { monolithStore } = useRootStore();
	const { testOutputs, setTestOutput, testScope } =
		useWorkflowWorkspaceContext();

	const handleScheduleActivate = useCallback(
		async (
			cron: string,
			timezone: string,
			recipe: string,
		): Promise<string | null> => {
			const jobName = `wf_${appId}_${Date.now()}`;
			const pixel = `ScheduleJob(jobGroup=["WORKFLOW_TRIGGERS"], jobName=["${jobName}"], cronExpression=["${cron}"], recipe=["${recipe.replace(/"/g, '\\"')}"], frequency=["cron"], timeZone=["${timezone}"]);`;
			try {
				const result = await monolithStore.runQuery(pixel);
				// ScheduleJob returns the Quartz UUID under "-jobId" (JobConfigKeys.JOB_ID has a dash prefix)
				const output = result.pixelReturn?.[0]?.output as
					| Record<string, unknown>
					| undefined;
				return (output?.["-jobId"] as string) ?? jobName;
			} catch {
				return null;
			}
		},
		[appId, monolithStore],
	);

	const handleScheduleDeactivate = useCallback(
		async (jobId: string): Promise<void> => {
			// RemoveJobFromDB requires both jobId AND jobGroup or the size-check throws
			const pixel = `RemoveJobFromDB(jobId=["${jobId}"], jobGroup=["WORKFLOW_TRIGGERS"]);`;
			try {
				await monolithStore.runQuery(pixel);
			} catch {
				// best-effort
			}
		},
		[monolithStore],
	);

	const handleGenerateWebhookSecret = useCallback(async (): Promise<
		string | null
	> => {
		const pixel = `GenerateWorkflowWebhookSecret(project=["${appId}"]);`;
		try {
			const result = await monolithStore.runQuery(pixel);
			return (result.pixelReturn?.[0]?.output?.secret as string) ?? null;
		} catch {
			return null;
		}
	}, [appId, monolithStore]);
	const testOutput = testOutputs[node.id] ?? null;
	const [testing, setTesting] = useState(false);
	const [testPixel, setTestPixel] = useState(() => buildPixelPreview(node));
	const [showAdvanced, setShowAdvanced] = useState(false);
	const outputRef = useRef<HTMLDivElement>(null);

	// Sync pixel preview whenever node config changes.
	useEffect(() => {
		setTestPixel(buildPixelPreview(node));
	}, [node]);

	useEffect(() => {
		if (testOutput !== null) {
			outputRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}
	}, [testOutput]);

	const pixelPreview = buildPixelPreview(node);

	// Vars referenced in the current pixel expression
	const varRefs = useMemo(() => extractVarRefs(testPixel), [testPixel]);

	const runTest = async () => {
		if (!testPixel.trim() || !isNodeReady(node)) return;
		setTesting(true);
		setTestOutput(node.id, null);
		try {
			const resolvedPixel = substituteVars(testPixel, testScope);
			const result = await monolithStore.runQuery(resolvedPixel);
			const output = result.pixelReturn?.[0]?.output;
			const raw = JSON.stringify(output, null, 2);
			const transformed = applyOutputTransform(raw, node.outputTransform);
			setTestOutput(node.id, transformed);
		} catch (err) {
			setTestOutput(node.id, `Error: ${(err as Error).message}`);
		} finally {
			setTesting(false);
		}
	};

	const update = useCallback(
		(config: NodeConfig) => onUpdate({ ...node, config }),
		[node, onUpdate],
	);

	const updateLabel = (label: string) => onUpdate({ ...node, label });
	const updateOutputVar = (outputVar: string) =>
		onUpdate({ ...node, outputVar });

	return (
		<div className="flex h-full flex-col overflow-hidden border-l bg-background">
			{/* header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<h3 className="font-semibold text-sm">Node Settings</h3>
				<Button variant="ghost" size="icon-sm" onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="flex-1 overflow-y-auto px-4 py-4">
				{/* common fields */}
				<div className="mb-4 flex flex-col gap-3">
					<Field>
						<FieldLabel>Label</FieldLabel>
						<Input
							value={node.label}
							onChange={(e) => updateLabel(e.target.value)}
						/>
					</Field>
					{!NO_OUTPUT_VAR_TYPES.has(node.type) && (
						<Field>
							<div className="flex items-center gap-1">
								<FieldLabel>Output Variable Name</FieldLabel>
								{outputVarHint(node.type) && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Info className="h-3 w-3 text-muted-foreground" />
										</TooltipTrigger>
										<TooltipContent
											side="right"
											className="max-w-60 text-xs"
										>
											{outputVarHint(node.type)}
										</TooltipContent>
									</Tooltip>
								)}
							</div>
							<Input
								value={node.outputVar}
								onChange={(e) =>
									updateOutputVar(e.target.value)
								}
								className="font-mono text-sm"
								placeholder="my_output"
							/>
							<p className="mt-1 text-muted-foreground text-xs">
								Downstream nodes reference this as{" "}
								<code className="rounded bg-muted px-1">
									{`\${${node.outputVar}}`}
								</code>
							</p>
						</Field>
					)}
				</div>

				<Separator className="mb-4" />

				{/* per-type form */}
				{node.type === "trigger" && (
					<TriggerForm
						config={node.config as TriggerConfig}
						appId={appId}
						engines={enginesByType}
						onChange={update}
						onScheduleActivate={handleScheduleActivate}
						onScheduleDeactivate={handleScheduleDeactivate}
						onGenerateWebhookSecret={handleGenerateWebhookSecret}
					/>
				)}
				{node.type === "database-engine" && (
					<DatabaseEngineForm
						config={node.config as DatabaseEngineConfig}
						engines={enginesByType.DATABASE ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "storage-engine" && (
					<StorageEngineForm
						config={node.config as StorageEngineConfig}
						engines={enginesByType.STORAGE ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "vector-engine" && (
					<VectorEngineForm
						config={node.config as VectorEngineConfig}
						engines={enginesByType.VECTOR ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "model-engine" && (
					<ModelEngineForm
						config={node.config as ModelEngineConfig}
						engines={enginesByType.MODEL ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "function-engine" && (
					<FunctionEngineForm
						config={node.config as FunctionEngineConfig}
						engines={enginesByType.FUNCTION ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "custom-pixel" && (
					<CustomPixelForm
						config={node.config as CustomPixelConfig}
						projects={projects}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "sub-workflow" && (
					<SubWorkflowStepForm
						step={node}
						projects={projects}
						upstreamVars={upstreamVars}
						onUpdate={onUpdate}
					/>
				)}
				{node.type === "for-each" && (
					<ForEachForm
						config={node.config as ForEachConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "conditional" && (
					<ConditionalStepForm
						step={node}
						enginesByType={enginesByType}
						projects={projects}
						upstreamVars={upstreamVars}
						onUpdate={onUpdate}
					/>
				)}
				{node.type === "while-loop" && (
					<WhileLoopForm
						config={node.config as WhileLoopConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "try-catch" && (
					<TryCatchForm
						config={node.config as TryCatchConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "wait" && (
					<WaitForm
						config={node.config as WaitConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "set-variable" && (
					<SetVariableForm
						config={node.config as SetVariableConfig}
						upstreamVars={upstreamVars}
						knownVarNames={knownVarNames}
						onChange={update}
					/>
				)}
				{node.type === "email" && (
					<EmailForm
						config={node.config as EmailConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "http-request" && (
					<HttpRequestForm
						config={node.config as HttpRequestConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "notification" && (
					<NotificationForm
						config={node.config as NotificationConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "switch" && (
					<SwitchForm
						config={node.config as SwitchConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "retry" && (
					<RetryForm
						config={node.config as RetryConfig}
						onChange={update}
					/>
				)}
				{node.type === "parallel" && (
					<ParallelForm
						config={node.config as ParallelConfig}
						onChange={update}
					/>
				)}
				{node.type === "transform" && (
					<TransformStepForm
						step={node}
						upstreamVars={upstreamVars}
						onUpdate={onUpdate}
					/>
				)}

				{/* Output transform — per-node reshaping for data-producing nodes */}
				{TRANSFORM_ENABLED.has(node.type) && (
					<>
						<Separator className="my-2" />
						<OutputTransformSection
							node={node}
							onUpdate={onUpdate}
						/>
					</>
				)}

				{node.type !== "trigger" && (
					<>
						<Separator className="my-4" />
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<span className="font-medium text-sm">
									Test Node
								</span>
								{!NO_PIXEL_TEST_TYPES.has(node.type) && (
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() =>
												setShowAdvanced((v) => !v)
											}
											className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
											title="Show pixel expression"
										>
											<ChevronDown
												className={`h-3 w-3 transition-transform duration-150 ${showAdvanced ? "" : "-rotate-90"}`}
											/>
											pixel
										</button>
										<Button
											size="sm"
											variant="outline"
											onClick={runTest}
											disabled={
												testing || !isNodeReady(node)
											}
										>
											{testing ? (
												<Loader2 className="mr-1 h-3 w-3 animate-spin" />
											) : (
												<Play className="mr-1 h-3 w-3" />
											)}
											Run
										</Button>
									</div>
								)}
							</div>

							{NO_PIXEL_TEST_TYPES.has(node.type) ? (
								<p className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
									This node runs directly in the workflow
									engine and cannot be tested in isolation.
									Use <strong>Run Now</strong> in the History
									tab to test it as part of the full workflow.
								</p>
							) : (
								<>
									{/* var scope chips — show which ${vars} are resolved vs. missing */}
									{varRefs.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{varRefs.map((v) => {
												const resolved = v in testScope;
												return (
													<span
														key={v}
														title={
															resolved
																? `= ${String(testScope[v]).slice(0, 120)}`
																: "Not in scope — test the upstream node first"
														}
														className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
															resolved
																? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
																: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
														}`}
													>
														{resolved ? (
															<Check className="h-2.5 w-2.5" />
														) : (
															<span className="font-bold">
																?
															</span>
														)}
														{`\${${v}}`}
													</span>
												);
											})}
										</div>
									)}

									{showAdvanced && (
										<div className="relative">
											<Textarea
												value={testPixel}
												onChange={(e) =>
													setTestPixel(e.target.value)
												}
												className="font-mono text-[11px] leading-relaxed"
												rows={4}
												placeholder="Pixel expression to test…"
											/>
											<button
												type="button"
												className="absolute top-1 right-1 rounded px-1 py-0.5 text-[9px] text-muted-foreground hover:bg-muted"
												onClick={() =>
													setTestPixel(pixelPreview)
												}
												title="Reset to node pixel"
											>
												reset
											</button>
										</div>
									)}
									{testOutput !== null && (
										<div
											ref={outputRef}
											className="rounded-md border bg-muted/50 p-2"
										>
											<div className="mb-1.5 flex items-center justify-between">
												<span className="text-[10px] text-muted-foreground">
													Output
												</span>
												<button
													type="button"
													onClick={() =>
														setTestOutput(
															node.id,
															null,
														)
													}
													className="text-[10px] text-muted-foreground hover:text-foreground"
													title="Clear output (removes it from test scope — other nodes can no longer reference this var)"
												>
													<X className="h-3 w-3" />
												</button>
											</div>
											<OutputPreview value={testOutput} />
										</div>
									)}
								</>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
