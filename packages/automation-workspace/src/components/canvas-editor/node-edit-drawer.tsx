import { Loader2, Play, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { Button, Field, FieldLabel, Input, Textarea } from "@semoss/ui/next";
import type {
	AutomationNode,
	StepRunStatus,
} from "../../domain/automation.types";
import { getDisplayMeta } from "../../domain/automation-display";
import {
	applyOutputTransform,
	buildPixelPreview,
	extractVarRefs,
	substituteVars,
	TRANSFORM_ENABLED,
	TRANSFORM_MODES,
} from "../../domain/automation-utils";
import { OutputPreview } from "../form-editor/output-preview";
import { StepForm } from "./step-form";

function toLabelSlug(label: string): string {
	return label
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}

function isOutputVarLinkedToLabel(outputVar: string, label: string): boolean {
	if (outputVar === toLabelSlug(label)) return true;
	return /^[a-z]+_out_\d+$/.test(outputVar);
}

export interface NodeEditDrawerProps {
	step: AutomationNode;
	upstreamVars: string[];
	nodeOutputs: Record<string, string>;
	runStatus?: StepRunStatus;
	runError?: string;
	runDuration?: number;
	runOutput?: string | null;
	devMode?: boolean;
	appId?: string;
	onUpdate: (step: AutomationNode) => void;
	onDelete: () => void;
	onSetOutput: (outputVar: string, value: string) => void;
}

export function NodeEditDrawer({
	step,
	upstreamVars,
	nodeOutputs,
	runStatus,
	runError,
	runOutput,
	devMode = false,
	appId = "",
	onUpdate,
	onDelete,
	onSetOutput,
}: NodeEditDrawerProps) {
	const [runningStepTest, setRunningStepTest] = useState(false);
	const [stepTestOutput, setStepTestOutput] = useState<string | null>(null);
	const [stepTestOutputExpanded, setStepTestOutputExpanded] = useState(false);
	const [mockValues, setMockValues] = useState<Record<string, string>>({});
	const [outputExpanded, setOutputExpanded] = useState(false);

	const meta = getDisplayMeta(step.type);
	const Icon = meta.icon;
	const pixelPreview = useMemo(() => buildPixelPreview(step), [step]);
	const varRefs = useMemo(() => extractVarRefs(pixelPreview), [pixelPreview]);
	const unresolvedVars = varRefs.filter((v) => !nodeOutputs[v]);

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
		<div className="flex h-full flex-col bg-background">
			{/* Drawer header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<span
						className={`flex h-7 w-7 items-center justify-center rounded-lg bg-muted ${meta.color}`}
					>
						<Icon className="h-3.5 w-3.5" />
					</span>
					<span className="font-semibold text-sm">{meta.label}</span>
				</div>
				<div className="flex items-center gap-1">
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
			</div>

			{/* Scrollable body */}
			<div className="flex-1 overflow-y-auto px-4 py-4">
				<div className="space-y-4">
					{/* Run result at top of drawer */}
					{runStatus === "success" && runOutput && (
						<div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
							<p className="mb-1 font-medium text-[10px] text-emerald-700 uppercase tracking-wide dark:text-emerald-400">
								Last run output
							</p>
							<OutputPreview
								value={runOutput}
								expanded={outputExpanded}
								onToggle={() => setOutputExpanded((v) => !v)}
								nodeType={step.type}
							/>
						</div>
					)}

					{runStatus === "error" && runError && (
						<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
							<div className="mb-1 flex items-center justify-between gap-2">
								<p className="font-medium text-[10px] text-destructive uppercase tracking-wide">
									Step failed
								</p>
							</div>
							<pre className="max-h-[80px] overflow-y-auto whitespace-pre-wrap break-all font-sans text-[11px] text-destructive/80">
								{runError}
							</pre>
						</div>
					)}

					{/* Label */}
					<Field>
						<FieldLabel className="text-xs">Label</FieldLabel>
						<Input
							className="h-9 text-sm"
							value={step.label}
							onChange={(e) => {
								const newLabel = e.target.value;
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

					{/* Output var (dev mode) */}
					{devMode && step.outputVar !== undefined && (
						<Field>
							<FieldLabel className="text-xs">
								Save result as
							</FieldLabel>
							<Input
								className="h-9 font-mono text-sm"
								value={step.outputVar}
								onChange={(e) => {
									const v = e.target.value.trim();
									if (v) onUpdate({ ...step, outputVar: v });
								}}
								placeholder="output_var"
							/>
						</Field>
					)}

					{/* Notes */}
					<Field>
						<FieldLabel className="text-xs">
							Notes (optional)
						</FieldLabel>
						<Textarea
							className="resize-none text-xs"
							rows={2}
							value={step.notes ?? ""}
							onChange={(e) =>
								onUpdate({
									...step,
									notes: e.target.value || undefined,
								})
							}
							placeholder="Notes about this step…"
						/>
					</Field>

					{/* Type-specific form */}
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

					{/* Output transform (dev mode) */}
					{devMode && TRANSFORM_ENABLED.has(step.type) && (
						<div>
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
									onChange={(e) =>
										onUpdate({
											...step,
											outputTransform: {
												mode:
													step.outputTransform
														?.mode ?? "raw",
												...step.outputTransform,
												column: e.target.value,
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
									onChange={(e) =>
										onUpdate({
											...step,
											outputTransform: {
												mode:
													step.outputTransform
														?.mode ?? "raw",
												...step.outputTransform,
												path: e.target.value,
											},
										})
									}
								/>
							)}
						</div>
					)}

					{/* Pixel preview + test step (dev mode) */}
					{devMode &&
						pixelPreview &&
						!pixelPreview.startsWith("//") && (
							<div className="space-y-4">
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
											{unresolvedVars.map((v) => (
												<div
													key={v}
													className="flex flex-col gap-2 md:flex-row md:items-center"
												>
													<code className="w-full font-mono text-[11px] text-muted-foreground md:w-32">{`\${${v}}`}</code>
													<Input
														className="h-8 flex-1 text-xs"
														placeholder="mock value…"
														value={
															mockValues[v] ?? ""
														}
														onChange={(e) =>
															setMockValues(
																(prev) => ({
																	...prev,
																	[v]: e
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
			</div>
		</div>
	);
}
