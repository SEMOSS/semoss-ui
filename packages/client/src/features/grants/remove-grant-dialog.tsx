import type { ReactNode } from "react";
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
} from "@semoss/ui/next";

/** Props for {@link RemoveGrantDialog}. */
export interface RemoveGrantDialogProps {
	/** What taking the permission away changes, naming who loses it */
	description: ReactNode;
	/** Why the last removal was refused, or null */
	error: string | null;
	/** Whether the removal is being saved, which keeps the dialog open */
	isRemoving: boolean;
	/** Takes the permission away */
	onConfirm: () => void;
	/** Closes the dialog without a change */
	onCancel: () => void;
	/** Called as the dialog closes, to move focus somewhere other than the button that opened it */
	onCloseAutoFocus?: (event: Event) => void;
}

/**
 * The confirmation before taking away a permission an engine or a project
 * gives. A refused removal shows in it, and it stays open while the removal
 * is saved. Render it only while a permission is picked.
 */
export const RemoveGrantDialog = ({
	description,
	error,
	isRemoving,
	onConfirm,
	onCancel,
	onCloseAutoFocus,
}: RemoveGrantDialogProps) => (
	<Dialog
		open
		onOpenChange={(isOpen) => {
			if (!isOpen && !isRemoving) {
				onCancel();
			}
		}}
	>
		<DialogContent onCloseAutoFocus={onCloseAutoFocus}>
			<DialogHeader>
				<DialogTitle className="font-medium text-base leading-6">
					Remove Access
				</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
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
					disabled={isRemoving}
					onClick={onCancel}
				>
					Cancel
				</Button>
				<Button
					type="button"
					variant="destructive"
					disabled={isRemoving}
					onClick={onConfirm}
				>
					{isRemoving ? "Removing..." : "Remove Access"}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
);
