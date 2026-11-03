import { MessageSquare, Unlink } from "lucide-react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	P,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { threadPath } from "@/lib/workspace-paths";
import { channelMeta } from "../channel-meta";
import { dateLabel } from "../date-label";
import type { Thread, WorkItem } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { resumeThread } from "../work-item-actions";
import { PersonAvatar } from "./person-avatar";
import { ThreadMenu } from "./thread-menu";

/** A topic's source thread, with its feed status and existing thread controls. */
export function TopicThreadRow({
	thread,
	topicId,
	items,
}: {
	thread: Thread;
	topicId: string;
	items: WorkItem[];
}) {
	const { state, dispatch } = useCollaborationSession();
	const meta = channelMeta(thread.channel);
	const Icon = meta.icon;
	const topicLink = thread.topicLinks.find(
		(link) => link.topicId === topicId,
	);
	const participant = thread.participants[0];
	const person = state.people.find(
		(candidate) => candidate.id === participant?.personId,
	);
	const participantName =
		person?.name || participant?.name || participant?.email;
	return (
		<li>
			<ThreadMenu
				thread={thread}
				additionalActions={[
					{
						id: "unlink-topic",
						label: "Remove from this topic",
						icon: Unlink,
						onSelect: () =>
							dispatch({
								type: "thread.link",
								threadId: thread.id,
								topicId,
								operation: "remove",
							}),
					},
				]}
			>
				{(menu) => (
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 hover:bg-muted/30">
						<div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:min-w-64 sm:flex-1">
							<span className="sr-only">{meta.label}</span>
							<Icon
								aria-hidden="true"
								className="size-4 shrink-0 text-muted-foreground"
							/>
							<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
								<Link
									className="min-w-0 break-words font-medium text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
									to={threadPath(thread.id)}
									title={
										topicLink?.primary
											? `${thread.subject} · main topic`
											: thread.subject
									}
								>
									{thread.subject}
								</Link>
								{topicLink?.primary && (
									<Small
										className={
											thread.topicLinks.length > 1
												? "font-normal text-muted-foreground text-xs"
												: "sr-only"
										}
									>
										Main topic
									</Small>
								)}

								{items.length > 0 && (
									<Badge
										variant="secondary"
										className="border-0 bg-primary/10 text-primary dark:text-foreground"
									>
										{items.some(
											(item) => item.status === "open",
										)
											? "Open action"
											: "Waiting"}
									</Badge>
								)}
								{topicLink?.source === "suggested" && (
									<Badge variant="outline">
										Suggested topic
									</Badge>
								)}
								{thread.muted && (
									<Badge variant="secondary">Ignored</Badge>
								)}
								{thread.automated && (
									<Badge variant="secondary">Automated</Badge>
								)}
								{thread.isSample && (
									<Badge variant="secondary">Sample</Badge>
								)}
								{thread.channel === "calendar" &&
									thread.when && (
										<Small className="w-full font-normal text-muted-foreground text-xs">
											{thread.when}
										</Small>
									)}
								{thread.channel === "calendar" &&
									thread.conflict && (
										<Small className="w-full break-words font-normal text-warning">
											{thread.conflict}
										</Small>
									)}
								{thread.summary && (
									<P className="line-clamp-2 w-full break-words text-muted-foreground text-sm leading-relaxed">
										{thread.summary}
									</P>
								)}
							</div>
						</div>
						<div className="ml-auto flex max-w-full flex-wrap items-center gap-3 text-muted-foreground">
							{!person && participantName && (
								<span
									className="inline-flex"
									title={participantName}
								>
									<PersonAvatar
										name={participantName}
										email={participant?.email}
										className="size-6"
									/>
									<span className="sr-only">
										{participantName}
									</span>
								</span>
							)}
							{person && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Link
											className="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-ring"
											to={`/brain/people/${encodeURIComponent(person.id)}`}
											aria-label={person.name}
										>
											<PersonAvatar
												name={person.name}
												initials={person.initials}
												email={person.email}
												className="size-6"
											/>
										</Link>
									</TooltipTrigger>
									<TooltipContent>
										{participantName}
									</TooltipContent>
								</Tooltip>
							)}
							<Small className="flex items-center gap-1 font-normal tabular-nums">
								<MessageSquare
									aria-hidden="true"
									className="size-3.5"
								/>
								{thread.messageCount}
								<span className="sr-only"> messages</span>
							</Small>
							<Small className="font-normal text-xs">
								{dateLabel(thread.lastAt)}
							</Small>
							{thread.muted && (
								<Button
									variant="outline"
									size="sm"
									className="pointer-coarse:min-h-11"
									onClick={() =>
										resumeThread(dispatch, thread)
									}
								>
									Resume thread
								</Button>
							)}
							{menu}
						</div>
					</div>
				)}
			</ThreadMenu>
		</li>
	);
}
