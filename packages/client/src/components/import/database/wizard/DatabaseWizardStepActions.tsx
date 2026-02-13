import type React from "react";
import { Button, P } from "@semoss/ui/next";
import type { WizardStep } from "@/utils/databaseWizard/types";

export type DatabaseWizardStepActionsProps = {
	isLoading: boolean;
	activeStep: WizardStep;
	onToggleStep: (step: WizardStep) => void;
	onRefreshSchema: () => void;
	renderCreate: () => React.ReactNode;
	renderCsv: () => React.ReactNode;
	renderManage: () => React.ReactNode;
};

export const DatabaseWizardStepActions: React.FC<
	DatabaseWizardStepActionsProps
> = ({
	isLoading,
	activeStep,
	onToggleStep,
	onRefreshSchema,
	renderCreate,
	renderCsv,
	renderManage,
}) => {
	const toggleStep = (next: WizardStep) => {
		onToggleStep(activeStep === next ? "actions" : next);
	};

	return (
		<div className="flex flex-col gap-4">
			<P className="text-muted-foreground text-sm">
				Choose how you want to work with the database.
			</P>
			<div className="flex flex-col gap-3">
				<div className="rounded-lg border border-border">
					<button
						className="flex w-full items-center justify-between px-4 py-3 text-left font-medium"
						onClick={() => toggleStep("create-nl")}
						disabled={isLoading}
						type="button"
					>
						<span>Create Table from Natural Language</span>
						<span>{activeStep === "create-nl" ? "-" : "+"}</span>
					</button>
					{activeStep === "create-nl" && (
						<div className="border-border border-t px-4 py-4">
							{renderCreate()}
						</div>
					)}
				</div>
				<div className="rounded-lg border border-border">
					<button
						className="flex w-full items-center justify-between px-4 py-3 text-left font-medium"
						onClick={() => toggleStep("csv")}
						disabled={isLoading}
						type="button"
					>
						<span>Load Data from CSV</span>
						<span>{activeStep === "csv" ? "-" : "+"}</span>
					</button>
					{activeStep === "csv" && (
						<div className="border-border border-t px-4 py-4">
							{renderCsv()}
						</div>
					)}
				</div>
				<div className="rounded-lg border border-border">
					<button
						className="flex w-full items-center justify-between px-4 py-3 text-left font-medium"
						onClick={() => toggleStep("manage")}
						disabled={isLoading}
						type="button"
					>
						<span>Manage & Query Database</span>
						<span>{activeStep === "manage" ? "-" : "+"}</span>
					</button>
					{activeStep === "manage" && (
						<div className="border-border border-t px-4 py-4">
							{renderManage()}
						</div>
					)}
				</div>
			</div>
			<Button variant="ghost" onClick={onRefreshSchema}>
				Refresh schema
			</Button>
		</div>
	);
};
