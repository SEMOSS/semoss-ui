import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { EngineOption, StorageEngineConfig } from "../../automation.types";
import { BoundInput, EngineSelect } from "./shared";

export function StorageEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
}: {
	config: StorageEngineConfig;
	engines: EngineOption[];
	upstreamVars: string[];
	onChange: (c: StorageEngineConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Storage Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => onChange({ ...config, engineId: v })}
			/>
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						onChange({
							...config,
							operation: v as StorageEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="list">List</SelectItem>
						<SelectItem value="download">Download</SelectItem>
						<SelectItem value="upload">Upload</SelectItem>
						<SelectItem value="delete">Delete</SelectItem>
						<SelectItem value="read-base64">
							Read as Base64
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="Storage Path"
				value={config.storagePath}
				placeholder="/documents/${folder}"
				onChange={(v) => onChange({ ...config, storagePath: v })}
				upstreamVars={upstreamVars}
			/>
			{(config.operation === "download" ||
				config.operation === "upload") && (
				<BoundInput
					label="Local File Path"
					value={config.filePath}
					placeholder="/tmp/output.csv"
					onChange={(v) => onChange({ ...config, filePath: v })}
					upstreamVars={upstreamVars}
				/>
			)}
			{config.operation === "upload" && (
				<BoundInput
					label="Metadata (JSON, optional)"
					value={config.metadata}
					placeholder='{"key": "value"}'
					onChange={(v) => onChange({ ...config, metadata: v })}
					upstreamVars={upstreamVars}
					mono
				/>
			)}
		</div>
	);
}
