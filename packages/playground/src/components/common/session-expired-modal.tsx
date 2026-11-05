import { LoginForm } from "@semoss/shared";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

/**
 * Shown over the current page when the session times out mid-use, instead of
 * navigating to /login. Keeping the underlying route mounted means component
 * state -- e.g. an in-progress chat draft in RoomInput -- survives
 * re-authentication instead of being lost to an unmount.
 */
export const SessionExpiredModal = () => {
	return (
		<Dialog open={true}>
			<DialogContent
				className="sm:max-w-md"
				showCloseButton={false}
				onEscapeKeyDown={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Session expired</DialogTitle>
					<DialogDescription>
						Your session has timed out. Log back in to continue --
						anything you were typing is still here.
					</DialogDescription>
				</DialogHeader>
				<LoginForm />
			</DialogContent>
		</Dialog>
	);
};
