import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { deleteTeam, type GroupKey } from "@/api/teams";

export interface DeleteTeamDialogProps {
	/** The team to delete, or null when the dialog is closed */
	team: GroupKey | null;
	/** Called when the dialog closes, with true after the team was deleted */
	onClose: (deleted?: boolean) => void;
}

/**
 * Confirms and deletes a team. Admins only.
 */
export const DeleteTeamDialog = ({ team, onClose }: DeleteTeamDialogProps) => {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleClose = (deleted?: boolean) => {
		setError(null);
		onClose(deleted);
	};

	const handleDelete = async () => {
		if (!team) {
			return;
		}
		setIsDeleting(true);
		setError(null);
		try {
			await deleteTeam(team.id, team.type);
		} catch (e) {
			setError(getErrorMessage(e, "Could not delete the team"));
			setIsDeleting(false);
			return;
		}
		setIsDeleting(false);
		toast.success(`Deleted ${team.id}`);
		handleClose(true);
	};

	return (
		<Dialog
			open={team !== null}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isDeleting) {
					handleClose();
				}
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Delete Team
					</DialogTitle>
					<DialogDescription>
						Deleting{" "}
						<span className="font-medium text-foreground">
							{team?.id}
						</span>{" "}
						removes it and takes away the access it gives its
						members. Access given to people directly stays. This
						cannot be undone.
					</DialogDescription>
				</DialogHeader>
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isDeleting}
						onClick={() => handleClose()}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={isDeleting}
						onClick={handleDelete}
					>
						{isDeleting ? <Spinner /> : null}
						{isDeleting ? "Deleting..." : "Delete Team"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
