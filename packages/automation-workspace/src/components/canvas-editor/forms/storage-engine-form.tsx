import type { StorageEngineConfig } from "../../../domain/automation.types";
import { EnginePickerField } from "./engine-picker-field";
import { BoundInput } from "./pill-input";

export interface StorageEngineFormProps {
	/** Current node config */
	config: StorageEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: StorageEngineConfig) => void;
}

export function StorageEngineForm({
	config,
	upstreamVars,
	onChange,
}: StorageEngineFormProps) {
	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Storage Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["STORAGE"]}
				required
				onChange={(e) =>
					onChange({
						...config,
						engineId: e.engine_id,
						engineName: e.engine_display_name ?? e.engine_name,
					})
				}
			/>
			<BoundInput
				label={`Storage Path${config.operation === "list" ? " (optional)" : ""}`}
				required={config.operation !== "list"}
				value={config.storagePath}
				placeholder="/documents/${folder}"
				onChange={(v) => onChange({ ...config, storagePath: v })}
				upstreamVars={upstreamVars}
			/>
			{(config.operation === "download" ||
				config.operation === "upload") && (
				<BoundInput
					label={
						config.operation === "download"
							? "Workspace Folder"
							: "Workspace File or Folder"
					}
					required
					value={config.filePath}
					placeholder={
						config.operation === "download"
							? "downloads"
							: "input/report.csv"
					}
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
