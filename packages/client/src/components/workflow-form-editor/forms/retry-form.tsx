import { Field, FieldLabel, Input } from "@semoss/ui/next";
import type { RetryConfig } from "@/pages/workflow/workflow.types";

export function RetryForm({
	config,
	onChange,
}: {
	config: RetryConfig;
	onChange: (c: RetryConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>Max Attempts</FieldLabel>
				<Input
					type="number"
					min={1}
					max={20}
					value={config.maxAttempts ?? 3}
					onChange={(e) =>
						onChange({
							...config,
							maxAttempts: Number(e.target.value),
						})
					}
					placeholder="3"
				/>
			</Field>
			<Field>
				<FieldLabel>Backoff Between Attempts (seconds)</FieldLabel>
				<Input
					type="number"
					min={0}
					max={300}
					value={config.backoffSeconds ?? 5}
					onChange={(e) =>
						onChange({
							...config,
							backoffSeconds: Number(e.target.value),
						})
					}
					placeholder="5"
				/>
			</Field>
			<Field>
				<div className="flex items-center gap-2">
					{/* biome-ignore lint/correctness/useUniqueElementIds: single retry form instance per panel */}
					<input
						type="checkbox"
						id="retry-exp"
						checked={config.exponential ?? false}
						onChange={(e) =>
							onChange({
								...config,
								exponential: e.target.checked,
							})
						}
						className="h-3.5 w-3.5 rounded"
					/>
					<label
						htmlFor="retry-exp"
						className="cursor-pointer text-sm"
					>
						Exponential backoff
					</label>
				</div>
				<p className="mt-1 text-[10px] text-muted-foreground">
					When checked, wait multiplies by the attempt number: attempt
					1 → {config.backoffSeconds ?? 5}s, attempt 2 →{" "}
					{(config.backoffSeconds ?? 5) * 2}s, etc. Capped at 5
					minutes.
				</p>
			</Field>
			<div className="space-y-1.5 rounded-md border border-border border-dashed p-3 text-[10px] text-muted-foreground">
				<p className="font-medium text-foreground text-xs">
					How Retry works
				</p>
				<p>
					Wraps a sub-pipeline. On failure the sub-pipeline is re-run
					from the start. Scope changes from a failed attempt are
					discarded before each retry.
				</p>
				<p>
					Build the inner sub-pipeline using the workflow editor after
					placing this node on the canvas.
				</p>
			</div>
		</div>
	);
}
