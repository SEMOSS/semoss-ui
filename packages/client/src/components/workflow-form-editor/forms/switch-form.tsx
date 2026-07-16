import { Plus, Trash2 } from "lucide-react";
import { Field, FieldLabel, Input } from "@semoss/ui/next";
import type { SwitchConfig } from "@/pages/workflow/workflow.types";

export function SwitchForm({
	config,
	upstreamVars: _upstreamVars,
	onChange,
}: {
	config: SwitchConfig;
	upstreamVars: string[];
	onChange: (c: SwitchConfig) => void;
}) {
	const cases = config.cases ?? [];

	const addCase = () =>
		onChange({
			...config,
			cases: [...cases, { value: "", label: `Case ${cases.length + 1}` }],
		});

	const updateCase = (idx: number, field: "value" | "label", val: string) =>
		onChange({
			...config,
			cases: cases.map((c, i) =>
				i === idx ? { ...c, [field]: val } : c,
			),
		});

	const removeCase = (idx: number) =>
		onChange({ ...config, cases: cases.filter((_, i) => i !== idx) });

	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>Switch On Variable</FieldLabel>
				<Input
					value={config.switchVar}
					onChange={(e) =>
						onChange({ ...config, switchVar: e.target.value })
					}
					placeholder="doc_type"
					className="font-mono text-sm"
				/>
				<p className="mt-1 text-[10px] text-muted-foreground">
					The value of{" "}
					<code className="rounded bg-muted px-1">{`\${${config.switchVar || "var"}}`}</code>{" "}
					is matched against the cases below.
				</p>
			</Field>
			<div className="flex flex-col gap-2">
				<p className="font-medium text-xs">Cases</p>
				{cases.length === 0 && (
					<p className="text-[10px] text-muted-foreground">
						No cases yet. Add one below.
					</p>
				)}
				{cases.map((c, idx) => (
					<div
						key={c.value || idx}
						className="flex items-center gap-2 rounded-md border border-border p-2"
					>
						<div className="flex flex-1 flex-col gap-1">
							<Input
								value={c.value}
								onChange={(e) =>
									updateCase(idx, "value", e.target.value)
								}
								placeholder="match value"
								className="font-mono text-xs"
							/>
							<Input
								value={c.label}
								onChange={(e) =>
									updateCase(idx, "label", e.target.value)
								}
								placeholder="branch label"
								className="text-xs"
							/>
						</div>
						<button
							type="button"
							onClick={() => removeCase(idx)}
							className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
				))}
				<button
					type="button"
					onClick={addCase}
					className="flex items-center gap-1.5 rounded-md border border-border border-dashed px-3 py-2 text-muted-foreground text-xs hover:bg-accent hover:text-foreground"
				>
					<Plus className="h-3.5 w-3.5" />
					Add Case
				</button>
			</div>
			<div className="rounded-md border border-border border-dashed p-3 text-[10px] text-muted-foreground">
				A <span className="font-medium text-foreground">Default</span>{" "}
				branch handles values that don't match any case. Build
				sub-pipelines for each case in the workflow editor after placing
				this node on the canvas.
			</div>
		</div>
	);
}
