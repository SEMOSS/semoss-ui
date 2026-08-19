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

	/** Stop the countdown and keep the MCP response pending for more context. */
	onKeepOpen: () => void;

	/** Complete the MCP response and close the remote browser immediately. */
	onCloseAndReturn: () => void;
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
	onCloseAndReturn,
}: PlaybackCompleteDialogProps) {
	const open = secondsRemaining !== null;

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onKeepOpen()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Playback complete</DialogTitle>
					<DialogDescription>
						{stepsRun} step{stepsRun === 1 ? "" : "s"} replayed. The
						browser will close and return this result to Playground
						in {secondsRemaining ?? 0} second
						{secondsRemaining === 1 ? "" : "s"}. Keep it open to
						inspect the page or capture more context before
						returning manually.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={onKeepOpen}>
						Keep open
					</Button>
					<Button onClick={onCloseAndReturn}>Close and return</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
