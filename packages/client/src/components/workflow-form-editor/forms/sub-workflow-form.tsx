import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type {
	ProjectOption,
	SubWorkflowNodeConfig,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";

interface SubWorkflowStepFormProps {
	step: WorkflowNode;
	projects: ProjectOption[];
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function SubWorkflowStepForm({
	step,
	projects,
	upstreamVars,
	onUpdate,
}: SubWorkflowStepFormProps) {
	const c = step.config as unknown as SubWorkflowNodeConfig;
	const update = (patch: Partial<SubWorkflowNodeConfig>) =>
		onUpdate({
			...step,
			config: { ...c, ...patch } as unknown as typeof step.config,
		});

	const varHint =
		upstreamVars.length > 0
			? `\${${upstreamVars[upstreamVars.length - 1]}}`
			: `\${upstreamVar} (from a prior step)`;

	return (
		<div className="flex flex-col gap-3">
			<Field>
				<FieldLabel className="text-xs">
					Target Workflow (App)
				</FieldLabel>
				<Select
					value={c.targetProjectId ?? ""}
					onValueChange={(v) => update({ targetProjectId: v })}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue
							placeholder={
								projects.length
									? "Select app…"
									: "No apps available"
							}
						/>
					</SelectTrigger>
					<SelectContent>
						{projects.map((p) => (
							<SelectItem
								key={p.project_id}
								value={p.project_id}
								className="text-xs"
							>
								{p.project_display_name ?? p.project_name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel className="text-xs">
					Input Mapping (JSON)
				</FieldLabel>
				<Textarea
					className="min-h-[80px] font-mono text-xs"
					value={c.inputMapping ?? "{}"}
					onChange={(e) => update({ inputMapping: e.target.value })}
					placeholder={`{"childVar": "${varHint}"}`}
					rows={4}
				/>
			</Field>
			<p className="text-[11px] text-muted-foreground">
				Runs the target app's saved workflow to completion and blocks
				this step until it finishes. Keys become variables available in
				the target workflow; values are resolved against this workflow's
				outputs first. The target workflow cannot call back into this
				one, directly or transitively — cycles are rejected at run time.
			</p>
		</div>
	);
}
