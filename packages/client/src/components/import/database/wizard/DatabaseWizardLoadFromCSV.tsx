import type React from "react";
import { useId } from "react";
import { Button, Input, Label, P, Textarea } from "@semoss/ui/next";
import {
	DatabaseWizardSchemaEditor,
	type SchemaEditorColumn,
} from "./DatabaseWizardSchemaEditor";

export type DatabaseWizardLoadFromCSVProps = {
	isLoading: boolean;
	csvPreview: { headers: string[]; rows: string[][] } | null;
	schemaSql: string;
	schemaTableName: string;
	schemaColumns: SchemaEditorColumn[];
	onCsvFileSelected: (file: File) => void;
	onTableNameChange: (value: string) => void;
	onColumnChange: (index: number, patch: Partial<SchemaEditorColumn>) => void;
	onAddColumn: () => void;
	onDeleteColumn: (index: number) => void;
	onGenerateSql: () => void;
	onExecuteSql: () => void;
};

export const DatabaseWizardLoadFromCSV: React.FC<
	DatabaseWizardLoadFromCSVProps
> = ({
	isLoading,
	csvPreview,
	schemaSql,
	schemaTableName,
	schemaColumns,
	onCsvFileSelected,
	onTableNameChange,
	onColumnChange,
	onAddColumn,
	onDeleteColumn,
	onGenerateSql,
	onExecuteSql,
}) => {
	const csvFileId = useId();
	const csvSqlId = useId();

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<Label htmlFor={csvFileId}>CSV file</Label>
				<Input
					id={csvFileId}
					type="file"
					accept=".csv"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) {
							onCsvFileSelected(file);
						}
					}}
				/>
			</div>
			{csvPreview && (
				<div className="rounded-md border border-border p-3">
					<P className="text-muted-foreground text-sm">Preview</P>
					<div className="mt-2 overflow-auto text-xs">
						<div className="grid grid-cols-1 gap-1">
							<P className="font-medium">
								{csvPreview.headers.join(" | ")}
							</P>
							{csvPreview.rows.map((row) => {
								const rowKey = JSON.stringify(row);
								return <P key={rowKey}>{row.join(" | ")}</P>;
							})}
						</div>
					</div>
				</div>
			)}
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
			</div>
			<Button
				variant="outline"
				onClick={onGenerateSql}
				disabled={isLoading}
			>
				Generate SQL
			</Button>
			<div className="flex flex-col gap-2">
				<Label htmlFor={csvSqlId}>SQL Preview</Label>
				<Textarea
					id={csvSqlId}
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
