import {
	Calendar,
	Check,
	Clock,
	Mail,
	MessageSquare,
	Reply,
	RotateCcw,
	Sparkles,
} from "lucide-react";
import { Link } from "react-router";
import { Badge, Button, P, Small } from "@semoss/ui/next";
import { dateLabel } from "../date-label";
import { selectThreadContext } from "../state/collaboration.selectors";
import type { WorkItem } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { PersonAvatar } from "./person-avatar";
import { TopicChip } from "./topic-chip";

/** A work item with independent navigation and reversible session actions. */
export function WorkItemCard({ item }: { item: WorkItem }) {
	const { state, dispatch } = useCollaborationSession();
	const thread = state.threads.find(
		(candidate) => candidate.id === item.threadId,
	);
	if (!thread) return null;
	const excludedCount =
		selectThreadContext(state, thread.id)?.participants.filter(
			(participant) => !participant.included,
		).length ?? 0;
	const person = state.people.find(
		(candidate) => candidate.id === item.actorId,
	);
	const author =
		person?.name || (item.actorId === "assistant" ? "Assistant" : "You");
	const Icon =
		item.channel === "email"
			? Mail
			: item.channel === "calendar"
				? Calendar
				: MessageSquare;
	const path = `/work/thread/${encodeURIComponent(thread.id)}`;
	return (
		<article className="flex gap-3 border-b px-4 py-4 transition-colors hover:bg-muted/30 md:px-6">
			<PersonAvatar name={author} initials={person?.initials} />
			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<Small className="font-medium">{author}</Small>
					<Small className="inline-flex items-center gap-1 text-muted-foreground">
						<Icon aria-hidden="true" className="size-3" />
						{item.channel}
					</Small>
					<Small className="text-muted-foreground">
						{dateLabel(item.received)}
					</Small>
					{item.suggested ? (
						<Badge variant="secondary">
							<Sparkles aria-hidden="true" />
							Suggestion
						</Badge>
					) : (
						item.priority === "P0" && (
							<Badge variant="destructive">Urgent</Badge>
						)
					)}
				</div>
				<Link
					to={path}
					className="block break-words font-medium text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
				>
					{item.title}
				</Link>
				<P className="line-clamp-2 break-words text-muted-foreground text-sm">
					{thread.summary}
				</P>
				<div className="flex flex-wrap items-center gap-2">
					{thread.topicLinks.map((link) => {
						const topic = state.topics.find(
							(candidate) => candidate.id === link.topicId,
						);
						return (
							topic && (
								<div
									key={link.topicId}
									className="flex flex-wrap items-center gap-1"
								>
									<TopicChip
										topic={topic}
										suggested={link.source === "suggested"}
									/>
									{link.source === "suggested" && (
										<>
											<Button
												variant="ghost"
												size="sm"
												aria-label={`Confirm ${topic.short} for ${thread.subject}`}
												onClick={() =>
													dispatch({
														type: "thread.link",
														threadId: thread.id,
														topicId: topic.id,
														operation: "confirm",
													})
												}
											>
												Yes
											</Button>
											<Button
												variant="ghost"
												size="sm"
												aria-label={`Remove ${topic.short} from ${thread.subject}`}
												onClick={() =>
													dispatch({
														type: "thread.link",
														threadId: thread.id,
														topicId: topic.id,
														operation: "remove",
													})
												}
											>
												No
											</Button>
										</>
									)}
								</div>
							)
						);
					})}
				</div>
				{item.reasons.length > 0 && (
					<Small className="text-muted-foreground">
						{item.reasons.join(" · ")}
					</Small>
				)}
				{item.due && (
					<Small className="text-muted-foreground">
						Due {dateLabel(item.due)}
					</Small>
				)}
				<div className="flex flex-wrap items-center gap-1">
					{item.suggested ? (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									dispatch({
										type: "item.update",
										itemId: item.id,
										changes: { suggested: false },
									})
								}
							>
								Add to my list
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									dispatch({
										type: "item.update",
										itemId: item.id,
										changes: { status: "dismissed" },
									})
								}
							>
								No thanks
							</Button>
						</>
					) : item.status === "done" ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								dispatch({
									type: "item.update",
									itemId: item.id,
									changes: { status: "open" },
								})
							}
						>
							<RotateCcw aria-hidden="true" />
							Move back
						</Button>
					) : (
						<>
							<Button asChild variant="ghost" size="sm">
								<Link to={path}>
									<Reply aria-hidden="true" />
									{item.status === "waiting"
										? "Nudge"
										: "Respond"}
								</Link>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									dispatch({
										type: "item.update",
										itemId: item.id,
										changes: { status: "done" },
									})
								}
							>
								<Check aria-hidden="true" />
								Done
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									dispatch({
										type: "item.update",
										itemId: item.id,
										changes: { status: "snoozed" },
									})
								}
							>
								<Clock aria-hidden="true" />
								Snooze
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									dispatch({
										type: "item.update",
										itemId: item.id,
										changes: { status: "dismissed" },
									})
								}
							>
								Dismiss
							</Button>
						</>
					)}
					<Small className="ml-auto text-muted-foreground">
						{thread.messageCount} messages · {excludedCount}{" "}
						excluded
					</Small>
				</div>
			</div>
		</article>
	);
}
