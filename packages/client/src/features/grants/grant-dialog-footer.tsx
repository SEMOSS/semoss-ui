import { Button, DialogFooter, Spinner } from "@semoss/ui/next";

/** Props for {@link GrantDialogFooter}. */
export interface GrantDialogFooterProps {
	/** Whether the form is being submitted */
	isSubmitting: boolean;
	/** Closes the dialog without a change */
	onCancel: () => void;
}

/**
 * The buttons of a dialog that gives permissions: Cancel, and Authorize Access,
 * which submits the form and reads Authorizing... with a spinner while it runs.
 * Both stay enabled until a submit starts.
 */
export const GrantDialogFooter = ({
	isSubmitting,
	onCancel,
}: GrantDialogFooterProps) => (
	<DialogFooter>
		<Button
			type="button"
			variant="outline"
			disabled={isSubmitting}
			onClick={onCancel}
		>
			Cancel
		</Button>
		<Button type="submit" disabled={isSubmitting}>
			{isSubmitting ? <Spinner className="size-4" /> : null}
			{isSubmitting ? "Authorizing..." : "Authorize Access"}
		</Button>
	</DialogFooter>
);
