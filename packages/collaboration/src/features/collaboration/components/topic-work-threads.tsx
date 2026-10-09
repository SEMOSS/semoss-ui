import { Link } from "react-router";
import { Badge, Button, P, Small } from "@semoss/ui/next";
import { threadPath } from "@/lib/workspace-paths";
import { channelMeta } from "../channel-meta";
import { dateLabel } from "../date-label";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { resumeThread } from "../work-item-actions";
import { ThreadMenu } from "./thread-menu";

interface TopicWorkThreadsProps {
	/** Topic whose explicit thread links are displayed. */
	topicId: string;
}

/** Source threads retain their menus and import a fresh room when opened. */
export function TopicWorkThreads({ topicId }: TopicWorkThreadsProps) {
	const { state, dispatch } = useCollaborationSession();
	const threads = state.threads.filter((thread) =>
		thread.topicLinks.some((link) => link.topicId === topicId),
	);
	return threads.length ? (
		<ul aria-label="Topic threads" className="divide-y divide-border">
			{threads.map((thread) => {
				const meta = channelMeta(thread.channel);
				const Icon = meta.icon;
				const link = thread.topicLinks.find(
					(candidate) => candidate.topicId === topicId,
				);
				return (
					<ThreadMenu key={thread.id} thread={thread}>
						{(menu) => (
							<li className="flex flex-wrap items-start gap-3 p-4 hover:bg-muted/30 md:px-6">
								<Icon
									aria-hidden="true"
									className="mt-1 size-4 shrink-0 text-muted-foreground"
								/>
								<div className="min-w-0 flex-1 space-y-1">
									<Link
										to={threadPath(thread.id)}
										className="break-words font-medium text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
									>
										{thread.subject}
									</Link>
									<Small className="block font-normal text-muted-foreground text-xs">
										{meta.label} ·{" "}
										{dateLabel(thread.lastAt)} ·{" "}
										{thread.messageCount} messages
									</Small>
									{thread.summary && (
										<P className="break-words text-muted-foreground text-sm leading-relaxed">
											{thread.summary}
										</P>
									)}
									<div className="flex flex-wrap gap-2">
										{link?.source === "suggested" && (
											<Badge variant="outline">
												Suggested topic
											</Badge>
										)}
										{thread.muted && (
											<Badge variant="secondary">
												Ignored
											</Badge>
										)}
										{thread.automated && (
											<Badge variant="secondary">
												Automated
											</Badge>
										)}
										{thread.isSample && (
											<Badge variant="secondary">
												Sample
											</Badge>
										)}
									</div>
								</div>
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
							</li>
						)}
					</ThreadMenu>
				);
			})}
		</ul>
	) : (
		<P className="p-6 text-muted-foreground text-sm">
			No threads in this topic yet. Add this topic from a thread’s details
			in Brain.
		</P>
	);
}
