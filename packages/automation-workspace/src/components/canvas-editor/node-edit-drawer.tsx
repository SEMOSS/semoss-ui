import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, Field, FieldLabel, Input, Textarea } from "@semoss/ui/next";
import type {
	AutomationNode,
	StepRunStatus,
} from "../../domain/automation.types";
import { getDisplayMeta } from "../../domain/automation-display";
import { getWorkflowNodeDefinition } from "../../domain/automation-workflow-adapter";
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
	source: string;
	onSourceChange: (source: string) => void;
	onUpdate: (step: AutomationNode) => void;
	onDelete: () => void;
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
				type === "app.pixel" ||
				type === "control.wait"),
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
	source,
	onSourceChange,
	onUpdate,
	onDelete,
}: NodeEditDrawerProps) {
	const [outputExpanded, setOutputExpanded] = useState(false);
	const meta = getDisplayMeta(step.type);
	const workflowDefinition = step.workflowType
		? getWorkflowNodeDefinition(step.workflowType)
		: undefined;
	const Icon = meta.icon;

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

					{supportsBusinessForm(step) && (
						<StepForm
							step={step}
							upstreamVars={upstreamVars}
							onUpdate={onUpdate}
							playgroundFillable={step.playgroundFillable ?? []}
							onPlaygroundFieldsChange={(fields) =>
								onUpdate({
									...step,
									playgroundFillable: fields,
								})
							}
							devMode={devMode}
							appId={appId}
						/>
					)}

					{devMode && (
						<Field>
							<FieldLabel className="text-xs">
								Python source artifact
							</FieldLabel>
							<Textarea
								className="min-h-48 font-mono text-xs"
								rows={12}
								value={source}
								onChange={(event) =>
									onSourceChange(event.target.value)
								}
							/>
							<p className="text-muted-foreground text-xs">
								This source is saved with the Python automation
								definition.
							</p>
						</Field>
					)}
				</div>
			</div>
		</div>
	);
}
