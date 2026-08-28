import { ChevronDown, Code2, ExternalLink, Trash2 } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useTheme,
} from "@semoss/ui/next";
import type {
	AutomationNode,
	StepRunStatus,
} from "../../domain/automation.types";
import { getDisplayMeta } from "../../domain/automation-display";
import {
	getGeneratedPythonPreview,
	getWorkflowNodeDefinition,
} from "../../domain/automation-workflow-adapter";
import { OutputPreview } from "../form-editor/output-preview";
import { StepForm } from "./step-form";

export interface NodeEditDrawerProps {
	step: AutomationNode;
	appId: string;
	upstreamVars: string[];
	runStatus?: StepRunStatus;
	runError?: string;
	runOutput?: string | null;
	devMode?: boolean;
	onUpdate: (step: AutomationNode) => void;
	onDelete: () => void;
}

interface PendingPythonUpdate {
	source: string;
	step: AutomationNode;
}

function supportsBusinessForm(step: AutomationNode): boolean {
	const type = step.workflowType;
	return Boolean(
		type &&
			(type.startsWith("database.") ||
				type.startsWith("model.") ||
				type.startsWith("storage.") ||
				type.startsWith("vector.") ||
				type === "function.execute" ||
				type === "agent.run" ||
				type === "app.pixel" ||
				type === "control.wait" ||
				type === "control.if"),
	);
}

export function NodeEditDrawer({
	step,
	appId,
	upstreamVars,
	runStatus,
	runError,
	runOutput,
	devMode = false,
	onUpdate,
	onDelete,
}: NodeEditDrawerProps) {
	const [outputExpanded, setOutputExpanded] = useState(false);
	const [editorMode, setEditorMode] = useState<"form" | "python">("form");
	const meta = getDisplayMeta(step.type);
	const workflowDefinition = step.workflowType
		? getWorkflowNodeDefinition(step.workflowType)
		: undefined;
	const isCustomSource = step.workflowCodeMode === "custom";
	const isDeveloperPython = step.workflowType === "developer.python";
	const canRevertToGenerated =
		isCustomSource && workflowDefinition?.defaultCodeMode === "generated";
	const persistedPythonSource =
		typeof step.workflowConfig?.pythonSource === "string"
			? step.workflowConfig.pythonSource
			: "";
	const pythonSource =
		persistedPythonSource ||
		(isCustomSource ? "" : getGeneratedPythonPreview(step));
	const [pythonDraft, setPythonDraft] = useState(pythonSource);
	const pythonUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const pendingPythonUpdateRef = useRef<PendingPythonUpdate | null>(null);
	const activePythonStepIdRef = useRef(step.id);
	const onUpdateRef = useRef(onUpdate);
	const { resolvedTheme } = useTheme();
	const [showPythonVariablePicker, setShowPythonVariablePicker] =
		useState(false);
	const Icon = meta.icon;
	useEffect(() => {
		onUpdateRef.current = onUpdate;
	}, [onUpdate]);
	const flushPythonUpdate = useCallback(() => {
		if (pythonUpdateTimeoutRef.current) {
			clearTimeout(pythonUpdateTimeoutRef.current);
			pythonUpdateTimeoutRef.current = null;
		}
		const pendingUpdate = pendingPythonUpdateRef.current;
		if (!pendingUpdate) return;
		pendingPythonUpdateRef.current = null;
		onUpdateRef.current({
			...pendingUpdate.step,
			workflowCodeMode: "custom",
			workflowConfig: {
				...pendingUpdate.step.workflowConfig,
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
		setPythonDraft(source);
		pendingPythonUpdateRef.current = { source, step };
		if (pythonUpdateTimeoutRef.current) {
			clearTimeout(pythonUpdateTimeoutRef.current);
		}
		pythonUpdateTimeoutRef.current = setTimeout(flushPythonUpdate, 300);
	};
	const insertPythonVariable = (variable: string) => {
		const separator =
			pythonDraft.length === 0 || pythonDraft.endsWith("\n") ? "" : "\n";
		updatePythonSource(`${pythonDraft}${separator}\${${variable}}`);
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
				<div className="absolute top-full right-0 z-50 mt-1 min-w-[180px] rounded-md border bg-popover py-1 shadow-md">
					{upstreamVars.map((variable) => (
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
								{"${}"}
							</span>
							{variable}
						</button>
					))}
				</div>
			)}
		</div>
	);
	const openPythonModal = () => {
		flushPythonUpdate();
		const parentOrigin = new URLSearchParams(window.location.search).get(
			"parentOrigin",
		);
		if (!parentOrigin || window.parent === window) return;
		window.parent.postMessage(
			{
				type: "SEMOSS_AUTOMATION_OPEN_PYTHON_EDITOR",
				projectId: appId,
				nodeId: step.id,
				source: pythonDraft,
			},
			parentOrigin,
		);
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
				</div>
				<Button
					size="sm"
					variant="ghost"
					className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive"
					onClick={onDelete}
					aria-label="Delete step"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</Button>
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
							<pre className="max-h-[80px] overflow-y-auto whitespace-pre-wrap break-all font-sans text-[11px] text-destructive/80">
								{runError}
							</pre>
						</div>
					)}

					<Field>
						<FieldLabel className="text-xs">Label</FieldLabel>
						<Input
							className="h-9 text-sm"
							value={step.label}
							onChange={(event) =>
								onUpdate({
									...step,
									label: event.target.value,
								})
							}
							placeholder="Step label"
						/>
					</Field>

					{typeof step.branchCondition === "string" && (
						<Field>
							<FieldLabel className="text-xs">
								Branch condition
							</FieldLabel>
							<Textarea
								className="resize-none font-mono text-xs"
								rows={2}
								value={step.branchCondition}
								onChange={(event) =>
									onUpdate({
										...step,
										branchCondition: event.target.value,
									})
								}
								placeholder='e.g. ${model_chat_1} == "yes"'
							/>
							<p className="mt-1 text-[10px] text-muted-foreground">
								Condition expression. When true the{" "}
								<strong>Then</strong> path runs, otherwise{" "}
								<strong>Else</strong>.
							</p>
						</Field>
					)}

					<div className="space-y-3 border-t pt-4">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="font-medium text-sm">
									{isDeveloperPython
										? "Python source"
										: "Configuration"}
								</p>
								<p className="text-[11px] text-muted-foreground">
									{isDeveloperPython
										? "This node runs its custom Python source."
										: isCustomSource
											? "This node uses custom Python."
											: "Use the form or inspect the generated Python."}
								</p>
							</div>
							{!isDeveloperPython && (
								<div className="flex rounded-md border bg-muted/40 p-0.5">
									<button
										type="button"
										aria-pressed={editorMode === "form"}
										onClick={() => setEditorMode("form")}
										className={`rounded px-2.5 py-1 font-medium text-[11px] transition-colors ${editorMode === "form" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
									>
										Form
									</button>
									<button
										type="button"
										aria-pressed={editorMode === "python"}
										onClick={() => setEditorMode("python")}
										className={`rounded px-2.5 py-1 font-medium text-[11px] transition-colors ${editorMode === "python" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
									>
										Python
									</button>
								</div>
							)}
						</div>

						{!isDeveloperPython &&
							editorMode === "form" &&
							(isCustomSource ? (
								<div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
									<p className="font-medium text-xs">
										Custom Python is active
									</p>
									<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
										The form is unavailable because this
										node&apos;s custom source controls its
										behavior.
									</p>
									{canRevertToGenerated ? (
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
									) : (
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
									)}
								</div>
							) : supportsBusinessForm(step) ? (
								<StepForm
									step={step}
									upstreamVars={upstreamVars}
									onUpdate={onUpdate}
									devMode={devMode}
									appId={appId}
								/>
							) : (
								<p className="rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
									This node is configured in Python.
								</p>
							))}

						{(isDeveloperPython || editorMode === "python") && (
							<Field>
								<div>
									<div className="flex items-center justify-between">
										<FieldLabel className="flex items-center gap-1.5 text-xs">
											<Code2 className="h-3.5 w-3.5 text-primary" />
											Python source
										</FieldLabel>
										{upstreamVars.length > 0 &&
											pythonVariablePicker}
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													type="button"
													size="icon-sm"
													variant="ghost"
													className="size-6"
													onClick={openPythonModal}
													aria-label="Open bigger Python editor"
												>
													<ExternalLink className="size-3.5" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												Open Editor
											</TooltipContent>
										</Tooltip>
									</div>
								</div>
								<div className="h-[300px] overflow-hidden rounded-lg border bg-muted/30">
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
												updatePythonSource(value ?? "")
											}
											options={{
												automaticLayout: true,
												fontSize: 13,
												lineNumbers: "on",
												minimap: { enabled: false },
												folding: true,
												scrollBeyondLastLine: false,
												wordWrap: "on",
												padding: {
													top: 12,
													bottom: 12,
												},
											}}
										/>
									</Suspense>
								</div>
								<p className="text-muted-foreground text-xs">
									{isCustomSource
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
