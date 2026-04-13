import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

interface DeleteEntityDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	entityType: "App" | "Engine" | "Insight";
	entityName?: string;
	entityId?: string;
	onConfirm: () => void;
	isLoading?: boolean;
	cancelButtonTestId?: string;
	confirmButtonTestId?: string;
}

export const DeleteEntityDialog = (props: DeleteEntityDialogProps) => {
	const {
		open,
		onOpenChange,
		entityType,
		entityName,
		entityId,
		onConfirm,
		isLoading = false,
		cancelButtonTestId,
		confirmButtonTestId,
	} = props;

	const nameLabel = `${entityType} Name:`;
	const idLabel = `${entityType} ID:`;
	const question = `Are you sure you want to delete this ${entityType.toLowerCase()}?`;
	const deleteGridClass =
		entityType === "App"
			? "grid-cols-[88px_minmax(0,1fr)]"
			: entityType === "Insight"
				? "grid-cols-[98px_minmax(0,1fr)]"
				: "grid-cols-[110px_minmax(0,1fr)]";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{`Delete ${entityType}`}</DialogTitle>
					<div className="mt-2 w-full border-border border-b" />
					<DialogDescription className="mt-2 text-left text-foreground">
						<p className="mb-3 text-foreground">{question}</p>
						<div
							className={`grid ${deleteGridClass} gap-y-2 text-foreground`}
						>
							<span>{nameLabel}</span>
							<span className="break-all font-semibold">
								{entityName || "N/A"}
							</span>
							<span>{idLabel}</span>
							<span className="break-all font-semibold">
								{entityId || "N/A"}
							</span>
						</div>
						<p className="mt-3 text-center font-semibold text-foreground">
							This action cannot be undone.
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
						{isLoading ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
