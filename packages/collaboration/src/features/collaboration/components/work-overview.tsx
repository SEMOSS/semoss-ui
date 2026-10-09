import { Link } from "react-router";
import { P, Small } from "@semoss/ui/next";
import { threadPath } from "@/lib/workspace-paths";
import { dateLabel } from "../date-label";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { memoriesAbout } from "../state/memory";
import { PersonAvatar } from "./person-avatar";
import { Section } from "./section";

interface WorkOverviewProps {
	/** All supporting context belongs to this topic. */
	topic: Topic;
}

/** Confirmed people, notes, and linked calendar threads for one topic. */
export function WorkOverview({ topic }: WorkOverviewProps) {
	const { state } = useCollaborationSession();
	const members = topic.people.flatMap((member) => {
		if (member.state !== "member") return [];
		const person = state.people.find(
			(candidate) =>
				candidate.id === member.personId &&
				candidate.isSample === topic.isSample,
		);
		return person ? [{ person, role: member.role }] : [];
	});
	// a topic's notes are memories about it
	const notes = memoriesAbout(state.memories, {
		type: "topic",
		id: topic.id,
	}).filter((memory) => memory.state === "active" && memory.confirmed);
	const calendar = state.threads.filter(
		(thread) =>
			thread.channel === "calendar" &&
			!thread.muted &&
			thread.isSample === topic.isSample &&
			thread.topicLinks.some(
				(link) =>
					link.topicId === topic.id && link.source !== "suggested",
			),
	);
	return (
		<>
			<Section title="People" variant="card">
				{members.length ? (
					members.map(({ person, role }) => (
						<div key={person.id} className="flex items-start gap-3">
							<PersonAvatar
								name={person.name}
								initials={person.initials}
							/>
							<div className="min-w-0 space-y-1">
								<Link
									to={`/brain/people/${encodeURIComponent(person.id)}`}
									className="break-words font-medium text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
								>
									{person.name}
								</Link>
								{role && (
									<Small className="block break-words font-normal text-muted-foreground text-xs">
										{role}
									</Small>
								)}
							</div>
						</div>
					))
				) : (
					<P className="text-muted-foreground text-sm">
						No confirmed people yet.
					</P>
				)}
			</Section>
			<Section title="Confirmed notes" variant="card">
				{notes.length ? (
					notes.map((note) => (
						<P
							key={note.id}
							className="break-words border-border border-b pb-3 text-sm leading-relaxed last:border-0 last:pb-0"
						>
							{note.text}
						</P>
					))
				) : (
					<P className="text-muted-foreground text-sm">
						No confirmed notes yet.
					</P>
				)}
			</Section>
			<Section title="Linked calendar" variant="card">
				{calendar.length ? (
					calendar.map((thread) => (
						<div
							key={thread.id}
							className="space-y-1 border-border border-b pb-3 last:border-0 last:pb-0"
						>
							<Link
								to={threadPath(thread.id)}
								className="break-words font-medium text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
							>
								{thread.subject}
							</Link>
							<Small className="block font-normal text-muted-foreground text-xs">
								{thread.when || dateLabel(thread.lastAt)}
							</Small>
							{thread.conflict && (
								<Small className="block break-words font-normal text-warning">
									{thread.conflict}
								</Small>
							)}
						</div>
					))
				) : (
					<P className="text-muted-foreground text-sm">
						No linked calendar threads.
					</P>
				)}
			</Section>
		</>
	);
}
