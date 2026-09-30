import { H3, P } from "@semoss/ui/next";
import { workContextSummary } from "./work-context-summary";
import { WorkContextUsage } from "./work-context-usage";
import { useWorkThread } from "./work-thread-context";

/** Diagnostics preserve the distinction between current sources and saved request history. */
export function WorkContextDetails() {
	const {
		contextPanel: { context, submitted },
	} = useWorkThread();
	return (
		<div className="space-y-6">
			<H3>Advanced</H3>
			<P className="text-muted-foreground">
				Source changes apply to future questions. Earlier requests
				remain in the saved conversation.
			</P>
			{[
				{ label: "Next request", value: context },
				...(submitted
					? [{ label: "Last submitted request", value: submitted }]
					: []),
			].map(({ label, value }) => (
				<details key={label} className="space-y-3">
					<summary className="min-h-9 cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-ring">
						{label}
					</summary>
					<P className="text-muted-foreground">
						{workContextSummary(value.contextText)}
					</P>
					<pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
						{value.contextText}
					</pre>
				</details>
			))}
			<WorkContextUsage />
		</div>
	);
}
