import { Brain, Folder } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
	Button,
	P,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { learnedMemories, suggestedMemories } from "../state/memory";
import { BrainOverview } from "./brain-overview";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { MemoryRow } from "./memory-list";
import { ReviewCard } from "./review-card";

/** Human review of topic suggestions, memberships, and memories Brain suggests or the assistant learned. */
export function BrainReview() {
	const { state, dispatch } = useCollaborationSession();
	const [tab, setTab] = useState("needs");
	const open = state.reviews.filter((review) => review.status === "open");
	const resolved = state.reviews.filter((review) => review.status !== "open");
	const suggestions = suggestedMemories(state.memories);
	const learnedInChat = learnedMemories(state.memories);
	const learned = state.threads.flatMap((thread) =>
		thread.topicLinks
			.filter((link) => link.source === "confirmed")
			.map((link) => ({
				thread,
				link,
				topic: state.topics.find((topic) => topic.id === link.topicId),
			})),
	);
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title="Review"
					description="Suggestions to check before using them as confirmed context."
				/>
			}
			aside={
				<>
					<BrainOverview />
					<Button asChild variant="outline">
						<Link to="/brain/sources">Sources</Link>
					</Button>
				</>
			}
			asideTitle="Brain overview"
		>
			<Tabs value={tab} onValueChange={setTab} className="gap-0">
				<div className="border-b p-4 md:px-6">
					<TabsList className={collaborationTabsStyles.list}>
						<TabsTrigger
							value="needs"
							className={collaborationTabsStyles.trigger}
						>
							Pending ({open.length + suggestions.length})
						</TabsTrigger>
						<TabsTrigger
							value="learned"
							className={collaborationTabsStyles.trigger}
						>
							Learned recently
						</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="needs" className="mt-0">
					{open.map((review) => (
						<ReviewCard key={review.id} review={review} />
					))}
					{suggestions.length > 0 && (
						<section
							aria-label="Memories to check"
							className="flex items-start gap-3 border-b px-4 py-4 md:gap-4 md:px-6"
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Brain className="size-4" aria-hidden="true" />
							</div>
							<div className="min-w-0 flex-1">
								<Small className="font-medium text-sm">
									Memories Brain suggests
								</Small>
								<P className="text-muted-foreground text-xs leading-5">
									From your finished chats. The assistant does
									not use them until you keep them.
								</P>
								{suggestions.map((memory) => (
									<MemoryRow
										key={memory.id}
										memory={memory}
									/>
								))}
							</div>
						</section>
					)}
					{!open.length && !suggestions.length && (
						<P className="p-6 text-muted-foreground">
							All caught up. No pending review in this session.
						</P>
					)}
				</TabsContent>
				<TabsContent value="learned" className="mt-0">
					<P className="border-b px-4 py-3 text-muted-foreground text-xs leading-5 md:px-6">
						Confirmed topics, your recent review decisions, and what
						the assistant learned in chats.
					</P>
					{learnedInChat.length > 0 && (
						<section
							aria-label="Learned in chats"
							className="border-b px-4 py-3 md:px-6"
						>
							<Small className="font-medium text-sm">
								Learned in chats
							</Small>
							<P className="text-muted-foreground text-xs leading-5">
								In use now. Confirm the ones the assistant
								should act on.
							</P>
							{learnedInChat.map((memory) => (
								<MemoryRow key={memory.id} memory={memory} />
							))}
						</section>
					)}
					{resolved.map((review) => (
						<ReviewCard key={review.id} review={review} />
					))}
					{learned.map(({ thread, link, topic }) => (
						<article
							key={`${thread.id}-${link.topicId}`}
							className="flex flex-wrap items-center gap-3 border-b px-4 py-3 hover:bg-muted/30 md:px-6"
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Folder className="size-4" aria-hidden="true" />
							</div>
							<div className="min-w-0 flex-1">
								<Link
									to={`/brain/threads/${encodeURIComponent(thread.id)}`}
									className="break-words font-medium text-sm hover:underline"
								>
									{thread.subject}
								</Link>
								<Small className="mt-1 font-normal text-muted-foreground text-xs">
									Filed under {topic?.short || "Topic"}
								</Small>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									dispatch({
										type: "thread.link",
										threadId: thread.id,
										topicId: link.topicId,
										operation: "remove",
									})
								}
							>
								Wrong topic
							</Button>
						</article>
					))}
				</TabsContent>
			</Tabs>
		</CollaborationSurface>
	);
}
