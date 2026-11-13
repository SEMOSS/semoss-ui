import { CircleAlert, Info } from "lucide-react";
import { cn, Muted, P } from "@semoss/ui/next";
import type { ConversationMessage } from "../types/message";
import { hasVisibleTaskOutcome } from "../utils/task-outcome";

/** Keep verified limitations visible even when individual tool steps are collapsed. */
export function MessageTaskOutcome({
	outcome,
}: {
	outcome: ConversationMessage["taskOutcome"];
}) {
	if (!outcome || !hasVisibleTaskOutcome(outcome)) return null;
	const limitations = [
		...new Set(outcome.limitations?.filter((text) => text.trim()) ?? []),
	];
	const action = outcome.actionRequired?.trim();
	const needsAttention =
		outcome.status === "PARTIAL" || outcome.status === "BLOCKED";
	const labels = {
		UNKNOWN:
			limitations.length || action ? "Limitations" : "Result details",
		FULFILLED: "Request completed",
		PARTIAL: "Result has limitations",
		BLOCKED: "Work could not be completed",
	};
	const Icon = needsAttention ? CircleAlert : Info;
	return (
		<aside
			aria-label="Task outcome"
			className="flex min-w-0 items-start gap-2 py-2"
		>
			<Icon
				aria-hidden="true"
				className={cn(
					"mt-1 size-4 shrink-0 text-muted-foreground",
					needsAttention && "text-warning",
				)}
			/>
			<div className="min-w-0 space-y-1">
				<P className="wrap-anywhere font-medium text-sm">
					{labels[outcome.status]}
				</P>
				{outcome.summary?.trim() && (
					<Muted className="wrap-anywhere block text-sm">
						{outcome.summary}
					</Muted>
				)}
				{limitations
					.filter((text) => text !== outcome.summary)
					.map((text) => (
						<Muted
							key={text}
							className="wrap-anywhere block text-sm"
						>
							{text}
						</Muted>
					))}
				{action && <P className="wrap-anywhere text-sm">{action}</P>}
			</div>
		</aside>
	);
}
