import type React from "react";
import { Button, P } from "@semoss/ui/next";
import type { WizardStep } from "@/utils/databaseWizard/types";

export type DatabaseWizardStepActionsProps = {
	isLoading: boolean;
	onSelectStep: (step: WizardStep) => void;
	onRefreshSchema: () => void;
};

export const DatabaseWizardStepActions: React.FC<
	DatabaseWizardStepActionsProps
> = ({ isLoading, onSelectStep, onRefreshSchema }) => {
	return (
		<div className="flex flex-col gap-4">
			<P className="text-muted-foreground text-sm">
				Choose how you want to work with the database.
			</P>
			<div className="grid gap-3 sm:grid-cols-3">
				<Button
					variant="outline"
					onClick={() => onSelectStep("create-nl")}
					disabled={isLoading}
				>
					Create Table from Natural Language
				</Button>
				<Button
					variant="outline"
					onClick={() => onSelectStep("csv")}
					disabled={isLoading}
				>
					Load Data from CSV
				</Button>
				<Button
					variant="outline"
					onClick={() => onSelectStep("manage")}
					disabled={isLoading}
				>
					Manage & Query Database
				</Button>
			</div>
			<Button variant="ghost" onClick={onRefreshSchema}>
				Refresh schema
			</Button>
		</div>
	);
};
