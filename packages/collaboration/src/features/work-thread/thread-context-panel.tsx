import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";
import type { SubmittedThreadContext } from "@/features/thread-assistant/thread-context";
import { PaneSearch } from "./pane-search";
import { PANE_SEARCH_CLASS, usePaneSearch } from "./use-pane-search";

/** Searchable thread insights and inclusion controls; diagnostics live in Settings. */
export function ThreadContextPanel({
	children,
}: {
	children: ReactNode;
	context: SubmittedThreadContext;
	submitted: SubmittedThreadContext | null;
}) {
	const search = usePaneSearch("section, details");
	return (
		<div className="flex h-full min-h-0 flex-col">
			<PaneSearch search={search} label="Search context" />
			<section
				aria-label="Thread context"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: the context pane supports keyboard scrolling
				tabIndex={0}
				ref={search.viewportRef}
				className={cn(
					"min-h-0 flex-1 space-y-6 overflow-y-auto p-4 focus-visible:outline-2 focus-visible:outline-ring",
					PANE_SEARCH_CLASS,
				)}
			>
				{children}
			</section>
		</div>
	);
}
