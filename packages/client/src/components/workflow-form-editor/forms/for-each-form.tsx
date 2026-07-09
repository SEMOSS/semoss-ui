import { Loader2, Play, Plus, Repeat, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type { WorkflowNode } from "@/pages/workflow/workflow.types";

interface ForEachStepFormProps {
	step: WorkflowNode;
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

interface ForEachConfig {
	sourceVar: string;
	iteratorVar: string;
	rowKeyField: string;
	nodes: WorkflowNode[];
}

export function ForEachStepForm({
	step,
	upstreamVars,
	onUpdate,
}: ForEachStepFormProps) {
	const config: ForEachConfig = (step.config as unknown as ForEachConfig) ?? {
		sourceVar: "",
		iteratorVar: "row",
		rowKeyField: "",
		nodes: [],
	};

	const updateConfig = useCallback(
		(partial: Partial<ForEachConfig>) => {
			onUpdate({
				...step,
				config: {
					...config,
					...partial,
				} as unknown as import("@/pages/workflow/workflow.types").NodeConfig,
			});
		},
		[step, config, onUpdate],
	);

	const addInnerNode = useCallback(() => {
		const newNode: WorkflowNode = {
			id: `inner-${Date.now()}`,
			type: "custom-pixel",
			position: { x: 0, y: 0 },
			label: `Step ${(config.nodes?.length ?? 0) + 1}`,
			outputVar: `inner_out_${(config.nodes?.length ?? 0) + 1}`,
			config: { pixel: "" },
		};
		updateConfig({ nodes: [...(config.nodes ?? []), newNode] });
	}, [config.nodes, updateConfig]);

	const updateInnerNode = useCallback(
		(index: number, partial: Partial<WorkflowNode>) => {
			const nodes = [...(config.nodes ?? [])];
			nodes[index] = { ...nodes[index], ...partial };
			updateConfig({ nodes });
		},
		[config.nodes, updateConfig],
	);

	const removeInnerNode = useCallback(
		(index: number) => {
			const nodes = [...(config.nodes ?? [])];
			nodes.splice(index, 1);
			updateConfig({ nodes });
		},
		[config.nodes, updateConfig],
	);

	return (
		<div className="space-y-4">
			<div className="rounded-lg border bg-muted/30 p-3">
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					<Repeat className="h-3.5 w-3.5" />
					<span>
						Iterates over each row in the source variable and runs
						the inner steps per row. Access fields via{" "}
						<code className="rounded bg-muted px-1 font-mono">
							{"${"}
							{config.iteratorVar || "row"}.fieldName{"}"}
						</code>
					</span>
				</div>
			</div>

			<Field>
				<FieldLabel>Source Variable</FieldLabel>
				{upstreamVars.length > 0 ? (
					<Select
						value={config.sourceVar}
						onValueChange={(value) =>
							updateConfig({ sourceVar: value })
						}
					>
						<SelectTrigger className="h-9">
							<SelectValue placeholder="Select upstream output..." />
						</SelectTrigger>
						<SelectContent>
							{upstreamVars.map((v) => (
								<SelectItem key={v} value={v}>
									{"${"}
									{v}
									{"}"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<Input
						className="h-9 font-mono text-sm"
						value={config.sourceVar}
						onChange={(e) =>
							updateConfig({ sourceVar: e.target.value })
						}
						placeholder="e.g., source_rows"
					/>
				)}
				<p className="mt-1 text-muted-foreground text-xs">
					Must be an array of objects (use "Rows → Objects" transform
					on the upstream node)
				</p>
			</Field>

			<div className="grid grid-cols-2 gap-3">
				<Field>
					<FieldLabel>Iterator Variable</FieldLabel>
					<Input
						className="h-9 font-mono text-sm"
						value={config.iteratorVar}
						onChange={(e) =>
							updateConfig({ iteratorVar: e.target.value })
						}
						placeholder="row"
					/>
				</Field>
				<Field>
					<FieldLabel>Row Key Field</FieldLabel>
					<Input
						className="h-9 font-mono text-sm"
						value={config.rowKeyField}
						onChange={(e) =>
							updateConfig({ rowKeyField: e.target.value })
						}
						placeholder="e.g., file_id"
					/>
					<p className="mt-1 text-muted-foreground text-xs">
						Used for identifying rows in failure reports
					</p>
				</Field>
			</div>

			{/* Inner nodes */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<FieldLabel>Inner Steps (per row)</FieldLabel>
					<Button
						size="sm"
						variant="outline"
						onClick={addInnerNode}
						className="h-7 text-xs"
					>
						<Plus className="mr-1 h-3 w-3" />
						Add Inner Step
					</Button>
				</div>

				{(!config.nodes || config.nodes.length === 0) && (
					<div className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground text-xs">
						No inner steps yet. Add steps that will run for each
						row.
					</div>
				)}

				{config.nodes?.map((innerNode, index) => (
					<div
						key={innerNode.id}
						className="space-y-2 rounded-lg border bg-card p-3"
					>
						<div className="flex items-center justify-between">
							<span className="font-medium text-xs">
								{index + 1}. {innerNode.label}
							</span>
							<button
								type="button"
								onClick={() => removeInnerNode(index)}
								className="text-muted-foreground hover:text-destructive"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</button>
						</div>
						<Field>
							<FieldLabel className="text-xs">Label</FieldLabel>
							<Input
								className="h-8 text-xs"
								value={innerNode.label}
								onChange={(e) =>
									updateInnerNode(index, {
										label: e.target.value,
									})
								}
							/>
						</Field>
						<Field>
							<FieldLabel className="text-xs">
								Output Variable
							</FieldLabel>
							<Input
								className="h-8 font-mono text-xs"
								value={innerNode.outputVar}
								onChange={(e) =>
									updateInnerNode(index, {
										outputVar: e.target.value,
									})
								}
							/>
						</Field>
						<Field>
							<FieldLabel className="text-xs">
								Pixel (builtPixel)
							</FieldLabel>
							<textarea
								className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
								rows={3}
								value={innerNode.builtPixel ?? ""}
								onChange={(e) =>
									updateInnerNode(index, {
										builtPixel: e.target.value,
									})
								}
								placeholder={`e.g., LLM(engine=["\${config.model}"], command=["<encode>\${${config.iteratorVar || "row"}.text}</encode>"]);`}
							/>
						</Field>
					</div>
				))}
			</div>

			{/* Test Section */}
			<TestForEachSection config={config} />
		</div>
	);
}

// ── Test Section Component ────────────────────────────────────────────────────

function TestForEachSection({ config }: { config: ForEachConfig }) {
	const { monolithStore } = useRootStore();
	const [mockInput, setMockInput] = useState("");
	const [testing, setTesting] = useState(false);
	const [testOutput, setTestOutput] = useState<string | null>(null);

	const runTest = useCallback(async () => {
		if (!mockInput.trim()) {
			toast.error("Provide mock input data (JSON array)");
			return;
		}
		if (!config.nodes || config.nodes.length === 0) {
			toast.error("No inner steps to test");
			return;
		}

		let rows: Record<string, unknown>[];
		try {
			rows = JSON.parse(mockInput);
			if (!Array.isArray(rows) || rows.length === 0) {
				toast.error("Mock input must be a non-empty JSON array");
				return;
			}
		} catch {
			toast.error("Invalid JSON — must be an array of objects");
			return;
		}

		setTesting(true);
		setTestOutput(null);

		try {
			// Test with first row only, first inner step only
			const firstRow = rows[0] as Record<string, unknown>;
			const iterVar = config.iteratorVar || "row";
			const firstInnerNode = config.nodes[0];
			let pixel = firstInnerNode.builtPixel ?? "";

			// Substitute ${iteratorVar.field} with values from first row
			for (const [key, value] of Object.entries(firstRow)) {
				pixel = pixel.replaceAll(
					`\${${iterVar}.${key}}`,
					String(value ?? ""),
				);
			}
			// Also substitute ${iteratorVar} with full row JSON
			pixel = pixel.replaceAll(
				`\${${iterVar}}`,
				JSON.stringify(firstRow),
			);

			const result = await monolithStore.runQuery(pixel);
			const pixelReturns = result.pixelReturn ?? [];
			const lastReturn = pixelReturns[pixelReturns.length - 1];
			const output = lastReturn?.output;
			const outputStr =
				typeof output === "string"
					? output
					: JSON.stringify(output, null, 2);
			setTestOutput(outputStr);
			toast.success("Test passed (first row, first inner step)");
		} catch (err) {
			setTestOutput(`Error: ${(err as Error).message}`);
			toast.error("Test failed");
		} finally {
			setTesting(false);
		}
	}, [mockInput, config, monolithStore]);

	return (
		<div className="space-y-3 rounded-xl border bg-muted/30 p-4">
			<div className="flex items-center justify-between">
				<span className="font-medium text-sm">Test For-Each</span>
				<span className="text-muted-foreground text-xs">
					Tests first inner step with first row of mock data
				</span>
			</div>

			<Field>
				<FieldLabel className="text-xs">
					Mock Input (JSON array for ${config.sourceVar || "source"})
				</FieldLabel>
				<textarea
					className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
					rows={4}
					value={mockInput}
					onChange={(e) => setMockInput(e.target.value)}
					placeholder={`[{"file_name": "test.txt", "file_path": "/tmp/test.txt", "file_id": "test-1"}]`}
				/>
			</Field>

			<Button
				size="sm"
				onClick={runTest}
				disabled={testing}
				className="w-full"
			>
				{testing ? (
					<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
				) : (
					<Play className="mr-1.5 h-3.5 w-3.5" />
				)}
				Test First Row
			</Button>

			{testOutput && (
				<div className="max-h-40 overflow-auto rounded-md border bg-background p-2">
					<pre className="whitespace-pre-wrap font-mono text-xs">
						{testOutput}
					</pre>
				</div>
			)}
		</div>
	);
}
