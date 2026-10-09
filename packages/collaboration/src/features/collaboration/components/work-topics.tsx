import { ArrowRight, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button, cn, P, Small } from "@semoss/ui/next";
import { CreateTopicDialog } from "@/features/topics/create-topic-dialog";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { useCollaborationResource } from "../live/work-updates.context";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { topicTone } from "../topic-tone";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";

/** Work starts with the topics that give each action its purpose. */
export function WorkTopics() {
	const { state } = useCollaborationSession();
	const directory = useCollaborationResource("directory");
	const navigate = useNavigate();
	const [isCreating, setIsCreating] = useState(false);
	const createButtonRef = useRef<HTMLButtonElement>(null);
	const topics = state.topics
		.filter((topic) => topic.status !== "archived")
		.sort(
			(a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
		);
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					layoutClassName="flex-col sm:flex-row"
					title="My topics"
					description="Keep related tasks and context together."
					actions={
						<>
							<Button
								asChild
								variant="outline"
								size="sm"
								className="pointer-coarse:min-h-11"
							>
								<Link to="/">Home</Link>
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
					<WorkRefreshStatus directory />
				</CollaborationPageHeader>
			}
		>
			{topics.length ? (
				<ul aria-label="Task topics" className="divide-y divide-border">
					{topics.map((topic) => {
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
										{topic.description && (
											<P className="max-w-prose break-words text-muted-foreground text-sm leading-relaxed">
												{topic.description}
											</P>
										)}
									</div>
									<div className="flex shrink-0 items-center gap-4 text-muted-foreground text-sm tabular-nums">
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
					<P>
						{directory.isLoading
							? "Loading topics…"
							: directory.error
								? "Topics could not be loaded."
								: "No topics yet."}
					</P>
					<P className="text-muted-foreground text-sm">
						{directory.complete
							? "Create a topic to organize your tasks and context."
							: "Use Refresh to check your saved topics."}
					</P>
				</div>
			)}
			{isCreating && (
				<CreateTopicDialog
					returnFocusRef={createButtonRef}
					onSubmit={(id) => {
						setIsCreating(false);
						if (id)
							navigate(`/tasks/topic/${encodeURIComponent(id)}`);
					}}
				/>
			)}
		</CollaborationSurface>
	);
}
