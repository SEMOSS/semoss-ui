import { useId } from "react";
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
import type { VectorEngineConfig } from "../../../domain/automation.types";
import { getPlaygroundParamDescription } from "../../../domain/automation-utils";
import { EnginePickerField } from "./engine-picker-field";
import { BoundInput } from "./shared";

export interface VectorEngineFormProps {
	/** Current node config */
	config: VectorEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: VectorEngineConfig) => void;
	/** Fields in this node's config currently marked as playground-fillable */
	playgroundFillable: string[];
	/** Called when the set of playground-fillable fields changes */
	onPlaygroundFieldsChange: (fields: string[]) => void;
	/** When false (business mode), advanced JSON fields like Filters are hidden */
	devMode?: boolean;
}

export function VectorEngineForm({
	config,
	upstreamVars,
	onChange,
	playgroundFillable,
	onPlaygroundFieldsChange,
	devMode = false,
}: VectorEngineFormProps) {
	const pgFillId = useId();
	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Search Documents Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["VECTOR"]}
				onChange={(e) =>
					onChange({
						...config,
						engineId: e.engine_id,
						engineName: e.engine_display_name ?? e.engine_name,
					})
				}
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
						<SelectItem value="search">Search with AI</SelectItem>
						<SelectItem value="add-file">Add Document</SelectItem>
						<SelectItem value="add-csv">Add CSV File</SelectItem>
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
						label="What to search for"
						value={config.command}
						placeholder="e.g. find documents about claims filed in 2024"
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
					/>
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id={pgFillId}
							checked={playgroundFillable.includes("command")}
							onChange={(e) => {
								const next = e.target.checked
									? [...playgroundFillable, "command"]
									: playgroundFillable.filter(
											(f) => f !== "command",
										);
								onPlaygroundFieldsChange(next);
							}}
							className="h-3.5 w-3.5 cursor-pointer accent-primary"
						/>
						<label
							htmlFor={pgFillId}
							className="cursor-pointer text-muted-foreground text-xs"
							title={getPlaygroundParamDescription(
								"vector-engine",
								"command",
							)}
						>
							Let Playground fill this field
						</label>
					</div>
					{playgroundFillable.includes("command") &&
						config.command && (
							<p className="text-amber-600 text-xs dark:text-amber-400">
								Current value will be overwritten if Playground
								provides input
							</p>
						)}
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
					/>
					<BoundInput
						label="Category (optional)"
						value={config.source}
						placeholder="internal-docs"
						onChange={(v) => onChange({ ...config, source: v })}
						upstreamVars={upstreamVars}
					/>
					<BoundInput
						label="Collection (optional)"
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
