import { ArrowRight, Inbox, Layers, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { Badge, Button, cn, P, Separator, Small } from "@semoss/ui/next";
import { BriefPanel } from "@/features/dashboard/brief-panel";
import { MailCheckStatus } from "@/features/dashboard/mail-check-status";
import { topicPath } from "@/lib/workspace-paths";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { topicTone } from "../topic-tone";
import { CollaborationHeroHeader } from "./collaboration-hero-header";
import { CollaborationHeroPage } from "./collaboration-hero-page";
import { TopicEditor } from "./topic-editor";
import { useWorkItems, waitingOn } from "./work-items-list";

/** The topics that group the owner's work items, each opening its own page. */
export function WorkTopics() {
	const { state } = useCollaborationSession();
	const { items, isMine } = useWorkItems();
	const [isCreating, setIsCreating] = useState(false);
	const createButtonRef = useRef<HTMLButtonElement>(null);
	const topics = state.topics.filter((topic) => topic.status !== "archived");
	const openReviews = state.reviews.filter(
		(review) => review.status === "open",
	).length;

	const create = (
		<Button
			ref={createButtonRef}
			size="sm"
			className="pointer-coarse:min-h-11"
			onClick={() => setIsCreating(true)}
		>
			<Plus aria-hidden="true" /> New topic
		</Button>
	);
	const list = topics.length ? (
		<ul aria-label="Work topics" className="divide-y divide-border">
			{topics.map((topic) => {
				// the owner's kept work items on this topic, and those waiting on someone
				const work = (items ?? []).filter(
					(item) => !item.proposed && item.topicId === topic.id,
				);
				const open = work.length;
				const waiting = work.filter((item) =>
					waitingOn(item, isMine),
				).length;
				return (
					<li key={topic.id}>
						<Link
							to={topicPath(topic.id)}
							// the hero's card has padding of its own, so a row only reaches a little past the text
							className="-mx-2 flex min-w-0 flex-col gap-4 rounded-lg px-2 py-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring sm:flex-row sm:items-center"
						>
							<div className="min-w-0 flex-1 space-y-2">
								<div className="flex flex-wrap items-center gap-2">
									<Small className="break-words font-medium text-base">
										{/* inside the name's first line, so a long name wraps beside its dot, not under it */}
										<span
											aria-hidden="true"
											className={cn(
												"mr-2 inline-block size-2 rounded-full align-middle",
												topicTone(topic.id),
											)}
										/>
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
								<P className="line-clamp-2 max-w-prose break-words text-muted-foreground text-sm leading-relaxed">
									{topic.description || "No description yet."}
								</P>
							</div>
							<div className="flex shrink-0 items-center gap-4 text-muted-foreground text-sm tabular-nums">
								{items !== null ? (
									<>
										<span>{open} open</span>
										<span>{waiting} waiting</span>
									</>
								) : null}
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
		<div className="space-y-2">
			<P>No topics yet.</P>
			<P className="text-muted-foreground text-sm">
				Create a topic to group your work items.
			</P>
		</div>
	);
	const editor = isCreating && (
		<TopicEditor
			returnFocusRef={createButtonRef}
			onClose={() => setIsCreating(false)}
		/>
	);

	return (
		<CollaborationHeroPage>
			<CollaborationHeroHeader
				title="Your topics."
				description="Choose a topic to focus on its actions, threads, and sessions."
			>
				<MailCheckStatus />
				<Separator
					orientation="vertical"
					className="data-[orientation=vertical]:h-4"
				/>
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="pointer-coarse:min-h-11 text-foreground"
				>
					<Link to="/work">
						<Layers aria-hidden="true" />
						All work
					</Link>
				</Button>
			</CollaborationHeroHeader>
			{openReviews > 0 && (
				<div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/15 bg-primary/5 px-5 py-4">
					<div className="flex min-w-0 items-center gap-3.5">
						<span
							aria-hidden="true"
							className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-xs"
						>
							<Inbox className="size-4" />
						</span>
						<div className="min-w-0">
							<P className="font-semibold text-sm">
								{openReviews}{" "}
								{openReviews === 1
									? "conversation needs"
									: "conversations need"}{" "}
								topic review
							</P>
							<P className="text-muted-foreground text-xs">
								Confirm which topic these emails and chats
								belong to.
							</P>
						</div>
					</div>
					<Button asChild variant="outline" size="sm">
						<Link to="/brain">
							Review filing
							<ArrowRight aria-hidden="true" className="size-4" />
						</Link>
					</Button>
				</div>
			)}
			<BriefPanel
				title="All topics"
				count={topics.length}
				detail={create}
			>
				{list}
			</BriefPanel>
			{editor}
		</CollaborationHeroPage>
	);
}
