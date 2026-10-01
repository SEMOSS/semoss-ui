import type { FC } from "react";
import { Button } from "@semoss/ui/next";

export interface WorkbenchPanelErrorProps {
	/** The detail. Multi-line text keeps its line breaks. */
	message: string;
	/** Omit to show the message with no retry action. */
	onRetry?: () => void;
	/** Stable selector for the message body. */
	testId?: string;
}

/**
 * The one panel-sized failure state, whether the shell drew it or a panel did.
 *
 * The accented container -- destructive border over a tinted wash -- is the
 * notebook's failed-cell language, so a dead panel reads like a failed cell.
 * The message itself is prose rather than mono: most of these are user-facing
 * ("you do not have access to this project"), and a monospaced, break-anywhere
 * treatment made those read like a stack trace. `whitespace-pre-wrap` still
 * keeps the line breaks a thrown error's message arrives with.
 *
 * `onRetry` is what separates a recoverable failure from one the shell reports
 * about itself -- a thrown body or an unregistered type has nothing to retry,
 * so it passes no handler and no button renders.
 *
 * One mode, and no placement prop: like `WorkbenchPanelLoading`, this is only
 * ever drawn *instead of* a body that cannot be shown. It deliberately has no
 * overlay form -- see the sibling's comment, and `AGENTS.md` on why a failed
 * background refresh must not take over a panel that still works.
 */
export const WorkbenchPanelError: FC<WorkbenchPanelErrorProps> = ({
	message,
	onRetry,
	testId,
}) => (
	<div className="flex size-full flex-col items-center justify-center gap-4 bg-background p-4">
		<div className="w-full max-w-sm overflow-auto rounded-md border border-destructive/30 bg-destructive/5 p-2">
			<p
				role="alert"
				data-testid={testId}
				className="whitespace-pre-wrap break-words text-center text-destructive text-sm"
			>
				{message || "Error"}
			</p>
		</div>
		{onRetry ? (
			<Button type="button" onClick={onRetry}>
				Retry
			</Button>
		) : null}
	</div>
);
