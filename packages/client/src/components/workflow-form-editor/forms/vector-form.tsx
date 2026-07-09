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
	EngineOption,
	VectorEngineConfig,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";
import { EngineSelect } from "./shared";

interface VectorStepFormProps {
	step: WorkflowNode;
	engines: EngineOption[];
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function VectorStepForm({
	step,
	engines,
	upstreamVars,
	onUpdate,
}: VectorStepFormProps) {
	const c = step.config as unknown as VectorEngineConfig;
	const update = (patch: Partial<VectorEngineConfig>) =>
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
				label="Vector Engine"
				engines={engines}
				value={c.engineId ?? ""}
				onChange={(v) => update({ engineId: v })}
			/>
			<Field>
				<FieldLabel className="text-xs">Operation</FieldLabel>
				<Select
					value={c.operation ?? "search"}
					onValueChange={(v) =>
						update({
							operation: v as VectorEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="search" className="text-xs">
							Search
						</SelectItem>
						<SelectItem value="add-file" className="text-xs">
							Add File
						</SelectItem>
						<SelectItem value="add-csv" className="text-xs">
							Add CSV
						</SelectItem>
						<SelectItem value="list" className="text-xs">
							List Documents
						</SelectItem>
						<SelectItem value="delete" className="text-xs">
							Delete Document
						</SelectItem>
						<SelectItem value="download" className="text-xs">
							Download File
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>

			{(c.operation ?? "search") === "search" && (
				<>
					<Field>
						<FieldLabel className="text-xs">
							Search query
						</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.command ?? ""}
							onChange={(e) =>
								update({ command: e.target.value })
							}
							placeholder={varHint ?? "Enter search query…"}
						/>
					</Field>
					<Field>
						<FieldLabel className="text-xs">Limit</FieldLabel>
						<Input
							type="number"
							className="h-8 text-xs"
							value={c.limit ?? 5}
							onChange={(e) =>
								update({ limit: Number(e.target.value) })
							}
							placeholder="5"
						/>
					</Field>
				</>
			)}

			{c.operation === "add-file" && (
				<>
					<Field>
						<FieldLabel className="text-xs">File path</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.filePath ?? ""}
							onChange={(e) =>
								update({ filePath: e.target.value })
							}
							placeholder={varHint ?? "[storageOutput]"}
						/>
					</Field>
					<Field>
						<FieldLabel className="text-xs">
							Source name (optional)
						</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.source ?? ""}
							onChange={(e) => update({ source: e.target.value })}
							placeholder="Document name or identifier"
						/>
					</Field>
				</>
			)}

			{c.operation === "add-csv" && (
				<>
					<Field>
						<FieldLabel className="text-xs">
							CSV file path
						</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.filePaths ?? ""}
							onChange={(e) =>
								update({ filePaths: e.target.value })
							}
							placeholder={varHint ?? "path/to/file.csv"}
						/>
					</Field>
					<Field>
						<FieldLabel className="text-xs">
							Param values (optional JSON)
						</FieldLabel>
						<Input
							className="h-8 font-mono text-xs"
							value={c.paramValues ?? ""}
							onChange={(e) =>
								update({ paramValues: e.target.value })
							}
							placeholder='{"chunkSize": 512}'
						/>
					</Field>
				</>
			)}

			{(c.operation === "delete" || c.operation === "download") && (
				<Field>
					<FieldLabel className="text-xs">File name(s)</FieldLabel>
					<Input
						className="h-8 text-xs"
						value={c.fileNames ?? ""}
						onChange={(e) => update({ fileNames: e.target.value })}
						placeholder="filename.pdf or comma-separated list"
					/>
				</Field>
			)}
		</div>
	);
}
