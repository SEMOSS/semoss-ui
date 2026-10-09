import {
	ArrowDownUp,
	ArrowLeft,
	ChevronRight,
	Plus,
	RefreshCw,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	H1,
	H2,
	P,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useAttention } from "@/features/attention/attention.context";
import {
	buildAttentionItems,
	selectAttentionItems,
} from "@/features/attention/attention.model";
import { AttentionCard } from "@/features/attention/attention-card";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { TopicActions } from "@/features/collaboration/components/topic-actions";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { TopicSessions } from "@/features/dashboard/topic-sessions";
import { TopicActivity } from "./topic-activity";
import { TopicContext } from "./topic-context";
import { TopicGoals } from "./topic-goals";
import { TopicTaskGroup } from "./topic-task-group";
import { selectTopicTasks } from "./topic-task-selectors";
import { useTopicWork } from "./use-topic-work";

const tabStyle =
	"h-12 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 font-normal text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent";

/** A topic's goals, real work, context, and verified rooms in one landing page. */
export function TopicWorkspace({ topicId }: { topicId: string }) {
	const { state } = useCollaborationSession();
	const work = useTopicWork(topicId);
	const attention = useAttention();
	const [tab, setTab] = useState("overview");
	const unavailableId = useId();
	const contextTriggerRef = useRef<HTMLButtonElement>(null);
	const topic = state.topics.find((candidate) => candidate.id === topicId);
	const groups = selectTopicTasks(work.items, state.threads, topicId);
	const taskReviews = buildAttentionItems(
		{ ...state, items: groups.needsInput, reviews: [], memories: [] },
		{ runs: [], delegations: [], roomSource: () => undefined },
	);
	const input = selectAttentionItems(
		[
			...attention.items.filter((item) => item.kind !== "work"),
			...taskReviews,
		],
		{ topicId },
	);
	const threads = state.threads.filter((thread) =>
		thread.topicLinks.some((link) => link.topicId === topicId),
	);
	const refresh = (): void => {
		work.refresh();
		attention.refresh();
	};
	if (!topic) {
		return (
			<CollaborationPage>
				<H1 className="mb-6 font-medium text-2xl">
					{work.isLoading ? "Loading topic…" : "Topic unavailable"}
				</H1>
				{work.isLoading ? (
					<div className="space-y-4" aria-busy="true">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-48 w-full" />
					</div>
				) : (
					<div className="space-y-4">
						<P className="text-muted-foreground">
							{work.error ||
								"This topic is not available in the current workspace."}
						</P>
						<div className="flex flex-wrap gap-2">
							<Button variant="outline" onClick={work.refresh}>
								Retry
							</Button>
							<Button asChild variant="outline">
								<Link to="/tasks/topics">
									<ArrowLeft aria-hidden="true" />
									My topics
								</Link>
							</Button>
						</div>
					</div>
				)}
			</CollaborationPage>
		);
	}
	return (
		<CollaborationPage>
			<nav
				aria-label="Breadcrumb"
				className="mb-5 flex min-w-0 items-center gap-3 text-muted-foreground text-sm"
			>
				<Link
					className="shrink-0 rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
					to="/tasks/topics"
				>
					My topics
				</Link>
				<ChevronRight aria-hidden="true" className="size-4 shrink-0" />
				<span className="truncate text-foreground" aria-current="page">
					{topic.name}
				</span>
			</nav>
			<header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
				<div className="min-w-0">
					<H1 className="break-words font-medium text-2xl sm:text-3xl">
						{topic.name}
					</H1>
					{topic.status === "archived" && (
						<Badge variant="secondary" className="mt-2">
							Archived
						</Badge>
					)}
				</div>
				<div className="space-y-2">
					<div className="flex flex-wrap items-center gap-2 sm:justify-end">
						<Button
							variant="ghost"
							size="icon"
							aria-label="Refresh topic"
							disabled={work.isLoading || attention.isLoading}
							onClick={refresh}
						>
							<RefreshCw aria-hidden="true" />
						</Button>
						<TopicActions
							topic={topic}
							threadCount={threads.length}
						/>
						<Button
							disabled
							aria-describedby={`${unavailableId}-chat`}
						>
							<Plus aria-hidden="true" />
							New chat
						</Button>
					</div>
					<P
						id={`${unavailableId}-chat`}
						className="text-muted-foreground text-sm sm:text-right"
					>
						Topic chats aren’t available yet.
					</P>
				</div>
			</header>
			<TopicGoals topic={topic} />
			{work.error && (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-3">
						<span>
							{work.error} These results may be incomplete.
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={work.isLoading}
							onClick={work.refresh}
						>
							Retry topic
						</Button>
					</AlertDescription>
				</Alert>
			)}
			<Tabs value={tab} onValueChange={setTab} className="gap-0">
				<TabsList
					aria-label="Topic workspace"
					className="h-auto w-full justify-start gap-3 overflow-x-auto rounded-none border-border border-b bg-transparent p-0 sm:gap-6"
				>
					<TabsTrigger value="overview" className={tabStyle}>
						Overview
					</TabsTrigger>
					<TabsTrigger
						ref={contextTriggerRef}
						value="context"
						className={tabStyle}
					>
						Context
					</TabsTrigger>
					<TabsTrigger value="rooms" className={tabStyle}>
						Rooms
					</TabsTrigger>
					<TabsTrigger value="chat" className={tabStyle}>
						Chat
					</TabsTrigger>
				</TabsList>
				<TabsContent value="overview" className="mt-0 py-6">
					<div className="grid min-w-0 gap-8 xl:grid-cols-4">
						<div className="min-w-0 space-y-8 xl:col-span-3">
							<section
								aria-label="Needs your input"
								className="space-y-4"
							>
								<div className="flex flex-wrap items-center justify-between gap-3">
									<H2 className="flex items-center gap-3 font-medium text-xl">
										Needs your input
										{input.length > 0 && (
											<Badge
												variant="secondary"
												className="rounded-sm bg-warning/10 text-foreground"
											>
												{input.length}
												{!attention.isComplete ||
												!work.isComplete
													? "+"
													: ""}
											</Badge>
										)}
									</H2>
									<P className="text-muted-foreground text-sm">
										You have the final say
									</P>
								</div>
								{attention.errors.length > 0 && (
									<Alert variant="destructive">
										<AlertDescription>
											<P className="text-sm">
												Some requests could not be
												checked.{" "}
												{attention.errors.join(" ")}
											</P>
											<Button
												variant="link"
												disabled={attention.isLoading}
												onClick={attention.refresh}
											>
												Retry requests
											</Button>
										</AlertDescription>
									</Alert>
								)}
								{(attention.isLoading || work.isLoading) &&
								input.length === 0 ? (
									<div aria-busy="true" className="space-y-3">
										<output className="sr-only">
											Checking requests…
										</output>
										<Skeleton className="h-28 w-full" />
									</div>
								) : input.length > 0 ? (
									<div className="@container/reviews overflow-hidden rounded-lg border border-warning/25 bg-warning/5 px-4 sm:px-5">
										{input.map((item) => (
											<AttentionCard
												key={item.id}
												item={item}
												view="list"
											/>
										))}
									</div>
								) : (
									<P className="rounded-md border border-border px-4 py-5 text-base text-muted-foreground">
										{attention.isComplete &&
										work.isComplete &&
										!attention.errors.length
											? "Nothing needs your input in this topic right now."
											: "No requests found in the information checked so far."}
									</P>
								)}
							</section>
							<div className="space-y-4">
								{work.isLoading && !work.items.length ? (
									<div aria-busy="true" className="space-y-4">
										<H2 className="font-medium text-xl">
											Next up
										</H2>
										<output className="text-muted-foreground text-sm">
											Loading related tasks…
										</output>
										<Skeleton className="h-24 w-full" />
										<Skeleton className="h-24 w-full" />
									</div>
								) : (
									<TopicTaskGroup
										title="Next up"
										items={groups.next}
										isComplete={work.isComplete}
										emptyText={
											work.isComplete
												? "No other open tasks in this topic."
												: "No other open tasks found so far."
										}
									/>
								)}
								<div className="flex flex-wrap gap-x-6 gap-y-4 border-border border-t pt-4">
									<div className="space-y-2">
										<Button
											disabled
											variant="ghost"
											className="-ml-3 text-primary"
											aria-describedby={`${unavailableId}-add-task`}
										>
											<Plus aria-hidden="true" />
											Add an action item
										</Button>
										<P
											id={`${unavailableId}-add-task`}
											className="max-w-prose text-muted-foreground text-sm"
										>
											Tasks can currently be added from a
											source thread.
										</P>
									</div>
									<div className="space-y-2">
										<Button
											disabled
											variant="ghost"
											className="-ml-3"
											aria-describedby={`${unavailableId}-reorder`}
										>
											<ArrowDownUp aria-hidden="true" />
											Reorder
										</Button>
										<P
											id={`${unavailableId}-reorder`}
											className="text-muted-foreground text-sm"
										>
											Manual ordering isn’t available. Use
											a task’s menu to change its
											priority.
										</P>
									</div>
								</div>
							</div>
							<TopicTaskGroup
								title="Waiting"
								items={groups.waiting}
								isComplete={work.isComplete}
								isCollapsible
							/>
							<TopicTaskGroup
								title="Completed"
								items={groups.completed}
								isComplete={work.isComplete}
								isCollapsible
							/>
							{groups.snoozed.length > 0 && (
								<TopicTaskGroup
									title="Snoozed"
									items={groups.snoozed}
									isComplete={work.isComplete}
									isCollapsible
								/>
							)}
						</div>
						<TopicActivity
							onContext={() => {
								setTab("context");
								window.requestAnimationFrame(() =>
									contextTriggerRef.current?.focus(),
								);
							}}
						/>
					</div>
				</TabsContent>
				<TabsContent value="context" className="mt-0">
					<TopicContext topic={topic} />
				</TabsContent>
				<TabsContent value="rooms" className="mt-0">
					<TopicSessions topicId={topic.id} />
					<P className="pb-6 text-muted-foreground text-sm">
						These rooms are linked through source threads. Attaching
						a chat directly to this topic isn’t available yet.
					</P>
				</TabsContent>
				<TabsContent value="chat" className="mt-0">
					<section className="max-w-prose space-y-4 py-8">
						<H2 className="font-medium text-xl">
							Topic chat is not available yet.
						</H2>
						<P className="text-base text-muted-foreground">
							Chats can’t be attached directly to a topic yet. You
							can open an existing conversation from Rooms or
							start an ordinary chat from Home.
						</P>
						<Button asChild variant="outline">
							<Link to="/">Go to Home</Link>
						</Button>
					</section>
				</TabsContent>
			</Tabs>
		</CollaborationPage>
	);
}
