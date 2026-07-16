import { Plus, Trash2 } from "lucide-react";
import { Input } from "@semoss/ui/next";
import type { ParallelConfig } from "@/pages/workflow/workflow.types";

export function ParallelForm({
	config,
	onChange,
}: {
	config: ParallelConfig;
	onChange: (c: ParallelConfig) => void;
}) {
	const branches = config.branches ?? [];

	const addBranch = () =>
		onChange({
			...config,
			branches: [
				...branches,
				{
					label: `Branch ${String.fromCharCode(65 + branches.length)}`,
					outputVar: `branch_${String.fromCharCode(97 + branches.length)}_out`,
				},
			],
		});

	const updateBranch = (
		idx: number,
		field: "label" | "outputVar",
		val: string,
	) =>
		onChange({
			...config,
			branches: branches.map((b, i) =>
				i === idx ? { ...b, [field]: val } : b,
			),
		});

	const removeBranch = (idx: number) =>
		onChange({ ...config, branches: branches.filter((_, i) => i !== idx) });

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<p className="font-medium text-xs">Branches</p>
				{branches.map((b, idx) => (
					<div
						key={b.outputVar || b.label || idx}
						className="flex items-center gap-2 rounded-md border border-border p-2"
					>
						<div className="flex flex-1 flex-col gap-1">
							<Input
								value={b.label}
								onChange={(e) =>
									updateBranch(idx, "label", e.target.value)
								}
								placeholder="Branch A"
								className="text-xs"
							/>
							<Input
								value={b.outputVar}
								onChange={(e) =>
									updateBranch(
										idx,
										"outputVar",
										e.target.value,
									)
								}
								placeholder="branch_a_out"
								className="font-mono text-xs"
							/>
						</div>
						<button
							type="button"
							onClick={() => removeBranch(idx)}
							className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
				))}
				<button
					type="button"
					onClick={addBranch}
					className="flex items-center gap-1.5 rounded-md border border-border border-dashed px-3 py-2 text-muted-foreground text-xs hover:bg-accent hover:text-foreground"
				>
					<Plus className="h-3.5 w-3.5" />
					Add Branch
				</button>
			</div>
			<div className="space-y-1.5 rounded-md border border-border border-dashed p-3 text-[10px] text-muted-foreground">
				<p className="font-medium text-foreground text-xs">
					How Parallel works
				</p>
				<p>
					Each branch runs its own sub-pipeline and writes results to
					its output variable. After all branches complete, their
					outputs are available to downstream nodes.
				</p>
				<p>
					Build each branch's sub-pipeline using the workflow editor
					after placing this node on the canvas.
				</p>
			</div>
		</div>
	);
}
