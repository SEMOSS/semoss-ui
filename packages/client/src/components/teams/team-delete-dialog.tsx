import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

interface TeamDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	teamId?: string;
	onConfirm: () => void;
	isLoading?: boolean;
}

export const TeamDeleteDialog = (props: TeamDeleteDialogProps) => {
	const { open, onOpenChange, teamId, onConfirm, isLoading = false } = props;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete team</DialogTitle>
					<DialogDescription>
						{teamId ? (
							<>
								Are you sure you want to delete{" "}
								<span className="font-medium text-foreground">
									{teamId}
								</span>
								? This action cannot be undone.
							</>
						) : (
							"Are you sure you want to delete this team? This action cannot be undone."
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isLoading}
					>
						{isLoading ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
