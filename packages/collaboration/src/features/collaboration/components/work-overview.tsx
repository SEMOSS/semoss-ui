import { CalendarDays, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { P, Small } from "@semoss/ui/next";
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
	const { items: waitingItems, total: waitingTotal } = selectWorkItems(
		state,
		{ view: "waiting" },
	);
	const waiting = waitingItems.slice(0, 4);
	return (
		<>
			<Section title="Coming up" variant="card">
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
							<Small className="font-normal text-muted-foreground">
								{thread.when || dateLabel(thread.lastAt)}
							</Small>
							{thread.conflict && (
								<Small className="font-normal text-warning">
									{thread.conflict}
								</Small>
							)}
						</div>
					))
				) : (
					<P className="flex items-center gap-3 text-muted-foreground text-sm">
						<CalendarDays
							aria-hidden="true"
							className="size-5 shrink-0"
						/>
						No loaded events.
					</P>
				)}
			</Section>
			<Section
				title="Brain wants to check"
				icon={Sparkles}
				variant="card"
				flush={reviews.length > 0}
				action={
					<Link
						className="rounded-sm font-medium text-primary text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
						to="/brain"
					>
						See all
					</Link>
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
					<P className="text-muted-foreground text-sm">
						All caught up.
					</P>
				)}
			</Section>
			{waiting.length > 0 && (
				<Section
					title="Waiting on others"
					variant="card"
					flush
					action={
						<span className="text-muted-foreground text-sm tabular-nums">
							{waitingTotal}
						</span>
					}
				>
					<ul>
						{waiting.map((item) => (
							<li
								key={item.id}
								className="flex gap-3 border-border border-b px-4 py-3 last:border-0"
							>
								<Clock
									aria-hidden="true"
									className="mt-1 size-4 shrink-0 text-muted-foreground"
								/>
								<div className="min-w-0">
									<Link
										className="break-words text-sm hover:underline"
										to={`/work/thread/${encodeURIComponent(item.threadId)}`}
									>
										{item.title}
									</Link>
									<Small className="font-normal text-muted-foreground">
										{state.people.find(
											(person) =>
												person.id === item.actorId,
										)?.name || "Someone else"}
									</Small>
								</div>
							</li>
						))}
					</ul>
				</Section>
			)}
		</>
	);
}
