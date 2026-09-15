import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

interface PlaybackCompleteDialogProps {
	/** Seconds left before the session closes, or null when not counting down. */
	secondsRemaining: number | null;

	/** Number of steps the replay executed, shown for context. */
	stepsRun: number;

	/** Stop the countdown and leave the remote browser open. */
	onKeepOpen: () => void;

	/** Skip the remaining countdown and close the session now. */
	onCloseNow: () => void;
}

/**
 * Shown when an MCP replay finishes. The remote browser is left on the last
 * executed step for a short window so the result can be inspected, then the
 * session is closed to release the browser on the server.
 */
export function PlaybackCompleteDialog({
	secondsRemaining,
	stepsRun,
	onKeepOpen,
	onCloseNow,
}: PlaybackCompleteDialogProps) {
	const open = secondsRemaining !== null;

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onKeepOpen()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Playback complete</DialogTitle>
					<DialogDescription>
						{stepsRun} step{stepsRun === 1 ? "" : "s"} replayed. The
						script will now close in {secondsRemaining ?? 0} second
						{secondsRemaining === 1 ? "" : "s"} to free up the
						remote browser.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={onKeepOpen}>
						Keep open
					</Button>
					<Button onClick={onCloseNow}>Close now</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
