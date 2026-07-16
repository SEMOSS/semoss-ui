import { Field, FieldLabel, Input } from "@semoss/ui/next";
import type { TryCatchConfig } from "@/pages/workflow/workflow.types";

export function TryCatchForm({
	config,
	upstreamVars: _upstreamVars,
	onChange,
}: {
	config: TryCatchConfig;
	upstreamVars: string[];
	onChange: (c: TryCatchConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>Error Variable Name</FieldLabel>
				<Input
					value={config.errorVar}
					onChange={(e) =>
						onChange({ ...config, errorVar: e.target.value })
					}
					placeholder="error"
					className="font-mono text-sm"
				/>
				<p className="mt-1 text-muted-foreground text-xs">
					On failure, the error message is injected into scope as{" "}
					<code className="rounded bg-muted px-1">{`\${${config.errorVar || "error"}}`}</code>{" "}
					so your Catch branch can reference it.
				</p>
			</Field>
			<div className="space-y-1.5 rounded-md border border-border border-dashed p-3 text-muted-foreground text-xs">
				<p className="font-medium text-foreground text-xs">
					How Try / Catch works
				</p>
				<p>
					The <span className="font-medium text-foreground">Try</span>{" "}
					branch runs first. If any node fails, execution moves to the{" "}
					<span className="font-medium text-foreground">Catch</span>{" "}
					branch. Success in Try means Catch never runs.
				</p>
				<p>
					Build the Try and Catch sub-pipelines using the workflow
					editor after placing this node on the canvas.
				</p>
			</div>
		</div>
	);
}
