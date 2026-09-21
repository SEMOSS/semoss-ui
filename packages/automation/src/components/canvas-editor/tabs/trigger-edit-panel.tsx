import { Code2, Lock, Play, Plus, Trash2, X } from "lucide-react";
import {
	Suspense,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Textarea,
	useTheme,
} from "@semoss/ui/next";
import type { AutomationNode } from "../../../domain/automation.types";
import type { AutomationGlobalVariable } from "../../../domain/automation-workflow.types";
import { getGeneratedPythonPreview } from "../../../domain/automation-workflow-adapter";
import { SchedulePanel } from "../schedule-dialog";

interface TriggerEditPanelProps {
	appId: string;
	description: string;
	onDescriptionChange: (value: string) => void;
	onClose: () => void;
	onPrepareSchedule: () => Promise<boolean>;
	step: AutomationNode;
	onUpdate: (step: AutomationNode) => void;
	/** When false (business mode), the setup Python editor is hidden. */
	devMode?: boolean;
	readOnly?: boolean;
}

interface GlobalInputRow {
	id: string;
	value: AutomationGlobalVariable;
}

type OptionalTriggerMode = "schedule" | "event-based";

function createGlobalInputRow(value: AutomationGlobalVariable): GlobalInputRow {
	return { id: crypto.randomUUID(), value };
}

export function TriggerEditPanel({
	appId,
	description,
	onDescriptionChange,
	onClose,
	onPrepareSchedule,
	step,
	onUpdate,
	devMode = false,
	readOnly = false,
}: TriggerEditPanelProps) {
	const [globalRows, setGlobalRows] = useState<GlobalInputRow[]>(() => {
		const globals = Array.isArray(step.workflowConfig?.globals)
			? (step.workflowConfig.globals as AutomationGlobalVariable[])
			: [];
		return globals.map(createGlobalInputRow);
	});
	const manualTriggerHeadingId = useId();
	const scheduleTriggerHeadingId = useId();
	const eventTriggerHeadingId = useId();
	const optionalTriggerModes: OptionalTriggerMode[] = Array.isArray(
		step.workflowConfig?.triggerModes,
	)
		? step.workflowConfig.triggerModes.filter(
				(mode): mode is OptionalTriggerMode =>
					mode === "schedule" || mode === "event-based",
			)
		: step.workflowConfig?.triggerType === "schedule" ||
				step.workflowConfig?.triggerType === "event-based"
			? [step.workflowConfig.triggerType]
			: [];

	const updateOptionalTriggerMode = (
		mode: OptionalTriggerMode,
		enabled: boolean,
	) => {
		if (readOnly) return;
		const triggerModes = enabled
			? [...optionalTriggerModes, mode]
			: optionalTriggerModes.filter((item) => item !== mode);
		onUpdate({
			...step,
			workflowConfig: {
				...step.workflowConfig,
				triggerModes,
			},
		});
	};

	const updateGlobals = (nextRows: GlobalInputRow[]) => {
		if (readOnly) return;
		setGlobalRows(nextRows);
		onUpdate({
			...step,
			workflowConfig: {
				...step.workflowConfig,
				globals: nextRows.map((row) => row.value),
			},
		});
	};

	const { resolvedTheme } = useTheme();
	const persistedPythonSource =
		typeof step.workflowConfig?.pythonSource === "string"
			? step.workflowConfig.pythonSource
			: "";
	const [pythonDraft, setPythonDraft] = useState(
		persistedPythonSource || getGeneratedPythonPreview(step),
	);
	const pythonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingPythonRef = useRef<string | null>(null);
	// The flush merges onto the newest version of the node rather than the one captured
	// when typing started, so a global input edited inside the debounce window is not
	// written back stale.
	const latestStepRef = useRef(step);
	const onUpdateRef = useRef(onUpdate);
	useEffect(() => {
		latestStepRef.current = step;
		onUpdateRef.current = onUpdate;
	}, [step, onUpdate]);

	const flushPythonSource = useCallback(() => {
		if (pythonTimeoutRef.current) {
			clearTimeout(pythonTimeoutRef.current);
			pythonTimeoutRef.current = null;
		}
		const pending = pendingPythonRef.current;
		if (pending === null) return;
		pendingPythonRef.current = null;
		const target = latestStepRef.current;
		onUpdateRef.current({
			...target,
			workflowConfig: {
				...target.workflowConfig,
				pythonSource: pending,
			},
		});
	}, []);
	useEffect(() => () => flushPythonSource(), [flushPythonSource]);

	const updatePythonSource = (source: string) => {
		if (readOnly) return;
		setPythonDraft(source);
		pendingPythonRef.current = source;
		if (pythonTimeoutRef.current) {
			clearTimeout(pythonTimeoutRef.current);
		}
		pythonTimeoutRef.current = setTimeout(flushPythonSource, 300);
	};

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15">
						<Play
							className="h-3.5 w-3.5 text-success"
							aria-hidden
						/>
					</span>
					<span className="font-semibold text-sm">Trigger</span>
					{readOnly && (
						<span className="flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-muted-foreground text-xs">
							<Lock className="size-3" aria-hidden />
							View only
						</span>
					)}
				</div>
				<Button
					size="sm"
					variant="ghost"
					className="size-8 p-0"
					onClick={onClose}
					aria-label="Close trigger editor"
				>
					<X className="size-4" aria-hidden />
				</Button>
			</div>
			<div className="flex-1 overflow-y-auto px-4 py-4">
				<div className="space-y-4">
					<section className="rounded-lg border p-3">
						<Field>
							<FieldLabel className="text-xs">
								Description
							</FieldLabel>
							<Textarea
								className="resize-none text-sm"
								rows={3}
								value={description}
								onChange={(event) => {
									if (!readOnly)
										onDescriptionChange(event.target.value);
								}}
								placeholder="I want to monitor new files and notify my team"
								readOnly={readOnly}
							/>
						</Field>
					</section>
					<section
						className="space-y-1 rounded-lg border p-3"
						aria-labelledby={manualTriggerHeadingId}
					>
						<h3
							id={manualTriggerHeadingId}
							className="font-medium text-sm"
						>
							Manual
						</h3>
						<p className="text-muted-foreground text-xs">
							Run this automation directly from the workspace.
						</p>
					</section>
					<section
						className="space-y-3 rounded-lg border p-3"
						aria-labelledby={scheduleTriggerHeadingId}
					>
						<div className="flex items-center justify-between gap-3">
							<div>
								<h3
									id={scheduleTriggerHeadingId}
									className="font-medium text-sm"
								>
									Schedule
								</h3>
								<p className="text-muted-foreground text-xs">
									Run this automation on a recurring schedule.
								</p>
							</div>
							{!readOnly && (
								<Button
									size="sm"
									variant={
										optionalTriggerModes.includes(
											"schedule",
										)
											? "outline"
											: "default"
									}
									onClick={() =>
										updateOptionalTriggerMode(
											"schedule",
											!optionalTriggerModes.includes(
												"schedule",
											),
										)
									}
								>
									{optionalTriggerModes.includes("schedule")
										? "Remove"
										: "Add"}
								</Button>
							)}
						</div>
						{optionalTriggerModes.includes("schedule") && (
							<SchedulePanel
								projectId={appId}
								onPrepareSchedule={onPrepareSchedule}
							/>
						)}
					</section>
					{/* The runtime accepts MANUAL, PLAYGROUND, and SCHEDULED triggers only,
					    so this is shown as upcoming rather than as a control that stores
					    a setting nothing acts on. */}
					<section
						className="space-y-1 rounded-lg border border-dashed bg-muted/30 p-3"
						aria-labelledby={eventTriggerHeadingId}
					>
						<h3
							id={eventTriggerHeadingId}
							className="flex items-center gap-2 font-medium text-muted-foreground text-sm"
						>
							Event Based
							<span className="rounded-md border bg-background px-1.5 py-0.5 font-normal text-[10px] text-muted-foreground">
								In development
							</span>
						</h3>
						<p className="text-muted-foreground text-xs">
							Starting this automation from a received event is
							not available yet.
						</p>
					</section>
					<div className="space-y-3 rounded-lg border p-3">
						<div>
							<p className="font-medium text-sm">Global Inputs</p>
							<p className="text-muted-foreground text-xs">
								Inputs provided when this automation is started.
								The value set here is used when none is given.
							</p>
						</div>
						{globalRows.map((row) => (
							<div
								key={row.id}
								className="grid grid-cols-[1fr_1fr_auto] gap-2"
							>
								<Input
									value={row.value.name}
									placeholder="variable_name"
									aria-label="Global input name"
									readOnly={readOnly}
									onChange={(event) =>
										updateGlobals(
											globalRows.map((item) =>
												item.id === row.id
													? {
															...item,
															value: {
																...item.value,
																name: event
																	.target
																	.value,
															},
														}
													: item,
											),
										)
									}
								/>
								<Input
									value={row.value.defaultValue}
									placeholder="Value"
									aria-label="Global input value"
									readOnly={readOnly}
									onChange={(event) =>
										updateGlobals(
											globalRows.map((item) =>
												item.id === row.id
													? {
															...item,
															value: {
																...item.value,
																defaultValue:
																	event.target
																		.value,
															},
														}
													: item,
											),
										)
									}
								/>
								{!readOnly && (
									<Button
										size="sm"
										variant="ghost"
										aria-label={`Remove ${row.value.name || "global input"}`}
										onClick={() =>
											updateGlobals(
												globalRows.filter(
													(item) =>
														item.id !== row.id,
												),
											)
										}
									>
										<Trash2
											className="size-4"
											aria-hidden
										/>
									</Button>
								)}
							</div>
						))}
						{!readOnly && (
							<Button
								size="sm"
								variant="outline"
								className="self-start"
								onClick={() =>
									updateGlobals([
										...globalRows,
										createGlobalInputRow({
											name: "",
											defaultValue: "",
										}),
									])
								}
							>
								<Plus className="mr-1.5 size-4" aria-hidden />
								Add Input
							</Button>
						)}
					</div>
					{devMode && (
						<div className="space-y-3 rounded-lg border p-3">
							<div>
								<p className="flex items-center gap-1.5 font-medium text-sm">
									<Code2
										className="size-3.5 text-primary"
										aria-hidden
									/>
									Setup Python
								</p>
								<p className="text-muted-foreground text-xs">
									Runs once before the first step.
									Module-level variables, and anything
									run(scope) returns, are added to scope for
									every step to read. Use it for values that
									have to be computed when the run starts,
									such as a date derived from a global input.
								</p>
							</div>
							<div className="h-64 overflow-hidden rounded-lg border bg-muted/30">
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
											readOnly,
											padding: { top: 12, bottom: 12 },
										}}
									/>
								</Suspense>
							</div>
							<p className="text-muted-foreground text-xs">
								{readOnly
									? "View only."
									: 'Read a global input with scope["name"]. Leave the template as is when the trigger needs no setup.'}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
