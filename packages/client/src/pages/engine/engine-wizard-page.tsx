import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect } from "react";
import { P } from "@semoss/ui/next";
import { DatabaseWizardCreateFromNL } from "@/components/import/database/wizard/DatabaseWizardCreateFromNL";
import { DatabaseWizardLoadFromCSV } from "@/components/import/database/wizard/DatabaseWizardLoadFromCSV";
import { DatabaseWizardManageAndQuery } from "@/components/import/database/wizard/DatabaseWizardManageAndQuery";
import { DatabaseWizardStepActions } from "@/components/import/database/wizard/DatabaseWizardStepActions";
import { useDatabaseWizard, useEngine } from "@/hooks";

export const EngineWizardPage: React.FC = observer(() => {
	const { active } = useEngine();
	const wizard = useDatabaseWizard({
		mode: "engine",
		databaseId: active.id,
	});

	useEffect(() => {
		if (!active.id) return;
		wizard.actions.listLlms();
		wizard.actions.refreshSchema(active.id);
	}, [active.id]);

	if (!active.id) {
		return (
			<div className="p-4">
				<P className="text-muted-foreground">Database not available.</P>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<P className="text-base">Database Wizard</P>
			</div>
			<DatabaseWizardStepActions
				isLoading={wizard.state.isLoading}
				activeStep={wizard.state.step}
				onToggleStep={wizard.setters.setStep}
				onRefreshSchema={() => wizard.actions.refreshSchema()}
				renderCreate={() => (
					<DatabaseWizardCreateFromNL
						isLoading={wizard.state.isLoading}
						llms={wizard.state.llms}
						selectedLlmId={wizard.state.selectedLlmId}
						includeSampleData={wizard.state.includeSampleData}
						sampleRowCount={wizard.state.sampleRowCount}
						schemaSql={wizard.state.schemaSql}
						schemaTableName={wizard.state.schemaTableName}
						schemaColumns={wizard.state.schemaColumns}
						onDescriptionChange={wizard.setters.setDescription}
						onSelectLlm={wizard.setters.setSelectedLlmId}
						onIncludeSampleDataChange={
							wizard.setters.setIncludeSampleData
						}
						onSampleRowCountChange={
							wizard.setters.setSampleRowCount
						}
						onGenerateSchema={wizard.actions.generateSchemaFromNl}
						onTableNameChange={wizard.setters.setSchemaTableName}
						onColumnChange={wizard.actions.updateSchemaColumn}
						onAddColumn={wizard.actions.addSchemaColumn}
						onDeleteColumn={wizard.actions.deleteSchemaColumn}
						onGenerateSql={wizard.actions.generateSqlFromSchema}
						onExecuteSql={wizard.actions.executeSql}
					/>
				)}
				renderCsv={() => (
					<DatabaseWizardLoadFromCSV
						isLoading={wizard.state.isLoading}
						csvPreview={wizard.state.csvPreview}
						schemaSql={wizard.state.schemaSql}
						schemaTableName={wizard.state.schemaTableName}
						schemaColumns={wizard.state.schemaColumns}
						onCsvFileSelected={wizard.actions.handleCsvFileSelected}
						onTableNameChange={wizard.setters.setSchemaTableName}
						onColumnChange={wizard.actions.updateSchemaColumn}
						onAddColumn={wizard.actions.addSchemaColumn}
						onDeleteColumn={wizard.actions.deleteSchemaColumn}
						onGenerateSql={wizard.actions.generateSqlFromCsv}
						onExecuteSql={wizard.actions.executeSql}
					/>
				)}
				renderManage={() => (
					<DatabaseWizardManageAndQuery
						isLoading={wizard.state.isLoading}
						schemaMetadata={wizard.state.schemaMetadata}
						querySql={wizard.state.querySql}
						onQuerySqlChange={wizard.setters.setQuerySql}
						onRunQuery={wizard.actions.runQuery}
						onRefreshSchema={() => wizard.actions.refreshSchema()}
					/>
				)}
			/>
		</div>
	);
});
