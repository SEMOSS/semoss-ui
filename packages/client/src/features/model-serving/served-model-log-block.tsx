import type { ReactElement } from "react";
import { cn } from "@semoss/ui/next";

export interface ServedModelLogBlockProps {
	/** What the lines are, for screen readers, such as "Log of the weight download" */
	label: string;
	lines: readonly string[];
	/** Class for the region, such as its height */
	className?: string;
}

/**
 * Log lines in a labelled region of their own, which scrolls when they are
 * long and which keyboards can reach to scroll it.
 */
export function ServedModelLogBlock({
	label,
	lines,
	className,
}: ServedModelLogBlockProps): ReactElement {
	return (
		<section
			aria-label={label}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be focusable
			tabIndex={0}
			className={cn(
				"overflow-auto rounded-md border bg-muted p-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring",
				className,
			)}
		>
			<pre className="whitespace-pre-wrap break-all font-mono text-xs">
				{lines.length > 0 ? lines.join("\n") : "No lines yet."}
			</pre>
		</section>
	);
}
