import type React from "react";
import { useId } from "react";
import {
	Button,
	Checkbox,
	Input,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import {
	DatabaseWizardSchemaEditor,
	type SchemaEditorColumn,
} from "./DatabaseWizardSchemaEditor";

export type DatabaseWizardCreateFromNLProps = {
	isLoading: boolean;
	llms: Array<{ database_id: string; database_name: string }>;
	selectedLlmId: string;
	includeSampleData: boolean;
	sampleRowCount: number;
	schemaSql: string;
	schemaTableName: string;
	schemaColumns: SchemaEditorColumn[];
	onDescriptionChange: (value: string) => void;
	onSelectLlm: (id: string) => void;
	onIncludeSampleDataChange: (value: boolean) => void;
	onSampleRowCountChange: (value: number) => void;
	onGenerateSchema: () => void;
	onTableNameChange: (value: string) => void;
	onColumnChange: (index: number, patch: Partial<SchemaEditorColumn>) => void;
	onAddColumn: () => void;
	onDeleteColumn: (index: number) => void;
	onGenerateSql: () => void;
	onExecuteSql: () => void;
};

export const DatabaseWizardCreateFromNL: React.FC<
	DatabaseWizardCreateFromNLProps
> = ({
	isLoading,
	llms,
	selectedLlmId,
	includeSampleData,
	sampleRowCount,
	schemaSql,
	schemaTableName,
	schemaColumns,
	onDescriptionChange,
	onSelectLlm,
	onIncludeSampleDataChange,
	onSampleRowCountChange,
	onGenerateSchema,
	onTableNameChange,
	onColumnChange,
	onAddColumn,
	onDeleteColumn,
	onGenerateSql,
	onExecuteSql,
}) => {
	const descriptionId = useId();
	const llmId = useId();
	const schemaSqlId = useId();

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<Label htmlFor={descriptionId}>Description</Label>
				<Textarea
					id={descriptionId}
					rows={4}
					placeholder="Describe the tables you want to create"
					onChange={(event) =>
						onDescriptionChange(event.target.value)
					}
				/>
			</div>
			<div className="grid gap-2 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<Label htmlFor={llmId}>LLM</Label>
					<Select value={selectedLlmId} onValueChange={onSelectLlm}>
						<SelectTrigger id={llmId}>
							<SelectValue placeholder="Choose model" />
						</SelectTrigger>
						<SelectContent>
							{llms.map((llm) => (
								<SelectItem
									key={llm.database_id}
									value={llm.database_id}
								>
									{llm.database_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2">
					<Label>Sample data</Label>
					<div className="flex items-center gap-2">
						<Checkbox
							checked={includeSampleData}
							onCheckedChange={(value) =>
								onIncludeSampleDataChange(Boolean(value))
							}
						/>
						<P className="text-sm">Generate sample data</P>
					</div>
					<Input
						type="number"
						min={1}
						max={20}
						value={sampleRowCount}
						disabled={!includeSampleData}
						onChange={(event) =>
							onSampleRowCountChange(Number(event.target.value))
						}
					/>
				</div>
			</div>
			<Button
				onClick={onGenerateSchema}
				disabled={isLoading || !selectedLlmId}
			>
				Generate schema
			</Button>
			<div className="flex flex-col gap-2">
				<Label>Schema</Label>
				<DatabaseWizardSchemaEditor
					tableName={schemaTableName}
					columns={schemaColumns}
					onTableNameChange={onTableNameChange}
					onColumnChange={onColumnChange}
					onAddColumn={onAddColumn}
					onDeleteColumn={onDeleteColumn}
				/>
				<Button
					variant="outline"
					onClick={onGenerateSql}
					disabled={isLoading}
				>
					Generate SQL
				</Button>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor={schemaSqlId}>SQL Preview</Label>
				<Textarea
					id={schemaSqlId}
					rows={6}
					value={schemaSql}
					readOnly
					className="max-h-40 overflow-y-auto"
				/>
				<Button
					variant="default"
					onClick={onExecuteSql}
					disabled={isLoading || !schemaSql}
				>
					Execute SQL
				</Button>
			</div>
		</div>
	);
};
