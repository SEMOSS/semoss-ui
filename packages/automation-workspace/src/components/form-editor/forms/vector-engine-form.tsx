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
} from "../../../domain/automation.types";
import { BoundInput, EngineSelect } from "./shared";

export interface VectorEngineFormProps {
	/** Current node config */
	config: VectorEngineConfig;
	/** Vector engines the user has access to */
	engines: EngineOption[];
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: VectorEngineConfig) => void;
}

export function VectorEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
}: VectorEngineFormProps) {
	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Vector Engine"
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
							operation: v as VectorEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="search">
							Search (semantic)
						</SelectItem>
						<SelectItem value="add-file">Add File</SelectItem>
						<SelectItem value="add-csv">Add CSV</SelectItem>
						<SelectItem value="list">List Documents</SelectItem>
						<SelectItem value="delete">Delete Documents</SelectItem>
						<SelectItem value="download">
							Download Document
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			{config.operation === "search" && (
				<>
					<BoundInput
						label="Search Query"
						value={config.command}
						placeholder="find documents about ${topic}"
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
					/>
					<Field>
						<FieldLabel>Result Limit</FieldLabel>
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
						/>
					</Field>
					<BoundInput
						label="Filters (JSON, optional)"
						value={config.filters}
						placeholder='{"category": "reports"}'
						onChange={(v) => onChange({ ...config, filters: v })}
						upstreamVars={upstreamVars}
						mono
					/>
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
					/>
					<BoundInput
						label="Source (optional)"
						value={config.source}
						placeholder="internal-docs"
						onChange={(v) => onChange({ ...config, source: v })}
						upstreamVars={upstreamVars}
					/>
					<BoundInput
						label="Space (optional)"
						value={config.space}
						placeholder="finance"
						onChange={(v) => onChange({ ...config, space: v })}
						upstreamVars={upstreamVars}
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
					/>
					<BoundInput
						label="Param Values (JSON, optional)"
						value={config.paramValues}
						placeholder='{"delimiter": ","}'
						onChange={(v) =>
							onChange({ ...config, paramValues: v })
						}
						upstreamVars={upstreamVars}
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
				/>
			)}
		</div>
	);
}
