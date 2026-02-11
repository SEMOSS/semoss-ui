import type React from "react";
import { useId } from "react";
import {
	Button,
	Input,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

export type DatabaseWizardStepSelectProps = {
	isLoading: boolean;
	databaseName: string;
	databases: Array<{ database_id: string; database_name: string }>;
	selectedDatabaseId: string;
	onDatabaseNameChange: (value: string) => void;
	onSelectDatabase: (id: string) => void;
	onCreateDatabase: () => void;
	onDeleteDatabase: (id: string) => void;
};

export const DatabaseWizardStepSelect: React.FC<
	DatabaseWizardStepSelectProps
> = ({
	isLoading,
	databaseName,
	databases,
	selectedDatabaseId,
	onDatabaseNameChange,
	onSelectDatabase,
	onCreateDatabase,
	onDeleteDatabase,
}) => {
	const databaseNameId = useId();
	const databaseSelectId = useId();

	return (
		<div className="flex flex-col gap-4">
			<P className="text-muted-foreground text-sm">
				Create a new database or select an existing one to begin.
			</P>
			<div className="flex flex-col gap-2">
				<Label htmlFor={databaseNameId}>New database name</Label>
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
					Create new database
				</Button>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor={databaseSelectId}>Select database</Label>
				<Select
					value={selectedDatabaseId}
					onValueChange={onSelectDatabase}
				>
					<SelectTrigger id={databaseSelectId}>
						<SelectValue placeholder="Choose a database" />
					</SelectTrigger>
					<SelectContent>
						{databases.map((db) => (
							<SelectItem
								key={db.database_id}
								value={db.database_id}
							>
								{db.database_name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="flex items-center gap-2">
					<Button
						variant="default"
						disabled={isLoading || !selectedDatabaseId}
						onClick={() => onSelectDatabase(selectedDatabaseId)}
					>
						Load database
					</Button>
					<Button
						variant="ghost"
						disabled={isLoading || !selectedDatabaseId}
						onClick={() => onDeleteDatabase(selectedDatabaseId)}
					>
						Delete
					</Button>
				</div>
			</div>
		</div>
	);
};
