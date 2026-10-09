import { Link } from "react-router";
import { Button, H2, P } from "@semoss/ui/next";
import { PersonAvatar } from "@/features/collaboration/components/person-avatar";
import { TopicWorkThreads } from "@/features/collaboration/components/topic-work-threads";
import type { Topic } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { memoriesAbout } from "@/features/collaboration/state/memory";

/** Existing confirmed context and source conversations for this topic. */
export function TopicContext({
	topic,
	isComplete = true,
	isLoading = false,
}: {
	topic: Topic;
	isComplete?: boolean;
	isLoading?: boolean;
}) {
	const { state } = useCollaborationSession();
	const notes = memoriesAbout(state.memories, {
		type: "topic",
		id: topic.id,
	}).filter((memory) => memory.state === "active" && memory.confirmed);
	const members = topic.people.filter((member) => member.state === "member");
	return (
		<div className="space-y-8 py-6">
			{isLoading && <output>Loading topic context…</output>}
			<section className="space-y-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<H2 className="font-medium text-xl">
						Current understanding
					</H2>
					<Button asChild variant="outline" size="sm">
						<Link
							to={`/brain/topics/${encodeURIComponent(topic.id)}`}
						>
							Edit topic context
						</Link>
					</Button>
				</div>
				<P className="max-w-prose whitespace-pre-wrap break-words text-base text-muted-foreground">
					{topic.description || "No description yet."}
				</P>
			</section>
			<div className="grid gap-8 lg:grid-cols-2">
				<section className="space-y-4">
					<H2 className="font-medium text-xl">Confirmed notes</H2>
					{notes.length ? (
						<ul className="divide-y divide-border">
							{notes.map((note) => (
								<li key={note.id} className="py-3 first:pt-0">
									<P className="whitespace-pre-wrap break-words text-base">
										{note.text}
									</P>
								</li>
							))}
						</ul>
					) : (
						<P className="text-base text-muted-foreground">
							{isComplete
								? "No confirmed notes for this topic yet."
								: "Notes have not finished loading."}
						</P>
					)}
				</section>
				<section className="space-y-4">
					<H2 className="font-medium text-xl">People</H2>
					{members.length ? (
						<ul className="space-y-4">
							{members.map((member) => {
								const person = state.people.find(
									(candidate) =>
										candidate.id === member.personId,
								);
								return (
									<li
										key={member.personId}
										className="flex items-start gap-3"
									>
										<PersonAvatar
											name={
												person?.name ||
												"Person unavailable"
											}
											initials={person?.initials}
										/>
										<div className="min-w-0">
											<P className="break-words font-medium text-base">
												{person ? (
													<Link
														className="hover:underline focus-visible:outline-2 focus-visible:outline-ring"
														to={`/brain/people/${encodeURIComponent(person.id)}`}
													>
														{person.name}
													</Link>
												) : (
													"Person unavailable"
												)}
											</P>
											{member.role && (
												<P className="break-words text-muted-foreground text-sm">
													{member.role}
												</P>
											)}
										</div>
									</li>
								);
							})}
						</ul>
					) : (
						<P className="text-base text-muted-foreground">
							{isComplete
								? "No confirmed people for this topic yet."
								: "People have not finished loading."}
						</P>
					)}
				</section>
			</div>
			<section className="space-y-3 border-border border-t pt-6">
				<H2 className="font-medium text-xl">Source threads</H2>
				{isComplete ? (
					<TopicWorkThreads topicId={topic.id} />
				) : (
					<P className="text-muted-foreground">
						Source threads have not finished loading.
					</P>
				)}
			</section>
		</div>
	);
}
