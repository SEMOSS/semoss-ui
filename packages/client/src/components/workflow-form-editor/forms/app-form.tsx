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
	AppNodeConfig,
	ProjectOption,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";

interface AppStepFormProps {
	step: WorkflowNode;
	projects: ProjectOption[];
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function AppStepForm({
	step,
	projects,
	upstreamVars,
	onUpdate,
}: AppStepFormProps) {
	const c = step.config as unknown as AppNodeConfig;
	const update = (patch: Partial<AppNodeConfig>) =>
		onUpdate({
			...step,
			config: { ...c, ...patch } as unknown as typeof step.config,
		});

	const varHint =
		upstreamVars.length > 0
			? `\${${upstreamVars[upstreamVars.length - 1]}}`
			: undefined;

	return (
		<div className="flex flex-col gap-3">
			<Field>
				<FieldLabel className="text-xs">App</FieldLabel>
				<Select
					value={c.appId ?? ""}
					onValueChange={(v) => update({ appId: v })}
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
				<FieldLabel className="text-xs">Reactor calls</FieldLabel>
				<Textarea
					className="min-h-[80px] font-mono text-xs"
					value={c.pixel ?? ""}
					onChange={(e) => update({ pixel: e.target.value })}
					placeholder={
						varHint
							? `MyReactor(param=["${varHint}"]);`
							: 'MyReactor(param=["${upstreamVar}"]);'
					}
					rows={4}
				/>
			</Field>
			<p className="text-[11px] text-muted-foreground">
				App context is set automatically — write reactor calls directly.
			</p>
		</div>
	);
}
