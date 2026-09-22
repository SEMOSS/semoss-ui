import { Bot, CircleCheck, CircleX } from "lucide-react";
import { cn, Spinner } from "@semoss/ui/next";
import type { ConversationMessagePart } from "../types/message";

type SubagentPart = Extract<ConversationMessagePart, { type: "subagent" }>;

/** Live subagent status rendered among the assistant's ordered parts. */
export function MessageSubagentPart({ part }: { part: SubagentPart }) {
	const isDone = part.status === "COMPLETED";
	const hasFailed = part.status === "FAILED" || part.status === "CANCELLED";

	return (
		<div className="flex items-center gap-2 rounded-lg border bg-sidebar p-2">
			<span
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-sm",
					isDone
						? "bg-primary/10 text-primary"
						: "bg-muted text-muted-foreground",
				)}
			>
				{isDone ? (
					<CircleCheck aria-hidden="true" className="size-4" />
				) : hasFailed ? (
					<CircleX aria-hidden="true" className="size-4" />
				) : part.status === "RUNNING" ? (
					<Spinner aria-hidden="true" className="size-4" />
				) : (
					<Bot aria-hidden="true" className="size-4" />
				)}
			</span>
			<span className="min-w-0">
				<span className="block truncate font-medium text-xs">
					{part.label}
				</span>
				<span className="block truncate text-muted-foreground text-xs">
					{part.error ??
						part.result ??
						part.status.replaceAll("_", " ").toLowerCase()}
				</span>
			</span>
		</div>
	);
}
