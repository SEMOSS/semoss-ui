import type React from "react";
import { Button, DialogContent, P } from "@semoss/ui/next";
import type { WizardStep } from "@/utils/databaseWizard/types";
import { DatabaseWizardCreateFromNL } from "./DatabaseWizardCreateFromNL";
import { DatabaseWizardLoadFromCSV } from "./DatabaseWizardLoadFromCSV";
import { DatabaseWizardManageAndQuery } from "./DatabaseWizardManageAndQuery";
import { DatabaseWizardStepActions } from "./DatabaseWizardStepActions";
import { DatabaseWizardStepSelect } from "./DatabaseWizardStepSelect";

export type DatabaseWizardDialogProps = {
	step: WizardStep;
	isLoading: boolean;
	databaseName: string;
	databases: Array<{ database_id: string; database_name: string }>;
	llms: Array<{ database_id: string; database_name: string }>;
	schemaSql: string;
	querySql: string;
	schemaJson: string;
	csvPreview: { headers: string[]; rows: string[][] } | null;
	selectedDatabaseId: string;
	selectedLlmId: string;
	includeSampleData: boolean;
	sampleRowCount: number;
	onClose: () => void;
	onBack: () => void;
	onSelectStep: (nextStep: WizardStep) => void;
	onDatabaseNameChange: (value: string) => void;
	onSelectDatabase: (id: string) => void;
	onCreateDatabase: () => void;
	onDeleteDatabase: (id: string) => void;
	onLoadSchema: () => void;
	onDescriptionChange: (value: string) => void;
	onSelectLlm: (id: string) => void;
	onIncludeSampleDataChange: (value: boolean) => void;
	onSampleRowCountChange: (value: number) => void;
	onGenerateSchema: () => void;
	onSchemaJsonChange: (value: string) => void;
	onGenerateSql: () => void;
	onExecuteSql: () => void;
	onCsvFileSelected: (file: File) => void;
	onTableNameChange: (value: string) => void;
	onQuerySqlChange: (value: string) => void;
	onRunQuery: () => void;
	onRefreshSchema: () => void;
};

const renderStep = (props: DatabaseWizardDialogProps) => {
	switch (props.step) {
		case "select":
			return (
				<DatabaseWizardStepSelect
					isLoading={props.isLoading}
					databaseName={props.databaseName}
					databases={props.databases}
					selectedDatabaseId={props.selectedDatabaseId}
					onDatabaseNameChange={props.onDatabaseNameChange}
					onSelectDatabase={props.onSelectDatabase}
					onCreateDatabase={props.onCreateDatabase}
					onDeleteDatabase={props.onDeleteDatabase}
				/>
			);
		case "actions":
			return (
				<DatabaseWizardStepActions
					isLoading={props.isLoading}
					onSelectStep={props.onSelectStep}
					onRefreshSchema={props.onRefreshSchema}
				/>
			);
		case "create-nl":
			return (
				<DatabaseWizardCreateFromNL
					isLoading={props.isLoading}
					llms={props.llms}
					selectedLlmId={props.selectedLlmId}
					includeSampleData={props.includeSampleData}
					sampleRowCount={props.sampleRowCount}
					schemaJson={props.schemaJson}
					schemaSql={props.schemaSql}
					onDescriptionChange={props.onDescriptionChange}
					onSelectLlm={props.onSelectLlm}
					onIncludeSampleDataChange={props.onIncludeSampleDataChange}
					onSampleRowCountChange={props.onSampleRowCountChange}
					onGenerateSchema={props.onGenerateSchema}
					onSchemaJsonChange={props.onSchemaJsonChange}
					onGenerateSql={props.onGenerateSql}
					onExecuteSql={props.onExecuteSql}
				/>
			);
		case "csv":
			return (
				<DatabaseWizardLoadFromCSV
					isLoading={props.isLoading}
					csvPreview={props.csvPreview}
					schemaSql={props.schemaSql}
					onCsvFileSelected={props.onCsvFileSelected}
					onTableNameChange={props.onTableNameChange}
					onGenerateSql={props.onGenerateSql}
					onExecuteSql={props.onExecuteSql}
				/>
			);
		case "manage":
			return (
				<DatabaseWizardManageAndQuery
					isLoading={props.isLoading}
					schemaSql={props.schemaSql}
					querySql={props.querySql}
					onQuerySqlChange={props.onQuerySqlChange}
					onRunQuery={props.onRunQuery}
					onRefreshSchema={props.onRefreshSchema}
				/>
			);
		default:
			return null;
	}
};

export const DatabaseWizardDialog: React.FC<DatabaseWizardDialogProps> = (
	props,
) => {
	return (
		<DialogContent className="w-[720px]" data-testid="database-wizard">
			<div className="flex h-full w-full flex-col gap-4">
				<div className="flex items-center justify-between">
					<P
						className="text-base"
						data-testid="database-wizard-title"
					>
						Database Wizard
					</P>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={props.onBack}
							disabled={props.step === "select"}
						>
							Back
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={props.onClose}
						>
							Close
						</Button>
					</div>
				</div>
				{renderStep(props)}
			</div>
		</DialogContent>
	);
};
