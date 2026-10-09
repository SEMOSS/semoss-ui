import { Check, Circle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	cn,
	H2,
	P,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { TopicSessions } from "@/features/dashboard/topic-sessions";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { TopicWorkThreads } from "./topic-work-threads";
import { WorkItemsFeed } from "./work-items-feed";
import { WorkOverview } from "./work-overview";

interface TopicWorkProps {
	/** The exact topic selected by the Work route. */
	topicId: string;
}

/** A topic's actions and conversations, with its goals and confirmed context. */
export function TopicWork({ topicId }: TopicWorkProps) {
	const { state } = useCollaborationSession();
	const [tab, setTab] = useState("actions");
	const topic = state.topics.find((candidate) => candidate.id === topicId);
	if (!topic) {
		return (
			<CollaborationSurface
				header={<CollaborationPageHeader title="Topic unavailable" />}
			>
				<div className="space-y-4 p-6">
					<P className="text-muted-foreground">
						This topic is not available in the current workspace.
					</P>
					<Button asChild variant="outline">
						<Link to="/for-you">Back to For you</Link>
					</Button>
				</div>
			</CollaborationSurface>
		);
	}
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					layoutClassName="flex-col sm:flex-row"
					title={topic.name}
					description={
						topic.description ||
						"Actions and conversations for this topic."
					}
					actions={
						<>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="pointer-coarse:min-h-11"
							>
								<Link to="/tasks/topics">All topics</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								size="sm"
								className="pointer-coarse:min-h-11"
							>
								<Link
									to={`/brain/topics/${encodeURIComponent(topic.id)}`}
								>
									Edit in Brain
								</Link>
							</Button>
						</>
					}
				>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline" className="capitalize">
							{topic.status}
						</Badge>
						{topic.isSample && (
							<Badge variant="secondary">Sample topic</Badge>
						)}
					</div>
					{topic.goals.length > 0 && (
						<section className="space-y-2" aria-label="Topic goals">
							<H2 className="font-medium text-base">Goals</H2>
							<ul className="space-y-2">
								{topic.goals.map((goal) => {
									const Icon =
										goal.status === "done" ? Check : Circle;
									return (
										<li
											key={goal.noteId}
											className="flex items-start gap-2 text-sm"
										>
											<Icon
												aria-hidden="true"
												className={cn(
													"mt-0.5 size-4 shrink-0",
													goal.status === "done"
														? "text-success"
														: "text-muted-foreground",
												)}
											/>
											<span
												className={cn(
													"max-w-prose break-words",
													goal.status === "done" &&
														"text-muted-foreground line-through",
												)}
											>
												{goal.text}
											</span>
											{goal.status === "done" && (
												<span className="sr-only">
													Completed
												</span>
											)}
										</li>
									);
								})}
							</ul>
						</section>
					)}
				</CollaborationPageHeader>
			}
			aside={<WorkOverview topic={topic} />}
			asideTitle="Topic context"
		>
			<Tabs value={tab} onValueChange={setTab} className="gap-0">
				<div className="border-border border-b p-4 md:px-5">
					<TabsList
						aria-label="Topic workspace"
						className={collaborationTabsStyles.list}
					>
						<TabsTrigger
							value="actions"
							className={collaborationTabsStyles.trigger}
						>
							Actions
						</TabsTrigger>
						<TabsTrigger
							value="threads"
							className={collaborationTabsStyles.trigger}
						>
							Threads
						</TabsTrigger>
						<TabsTrigger
							value="sessions"
							className={collaborationTabsStyles.trigger}
						>
							Sessions
						</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="actions" className="mt-0">
					<WorkItemsFeed topicId={topic.id} initialFilter="open" />
				</TabsContent>
				<TabsContent value="threads" className="mt-0">
					<TopicWorkThreads topicId={topic.id} />
				</TabsContent>
				<TabsContent value="sessions" className="mt-0">
					{tab === "sessions" && <TopicSessions topicId={topic.id} />}
				</TabsContent>
			</Tabs>
		</CollaborationSurface>
	);
}
