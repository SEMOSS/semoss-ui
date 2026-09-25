import { Link } from "react-router";
import { Button, P, Small } from "@semoss/ui/next";
import { dateLabel } from "../date-label";
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { ReviewCard } from "./review-card";
import { Section } from "./section";

/** Relevant upcoming events, review questions, and waiting items from shared state. */
export function WorkOverview() {
	const { state } = useCollaborationSession();
	const coming = state.threads
		.filter((thread) => thread.channel === "calendar" && !thread.muted)
		.slice(0, 4);
	const reviews = state.reviews
		.filter((review) => review.status === "open")
		.slice(0, 3);
	const waiting = selectWorkItems(state, { view: "waiting" }).items.slice(
		0,
		4,
	);
	return (
		<>
			<Section title="Coming up" variant="widget">
				{coming.length ? (
					coming.map((thread) => (
						<div
							key={thread.id}
							className="space-y-1 border-border/50 border-b pb-2 last:border-0 last:pb-0"
						>
							<Link
								className="font-medium text-sm hover:underline"
								to={`/work/thread/${encodeURIComponent(thread.id)}`}
							>
								{thread.subject}
							</Link>
							<Small className="text-muted-foreground">
								{thread.when || dateLabel(thread.lastAt)}
							</Small>
							{thread.conflict && (
								<Small className="text-warning">
									{thread.conflict}
								</Small>
							)}
						</div>
					))
				) : (
					<P className="text-muted-foreground">No loaded events.</P>
				)}
			</Section>
			<Section
				title="Brain wants to check"
				variant="widget"
				action={
					<Button asChild variant="ghost" size="sm">
						<Link to="/brain">All</Link>
					</Button>
				}
			>
				{reviews.length ? (
					<div>
						{reviews.map((review) => (
							<ReviewCard
								key={review.id}
								review={review}
								compact
							/>
						))}
					</div>
				) : (
					<P className="text-muted-foreground">All caught up.</P>
				)}
			</Section>
			{waiting.length > 0 && (
				<Section title="Waiting on others" variant="widget">
					{waiting.map((item) => (
						<div
							key={item.id}
							className="border-b pb-3 last:border-0"
						>
							<Link
								className="text-sm hover:underline"
								to={`/work/thread/${encodeURIComponent(item.threadId)}`}
							>
								{item.title}
							</Link>
							<Small className="mt-1 text-muted-foreground">
								{state.people.find(
									(person) => person.id === item.actorId,
								)?.name || "Someone else"}
							</Small>
						</div>
					))}
				</Section>
			)}
			<Section title="Your connected sources" variant="widget">
				<P className="text-muted-foreground text-sm">
					Bring selected emails, chats, and events into Work.
				</P>
				<Button asChild variant="outline" className="w-full">
					<Link to="/brain/sources">Load your sources</Link>
				</Button>
			</Section>
		</>
	);
}
