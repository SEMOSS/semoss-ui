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

export type DatabaseWizardCreateFromNLProps = {
	isLoading: boolean;
	llms: Array<{ database_id: string; database_name: string }>;
	selectedLlmId: string;
	includeSampleData: boolean;
	sampleRowCount: number;
	schemaJson: string;
	schemaSql: string;
	onDescriptionChange: (value: string) => void;
	onSelectLlm: (id: string) => void;
	onIncludeSampleDataChange: (value: boolean) => void;
	onSampleRowCountChange: (value: number) => void;
	onGenerateSchema: () => void;
	onSchemaJsonChange: (value: string) => void;
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
	schemaJson,
	schemaSql,
	onDescriptionChange,
	onSelectLlm,
	onIncludeSampleDataChange,
	onSampleRowCountChange,
	onGenerateSchema,
	onSchemaJsonChange,
	onGenerateSql,
	onExecuteSql,
}) => {
	const descriptionId = useId();
	const llmId = useId();
	const schemaJsonId = useId();
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
				<Label htmlFor={schemaJsonId}>Schema JSON</Label>
				<Textarea
					id={schemaJsonId}
					rows={6}
					value={schemaJson}
					onChange={(event) => onSchemaJsonChange(event.target.value)}
					placeholder="Paste or edit the schema JSON"
				/>
				<Button
					variant="outline"
					onClick={onGenerateSql}
					disabled={isLoading || !schemaJson}
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
