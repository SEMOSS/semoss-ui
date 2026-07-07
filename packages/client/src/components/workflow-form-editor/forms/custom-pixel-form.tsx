import { Field, FieldLabel, Textarea } from "@semoss/ui/next";
import type { WorkflowNode } from "@/pages/workflow/workflow.types";

interface CustomPixelStepFormProps {
	step: WorkflowNode;
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function CustomPixelStepForm({
	step,
	upstreamVars,
	onUpdate,
}: CustomPixelStepFormProps) {
	const c = step.config as unknown as Record<string, unknown>;
	const varHint =
		upstreamVars.length > 0
			? `\${${upstreamVars[upstreamVars.length - 1]}}`
			: undefined;

	return (
		<Field>
			<FieldLabel className="text-xs">Pixel expression</FieldLabel>
			<Textarea
				className="min-h-[100px] font-mono text-xs"
				value={(c.pixel ?? c.pixelExpression ?? "") as string}
				onChange={(e) =>
					onUpdate({
						...step,
						config: {
							...c,
							pixel: e.target.value,
							pixelExpression: e.target.value,
						} as unknown as typeof step.config,
					})
				}
				placeholder={
					varHint
						? `SqlQuery(database=["id"], query=["<encode>${varHint}</encode>"]);`
						: 'SqlQuery(database=["id"], query=["<encode>${query}</encode>"]);'
				}
				rows={5}
			/>
		</Field>
	);
}
