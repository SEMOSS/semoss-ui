import type { ReactNode } from "react";
import { H3, H4, P, Small } from "@semoss/ui/next";
import type { SubmittedThreadContext } from "@/features/thread-assistant/thread-context";
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
	return (
		<div className="h-full min-h-0 space-y-6 overflow-y-auto p-4">
			<H3 className="text-lg">Context</H3>
			<P className="text-muted-foreground text-sm">
				{workContextSummary(context.contextText)}
			</P>
			{children}
			<section className="space-y-3" aria-label="Agent context">
				<H4>Context for Assistant</H4>
				<P className="text-muted-foreground">
					The next request includes the current thread context below.
					Earlier requests remain in the conversation history.
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
		</div>
	);
}
