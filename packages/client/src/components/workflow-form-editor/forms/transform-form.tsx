import {
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type {
	TransformConfig,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";

interface TransformStepFormProps {
	step: WorkflowNode;
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function TransformStepForm({
	step,
	upstreamVars,
	onUpdate,
}: TransformStepFormProps) {
	const c = step.config as unknown as TransformConfig;
	const update = (patch: Partial<TransformConfig>) =>
		onUpdate({
			...step,
			config: { ...c, ...patch } as unknown as typeof step.config,
		});

	return (
		<div className="flex flex-col gap-3">
			<Field>
				<FieldLabel className="text-xs">Input variable</FieldLabel>
				<Select
					value={c.inputVar ?? ""}
					onValueChange={(v) => update({ inputVar: v })}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue
							placeholder={
								upstreamVars.length
									? "Select upstream variable…"
									: "No upstream variables"
							}
						/>
					</SelectTrigger>
					<SelectContent>
						{upstreamVars.map((v) => (
							<SelectItem
								key={v}
								value={v}
								className="font-mono text-xs"
							>
								{v}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel className="text-xs">Operation</FieldLabel>
				<Select
					value={c.operation ?? "convert-to-objects"}
					onValueChange={(v) =>
						update({ operation: v as TransformConfig["operation"] })
					}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem
							value="convert-to-objects"
							className="text-xs"
						>
							Convert to objects
						</SelectItem>
						<SelectItem value="extract-field" className="text-xs">
							Extract field
						</SelectItem>
						<SelectItem value="filter" className="text-xs">
							Filter rows
						</SelectItem>
						<SelectItem value="map" className="text-xs">
							Map items
						</SelectItem>
						<SelectItem value="flatten" className="text-xs">
							Flatten
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>

			{c.operation === "extract-field" && (
				<Field>
					<FieldLabel className="text-xs">JSON path</FieldLabel>
					<Input
						className="h-8 font-mono text-xs"
						value={c.expression ?? ""}
						onChange={(e) => update({ expression: e.target.value })}
						placeholder="[0].name"
					/>
				</Field>
			)}

			{(c.operation === "filter" || c.operation === "map") && (
				<Field>
					<FieldLabel className="text-xs">JS expression</FieldLabel>
					<Input
						className="h-8 font-mono text-xs"
						value={c.expression ?? ""}
						onChange={(e) => update({ expression: e.target.value })}
						placeholder={
							c.operation === "filter"
								? 'item.status === "active"'
								: "item.name"
						}
					/>
				</Field>
			)}

			<p className="text-[11px] text-muted-foreground">
				Transform runs client-side when testing; in the full workflow
				run it uses the Transform reactor.
			</p>
		</div>
	);
}
