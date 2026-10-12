import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

export interface DiscardChangesDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** What would drop the changes: the Discard Changes button, or leaving the page */
	reason: "DISCARD" | "LEAVE";
	/** How many changes are not saved, all of which would be dropped */
	changeCount: number;
	/** Called to drop the changes */
	onConfirm: () => void;
	/** Called to keep the changes */
	onCancel: () => void;
}

/**
 * Asks before changes that are not saved are dropped, by discarding them or by
 * leaving their page. Nothing is saved either way.
 */
export const DiscardChangesDialog = ({
	open,
	reason,
	changeCount,
	onConfirm,
	onCancel,
}: DiscardChangesDialogProps) => {
	const isLeaving = reason === "LEAVE";
	const changes =
		changeCount === 1
			? "1 change"
			: `${changeCount.toLocaleString()} changes`;

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					onCancel();
				}
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						{isLeaving
							? "Leave Without Saving?"
							: "Discard Changes?"}
					</DialogTitle>
					<DialogDescription>
						{isLeaving
							? `You have ${changes} that are not saved. Leaving drops them, and the access stays as it is.`
							: `This drops ${changes}. Nothing was saved, so the access stays as it is.`}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel}>
						{isLeaving ? "Stay" : "Keep Changes"}
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={onConfirm}
					>
						{isLeaving ? "Leave" : "Discard Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
