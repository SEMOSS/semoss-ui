import {
	ChevronDown,
	ChevronRight,
	ClipboardCopy,
	Loader2,
	Play,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button, Field, FieldLabel, Input, toast } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	AutomationNode,
	EngineOption,
	ProjectOption,
	StepRunStatus,
} from "@/pages/automation/automation.types";
import {
	applyOutputTransform,
	buildPixelPreview,
	extractVarRefs,
	formatDurationMs,
	substituteVars,
	TRANSFORM_ENABLED,
	TRANSFORM_MODES,
} from "../automation-workspace/automation-utils";
import {
	getDisplayMeta,
	getStepHeaderLabel,
	STEP_STATUS_BORDER,
} from "./automation-editor-utils";
import { StatusIcon } from "./automation-status";
import { StepForm } from "./step-form";

export interface AutomationStepEditorCardProps {
	step: AutomationNode;
	index: number;
	isExpanded: boolean;
	isFirst: boolean;
	isLast: boolean;
	enginesByType: Record<string, EngineOption[]>;
	projects: ProjectOption[];
	upstreamVars: string[];
	nodeOutputs: Record<string, string>;
	runStatus?: StepRunStatus;
	runError?: string;
	runDuration?: number;
	onToggle: () => void;
	onUpdate: (step: AutomationNode) => void;
	onDelete: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onSetOutput: (outputVar: string, value: string) => void;
}

export function AutomationStepEditorCard({
	step,
	index,
	isExpanded,
	isFirst,
	isLast,
	enginesByType,
	projects,
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
}: AutomationStepEditorCardProps) {
	const { monolithStore } = useRootStore();
	const [runningStepTest, setRunningStepTest] = useState(false);
	const [runOutput, setRunOutput] = useState<string | null>(null);
	const [mockValues, setMockValues] = useState<Record<string, string>>({});
	const meta = getDisplayMeta(step.type);
	const Icon = meta.icon;
	const pixelPreview = buildPixelPreview(step);
	const varRefs = extractVarRefs(pixelPreview);
	const unresolvedVars = varRefs.filter((value) => !nodeOutputs[value]);
	const borderClass =
		STEP_STATUS_BORDER[runStatus ?? "idle"] ?? STEP_STATUS_BORDER.idle;

	const handleRunStep = async () => {
		if (!pixelPreview || pixelPreview.startsWith("//")) return;

		const allValues = { ...nodeOutputs, ...mockValues };
		const pixel = substituteVars(pixelPreview, allValues);
		setRunningStepTest(true);
		setRunOutput(null);

		try {
			const result = await monolithStore.runQuery(pixel);
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
			setRunOutput(transformed);
			if (step.outputVar) {
				onSetOutput(step.outputVar, transformed);
			}
		} catch (error) {
			setRunOutput(`Error: ${(error as Error).message}`);
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
					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-[11px] text-muted-foreground">
						{index + 1}
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
								<span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
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
						disabled={isFirst}
					>
						↑
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 px-2 text-xs"
						onClick={onMoveDown}
						disabled={isLast}
					>
						↓
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 w-8 p-0 text-destructive hover:text-destructive"
						onClick={onDelete}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>

			{isExpanded && (
				<div className="border-t px-4 pt-4 pb-5">
					{runStatus === "error" && runError && (
						<div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive">
							{runError}
						</div>
					)}

					<div className="mb-4 grid gap-3 md:grid-cols-2">
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
						<Field>
							<FieldLabel className="text-xs">
								Output variable
							</FieldLabel>
							<Input
								className="h-9 font-mono text-sm"
								value={step.outputVar}
								onChange={(event) =>
									onUpdate({
										...step,
										outputVar: event.target.value,
									})
								}
								placeholder="outputVar"
							/>
						</Field>
					</div>

					<StepForm
						step={step}
						enginesByType={enginesByType}
						projects={projects}
						upstreamVars={upstreamVars}
						onUpdate={onUpdate}
					/>

					{pixelPreview && !pixelPreview.startsWith("//") && (
						<div className="mt-4 space-y-4">
							<div>
								<p className="mb-1 font-medium text-[11px] text-muted-foreground">
									Pixel preview
								</p>
								<pre className="whitespace-pre-wrap break-all rounded-lg border bg-muted/40 px-3 py-2 font-mono text-[11px]">
									{pixelPreview}
								</pre>
							</div>

							{TRANSFORM_ENABLED.has(step.type) && (
								<div>
									<p className="mb-2 font-medium text-[11px] text-muted-foreground">
										Store in{" "}
										<code className="font-mono">{`\${${step.outputVar || "out"}}`}</code>{" "}
										as:
									</p>
									<div className="flex flex-wrap gap-2">
										{TRANSFORM_MODES.map((mode) => {
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
									{step.outputTransform?.mode ===
										"column" && (
										<Input
											className="mt-2 h-8 text-xs"
											placeholder="Column name e.g. NAME"
											value={
												step.outputTransform.column ??
												""
											}
											onChange={(event) =>
												onUpdate({
													...step,
													outputTransform: {
														...step.outputTransform,
														column: event.target
															.value,
													},
												})
											}
										/>
									)}
									{step.outputTransform?.mode ===
										"jsonpath" && (
										<Input
											className="mt-2 h-8 font-mono text-xs"
											placeholder="$.data.values"
											value={
												step.outputTransform.path ?? ""
											}
											onChange={(event) =>
												onUpdate({
													...step,
													outputTransform: {
														...step.outputTransform,
														path: event.target
															.value,
													},
												})
											}
										/>
									)}
								</div>
							)}

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
														mockValues[value] ?? ""
													}
													onChange={(event) =>
														setMockValues(
															(previous) => ({
																...previous,
																[value]:
																	event.target
																		.value,
															}),
														)
													}
												/>
											</div>
										))}
									</div>
								)}

								{runOutput !== null && (
									<div className="relative mt-3">
										<button
											type="button"
											className="absolute top-2 right-2 rounded-md border bg-background p-1 text-muted-foreground hover:text-foreground"
											onClick={() => {
												navigator.clipboard.writeText(
													runOutput,
												);
												toast.success(
													"Copied to clipboard",
												);
											}}
										>
											<ClipboardCopy className="h-3.5 w-3.5" />
										</button>
										<pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg border bg-muted/40 p-3 pr-10 font-mono text-[11px]">
											{runOutput}
										</pre>
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
