import {
	Activity,
	AppWindow,
	Brain,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Code2,
	Database,
	Loader2,
	Play,
	Server,
	Shuffle,
	Trash2,
	Workflow,
	XCircle,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Button, Field, FieldLabel, Input } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	EngineOption,
	OutputTransform,
	ProjectOption,
	StepRunStatus,
	WorkflowNode,
	WorkflowNodeType,
} from "@/pages/workflow/workflow.types";
import {
	applyOutputTransform,
	buildPixelPreview,
	extractVarRefs,
	substituteVars,
} from "../workflow-workspace/workflow-utils";
import { StepForm } from "./step-form";

const TYPE_ICONS: Record<
	WorkflowNodeType,
	React.ComponentType<{ className?: string }>
> = {
	trigger: Play,
	"database-engine": Database,
	"storage-engine": Server,
	"vector-engine": Brain,
	"model-engine": Activity,
	"function-engine": Zap,
	app: AppWindow,
	"custom-pixel": Code2,
	"fan-out": Activity,
	conditional: Activity,
	transform: Shuffle,
	"sub-workflow": Workflow,
};

const TYPE_COLORS: Record<WorkflowNodeType, string> = {
	trigger: "bg-emerald-500",
	"database-engine": "bg-blue-500",
	"storage-engine": "bg-orange-500",
	"vector-engine": "bg-purple-500",
	"model-engine": "bg-pink-500",
	"function-engine": "bg-yellow-500",
	app: "bg-cyan-500",
	"custom-pixel": "bg-slate-500",
	"fan-out": "bg-indigo-500",
	conditional: "bg-amber-500",
	transform: "bg-teal-500",
	"sub-workflow": "bg-teal-600",
};

const TYPE_LABELS: Record<WorkflowNodeType, string> = {
	trigger: "Trigger",
	"database-engine": "Database",
	"storage-engine": "Storage",
	"vector-engine": "Vector",
	"model-engine": "Model",
	"function-engine": "Function",
	app: "App",
	"custom-pixel": "Custom Pixel",
	"fan-out": "Fan-Out",
	conditional: "Conditional",
	transform: "Transform",
	"sub-workflow": "Sub-Workflow",
};

const TRANSFORM_MODES: { value: OutputTransform["mode"]; label: string }[] = [
	{ value: "raw", label: "Raw" },
	{ value: "rows-as-objects", label: "Rows → Objects" },
	{ value: "first-row", label: "First Row" },
	{ value: "column", label: "Column" },
	{ value: "jsonpath", label: "JSONPath" },
];

// Node types that return data and benefit from an output transform.
const TRANSFORM_ENABLED: Set<WorkflowNodeType> = new Set([
	"database-engine",
	"model-engine",
	"vector-engine",
	"storage-engine",
	"function-engine",
	"app",
	"custom-pixel",
]);

interface StepCardProps {
	step: WorkflowNode;
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
	onToggle: () => void;
	onUpdate: (step: WorkflowNode) => void;
	onDelete: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onSetOutput: (outputVar: string, value: string) => void;
}

export function StepCard({
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
	onToggle,
	onUpdate,
	onDelete,
	onMoveUp,
	onMoveDown,
	onSetOutput,
}: StepCardProps) {
	const { monolithStore } = useRootStore();
	const [running, setRunning] = useState(false);
	const [runOutput, setRunOutput] = useState<string | null>(null);
	const [mockValues, setMockValues] = useState<Record<string, string>>({});

	const Icon = TYPE_ICONS[step.type] ?? Code2;
	const color = TYPE_COLORS[step.type] ?? "bg-slate-500";
	const typeLabel = TYPE_LABELS[step.type] ?? step.type;

	const pixelPreview = buildPixelPreview(step);
	const varRefs = extractVarRefs(pixelPreview);
	const unresolvedVars = varRefs.filter((v) => !nodeOutputs[v]);

	const handleRun = async () => {
		if (!pixelPreview || pixelPreview.startsWith("//")) return;
		const allValues = { ...nodeOutputs, ...mockValues };
		const pixel = substituteVars(pixelPreview, allValues);
		setRunning(true);
		setRunOutput(null);
		try {
			const result = await monolithStore.runQuery(pixel);
			const out = result.pixelReturn?.[0]?.output;
			const rawStr =
				typeof out === "string" ? out : JSON.stringify(out, null, 2);
			const transformed = applyOutputTransform(
				rawStr,
				step.outputTransform,
			);
			setRunOutput(transformed);
			if (step.outputVar) onSetOutput(step.outputVar, transformed);
		} catch (err) {
			setRunOutput(`Error: ${(err as Error).message}`);
		} finally {
			setRunning(false);
		}
	};

	const borderColor =
		runStatus === "error"
			? "border-destructive/50"
			: runStatus === "success"
				? "border-emerald-500/40"
				: runStatus === "running"
					? "border-primary/40"
					: "";

	return (
		<div className={`rounded-lg border bg-card shadow-sm ${borderColor}`}>
			{/* Header */}
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
			>
				<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-[11px] text-muted-foreground">
					{index + 1}
				</span>
				<span
					className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${color}`}
				>
					<Icon className="h-4 w-4 text-white" />
				</span>
				<div className="flex flex-1 flex-col">
					<span className="font-medium text-sm">
						{step.label || typeLabel}
					</span>
					<span className="font-mono text-[11px] text-muted-foreground">
						→ {step.outputVar || "unnamed"}
					</span>
				</div>
				{/* Workflow run status indicator */}
				{runStatus === "running" && (
					<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
				)}
				{runStatus === "success" && (
					<CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
				)}
				{runStatus === "error" && (
					<XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
				)}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: stop-propagation wrapper for buttons inside a button */}
				<div
					className="flex items-center gap-1"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={() => {}}
				>
					<Button
						size="sm"
						variant="ghost"
						className="h-6 w-6 p-0"
						onClick={onMoveUp}
						disabled={isFirst}
					>
						<ChevronUp className="h-3.5 w-3.5" />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-6 w-6 p-0"
						onClick={onMoveDown}
						disabled={isLast}
					>
						<ChevronDown className="h-3.5 w-3.5" />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-6 w-6 p-0 text-destructive hover:text-destructive"
						onClick={onDelete}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				</div>
			</button>

			{/* Expanded body */}
			{isExpanded && (
				<div className="border-t px-4 pt-3 pb-4">
					{/* Workflow run error banner */}
					{runStatus === "error" && runError && (
						<div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-[11px] text-destructive">
							{runError}
						</div>
					)}
					{/* Label + outputVar row */}
					<div className="mb-3 flex gap-3">
						<Field className="flex-1">
							<FieldLabel className="text-xs">Label</FieldLabel>
							<Input
								className="h-7 text-xs"
								value={step.label}
								onChange={(e) =>
									onUpdate({ ...step, label: e.target.value })
								}
								placeholder="Step label"
							/>
						</Field>
						<Field className="flex-1">
							<FieldLabel className="text-xs">
								Output variable
							</FieldLabel>
							<Input
								className="h-7 font-mono text-xs"
								value={step.outputVar}
								onChange={(e) =>
									onUpdate({
										...step,
										outputVar: e.target.value,
									})
								}
								placeholder="outputVar"
							/>
						</Field>
					</div>

					{/* Per-type form */}
					<StepForm
						step={step}
						enginesByType={enginesByType}
						projects={projects}
						upstreamVars={upstreamVars}
						onUpdate={onUpdate}
					/>

					{/* Pixel preview */}
					{pixelPreview && !pixelPreview.startsWith("//") && (
						<div className="mt-3">
							<p className="mb-1 font-medium text-[11px] text-muted-foreground">
								Pixel preview
							</p>
							<pre className="whitespace-pre-wrap break-all rounded border bg-muted/50 px-2.5 py-1.5 font-mono text-[10px]">
								{pixelPreview}
							</pre>
						</div>
					)}

					{/* Output transform */}
					{TRANSFORM_ENABLED.has(step.type) &&
						pixelPreview &&
						!pixelPreview.startsWith("//") && (
							<div className="mt-3">
								<p className="mb-1.5 font-medium text-[11px] text-muted-foreground">
									Store in{" "}
									<code className="font-mono">{`\${${step.outputVar || "out"}}`}</code>{" "}
									as:
								</p>
								<div className="flex flex-wrap gap-1">
									{TRANSFORM_MODES.map((m) => {
										const active =
											(step.outputTransform?.mode ??
												"raw") === m.value;
										return (
											<button
												key={m.value}
												type="button"
												onClick={() =>
													onUpdate({
														...step,
														outputTransform: {
															...(step.outputTransform ?? {
																mode: "raw" as const,
															}),
															mode: m.value,
														},
													})
												}
												className={`rounded border px-2 py-0.5 text-[10px] transition-colors ${
													active
														? "border-primary bg-primary/10 font-medium text-primary"
														: "border-border hover:border-primary/40"
												}`}
											>
												{m.label}
											</button>
										);
									})}
								</div>
								{step.outputTransform?.mode === "column" && (
									<Input
										className="mt-1.5 h-6 text-[11px]"
										placeholder="Column name e.g. NAME"
										value={
											step.outputTransform.column ?? ""
										}
										onChange={(e) =>
											onUpdate({
												...step,
												outputTransform: {
													...step.outputTransform,
													column: e.target.value,
												},
											})
										}
									/>
								)}
								{step.outputTransform?.mode === "jsonpath" && (
									<Input
										className="mt-1.5 h-6 font-mono text-[11px]"
										placeholder="$.data.values"
										value={step.outputTransform.path ?? ""}
										onChange={(e) =>
											onUpdate({
												...step,
												outputTransform: {
													...step.outputTransform,
													path: e.target.value,
												},
											})
										}
									/>
								)}
							</div>
						)}

					{/* Test run section */}
					{pixelPreview && !pixelPreview.startsWith("//") && (
						<div className="mt-3 rounded-md border border-dashed p-3">
							<div className="flex items-center justify-between">
								<span className="font-medium text-xs">
									Test this step
								</span>
								<Button
									size="sm"
									variant="outline"
									className="h-6 px-2 text-[11px]"
									onClick={handleRun}
									disabled={running}
								>
									{running ? (
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
									) : (
										<Play className="mr-1 h-3 w-3" />
									)}
									Run
								</Button>
							</div>

							{/* Mock inputs for unresolved vars */}
							{unresolvedVars.length > 0 && (
								<div className="mt-2 flex flex-col gap-1.5">
									<p className="text-[10px] text-muted-foreground">
										Mock values for unresolved references:
									</p>
									{unresolvedVars.map((v) => (
										<div
											key={v}
											className="flex items-center gap-2"
										>
											<code className="w-28 shrink-0 truncate font-mono text-[10px] text-muted-foreground">{`\${${v}}`}</code>
											<Input
												className="h-6 flex-1 text-[11px]"
												placeholder="mock value…"
												value={mockValues[v] ?? ""}
												onChange={(e) =>
													setMockValues((prev) => ({
														...prev,
														[v]: e.target.value,
													}))
												}
											/>
										</div>
									))}
								</div>
							)}

							{/* Output */}
							{runOutput !== null && (
								<pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded border bg-muted/50 p-1.5 font-mono text-[10px]">
									{runOutput}
								</pre>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
