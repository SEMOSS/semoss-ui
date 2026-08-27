import type { FC } from "react";

export interface WorkbenchPanelErrorProps {
	/** The detail, rendered mono so stack-ish text stays legible. */
	message: string;
	/** Stable selector for the message body. */
	testId?: string;
}

/**
 * A panel-sized failure state, styled as the accented error panel the notebook
 * uses for a failed cell — a leading destructive stripe, a tinted header band
 * with an uppercase micro-label, and a mono body.
 *
 * The classes mirror `cell-output-block.tsx`'s red `Panel` rather than sharing
 * it: that one is private to the notebook renderer and carries collapse, meta,
 * and toolbar machinery a panel failure has no use for. Keep the two in visual
 * step by hand.
 */
export const WorkbenchPanelError: FC<WorkbenchPanelErrorProps> = ({
	message,
	testId,
}) => (
	<div className="flex items-center justify-center">
		{/* `alert` announces the failure; <pre> keeps the whitespace a
				    stack-ish message needs. */}
		<div className="h-full w-full max-w-sm overflow-auto bg-background p-4">
			<div className="overflow-hidden rounded-md border border-destructive/30 bg-destructive/5 p-2">
				<pre
					role="alert"
					data-testid={testId}
					className="whitespace-pre-wrap break-all font-mono text-destructive text-sm"
				>
					{message || "Error"}
				</pre>
			</div>
		</div>
	</div>
);
