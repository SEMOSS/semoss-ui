import {
	BellOff,
	Check,
	Clock,
	Plus,
	Reply,
	RotateCcw,
	Sparkles,
	X,
} from "lucide-react";
import { Link } from "react-router";
import { Badge, Button, cn, P, Small } from "@semoss/ui/next";
import { threadPath } from "@/lib/workspace-paths";
import { channelMeta } from "../channel-meta";
import { dateLabel } from "../date-label";
import { selectThreadContext } from "../state/collaboration.selectors";
import type { WorkItem } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { ignoreThread, noResponseNeeded } from "../work-item-actions";
import { PersonAvatar } from "./person-avatar";
import { ThreadMenu } from "./thread-menu";
import { TopicChip } from "./topic-chip";

// the classifier ends its reasons with "Urgency: <level>"; the level reads better as a marked label
const URGENCY_PREFIX = "Urgency: ";
const URGENCY_TONES: Record<string, string> = {
	"Right now": "bg-destructive",
	Today: "bg-warning",
	"This week": "bg-warning",
};

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
	const { label: channelLabel, icon: Icon } = channelMeta(item.channel);
	const path = threadPath(thread.id);
	return (
		<ThreadMenu thread={thread} item={item}>
			{(menu) => (
				<article className="group/item flex gap-3 border-border border-b border-l-3 border-l-transparent py-4 pr-4 pl-3 transition-colors focus-within:border-l-primary focus-within:bg-accent hover:border-l-primary hover:bg-accent md:pr-6 md:pl-5">
					<PersonAvatar
						name={author}
						initials={person?.initials}
						className="size-9"
					/>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
							<span className="font-medium text-base">
								{author}
							</span>
							<span
								className="inline-flex text-muted-foreground"
								title={channelLabel}
							>
								<Icon aria-hidden="true" className="size-4" />
								<span className="sr-only">{channelLabel}</span>
							</span>
							{item.suggested ? (
								<Badge
									variant="outline"
									className="border-primary/30 bg-primary/10 px-2 text-primary text-sm"
								>
									<Sparkles aria-hidden="true" />
									Suggestion
								</Badge>
							) : (
								item.priority === "P0" && (
									<Badge
										variant="outline"
										className="border-transparent bg-destructive/10 px-2 text-destructive text-sm"
									>
										Urgent
									</Badge>
								)
							)}
							<div className="ml-auto flex items-center gap-3">
								{item.due && (
									<Small
										className={cn(
											"font-normal",
											item.priority === "P0"
												? "text-destructive"
												: "text-muted-foreground",
										)}
									>
										Due{" "}
										{dateLabel(item.due, undefined, "date")}
									</Small>
								)}
								<Small className="font-normal text-muted-foreground group-focus-within/item:text-primary group-hover/item:text-primary">
									{dateLabel(item.received)}
								</Small>
								{menu}
							</div>
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
							<Link
								to={path}
								className="break-words font-medium text-base leading-snug hover:underline focus-visible:outline-2 focus-visible:outline-ring group-focus-within/item:text-primary group-hover/item:text-primary"
							>
								{item.title}
							</Link>
							{thread.topicLinks.map((link) => {
								const topic = state.topics.find(
									(candidate) =>
										candidate.id === link.topicId,
								);
								return (
									topic && (
										<div
											key={link.topicId}
											className="flex flex-wrap items-center gap-1"
										>
											<TopicChip
												topic={topic}
												suggested={
													link.source === "suggested"
												}
											/>
											{link.source === "suggested" && (
												<>
													<Button
														variant="ghost"
														size="sm"
														className="h-7 px-2"
														aria-label={`Confirm ${topic.short} for ${thread.subject}`}
														onClick={() =>
															dispatch({
																type: "thread.link",
																threadId:
																	thread.id,
																topicId:
																	topic.id,
																operation:
																	"confirm",
															})
														}
													>
														Yes
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="h-7 px-2"
														aria-label={`Remove ${topic.short} from ${thread.subject}`}
														onClick={() =>
															dispatch({
																type: "thread.link",
																threadId:
																	thread.id,
																topicId:
																	topic.id,
																operation:
																	"remove",
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
						{thread.summary && (
							<P className="mt-1 line-clamp-2 break-words text-muted-foreground text-sm leading-relaxed">
								{thread.summary}
							</P>
						)}
						{item.reasons.length > 0 && (
							<div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
								{item.reasons.map((reason, index) => {
									const urgency = reason.startsWith(
										URGENCY_PREFIX,
									)
										? reason.slice(URGENCY_PREFIX.length)
										: null;
									return (
										<span
											key={`${index}-${reason}`}
											className={cn(
												"inline-flex items-center gap-1.5",
												index === 0
													? "text-foreground"
													: "text-muted-foreground",
											)}
										>
											{urgency !== null && (
												<>
													<span
														aria-hidden="true"
														className={cn(
															"size-2 shrink-0 rounded-full",
															URGENCY_TONES[
																urgency
															] ??
																"bg-muted-foreground/50",
														)}
													/>
													<span className="sr-only">
														{URGENCY_PREFIX}
													</span>
												</>
											)}
											{urgency ?? reason}
										</span>
									);
								})}
							</div>
						)}
						<div className="-ml-2 mt-2 flex flex-wrap items-center gap-0.5 [&_[data-slot=button]:hover]:bg-foreground/5 [&_[data-slot=button]]:px-2 [&_svg]:text-muted-foreground">
							{item.suggested ? (
								<>
									<Button
										variant="outline"
										size="sm"
										className="mr-1 ml-2"
										onClick={() =>
											dispatch({
												type: "item.update",
												itemId: item.id,
												changes: { suggested: false },
											})
										}
									>
										<Plus aria-hidden="true" />
										Add to my list
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="font-normal"
										onClick={() =>
											noResponseNeeded(dispatch, item)
										}
									>
										<X aria-hidden="true" />
										No response needed
									</Button>
								</>
							) : item.status === "done" ? (
								<Button
									variant="ghost"
									size="sm"
									className="font-normal"
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
							) : item.status === "snoozed" ? (
								<>
									<Button
										variant="ghost"
										size="sm"
										className="font-normal"
										onClick={() =>
											dispatch({
												type: "item.update",
												itemId: item.id,
												changes: {
													status:
														item.snoozedFrom ??
														"open",
												},
											})
										}
									>
										<RotateCcw aria-hidden="true" />
										Bring back
									</Button>
									{item.snoozeUntil && (
										<Small className="px-2 font-normal text-muted-foreground">
											Until{" "}
											{dateLabel(
												item.snoozeUntil,
												(item.isSample
													? state.profile
													: state.liveProfile
												)?.timezone,
											)}
										</Small>
									)}
								</>
							) : (
								<>
									<Button
										asChild
										variant="ghost"
										size="sm"
										className="font-normal"
									>
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
										className="font-normal"
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
										className="font-normal"
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
										className="font-normal"
										title="Clears this item; a new request on the thread still shows up"
										onClick={() =>
											noResponseNeeded(dispatch, item)
										}
									>
										<X aria-hidden="true" />
										No response needed
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="font-normal"
										title="No more Work from this thread; it stays in Brain"
										onClick={() =>
											ignoreThread(dispatch, thread)
										}
									>
										<BellOff aria-hidden="true" />
										Ignore thread
									</Button>
								</>
							)}
							<Small className="ml-auto font-normal text-muted-foreground">
								{thread.messageCount}{" "}
								{thread.messageCount === 1
									? "message"
									: "messages"}
								{excludedCount > 0 &&
									` · ${excludedCount} excluded`}
							</Small>
						</div>
					</div>
				</article>
			)}
		</ThreadMenu>
	);
}
