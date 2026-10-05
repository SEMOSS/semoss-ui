import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

export interface ConfirmDialogProps {
	open: boolean;

	title: string;

	description: string;

	/** Label of the affirmative button. Defaults to "Confirm". */
	confirmLabel?: string;

	/** Renders the affirmative button in the destructive style */
	destructive?: boolean;

	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

/** Small yes/no modal for actions that throw away work. */
export const ConfirmDialog = ({
	open,
	title,
	description,
	confirmLabel = "Confirm",
	destructive = false,
	onOpenChange,
	onConfirm,
}: ConfirmDialogProps) => (
	<Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent className="sm:max-w-md">
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button variant="outline" onClick={() => onOpenChange(false)}>
					Cancel
				</Button>
				<Button
					variant={destructive ? "destructive" : "default"}
					onClick={() => {
						onConfirm();
						onOpenChange(false);
					}}
				>
					{confirmLabel}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
);
