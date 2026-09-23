import { CircleSlash, MessageSquareReply } from "lucide-react";
import { cn } from "@semoss/ui/next";
import { MessageMarkdown } from "@/features/messages/components/message-markdown";
import type { DelegationReply } from "@/features/messages/types/message";

const HEADLINE: Record<DelegationReply["outcome"], string> = {
	RESPONDED: "replied to your request",
	DECLINED: "declined your request",
	CANCELLED: "request was cancelled",
	UNANSWERED: "did not answer your request",
};

function initials(name: string): string {
	return name
		.split(/[\s@._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0))
		.join("")
		.toUpperCase();
}

/** A person's answer to a delegated request, shown as their reply rather than agent text. */
export function DelegationReplyCard({ reply }: { reply: DelegationReply }) {
	const answered = reply.outcome === "RESPONDED";
	const Icon = answered ? MessageSquareReply : CircleSlash;

	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg border bg-card",
				answered ? "border-primary/30" : "border-dashed",
			)}
		>
			<header className="flex items-center gap-2.5 border-b bg-sidebar px-3 py-2">
				<span
					aria-hidden="true"
					className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent font-medium text-link text-xs"
				>
					{initials(reply.assignee) || "?"}
				</span>
				<p className="min-w-0 flex-1 truncate text-sm">
					<span className="font-semibold">{reply.assignee}</span>{" "}
					<span className="text-muted-foreground">
						{HEADLINE[reply.outcome]}
					</span>
				</p>
				<Icon
					aria-hidden="true"
					className={cn(
						"size-4 shrink-0",
						answered ? "text-primary" : "text-muted-foreground",
					)}
				/>
			</header>
			{reply.question && (
				<p className="wrap-break-word line-clamp-2 border-b px-3 py-2 text-muted-foreground text-xs">
					<span className="font-medium">You asked:</span>{" "}
					{reply.question}
				</p>
			)}
			{reply.text && (
				<div className="px-3 py-3">
					<MessageMarkdown text={reply.text} isStreaming={false} />
				</div>
			)}
		</div>
	);
}
