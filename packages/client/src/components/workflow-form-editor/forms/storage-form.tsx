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
	StorageEngineConfig,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";
import { EngineSelect } from "./shared";

interface StorageStepFormProps {
	step: WorkflowNode;
	engines: EngineOption[];
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function StorageStepForm({
	step,
	engines,
	upstreamVars,
	onUpdate,
}: StorageStepFormProps) {
	const c = step.config as unknown as StorageEngineConfig;
	const update = (patch: Partial<StorageEngineConfig>) =>
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
				label="Storage Engine"
				engines={engines}
				value={c.engineId ?? ""}
				onChange={(v) => update({ engineId: v })}
			/>
			<Field>
				<FieldLabel className="text-xs">Operation</FieldLabel>
				<Select
					value={c.operation ?? "list"}
					onValueChange={(v) =>
						update({
							operation: v as StorageEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="list" className="text-xs">
							List path
						</SelectItem>
						<SelectItem value="download" className="text-xs">
							Download file
						</SelectItem>
						<SelectItem value="upload" className="text-xs">
							Upload file
						</SelectItem>
						<SelectItem value="delete" className="text-xs">
							Delete
						</SelectItem>
						<SelectItem value="read-base64" className="text-xs">
							Read as base64
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>

			{(c.operation ?? "list") === "list" && (
				<Field>
					<FieldLabel className="text-xs">Storage path</FieldLabel>
					<Input
						className="h-8 text-xs"
						value={c.storagePath ?? "/"}
						onChange={(e) =>
							update({ storagePath: e.target.value })
						}
						placeholder="/"
					/>
				</Field>
			)}

			{c.operation === "download" && (
				<>
					<Field>
						<FieldLabel className="text-xs">
							Remote path (storage)
						</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.storagePath ?? ""}
							onChange={(e) =>
								update({ storagePath: e.target.value })
							}
							placeholder="/folder/file.pdf"
						/>
					</Field>
					<Field>
						<FieldLabel className="text-xs">
							Local destination path
						</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.filePath ?? ""}
							onChange={(e) =>
								update({ filePath: e.target.value })
							}
							placeholder={varHint ?? "/local/path/file.pdf"}
						/>
					</Field>
				</>
			)}

			{c.operation === "upload" && (
				<>
					<Field>
						<FieldLabel className="text-xs">
							Local source path
						</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.filePath ?? ""}
							onChange={(e) =>
								update({ filePath: e.target.value })
							}
							placeholder={varHint ?? "/local/path/file.pdf"}
						/>
					</Field>
					<Field>
						<FieldLabel className="text-xs">
							Remote destination path
						</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.storagePath ?? ""}
							onChange={(e) =>
								update({ storagePath: e.target.value })
							}
							placeholder="/remote/folder/"
						/>
					</Field>
					<Field>
						<FieldLabel className="text-xs">
							Metadata (optional JSON)
						</FieldLabel>
						<Input
							className="h-8 font-mono text-xs"
							value={c.metadata ?? ""}
							onChange={(e) =>
								update({ metadata: e.target.value })
							}
							placeholder='{"key": "value"}'
						/>
					</Field>
				</>
			)}

			{(c.operation === "delete" || c.operation === "read-base64") && (
				<Field>
					<FieldLabel className="text-xs">Storage path</FieldLabel>
					<Input
						className="h-8 text-xs"
						value={c.storagePath ?? ""}
						onChange={(e) =>
							update({ storagePath: e.target.value })
						}
						placeholder="/folder/file.pdf"
					/>
				</Field>
			)}
		</div>
	);
}
