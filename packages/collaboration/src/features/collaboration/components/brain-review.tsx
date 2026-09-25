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
import { CollaborationSurface } from "./collaboration-surface";
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
					<Section title="Your Brain">
						<P className="text-muted-foreground">
							Topics, people, and context you choose to keep.
							Changes apply across Work and Brain.
						</P>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<P className="font-semibold text-2xl">
									{state.topics.length}
								</P>
								<Small>Topics</Small>
							</div>
							<div>
								<P className="font-semibold text-2xl">
									{state.people.length}
								</P>
								<Small>People</Small>
							</div>
						</div>
					</Section>
					<Section title="Session history">
						<P className="text-muted-foreground">
							Undo reverses the latest local change. It never
							deletes saved conversations or Outlook drafts.
						</P>
						<Button
							variant="outline"
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
			<header className="space-y-2 border-b px-4 py-5 md:px-6">
				<H1 className="font-semibold text-xl">Review</H1>
				<P className="text-muted-foreground">
					Suggestions to check before using them as confirmed context.
				</P>
				<Badge variant="outline">
					Sample suggestions and session changes
				</Badge>
			</header>
			<Tabs value={tab} onValueChange={setTab}>
				<div className="border-b px-4 py-3 md:px-6">
					<TabsList>
						<TabsTrigger value="needs">
							Needs you ({open.length + notes.length})
						</TabsTrigger>
						<TabsTrigger value="learned">
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
							className="space-y-3 border-b p-4 md:px-6"
						>
							<Small className="font-medium">
								Note for {topic.short}
							</Small>
							<P>{note.text}</P>
							<Small className="text-muted-foreground">
								{note.source || "Assistant suggestion"} · not
								yet used as fact
							</Small>
							<div className="flex gap-2">
								<Button
									variant="outline"
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
						</article>
					))}
					{!open.length && !notes.length && (
						<P className="p-6 text-muted-foreground">
							All caught up. No pending review in this session.
						</P>
					)}
				</TabsContent>
				<TabsContent value="learned" className="mt-0">
					<P className="border-b px-4 py-3 text-muted-foreground md:px-6">
						The supplied scenario and decisions made this session.
						Automatic classification is not connected.
					</P>
					{resolved.map((review) => (
						<ReviewCard key={review.id} review={review} />
					))}
					{learned.map(({ thread, link, topic }) => (
						<article
							key={`${thread.id}-${link.topicId}`}
							className="flex flex-wrap items-center gap-3 border-b p-4 md:px-6"
						>
							<div className="min-w-0 flex-1">
								<Link
									to={`/brain/threads/${encodeURIComponent(thread.id)}`}
									className="font-medium hover:underline"
								>
									{thread.subject}
								</Link>
								<Small className="text-muted-foreground">
									Filed under {topic?.short || "Topic"}
									{thread.isSample
										? " · sample"
										: " · confirmed locally"}
								</Small>
							</div>
							<Button
								variant="outline"
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
