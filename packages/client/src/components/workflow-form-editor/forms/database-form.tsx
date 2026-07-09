import {
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type {
	DatabaseEngineConfig,
	EngineOption,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";
import { EngineSelect } from "./shared";

interface DatabaseStepFormProps {
	step: WorkflowNode;
	engines: EngineOption[];
	onUpdate: (step: WorkflowNode) => void;
}

export function DatabaseStepForm({
	step,
	engines,
	onUpdate,
}: DatabaseStepFormProps) {
	const c = step.config as unknown as DatabaseEngineConfig;
	const update = (patch: Partial<DatabaseEngineConfig>) =>
		onUpdate({
			...step,
			config: { ...c, ...patch } as unknown as typeof step.config,
		});

	return (
		<div className="flex flex-col gap-3">
			<EngineSelect
				label="Database Engine"
				engines={engines}
				value={c.engineId ?? ""}
				onChange={(v) => update({ engineId: v })}
			/>
			<Field>
				<FieldLabel className="text-xs">Operation</FieldLabel>
				<Select
					value={c.operation ?? "query"}
					onValueChange={(v) =>
						update({ operation: v as "query" | "write" })
					}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="query" className="text-xs">
							Query (SELECT)
						</SelectItem>
						<SelectItem value="write" className="text-xs">
							Write (INSERT/UPDATE/DELETE)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel className="text-xs">SQL Expression</FieldLabel>
				<Textarea
					className="min-h-[80px] font-mono text-xs"
					value={c.expression ?? ""}
					onChange={(e) => update({ expression: e.target.value })}
					placeholder="SELECT * FROM table WHERE id = '${upstreamVar}'"
					rows={4}
				/>
			</Field>
			{(c.operation ?? "query") === "query" && (
				<Field>
					<FieldLabel className="text-xs">Limit</FieldLabel>
					<Input
						type="number"
						className="h-8 text-xs"
						value={c.limit ?? 50}
						onChange={(e) =>
							update({ limit: Number(e.target.value) })
						}
						placeholder="50"
					/>
				</Field>
			)}
			{c.operation === "write" && (
				<p className="text-[11px] text-muted-foreground">
					commit=true is applied automatically for write operations.
				</p>
			)}
		</div>
	);
}
