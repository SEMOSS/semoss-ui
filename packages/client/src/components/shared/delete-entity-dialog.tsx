import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
} from "@semoss/ui/next";

interface DeleteEntityDialogProps {
	/** Controls whether the dialog is visible. */
	open: boolean;
	/** Called when the dialog open state changes. */
	onOpenChange: (open: boolean) => void;
	/** Display label for the entity being deleted (for example, App or Insight). */
	entityLabel: string;
	/** Human-readable name of the entity to show in the confirmation details. */
	entityName: string;
	/** Identifier of the entity to show in the confirmation details. */
	entityId: string;
	/** Invoked when the user confirms deletion. */
	onConfirm: () => void;
	/** Disables actions and shows loading UI while deletion is in progress. */
	isLoading?: boolean;
	/** Optional test id for the cancel button. */
	cancelButtonTestId?: string;
	/** Optional test id for the confirm/delete button. */
	confirmButtonTestId?: string;
}

export const DeleteEntityDialog = (props: DeleteEntityDialogProps) => {
	const {
		open,
		onOpenChange,
		entityLabel,
		entityName,
		entityId,
		onConfirm,
		isLoading = false,
		cancelButtonTestId,
		confirmButtonTestId,
	} = props;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete {entityLabel}</DialogTitle>
					<DialogDescription>
						<div
							className={`my-4 grid grid-cols-[max-content_1fr] gap-2 text-foreground`}
						>
							<span>Name:</span>
							<span className="break-all font-semibold">
								{entityName || "N/A"}
							</span>
							<span>ID:</span>
							<span className="break-all font-semibold">
								{entityId || "N/A"}
							</span>
						</div>
						<p className="text-foreground">
							Are you sure you want to delete this{" "}
							{entityLabel.toLowerCase()}? This action cannot be
							undone.
						</p>
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="w-full justify-center sm:justify-center">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
						data-testid={cancelButtonTestId}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isLoading}
						data-testid={confirmButtonTestId}
					>
						{isLoading ? <Spinner /> : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
