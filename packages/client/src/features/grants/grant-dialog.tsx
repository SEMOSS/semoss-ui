import type { ReactNode } from "react";
import { Dialog, DialogContent } from "@semoss/ui/next";

/** Props for {@link GrantDialog}. */
export interface GrantDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Whether its form is being submitted, which keeps it open */
	isSubmitting: boolean;
	/** Called when the user closes it, unless a submit is running */
	onClose: () => void;
	/** Classes for the dialog's content, such as its width */
	className?: string;
	/** The dialog's form */
	children: ReactNode;
}

/**
 * The frame of a dialog that gives permissions: it cannot be closed, by its
 * close button, Escape or a click outside, while its form is being submitted.
 */
export const GrantDialog = ({
	open,
	isSubmitting,
	onClose,
	className,
	children,
}: GrantDialogProps) => (
	<Dialog
		open={open}
		onOpenChange={(isOpen) => {
			if (!isOpen && !isSubmitting) {
				onClose();
			}
		}}
	>
		<DialogContent
			className={className}
			showCloseButton={!isSubmitting}
			onEscapeKeyDown={(event) => {
				if (isSubmitting) {
					event.preventDefault();
				}
			}}
			onInteractOutside={(event) => {
				if (isSubmitting) {
					event.preventDefault();
				}
			}}
		>
			{children}
		</DialogContent>
	</Dialog>
);
