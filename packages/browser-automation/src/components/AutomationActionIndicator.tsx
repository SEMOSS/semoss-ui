import type React from "react";
import { Small, Spinner } from "@semoss/ui/next";

/**
 * Floating progress indicator shown while a selected field is being analyzed.
 */
export const AutomationActionIndicator: React.FC = () => {
	return (
		<div className="-translate-x-1/2 absolute top-4 left-1/2 z-30 flex min-h-16 w-56 items-center gap-2 rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
			<Spinner className="size-4 shrink-0 text-primary" />
			<Small className="text-muted-foreground">Generating…</Small>
		</div>
	);
};
