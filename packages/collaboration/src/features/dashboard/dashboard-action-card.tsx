import { ArrowUpRight, Check, Clock3 } from "lucide-react";
import { Link } from "react-router";
import { Badge, Button } from "@semoss/ui/next";
import { PersonAvatar } from "@/features/collaboration/components/person-avatar";
import { ThreadMenu } from "@/features/collaboration/components/thread-menu";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { threadPath } from "@/lib/workspace-paths";

/** Action cards keep the classifier's actual reasons and existing Work mutations. */
export function DashboardActionCard({
	item,
	featured = false,
}: {
	item: WorkItem;
	featured?: boolean;
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
	const due = item.due ? new Date(item.due) : null;
	return (
		<ThreadMenu thread={thread} item={item}>
			{(menu) => (
				<article className="dashboard-row space-y-3 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:border-primary/30 sm:p-5">
					<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
						<PersonAvatar
							name={person?.name || "You"}
							className="size-7"
						/>
						<span className="min-w-0 truncate font-medium text-foreground">
							{person?.name || thread.channel}
						</span>
						<span className="ml-auto flex items-center gap-1">
							{item.priority && (
								<Badge
									variant={
										item.priority === "P0"
											? "destructive"
											: "outline"
									}
								>
									{
										{
											P0: "Urgent",
											P1: "High",
											P2: "Normal",
											P3: "Low",
										}[item.priority]
									}
								</Badge>
							)}
							{due && Number.isFinite(due.getTime()) && (
								<>
									<Clock3
										aria-hidden="true"
										className="size-3"
									/>
									<time dateTime={due.toISOString()}>
										{due.toLocaleDateString(undefined, {
											month: "short",
											day: "numeric",
										})}
									</time>
								</>
							)}
						</span>
					</div>
					<h3 className="break-words font-semibold text-base leading-snug">
						<Link
							className="hover:underline"
							to={threadPath(thread.id)}
						>
							{item.title}
						</Link>
					</h3>
					{item.reasons.length > 0 && (
						<p className="text-muted-foreground text-sm leading-relaxed">
							{item.reasons.join(" · ")}
						</p>
					)}
					{topic && (
						<p className="text-muted-foreground text-xs">
							{topic.name}
						</p>
					)}
					<div className="flex flex-wrap items-center gap-2">
						<Button
							size="sm"
							variant={featured ? "default" : "secondary"}
							asChild
						>
							<Link to={threadPath(thread.id)}>
								{item.askType === "reply"
									? "Review reply"
									: item.askType === "approve"
										? "Review decision"
										: "Open thread"}
								<ArrowUpRight aria-hidden="true" />
							</Link>
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() =>
								dispatch({
									type: "item.update",
									itemId: item.id,
									changes: { status: "done" },
								})
							}
						>
							<Check aria-hidden="true" />
							Complete
						</Button>
						<span className="ml-auto">{menu}</span>
					</div>
				</article>
			)}
		</ThreadMenu>
	);
}
