import { ChevronDown, ChevronRight, Loader2, Play, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { Button, Field, FieldLabel, Input, Textarea } from "@semoss/ui/next";
import type {
	AutomationNode,
	StepRunStatus,
} from "../../domain/automation.types";
import {
	getDisplayMeta,
	getStepHeaderLabel,
	STEP_STATUS_BORDER,
} from "../../domain/automation-display";
import {
	applyOutputTransform,
	buildPixelPreview,
	extractVarRefs,
	formatDurationMs,
	substituteVars,
	TRANSFORM_ENABLED,
	TRANSFORM_MODES,
} from "../../domain/automation-utils";
import { StatusIcon } from "../status-icon";
import { AiSuggestButton } from "./ai-suggest-button";

/** Converts a step label to a snake_case outputVar slug. */
function toLabelSlug(label: string): string {
	return label
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}

/** Returns true if outputVar still tracks the label (not manually customized). */
function isOutputVarLinkedToLabel(outputVar: string, label: string): boolean {
	if (outputVar === toLabelSlug(label)) return true;
	// Matches default type-based pattern e.g. "db_out_3", "model_out_1"
	return /^[a-z]+_out_\d+$/.test(outputVar);
}

import { OutputPreview } from "./output-preview";
import { StepForm } from "./step-form";

export interface AutomationStepEditorCardProps {
	step: AutomationNode;
	index: number;
	isExpanded: boolean;
	isFirst: boolean;
	isLast: boolean;
	upstreamVars: string[];
	/** Live node output values from the last test run, keyed by outputVar name — used for variable autocomplete substitution */
	nodeOutputs: Record<string, string>;
	/** Result status of this step's last full-automation run */
	runStatus?: StepRunStatus;
	/** Error message from this step's last full-automation run */
	runError?: string;
	/** Duration in milliseconds of this step's last full-automation run */
	runDuration?: number;
	onToggle: () => void;
	onUpdate: (step: AutomationNode) => void;
	onDelete: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onSetOutput: (outputVar: string, value: string) => void;
	/** When false (business mode), technical fields like output variable and pixel preview are hidden */
	devMode?: boolean;
	/** The automation's own project ID — passed to app node forms for reactor discovery */
	appId?: string;
	/** True when the node has unfilled required fields — shows an amber dot on the step number badge */
	isIncomplete?: boolean;
	/** Short output preview from the last automation run — shown inline in the header when step succeeded */
	runOutput?: string | null;
	/** When true, move and delete controls are disabled (e.g. while a run is in progress) */
	locked?: boolean;
}

export function AutomationStepEditorCard({
	step,
	index,
	isExpanded,
	isFirst,
	isLast,
	upstreamVars,
	nodeOutputs,
	runStatus,
	runError,
	runDuration,
	onToggle,
	onUpdate,
	onDelete,
	onMoveUp,
	onMoveDown,
	onSetOutput,
	devMode = false,
	appId = "",
	isIncomplete = false,
	runOutput = null,
	locked = false,
}: AutomationStepEditorCardProps) {
	const [runningStepTest, setRunningStepTest] = useState(false);
	const [stepTestOutput, setStepTestOutput] = useState<string | null>(null);
	const [stepTestOutputExpanded, setStepTestOutputExpanded] = useState(false);
	const [mockValues, setMockValues] = useState<Record<string, string>>({});
	const [generatingLabel, setGeneratingLabel] = useState(false);
	const meta = getDisplayMeta(step.type);
	const Icon = meta.icon;
	const pixelPreview = useMemo(() => buildPixelPreview(step), [step]);
	const varRefs = useMemo(() => extractVarRefs(pixelPreview), [pixelPreview]);
	const unresolvedVars = varRefs.filter((value) => !nodeOutputs[value]);
	const borderClass =
		STEP_STATUS_BORDER[runStatus ?? "idle"] ?? STEP_STATUS_BORDER.idle;

	/** Calls GenerateNodeLabel to propose an AI-generated step label based on the current config. */
	const handleGenerateLabel = async () => {
		if (!appId || generatingLabel) return;
		setGeneratingLabel(true);
		try {
			const configB64 = btoa(
				unescape(encodeURIComponent(JSON.stringify(step.config))),
			);
			const pixel = `GenerateNodeLabel(project=["${appId}"], type=["${step.type}"], config=["${configB64}"]);`;
			const result = await runPixel(pixel);
			const output = result.pixelReturn?.[0]?.output;
			if (typeof output === "string" && output.trim()) {
				onUpdate({ ...step, label: output.trim() });
			}
		} catch {
			// silently fail — user's current label is unchanged
		} finally {
			setGeneratingLabel(false);
		}
	};

	/** Runs the step's current pixel directly (dev test mode), substituting mock values for unresolved upstream variables. Streams result back to the parent via onSetOutput. */
	const handleRunStep = async () => {
		if (!pixelPreview || pixelPreview.startsWith("//")) return;

		const allValues = { ...nodeOutputs, ...mockValues };
		const pixel = substituteVars(pixelPreview, allValues);
		setRunningStepTest(true);
		setStepTestOutput(null);

		try {
			const result = await runPixel(pixel);
			const pixelReturns = result.pixelReturn ?? [];
			const lastReturn = pixelReturns[pixelReturns.length - 1];
			const output = lastReturn?.output;
			const rawOutput =
				typeof output === "string"
					? output
					: JSON.stringify(output, null, 2);
			const transformed = applyOutputTransform(
				rawOutput,
				step.outputTransform,
			);
			setStepTestOutput(transformed);
			if (step.outputVar) {
				onSetOutput(step.outputVar, transformed);
			}
		} catch (error) {
			setStepTestOutput(`Error: ${(error as Error).message}`);
		} finally {
			setRunningStepTest(false);
		}
	};

	return (
		<div className={`rounded-2xl border bg-card shadow-sm ${borderClass}`}>
			<div className="flex items-center gap-2 px-4 py-4">
				<button
					type="button"
					onClick={onToggle}
					className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:text-foreground"
				>
					<span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-[11px] text-muted-foreground">
						{index + 1}
						{isIncomplete && runStatus === undefined && (
							<span className="-top-0.5 -right-0.5 absolute h-2 w-2 rounded-full bg-amber-500 ring-1 ring-background" />
						)}
					</span>
					<span
						className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${meta.color}`}
					>
						<Icon className="h-5 w-5" />
					</span>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-medium text-sm">
								{getStepHeaderLabel(step)}
							</span>
							{step.outputVar && (
								<span
									title="Output of this step — reference it in later steps with ${...}"
									className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] text-muted-foreground"
								>
									{step.outputVar}
								</span>
							)}
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
							<span>{meta.label}</span>
							{varRefs.length > 0 && (
								<span className="inline-flex flex-wrap items-center gap-1">
									<span className="text-muted-foreground/60">
										←
									</span>
									{varRefs.map((v) => (
										<span
											key={v}
											className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] text-blue-600 dark:text-blue-400"
										>
											${"{"}
											{v}
											{"}"}
										</span>
									))}
								</span>
							)}
							{runStatus && runStatus !== "idle" && (
								<span className="inline-flex items-center gap-1">
									<StatusIcon
										status={runStatus}
										className="h-3 w-3"
									/>
									{runStatus === "success"
										? `${runDuration != null ? formatDurationMs(runDuration) : "done"}`
										: runStatus === "error"
											? `failed${runDuration != null ? ` · ${formatDurationMs(runDuration)}` : ""}`
											: "Running"}
								</span>
							)}
						</div>
					</div>
					{isExpanded ? (
						<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
					) : (
						<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
					)}
				</button>
				<div className="flex shrink-0 items-center gap-1">
					<Button
						size="sm"
						variant="ghost"
						className="h-8 px-2 text-xs"
						onClick={onMoveUp}
						disabled={isFirst || locked}
					>
						↑
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 px-2 text-xs"
						onClick={onMoveDown}
						disabled={isLast || locked}
					>
						↓
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 w-8 p-0 text-destructive hover:text-destructive"
						onClick={onDelete}
						disabled={locked}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>

			{isExpanded && (
				<div className="border-t px-4 pt-4 pb-5">
					{runStatus === "success" && runOutput && (
						<div
							title={runOutput}
							className="mb-4 truncate rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-300"
						>
							{runOutput}
						</div>
					)}

					{runStatus === "error" && runError && (
						<div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive">
							{runError}
						</div>
					)}

					<div className="mb-4">
						<Field>
							<div className="flex items-center justify-between">
								<FieldLabel className="text-xs">
									Label
								</FieldLabel>
								{appId && (
									<AiSuggestButton
										onClick={handleGenerateLabel}
										loading={generatingLabel}
										title="Suggest a label based on this step's configuration"
									/>
								)}
							</div>
							<Input
								className="h-9 text-sm"
								value={step.label}
								onChange={(event) => {
									const newLabel = event.target.value;
									const updated: AutomationNode = {
										...step,
										label: newLabel,
									};
									if (
										step.outputVar !== undefined &&
										isOutputVarLinkedToLabel(
											step.outputVar,
											step.label,
										)
									) {
										const slug = toLabelSlug(newLabel);
										if (slug) updated.outputVar = slug;
									}
									onUpdate(updated);
								}}
								placeholder="Step label"
							/>
						</Field>
					</div>

					{devMode && step.outputVar !== undefined && (
						<div className="mb-4">
							<Field>
								<FieldLabel className="text-xs">
									Save result as
								</FieldLabel>
								<Input
									className="h-9 font-mono text-sm"
									value={step.outputVar}
									onChange={(event) => {
										const v = event.target.value.trim();
										if (v)
											onUpdate({ ...step, outputVar: v });
									}}
									placeholder="output_var"
								/>
							</Field>
						</div>
					)}

					<div className="mb-4">
						<Field>
							<FieldLabel className="text-xs">
								Notes (optional)
							</FieldLabel>
							<Textarea
								className="resize-none text-xs"
								rows={2}
								value={step.notes ?? ""}
								onChange={(event) =>
									onUpdate({
										...step,
										notes: event.target.value || undefined,
									})
								}
								placeholder="Notes about this step…"
							/>
						</Field>
					</div>

					<StepForm
						step={step}
						upstreamVars={upstreamVars}
						onUpdate={onUpdate}
						playgroundFillable={step.playgroundFillable ?? []}
						onPlaygroundFieldsChange={(fields) =>
							onUpdate({ ...step, playgroundFillable: fields })
						}
						devMode={devMode}
						appId={appId}
					/>

					{devMode && TRANSFORM_ENABLED.has(step.type) && (
						<div className="mt-4">
							<p className="mb-2 font-medium text-[11px] text-muted-foreground">
								How to store the result:
							</p>
							<div className="flex flex-wrap gap-2">
								{TRANSFORM_MODES.filter(
									(mode) => devMode || !mode.devOnly,
								).map((mode) => {
									const isActive =
										(step.outputTransform?.mode ??
											"raw") === mode.value;

									return (
										<button
											key={mode.value}
											type="button"
											onClick={() =>
												onUpdate({
													...step,
													outputTransform: {
														...(step.outputTransform ?? {
															mode: "raw" as const,
														}),
														mode: mode.value,
													},
												})
											}
											className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
												isActive
													? "border-primary bg-primary/10 font-medium text-primary"
													: "hover:border-primary/40"
											}`}
										>
											{mode.label}
										</button>
									);
								})}
							</div>
							{step.outputTransform?.mode === "column" && (
								<Input
									className="mt-2 h-8 text-xs"
									placeholder="Column name e.g. NAME"
									value={step.outputTransform.column ?? ""}
									onChange={(event) =>
										onUpdate({
											...step,
											outputTransform: {
												mode:
													step.outputTransform
														?.mode ?? "raw",
												...step.outputTransform,
												column: event.target.value,
											},
										})
									}
								/>
							)}
							{step.outputTransform?.mode === "jsonpath" && (
								<Input
									className="mt-2 h-8 font-mono text-xs"
									placeholder="$.data.values"
									value={step.outputTransform.path ?? ""}
									onChange={(event) =>
										onUpdate({
											...step,
											outputTransform: {
												mode:
													step.outputTransform
														?.mode ?? "raw",
												...step.outputTransform,
												path: event.target.value,
											},
										})
									}
								/>
							)}
						</div>
					)}

					{devMode &&
						pixelPreview &&
						!pixelPreview.startsWith("//") && (
							<div className="mt-4 space-y-4">
								<div>
									<p className="mb-1 font-medium text-[11px] text-muted-foreground">
										Pixel preview
									</p>
									<pre className="whitespace-pre-wrap break-all rounded-lg border bg-muted/40 px-3 py-2 font-mono text-[11px]">
										{pixelPreview}
									</pre>
								</div>

								<div className="rounded-xl border border-dashed p-4">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="font-medium text-sm">
												Test this step
											</p>
											<p className="text-[11px] text-muted-foreground">
												Execute the generated Pixel with
												optional mock inputs.
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="h-8 px-3 text-xs"
											onClick={handleRunStep}
											disabled={runningStepTest}
										>
											{runningStepTest ? (
												<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
											) : (
												<Play className="mr-1.5 h-3.5 w-3.5" />
											)}
											Run
										</Button>
									</div>

									{unresolvedVars.length > 0 && (
										<div className="mt-3 space-y-2">
											<p className="text-[11px] text-muted-foreground">
												Mock values for unresolved
												references:
											</p>
											{unresolvedVars.map((value) => (
												<div
													key={value}
													className="flex flex-col gap-2 md:flex-row md:items-center"
												>
													<code className="w-full font-mono text-[11px] text-muted-foreground md:w-32">{`\${${value}}`}</code>
													<Input
														className="h-8 flex-1 text-xs"
														placeholder="mock value…"
														value={
															mockValues[value] ??
															""
														}
														onChange={(event) =>
															setMockValues(
																(previous) => ({
																	...previous,
																	[value]:
																		event
																			.target
																			.value,
																}),
															)
														}
													/>
												</div>
											))}
										</div>
									)}

									{stepTestOutput !== null && (
										<div className="mt-3">
											<OutputPreview
												value={stepTestOutput}
												expanded={
													stepTestOutputExpanded
												}
												onToggle={() =>
													setStepTestOutputExpanded(
														(prev) => !prev,
													)
												}
												nodeType={step.type}
											/>
										</div>
									)}
								</div>
							</div>
						)}
				</div>
			)}
		</div>
	);
}
