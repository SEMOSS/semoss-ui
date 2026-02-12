import type React from "react";
import { useId } from "react";
import { Button, Input, Label, P } from "@semoss/ui/next";

export type DatabaseWizardCreatePanelProps = {
	isLoading: boolean;
	databaseName: string;
	onDatabaseNameChange: (value: string) => void;
	onCreateDatabase: () => void;
};

export const DatabaseWizardCreatePanel: React.FC<
	DatabaseWizardCreatePanelProps
> = ({ isLoading, databaseName, onDatabaseNameChange, onCreateDatabase }) => {
	const databaseNameId = useId();

	return (
		<div className="flex flex-col gap-4">
			<P className="text-muted-foreground text-sm">
				Create a new database to start using the wizard workflows.
			</P>
			<div className="flex flex-col gap-2">
				<Label htmlFor={databaseNameId}>Database name</Label>
				<Input
					id={databaseNameId}
					value={databaseName}
					onChange={(event) =>
						onDatabaseNameChange(event.target.value)
					}
					placeholder="e.g. Customer Insights"
				/>
				<Button
					onClick={onCreateDatabase}
					disabled={isLoading || !databaseName}
				>
					Create database
				</Button>
			</div>
		</div>
	);
};
