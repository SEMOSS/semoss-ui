import { Sparkles } from "lucide-react";
import { Link } from "react-router";
import { Button, cn, H3, P } from "@semoss/ui/next";
import { ThreadMenu } from "@/features/collaboration/components/thread-menu";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { topicTone } from "@/features/collaboration/topic-tone";
import { BriefDeadline } from "./brief-deadline";

/** Prioritized work opens the existing thread review and approval flow. */
export function BriefActionCard({
	item,
	featured = false,
	compact = false,
}: {
	item: WorkItem;
	featured?: boolean;
	compact?: boolean;
}) {
	const { state, dispatch } = useCollaborationSession();
	const thread = state.threads.find(
		(candidate) => candidate.id === item.threadId,
	);
	if (!thread) return null;
	const person = state.people.find(
		(candidate) => candidate.id === item.actorId,
	);
	const topic = state.topics.find((candidate) =>
		item.topicIds.includes(candidate.id),
	);
	const draft = state.workspaces[thread.id]?.drafts[0];
	const path = `/work/thread/${encodeURIComponent(thread.id)}`;
	return (
		<ThreadMenu thread={thread} item={item}>
			{(menu) => (
				<article
					className={cn(
						"min-w-0 space-y-3 rounded-xl border bg-card p-5",
						featured && !compact && "shadow-sm",
						compact &&
							"rounded-none border-0 border-b p-4 last:border-b-0",
					)}
				>
					{featured && !compact && (
						<div className="flex flex-wrap items-center justify-between gap-2">
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
								Up next
							</span>
							<BriefDeadline
								item={item}
								timeZone={state.profile.timezone}
							/>
						</div>
					)}
					<div className="space-y-1.5">
						<H3
							className={cn(
								"font-medium text-base leading-snug tracking-tight",
								featured && !compact && "text-lg",
							)}
						>
							<Link
								to={path}
								className="break-words hover:underline"
							>
								{item.title}
							</Link>
						</H3>
						<P className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground text-sm">
							{person?.name ?? "You"}
							{topic && (
								<>
									<span aria-hidden="true">·</span>
									<span
										className={cn(
											"ml-0.5 size-2 shrink-0 rounded-xs",
											topicTone(topic.id),
										)}
										aria-hidden="true"
									/>
									<span>{topic.short || topic.name}</span>
								</>
							)}
							{!compact && (
								<>
									<span aria-hidden="true">·</span>
									<span>
										{thread.channel === "email"
											? "email"
											: thread.channel === "teams"
												? "teams"
												: thread.channel}
									</span>
								</>
							)}
						</P>
					</div>
					{featured &&
						!compact &&
						(draft ||
							thread.summary ||
							item.reasons.length > 0) && (
							<div className="rounded-lg border bg-muted/20 p-4">
								<P className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-widest">
									{draft ? "Draft reply" : "Context"}
								</P>
								<P className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed">
									{draft?.body ||
										thread.summary ||
										item.reasons.join(" · ")}
								</P>
							</div>
						)}
					<div className="flex flex-wrap items-center gap-x-2 gap-y-3">
						<Button
							asChild
							size="sm"
							className="bg-foreground font-normal text-background hover:bg-foreground/90"
						>
							<Link to={path}>
								{item.askType === "reply"
									? "Review reply"
									: item.askType === "approve"
										? "Review decision"
										: "Open thread"}
							</Link>
						</Button>
						{compact ? (
							<Button
								asChild
								size="sm"
								variant="ghost"
								className="px-1 font-normal text-muted-foreground"
							>
								<Link
									to={path}
									state={{
										threadAction: {
											id: crypto.randomUUID(),
											threadId: thread.id,
											action: "ask",
											prompt: `Help me with: ${item.title}`,
										},
									}}
								>
									<Sparkles
										aria-hidden="true"
										className="size-3"
									/>
									Ask about this
								</Link>
							</Button>
						) : (
							<Button
								size="sm"
								variant="ghost"
								className="font-normal text-muted-foreground"
								onClick={() =>
									dispatch({
										type: "item.update",
										itemId: item.id,
										changes: { status: "done" },
									})
								}
							>
								Mark handled
							</Button>
						)}
						{(!featured || compact) && (
							<span className="ml-auto">
								<BriefDeadline
									item={item}
									timeZone={state.profile.timezone}
								/>
							</span>
						)}
						{!compact && (
							<span
								className={cn(
									"shrink-0",
									featured && "ml-auto",
								)}
							>
								{menu}
							</span>
						)}
					</div>
				</article>
			)}
		</ThreadMenu>
	);
}
