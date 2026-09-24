import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { normalizeAutomationErrorMessage } from "../../domain/automation-utils";

/** Collapsible error message shown under a failed step's result. */
export function ErrorDetail({ message }: { message: string }) {
	const [expanded, setExpanded] = useState(false);
	const displayMessage = normalizeAutomationErrorMessage(message);
	return (
		<div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
			<div className="flex items-center justify-between gap-2">
				<span className="font-medium">Step failed</span>
				<button
					type="button"
					onClick={() => setExpanded((p) => !p)}
					className="flex items-center gap-0.5 text-destructive/70 hover:text-destructive"
				>
					{expanded ? (
						<ChevronDown className="h-3 w-3" />
					) : (
						<ChevronRight className="h-3 w-3" />
					)}
					{expanded ? "Hide details" : "Show details"}
				</button>
			</div>
			{expanded && (
				<pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[10px] opacity-80">
					{displayMessage}
				</pre>
			)}
		</div>
	);
}
