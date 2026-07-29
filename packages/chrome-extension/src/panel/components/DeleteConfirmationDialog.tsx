/**
 * Delete Confirmation Dialog Component
 * Shows impact analysis when deleting a step with dependencies
 */

// biome-ignore lint/correctness/noUnusedImports: the package uses the classic JSX transform.
import React, { type FC } from "react";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	P,
	Small,
} from "@semoss/ui/next";
import type {
	DeleteImpact,
	Dependency,
} from "../../services/dependencyAnalyzer";

interface DeleteConfirmationDialogProps {
	/** Whether the dialog is open */
	isOpen: boolean;

	/** Callback when dialog should close */
	onClose: () => void;

	/** Callback when user confirms deletion */
	onConfirm: () => void;

	/** Impact analysis for the deletion */
	impact: DeleteImpact;

	/** Index of the step being deleted (1-indexed for display) */
	stepIndex: number;

	/** Type of action being deleted */
	actionType: string;
}

export const DeleteConfirmationDialog: FC<DeleteConfirmationDialogProps> = ({
	isOpen,
	onClose,
	onConfirm,
	impact,
	stepIndex,
	actionType,
}) => {
	const handleConfirm = () => {
		onConfirm();
		onClose();
	};

	const groupDependenciesByType = (dependencies: Dependency[]) => {
		const grouped = dependencies.reduce(
			(acc, dep) => {
				if (!acc[dep.type]) {
					acc[dep.type] = [];
				}
				acc[dep.type].push(dep);
				return acc;
			},
			{} as Record<string, Dependency[]>,
		);

		return grouped;
	};

	const _getDependencyIcon = (type: string) => {
		switch (type) {
			case "navigation":
				return "🌐";
			case "selector":
				return "🎯";
			case "form_flow":
				return "📝";
			case "element_state":
				return "☑️";
			case "page_state":
				return "📜";
			default:
				return "⚠️";
		}
	};

	const _getDependencyTitle = (type: string) => {
		switch (type) {
			case "navigation":
				return "Page Context";
			case "selector":
				return "Element Dependencies";
			case "form_flow":
				return "Form Flow";
			case "element_state":
				return "Element State";
			case "page_state":
				return "Page State";
			default:
				return "Dependencies";
		}
	};

	const _groupedDeps = groupDependenciesByType(impact.dependencies);
	const _affectedStepsCount = new Set(
		impact.dependencies.map((d) => d.dependentStepIndex),
	).size;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="!p-6 !gap-0 mx-auto flex max-h-[80vh] w-[90%] max-w-md flex-col">
				<DialogHeader className="!mb-6 flex-shrink-0">
					<DialogTitle className="flex items-center gap-2 text-lg">
						<span className="text-2xl">⚠️</span>
						<span>Confirm Deletion</span>
					</DialogTitle>
					<DialogDescription className="!mt-3 text-slate-600 text-sm">
						Deleting Step #{stepIndex + 1} ({actionType})
					</DialogDescription>
				</DialogHeader>

				<div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
					{/* Summary */}
					<div className="!mb-6">
						<P className="text-slate-600 text-sm leading-relaxed">
							{impact.summary}
						</P>
					</div>

					{/* Dependencies breakdown */}
					{impact.hasImpact && (
						<div className="space-y-4">
							<P className="font-medium text-slate-500 text-xs uppercase tracking-wide">
								Affected Steps
							</P>

							{/* Show all dependencies without grouping */}
							<div className="space-y-3">
								{impact.dependencies.map((dep, idx) => (
									<div
										key={`${dep.dependentStepIndex}-${idx}`}
										className="!p-4 rounded-md bg-slate-50 transition-colors hover:bg-slate-100"
									>
										<div className="!mb-2 flex items-center gap-2">
											<Small className="font-semibold text-slate-900">
												Step #
												{dep.dependentStepIndex + 1}
											</Small>
											<Small className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-slate-600 text-xs">
												{dep.dependentAction.type}
											</Small>
										</div>
										<Small className="text-slate-600 text-xs leading-relaxed">
											{dep.reason}
										</Small>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="!mt-6 !pt-5 flex-shrink-0 gap-2 border-slate-200 border-t">
					<Button
						variant="outline"
						onClick={onClose}
						className="rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
					>
						Cancel
					</Button>
					<Button
						variant={impact.hasImpact ? "destructive" : "default"}
						onClick={handleConfirm}
						className={cn(
							"rounded-lg",
							impact.hasImpact
								? "bg-red-600 hover:bg-red-700"
								: "bg-blue-600 hover:bg-blue-700",
						)}
					>
						{impact.hasImpact ? "Delete Anyway" : "Delete Step"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
