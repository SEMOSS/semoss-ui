import { ArrowRight, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { Badge, Button, cn, P, Small } from "@semoss/ui/next";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { topicTone } from "../topic-tone";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { TopicEditor } from "./topic-editor";

/** Work starts with the topics that give each action its purpose. */
export function WorkTopics() {
	const { state } = useCollaborationSession();
	const [isCreating, setIsCreating] = useState(false);
	const createButtonRef = useRef<HTMLButtonElement>(null);
	const topics = state.topics.filter((topic) => topic.status !== "archived");
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					layoutClassName="flex-col sm:flex-row"
					title="Topics"
					description="Explore the topics behind your tasks, threads, and sessions."
					actions={
						<>
							<Button
								asChild
								variant="outline"
								size="sm"
								className="pointer-coarse:min-h-11"
							>
								<Link to="/for-you">For you</Link>
							</Button>
							<Button
								ref={createButtonRef}
								size="sm"
								className="pointer-coarse:min-h-11"
								onClick={() => setIsCreating(true)}
							>
								<Plus aria-hidden="true" /> New topic
							</Button>
						</>
					}
				>
					<WorkRefreshStatus />
				</CollaborationPageHeader>
			}
		>
			{topics.length ? (
				<ul aria-label="Task topics" className="divide-y divide-border">
					{topics.map((topic) => {
						const open = selectWorkItems(state, {
							topicId: topic.id,
						}).total;
						const waiting = selectWorkItems(state, {
							topicId: topic.id,
							view: "waiting",
						}).total;
						return (
							<li key={topic.id}>
								<Link
									to={`/tasks/topic/${encodeURIComponent(topic.id)}`}
									className="focus-visible:-outline-offset-2 flex min-w-0 flex-col gap-4 p-5 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring sm:flex-row sm:items-center md:px-6"
								>
									<div className="min-w-0 flex-1 space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<span
												aria-hidden="true"
												className={cn(
													"size-2 shrink-0 rounded-full",
													topicTone(topic.id),
												)}
											/>
											<Small className="break-words font-medium text-base">
												{topic.name}
											</Small>
											<Badge
												variant="outline"
												className="font-normal capitalize"
											>
												{topic.status}
											</Badge>
											{topic.isSample && (
												<Badge variant="secondary">
													Sample
												</Badge>
											)}
										</div>
										<P className="max-w-prose break-words text-muted-foreground text-sm leading-relaxed">
											{topic.description ||
												"No description yet."}
										</P>
									</div>
									<div className="flex shrink-0 items-center gap-4 text-muted-foreground text-sm tabular-nums">
										<span>{open} open</span>
										<span>{waiting} waiting</span>
										<ArrowRight
											aria-hidden="true"
											className="ml-auto size-4"
										/>
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			) : (
				<div className="space-y-2 p-6">
					<P>No topics yet.</P>
					<P className="text-muted-foreground text-sm">
						Create a topic to organize your tasks, or open For you
						to see unfiled actions.
					</P>
				</div>
			)}
			{isCreating && (
				<TopicEditor
					returnFocusRef={createButtonRef}
					onClose={() => setIsCreating(false)}
				/>
			)}
		</CollaborationSurface>
	);
}
