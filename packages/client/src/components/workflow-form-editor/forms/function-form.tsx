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
	EngineOption,
	FunctionEngineConfig,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";
import { EngineSelect } from "./shared";

interface FunctionStepFormProps {
	step: WorkflowNode;
	engines: EngineOption[];
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function FunctionStepForm({
	step,
	engines,
	upstreamVars,
	onUpdate,
}: FunctionStepFormProps) {
	const c = step.config as unknown as FunctionEngineConfig;
	const update = (patch: Partial<FunctionEngineConfig>) =>
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
			<EngineSelect
				label="Function Engine"
				engines={engines}
				value={c.engineId ?? ""}
				onChange={(v) => update({ engineId: v })}
			/>
			<Field>
				<FieldLabel className="text-xs">Operation</FieldLabel>
				<Select
					value={c.operation ?? "execute"}
					onValueChange={(v) =>
						update({ operation: v as "execute" | "streaming" })
					}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="execute" className="text-xs">
							Execute
						</SelectItem>
						<SelectItem value="streaming" className="text-xs">
							Execute Streaming
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel className="text-xs">
					Parameters (JSON map)
				</FieldLabel>
				<Textarea
					className="min-h-[80px] font-mono text-xs"
					value={c.params ?? ""}
					onChange={(e) => update({ params: e.target.value })}
					placeholder={
						varHint
							? `{"key": "${varHint}"}`
							: '{"key": "${value}"}'
					}
					rows={3}
				/>
			</Field>
		</div>
	);
}
