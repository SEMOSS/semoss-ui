import { CalendarDays, Mail, MessagesSquare } from "lucide-react";
import { Link } from "react-router";
import { P, Small } from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { PersonAvatar } from "./person-avatar";
import { Section } from "./section";

/** Shared Brain overview reflects selected records without claiming provider sync. */
export function BrainOverview() {
	const { state } = useCollaborationSession();
	const filedCount = state.threads.filter((thread) =>
		thread.topicLinks.some((link) => link.source !== "suggested"),
	).length;
	const people = state.people
		.filter((person) => !person.automated)
		.sort((left, right) => (right.strength ?? 0) - (left.strength ?? 0))
		.slice(0, 5);
	return (
		<>
			<Section title="What Brain knows" variant="widget">
				<div className="grid grid-cols-2 gap-2">
					{[
						["Topics", state.topics.length],
						["People", state.people.length],
						["Threads", state.threads.length],
						[
							"Filed",
							state.threads.length
								? `${Math.round((filedCount / state.threads.length) * 100)}%`
								: "0%",
						],
					].map(([label, count]) => (
						<div
							key={label}
							className="rounded-lg bg-muted/60 px-3 py-2"
						>
							<P className="font-semibold text-lg tabular-nums">
								{count}
							</P>
							<Small className="font-normal text-muted-foreground text-xs">
								{label}
							</Small>
						</div>
					))}
				</div>
			</Section>
			<Section
				title="Sources"
				variant="widget"
				action={
					<Link
						className="inline-flex min-h-6 items-center text-primary text-xs hover:underline"
						to="/brain/sources"
					>
						Manage
					</Link>
				}
			>
				<div className="divide-y">
					{[
						{ kind: "outlook", label: "Outlook email", Icon: Mail },
						{
							kind: "teams",
							label: "Teams conversations",
							Icon: MessagesSquare,
						},
						{
							kind: "calendar",
							label: "Calendar events",
							Icon: CalendarDays,
						},
					].map(({ kind, label, Icon }) => (
						<div
							key={kind}
							className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
						>
							<Icon
								className="size-4 shrink-0 text-muted-foreground"
								aria-hidden="true"
							/>
							<div>
								<P className="text-sm">{label}</P>
								<Small className="font-normal text-muted-foreground text-xs">
									{
										state.threads.filter(
											(thread) =>
												!thread.isSample &&
												thread.source?.kind === kind,
										).length
									}{" "}
									selected
								</Small>
							</div>
						</div>
					))}
				</div>
			</Section>
			<Section
				title="You work most with"
				variant="widget"
				action={
					<Link
						className="inline-flex min-h-6 items-center text-primary text-xs hover:underline"
						to="/brain/people"
					>
						All
					</Link>
				}
			>
				<div className="space-y-3">
					{people.map((person) => (
						<div
							key={person.id}
							className="flex items-center gap-3"
						>
							<PersonAvatar
								name={person.name}
								initials={person.initials}
							/>
							<div className="min-w-0">
								<Link
									className="inline-block min-h-6 break-words font-medium text-sm hover:underline"
									to={`/brain/people/${encodeURIComponent(person.id)}`}
								>
									{person.name}
								</Link>
								<Small className="font-normal text-muted-foreground text-xs leading-4">
									{person.relationship ||
										person.title ||
										person.email}
								</Small>
							</div>
						</div>
					))}
					{!people.length && (
						<Small className="font-normal text-muted-foreground text-xs">
							People appear here when you add a source.
						</Small>
					)}
				</div>
			</Section>
		</>
	);
}
