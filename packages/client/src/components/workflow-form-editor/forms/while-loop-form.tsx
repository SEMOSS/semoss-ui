import { Field, FieldLabel, Input } from "@semoss/ui/next";
import type { WhileLoopConfig } from "@/pages/workflow/workflow.types";
import { BoundInput } from "./shared";

export function WhileLoopForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: WhileLoopConfig;
	upstreamVars: string[];
	onChange: (c: WhileLoopConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Condition (JS expression)"
				value={config.condition}
				placeholder="${row_count} > 0"
				onChange={(v) => onChange({ ...config, condition: v })}
				upstreamVars={upstreamVars}
			/>
			<Field>
				<FieldLabel>Max Iterations (safety cap)</FieldLabel>
				<Input
					type="number"
					min={1}
					max={10000}
					value={config.maxIterations ?? 100}
					onChange={(e) =>
						onChange({
							...config,
							maxIterations: Number(e.target.value),
						})
					}
					placeholder="100"
				/>
				<p className="mt-1 text-muted-foreground text-xs">
					Execution stops after this many iterations even if the
					condition is still true.
				</p>
			</Field>
			<div className="space-y-1.5 rounded-md border border-border border-dashed p-3 text-muted-foreground text-xs">
				<p className="font-medium text-foreground text-xs">
					How While Loop works
				</p>
				<p>
					Before each iteration the condition is evaluated. If true,
					the inner sub-pipeline runs. Repeats until the condition is
					false or max iterations is reached.
				</p>
				<p>
					Build the inner pipeline steps using the workflow editor
					after placing this node on the canvas.
				</p>
			</div>
		</div>
	);
}
