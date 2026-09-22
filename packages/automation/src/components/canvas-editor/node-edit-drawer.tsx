import {
	ChevronDown,
	Code2,
	ExternalLink,
	HelpCircle,
	Lock,
	Trash2,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useTheme,
} from "@semoss/ui/next";
import type {
	AutomationNode,
	AutomationNodeTrace,
	StepRunStatus,
} from "../../domain/automation.types";
import { getDisplayMeta } from "../../domain/automation-display";
import {
	getGeneratedPythonPreview,
	getWorkflowNodeDefinition,
	validateAutomationOutputVariable,
} from "../../domain/automation-workflow-adapter";
import { OutputPreview } from "../form-editor/output-preview";
import { TraceDetail } from "../form-editor/trace-detail";
import { StepForm } from "./step-form";

/** Values the runtime seeds into every run's scope, regardless of the graph. */
const RUN_SCOPE_VARIABLES = ["date", "triggered_at", "run_id"];

export interface NodeEditDrawerProps {
	step: AutomationNode;
	appId: string;
	upstreamVars: string[];
	runStatus?: StepRunStatus;
	runError?: string;
	runOutput?: string | null;
	runTrace?: AutomationNodeTrace;
	devMode?: boolean;
	onUpdate: (step: AutomationNode) => void;
	onDelete: () => void;
	/** Pops the raw Python source out into a larger editor, for a host rendering this drawer
	 * alongside the canvas instead of in a separate iframe. */
	onOpenPythonEditor?: (nodeId: string, source: string) => void;
	/** When true, this node's compiled Python source is open in a real file editor tab —
	 * the inline editor is locked so the two copies can't diverge. */
	pythonFileOpen?: boolean;
	/** When true, renders the node's configuration as view-only: mutating fields, the
	 * delete action, and raw Python editing (inline and the popout modal) are all disabled. */
	readOnly?: boolean;
}

interface PendingPythonUpdate {
	source: string;
	step: AutomationNode;
}

function supportsBusinessForm(step: AutomationNode): boolean {
	if (!step.workflowType) return false;
	const category = getWorkflowNodeDefinition(step.workflowType)?.category;
	return (
		category !== undefined &&
		category !== "trigger" &&
		category !== "developer"
	);
}

export function NodeEditDrawer({
	step,
	appId,
	upstreamVars,
	runStatus,
	runError,
	runOutput,
	runTrace,
	devMode = false,
	onUpdate,
	onDelete,
	onOpenPythonEditor,
	pythonFileOpen = false,
	readOnly = false,
}: NodeEditDrawerProps) {
	const [outputExpanded, setOutputExpanded] = useState(false);
	const [editorMode, setEditorMode] = useState<"form" | "python">("form");
	const meta = getDisplayMeta(step.type);
	const workflowDefinition = step.workflowType
		? getWorkflowNodeDefinition(step.workflowType)
		: undefined;
	const isCustomSource = step.workflowCodeMode === "custom";
	const isDeveloperPython = step.workflowType === "developer.python";
	const isDecisionBranch = step.workflowType === "control.if";
	const hasOutputVariable =
		step.workflowType !== "trigger.start" && !isDecisionBranch;
	const outputVariableError = hasOutputVariable
		? validateAutomationOutputVariable(step.outputVar)
		: null;
	const showPythonEditor =
		isDeveloperPython ||
		(!isDecisionBranch && devMode && editorMode === "python");
	const canRevertToGenerated =
		isCustomSource && workflowDefinition?.defaultCodeMode === "generated";
	const persistedPythonSource =
		typeof step.workflowConfig?.pythonSource === "string"
			? step.workflowConfig.pythonSource
			: "";
	// A Python node starts in custom mode with no source, so seed the editor with the
	// runnable scaffold rather than a blank buffer: the runtime requires a top-level
	// run(scope) and the save validator rejects source without one.
	const pythonSource =
		persistedPythonSource ||
		(isCustomSource && !isDeveloperPython
			? ""
			: getGeneratedPythonPreview(step));
	// Historical runs carry the executed graph shape but not saved node sources, so a
	// custom-code node has nothing to show — hide the editor instead of rendering it empty.
	const pythonSourceUnavailable =
		readOnly && isCustomSource && !persistedPythonSource;
	const [pythonDraft, setPythonDraft] = useState(pythonSource);
	const pythonUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const pendingPythonUpdateRef = useRef<PendingPythonUpdate | null>(null);
	const activePythonStepIdRef = useRef(step.id);
	const onUpdateRef = useRef(onUpdate);
	// Newest version of each node the drawer has rendered. The pending edit records which
	// node it belongs to, and the flush merges onto that node's current state rather than
	// the snapshot taken when typing started, so a label or output-variable change made
	// inside the debounce window is not written back stale.
	const latestStepsRef = useRef(new Map<string, AutomationNode>());
	const { resolvedTheme } = useTheme();
	const [showPythonVariablePicker, setShowPythonVariablePicker] =
		useState(false);
	// Position (relative to the lock overlay) of the "can't edit" tooltip, so it
	// follows the cursor instead of sitting fixed at one corner.
	const [pythonLockPointer, setPythonLockPointer] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const Icon = meta.icon;
	useEffect(() => {
		onUpdateRef.current = onUpdate;
	}, [onUpdate]);
	useEffect(() => {
		latestStepsRef.current.set(step.id, step);
	}, [step]);
	const flushPythonUpdate = useCallback(() => {
		if (pythonUpdateTimeoutRef.current) {
			clearTimeout(pythonUpdateTimeoutRef.current);
			pythonUpdateTimeoutRef.current = null;
		}
		const pendingUpdate = pendingPythonUpdateRef.current;
		if (!pendingUpdate) return;
		pendingPythonUpdateRef.current = null;
		const target =
			latestStepsRef.current.get(pendingUpdate.step.id) ??
			pendingUpdate.step;
		onUpdateRef.current({
			...target,
			workflowCodeMode: "custom",
			workflowConfig: {
				...target.workflowConfig,
				pythonSource: pendingUpdate.source,
			},
		});
	}, []);
	useEffect(() => {
		if (activePythonStepIdRef.current !== step.id) {
			flushPythonUpdate();
			activePythonStepIdRef.current = step.id;
			setPythonDraft(pythonSource);
			return;
		}
		if (!pendingPythonUpdateRef.current) {
			setPythonDraft(pythonSource);
		}
	}, [flushPythonUpdate, pythonSource, step.id]);
	useEffect(() => () => flushPythonUpdate(), [flushPythonUpdate]);
	const updatePythonSource = (source: string) => {
		if (readOnly || pythonFileOpen) return;
		setPythonDraft(source);
		pendingPythonUpdateRef.current = { source, step };
		if (pythonUpdateTimeoutRef.current) {
			clearTimeout(pythonUpdateTimeoutRef.current);
		}
		pythonUpdateTimeoutRef.current = setTimeout(flushPythonUpdate, 300);
	};
	// Custom source reads upstream values off the scope mapping. A ${...} reference is only
	// resolved for generated nodes, and is not valid Python syntax on its own.
	const insertPythonVariable = (variable: string) => {
		const separator =
			pythonDraft.length === 0 || pythonDraft.endsWith("\n") ? "" : "\n";
		updatePythonSource(
			`${pythonDraft}${separator}scope[${JSON.stringify(variable)}]`,
		);
	};
	const pythonVariablePicker = (
		<div className="relative">
			<Button
				size="sm"
				variant="ghost"
				className="h-6 gap-0.5 px-1.5 text-[10px] text-primary"
				onClick={() => setShowPythonVariablePicker((isOpen) => !isOpen)}
			>
				+ Variable
				<ChevronDown className="size-3" />
			</Button>
			{showPythonVariablePicker && (
				<div className="absolute top-full right-0 z-50 mt-1 min-w-45 rounded-md border bg-popover py-1 shadow-md">
					{[...upstreamVars, ...RUN_SCOPE_VARIABLES].map(
						(variable) => (
							<button
								key={variable}
								type="button"
								onMouseDown={(event) => {
									event.preventDefault();
									insertPythonVariable(variable);
									setShowPythonVariablePicker(false);
								}}
								className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground"
							>
								<span className="text-[10px] text-muted-foreground">
									scope
								</span>
								{variable}
							</button>
						),
					)}
				</div>
			)}
		</div>
	);
	const openPythonModal = () => {
		if (readOnly) return;
		flushPythonUpdate();
		onOpenPythonEditor?.(step.id, pythonDraft);
	};

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<span
						className={`flex h-7 w-7 items-center justify-center rounded-lg bg-muted ${meta.color}`}
					>
						<Icon className="h-3.5 w-3.5" />
					</span>
					<span className="font-semibold text-sm">
						{workflowDefinition?.label ?? meta.label}
					</span>
					{readOnly && (
						<span className="flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
							<Lock className="size-3" />
							View only
						</span>
					)}
				</div>
				{!readOnly && (
					<Button
						size="sm"
						variant="ghost"
						className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive"
						onClick={onDelete}
						aria-label="Delete step"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				)}
			</div>

			<div className="flex-1 overflow-y-auto px-4 py-4">
				<div className="space-y-4">
					{runStatus === "success" && runOutput && (
						<div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
							<p className="mb-1 font-medium text-[10px] text-emerald-700 uppercase tracking-wide dark:text-emerald-400">
								Last run output
							</p>
							<OutputPreview
								value={runOutput}
								expanded={outputExpanded}
								onToggle={() =>
									setOutputExpanded((value) => !value)
								}
								nodeType={step.type}
							/>
						</div>
					)}

					{runStatus === "error" && runError && (
						<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
							<p className="mb-1 font-medium text-[10px] text-destructive uppercase tracking-wide">
								Step failed
							</p>
							<pre className="max-h-20 overflow-y-auto whitespace-pre-wrap break-all font-sans text-[11px] text-destructive/80">
								{runError}
							</pre>
						</div>
					)}
					{runTrace && <TraceDetail trace={runTrace} step={step} />}

					<Field>
						<FieldLabel className="text-xs">Label</FieldLabel>
						<Input
							className="h-9 text-sm"
							value={step.label}
							onChange={(event) => {
								if (readOnly) return;
								onUpdate({
									...step,
									label: event.target.value,
								});
							}}
							placeholder="Step label"
							readOnly={readOnly}
						/>
					</Field>

					{hasOutputVariable && (
						<Field>
							<FieldLabel className="text-xs">
								Output variable
							</FieldLabel>
							<Input
								className="h-9 font-mono text-sm"
								value={step.outputVar}
								onChange={(event) => {
									if (readOnly) return;
									onUpdate({
										...step,
										outputVar: event.target.value,
									});
								}}
								placeholder="step_output"
								readOnly={readOnly}
								aria-invalid={Boolean(outputVariableError)}
							/>
							<p
								className={`text-[11px] ${outputVariableError ? "text-destructive" : "text-muted-foreground"}`}
							>
								{outputVariableError ??
									`Later steps can use \${${step.outputVar}}.`}
							</p>
						</Field>
					)}

					<div className="space-y-3 border-t pt-4">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="font-medium text-sm">
									{showPythonEditor
										? "Python source"
										: "Configuration"}
								</p>
								<p className="text-[11px] text-muted-foreground">
									{pythonSourceUnavailable
										? "Not available for historical runs."
										: isDecisionBranch
											? "This decision evaluates its conditions in order and uses the first matching path."
											: isDeveloperPython
												? "This node runs its custom Python source."
												: isCustomSource
													? "This node uses custom Python."
													: "Use the form or inspect the generated Python."}
								</p>
							</div>
							{!isDeveloperPython &&
								!isDecisionBranch &&
								devMode && (
									<div className="flex rounded-md border bg-muted/40 p-0.5">
										<button
											type="button"
											aria-pressed={editorMode === "form"}
											onClick={() =>
												setEditorMode("form")
											}
											className={`rounded px-2.5 py-1 font-medium text-[11px] transition-colors ${editorMode === "form" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
										>
											Form
										</button>
										<button
											type="button"
											aria-pressed={
												editorMode === "python"
											}
											onClick={() =>
												setEditorMode("python")
											}
											className={`rounded px-2.5 py-1 font-medium text-[11px] transition-colors ${editorMode === "python" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
										>
											Python
										</button>
									</div>
								)}
						</div>

						{!isDeveloperPython &&
							editorMode === "form" &&
							(isCustomSource && !isDecisionBranch ? (
								<div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
									<p className="font-medium text-xs">
										Custom Python is active
									</p>
									<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
										The form is unavailable because this
										node&apos;s custom source controls its
										behavior.
									</p>
									{devMode &&
									canRevertToGenerated &&
									!readOnly ? (
										<Button
											size="sm"
											variant="outline"
											className="mt-3 h-7 text-[11px]"
											onClick={() => {
												const {
													pythonSource: _pythonSource,
													...workflowConfig
												} = step.workflowConfig ?? {};
												onUpdate({
													...step,
													workflowCodeMode:
														"generated",
													workflowConfig,
												});
											}}
										>
											Revert to generated default
										</Button>
									) : devMode ? (
										<Button
											size="sm"
											variant="outline"
											className="mt-3 h-7 text-[11px]"
											onClick={() =>
												setEditorMode("python")
											}
										>
											View Python source
										</Button>
									) : (
										<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
											Switch to Dev mode to view or edit
											the custom Python source.
										</p>
									)}
								</div>
							) : supportsBusinessForm(step) ? (
								// Keyed by node so the form remounts when the drawer
								// switches nodes. The engine forms seed local state
								// from config in useState initializers, which only
								// run on mount.
								<StepForm
									key={step.id}
									step={step}
									upstreamVars={upstreamVars}
									onUpdate={onUpdate}
									devMode={devMode}
									appId={appId}
									readOnly={readOnly}
								/>
							) : (
								<p className="rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
									This node is configured in Python.
								</p>
							))}

						{showPythonEditor && pythonSourceUnavailable && (
							<p className="rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
								Python source isn&apos;t available for this
								historical run.
							</p>
						)}

						{showPythonEditor && !pythonSourceUnavailable && (
							<Field>
								<div>
									<div className="flex items-center justify-between">
										<FieldLabel className="flex items-center gap-1.5 text-xs">
											<Code2 className="h-3.5 w-3.5 text-primary" />
											Python source
											<Tooltip>
												<TooltipTrigger asChild>
													<HelpCircle
														className="size-3 text-muted-foreground"
														aria-label="How scope works"
													/>
												</TooltipTrigger>
												<TooltipContent
													side="right"
													className="max-w-80"
												>
													<p className="font-medium">
														run(scope)
													</p>
													<p className="mt-1">
														scope is a read-only
														dict of this run&apos;s
														values: date,
														triggered_at, run_id,
														the trigger inputs, and
														each earlier step&apos;s
														output under its output
														variable.
													</p>
													<p className="mt-1">
														Read with
														scope[&quot;name&quot;]
														or
														scope.get(&quot;name&quot;).
														Assigning to scope
														raises; return a
														JSON-shaped value to
														pass data on.
													</p>
												</TooltipContent>
											</Tooltip>
										</FieldLabel>
										{!readOnly &&
											!pythonFileOpen &&
											pythonVariablePicker}
										{!readOnly && (
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														type="button"
														size="icon-sm"
														variant="ghost"
														className="size-6"
														onClick={
															openPythonModal
														}
														aria-label="Open bigger Python editor"
													>
														<ExternalLink className="size-3.5" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Open Editor
												</TooltipContent>
											</Tooltip>
										)}
									</div>
								</div>
								<div className="relative h-75 overflow-hidden rounded-lg border bg-muted/30">
									<div
										className={
											pythonFileOpen
												? "h-full opacity-50"
												: "h-full"
										}
									>
										<Suspense
											fallback={
												<pre className="h-full overflow-auto p-3 font-mono text-xs">
													{pythonDraft}
												</pre>
											}
										>
											<MonacoEditor
												height="100%"
												width="100%"
												language="python"
												theme={
													resolvedTheme === "dark"
														? "vs-dark"
														: "vs"
												}
												value={pythonDraft}
												onChange={(value) =>
													updatePythonSource(
														value ?? "",
													)
												}
												options={{
													automaticLayout: true,
													fontSize: 13,
													lineNumbers: "on",
													minimap: { enabled: false },
													folding: true,
													scrollBeyondLastLine: false,
													wordWrap: "on",
													readOnly:
														readOnly ||
														pythonFileOpen,
													padding: {
														top: 12,
														bottom: 12,
													},
												}}
											/>
										</Suspense>
									</div>
									{pythonFileOpen && (
										<div
											role="note"
											className="absolute inset-0 z-20 cursor-not-allowed"
											aria-label="Can't edit here while the file is open"
											onMouseMove={(event) =>
												setPythonLockPointer({
													x: event.clientX,
													y: event.clientY,
												})
											}
											onMouseLeave={() =>
												setPythonLockPointer(null)
											}
										>
											{pythonLockPointer &&
												createPortal(
													// Portalled to <body> — position: fixed only
													// resolves against the viewport when every
													// ancestor is untransformed, and this panel sits
													// inside dock/dialog wrappers that aren't
													// guaranteed to be, which threw the tooltip out
													// of alignment with the actual cursor.
													<div
														className="pointer-events-none fixed z-9999 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-popover-foreground text-xs shadow-md"
														style={{
															left:
																pythonLockPointer.x +
																12,
															top:
																pythonLockPointer.y +
																12,
														}}
													>
														Can&apos;t edit here
														while the file is open
													</div>,
													document.body,
												)}
										</div>
									)}
								</div>
								<p className="text-muted-foreground text-xs">
									{pythonFileOpen
										? "Can't edit here while the file is open."
										: readOnly
											? "View only."
											: isDecisionBranch
												? "Decision branches use generated code."
												: isCustomSource
													? "This custom source is saved with the node."
													: "Editing generated source creates a custom node."}
								</p>
							</Field>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
