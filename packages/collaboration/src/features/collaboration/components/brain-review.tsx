import { Folder, StickyNote } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	H1,
	P,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { BrainOverview } from "./brain-overview";
import { CollaborationSurface } from "./collaboration-surface";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { ReviewCard } from "./review-card";
import { Section } from "./section";

/** Human review of local topic suggestions, memberships, and unconfirmed notes. */
export function BrainReview() {
	const { state, dispatch, undo, canUndo } = useCollaborationSession();
	const [tab, setTab] = useState("needs");
	const open = state.reviews.filter((review) => review.status === "open");
	const resolved = state.reviews.filter((review) => review.status !== "open");
	const notes = state.topics.flatMap((topic) =>
		topic.notes
			.filter((note) => note.status === "draft")
			.map((note) => ({ topic, note })),
	);
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
			aside={
				<>
					<BrainOverview />
					<Section title="Session history" variant="widget">
						<P className="text-muted-foreground text-xs leading-5">
							Undo reverses the latest local change. It never
							deletes saved conversations or Outlook drafts.
						</P>
						<Button
							variant="outline"
							size="sm"
							disabled={!canUndo}
							onClick={undo}
						>
							Undo latest change
						</Button>
					</Section>
					<Button asChild variant="outline">
						<Link to="/brain/sources">Sources and rules</Link>
					</Button>
				</>
			}
			asideTitle="Brain overview"
		>
			<header className="space-y-1.5 px-4 pt-5 pb-3 md:px-6">
				<H1 className="font-semibold text-xl">Review</H1>
				<P className="text-muted-foreground text-sm">
					Suggestions to check before using them as confirmed context.
				</P>
			</header>
			<Tabs value={tab} onValueChange={setTab} className="gap-0">
				<div className="border-b px-4 md:px-6">
					<TabsList className={collaborationTabsStyles.list}>
						<TabsTrigger
							value="needs"
							className={collaborationTabsStyles.trigger}
						>
							Needs you ({open.length + notes.length})
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
					{notes.map(({ topic, note }) => (
						<article
							key={note.noteId}
							className="flex items-start gap-3 border-b px-4 py-4 hover:bg-muted/30 md:gap-4 md:px-6"
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<StickyNote
									className="size-4"
									aria-hidden="true"
								/>
							</div>
							<div className="min-w-0 flex-1 space-y-2">
								<div className="flex flex-wrap items-center gap-2 text-xs">
									<span className="font-semibold">Brain</span>
									<Badge
										variant="secondary"
										className="font-normal text-xs"
									>
										Note
									</Badge>
								</div>
								<Small className="font-semibold text-sm">
									Note for {topic.short}
								</Small>
								<P className="rounded-r-lg border-primary/40 border-l-2 bg-muted/50 px-3 py-2 text-sm leading-6">
									{note.text}
								</P>
								<Small className="font-normal text-muted-foreground text-xs leading-5">
									{note.source || "Assistant suggestion"} ·
									not yet used as fact
								</Small>
								<div className="-ml-2 flex flex-wrap gap-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											dispatch({
												type: "topic.note",
												topicId: topic.id,
												kind: "note",
												operation: "save",
												noteId: note.noteId,
												status: "confirmed",
											})
										}
									>
										Confirm note
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											dispatch({
												type: "topic.note",
												topicId: topic.id,
												kind: "note",
												operation: "remove",
												noteId: note.noteId,
											})
										}
									>
										Remove
									</Button>
								</div>
							</div>
						</article>
					))}
					{!open.length && !notes.length && (
						<P className="p-6 text-muted-foreground">
							All caught up. No pending review in this session.
						</P>
					)}
				</TabsContent>
				<TabsContent value="learned" className="mt-0">
					<P className="border-b px-4 py-3 text-muted-foreground text-xs leading-5 md:px-6">
						Confirmed topics and your recent review decisions.
					</P>
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
