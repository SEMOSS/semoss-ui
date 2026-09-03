import { Field, FieldLabel, Input } from "@semoss/ui/next";
import type { VectorEngineConfig } from "../../../domain/automation.types";
import { EnginePickerField } from "./engine-picker-field";
import { BoundInput } from "./pill-input";

export interface VectorEngineFormProps {
	/** Current node config */
	config: VectorEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: VectorEngineConfig) => void;
	/** When false (business mode), advanced JSON fields like Filters are hidden */
	devMode?: boolean;
	/** When true, all fields are locked to their current values */
	readOnly?: boolean;
}

export function VectorEngineForm({
	config,
	upstreamVars,
	onChange,
	devMode = false,
	readOnly = false,
}: VectorEngineFormProps) {
	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Search Documents Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["VECTOR"]}
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
			{config.operation === "search" && (
				<>
					<BoundInput
						label="What to search for"
						required
						value={config.command}
						placeholder="e.g. find documents about claims filed in 2024"
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
					<Field>
						<FieldLabel>Max Results</FieldLabel>
						<Input
							type="number"
							min={1}
							value={config.limit ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									limit: e.target.value
										? Number(e.target.value)
										: 5,
								})
							}
							placeholder="5"
							disabled={readOnly}
						/>
					</Field>
					{devMode && (
						<BoundInput
							label="Filters (JSON, optional)"
							value={config.filters}
							placeholder='{"category": "reports"}'
							onChange={(v) =>
								onChange({ ...config, filters: v })
							}
							upstreamVars={upstreamVars}
							readOnly={readOnly}
							mono
						/>
					)}
				</>
			)}
			{config.operation === "add-file" && (
				<>
					<BoundInput
						label="File Path"
						value={config.filePath}
						placeholder="/path/to/file.pdf"
						onChange={(v) => onChange({ ...config, filePath: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
					<BoundInput
						label="Category (optional)"
						value={config.source}
						placeholder="internal-docs"
						onChange={(v) => onChange({ ...config, source: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
					<BoundInput
						label="Collection (optional)"
						value={config.space}
						placeholder="finance"
						onChange={(v) => onChange({ ...config, space: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
				</>
			)}
			{config.operation === "add-csv" && (
				<>
					<BoundInput
						label="File Paths (comma-separated)"
						value={config.filePaths}
						placeholder="/data/embeddings.csv"
						onChange={(v) => onChange({ ...config, filePaths: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
					<BoundInput
						label="Param Values (JSON, optional)"
						value={config.paramValues}
						placeholder='{"delimiter": ","}'
						onChange={(v) =>
							onChange({ ...config, paramValues: v })
						}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
						mono
					/>
				</>
			)}
			{(config.operation === "delete" ||
				config.operation === "download") && (
				<BoundInput
					label="File Names (comma-separated)"
					value={config.fileNames}
					placeholder="doc1.pdf, doc2.docx"
					onChange={(v) => onChange({ ...config, fileNames: v })}
					upstreamVars={upstreamVars}
					readOnly={readOnly}
				/>
			)}
		</div>
	);
}
