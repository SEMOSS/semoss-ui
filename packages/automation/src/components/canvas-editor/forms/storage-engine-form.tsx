import { Switch } from "@semoss/ui/next";
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
	/** When true, all fields are locked to their current values */
	readOnly?: boolean;
}

export function StorageEngineForm({
	config,
	upstreamVars,
	onChange,
	readOnly = false,
}: StorageEngineFormProps) {
	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Storage Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["STORAGE"]}
				required
				disabled={readOnly}
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
				readOnly={readOnly}
			/>
			{(config.operation === "download" ||
				config.operation === "upload") && (
				<BoundInput
					label={
						config.operation === "download"
							? "Save to Folder (optional)"
							: "Workspace File or Folder"
					}
					required={config.operation === "upload"}
					value={config.filePath}
					placeholder={
						config.operation === "download"
							? "/ (run workspace root)"
							: "input/report.csv"
					}
					onChange={(v) => onChange({ ...config, filePath: v })}
					upstreamVars={upstreamVars}
					readOnly={readOnly}
				/>
			)}
			{config.operation === "list" && (
				<BoundInput
					label="Only include file types (optional)"
					value={config.fileTypes}
					placeholder="pdf, png, jpg"
					description="Separate file extensions with commas. Leave blank to include every path returned by storage."
					onChange={(fileTypes) => onChange({ ...config, fileTypes })}
					upstreamVars={upstreamVars}
					readOnly={readOnly}
				/>
			)}
			{config.operation === "upload" && (
				<BoundInput
					label="Metadata (JSON, optional)"
					value={config.metadata}
					placeholder='{"key": "value"}'
					onChange={(v) => onChange({ ...config, metadata: v })}
					upstreamVars={upstreamVars}
					readOnly={readOnly}
					mono
				/>
			)}
			{config.operation === "read-base64" && (
				<div className="flex items-center gap-3">
					<Switch
						checked={config.convertToPdf}
						disabled={readOnly}
						onCheckedChange={(checked) =>
							onChange({ ...config, convertToPdf: checked })
						}
						aria-label="Convert supported files to PDF"
					/>
					<div>
						<p className="font-medium text-sm">Convert to PDF</p>
						<p className="text-muted-foreground text-xs">
							Convert supported document formats before reading.
						</p>
					</div>
				</div>
			)}
			{config.operation === "download" && (
				<BoundInput
					label="Version ID (optional)"
					value={config.version}
					placeholder="Use the latest version"
					onChange={(v) => onChange({ ...config, version: v })}
					upstreamVars={upstreamVars}
					readOnly={readOnly}
				/>
			)}
			{config.operation === "delete" && (
				<div className="flex items-center gap-3">
					<Switch
						checked={config.leaveFolderStructure}
						disabled={readOnly}
						onCheckedChange={(checked) =>
							onChange({
								...config,
								leaveFolderStructure: checked,
							})
						}
						aria-label="Keep empty folders"
					/>
					<div>
						<p className="font-medium text-sm">
							Keep empty folders
						</p>
						<p className="text-muted-foreground text-xs">
							Delete matching files without removing their folder
							structure.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
