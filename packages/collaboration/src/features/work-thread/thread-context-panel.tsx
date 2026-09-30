import type { ReactNode } from "react";
import { cn, H3, H4, P, Small } from "@semoss/ui/next";
import type { SubmittedThreadContext } from "@/features/thread-assistant/thread-context";
import { PaneSearch } from "./pane-search";
import { PANE_SEARCH_CLASS, usePaneSearch } from "./use-pane-search";
import { workContextSummary } from "./work-context-summary";
import { WorkContextUsage } from "./work-context-usage";

/** Shows the source context assembled by Work alongside the saved request snapshot. */
export function ThreadContextPanel({
	children,
	context,
	submitted,
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
				<H3 className="text-lg">Context</H3>
				<P className="text-muted-foreground text-sm">
					{workContextSummary(context.contextText)}
				</P>
				{children}
				<section className="space-y-3" aria-label="Agent context">
					<H4>Context for Assistant</H4>
					<P className="text-muted-foreground">
						The next request includes the current thread context
						below. Earlier requests remain in the conversation
						history.
					</P>
					<details>
						<summary className="min-h-8 cursor-pointer focus-visible:outline-2 focus-visible:outline-ring">
							View raw next-request context
						</summary>
						<pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
							{context.contextText}
						</pre>
					</details>
					{submitted && (
						<div className="space-y-2">
							<Small className="block text-muted-foreground">
								Last submitted:{" "}
								{workContextSummary(submitted.contextText)}
							</Small>
							<details>
								<summary className="min-h-8 cursor-pointer focus-visible:outline-2 focus-visible:outline-ring">
									View raw last-submitted context
								</summary>
								<pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
									{submitted.contextText}
								</pre>
							</details>
						</div>
					)}
				</section>
				<WorkContextUsage />
			</section>
		</div>
	);
}
