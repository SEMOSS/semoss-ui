import { Link } from "react-router";
import { P } from "@semoss/ui/next";
import { ReviewCard } from "@/features/collaboration/components/review-card";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { BriefPanel } from "./brief-panel";

/** Human topic decisions stay connected to the same Brain review commands. */
export function BriefBrain() {
	const { state } = useCollaborationSession();
	const reviews = state.reviews.filter((review) => review.status === "open");
	const draftNotes = state.topics.reduce(
		(count, topic) =>
			count +
			topic.notes.filter((note) => note.status === "draft").length,
		0,
	);
	return (
		<BriefPanel
			title="Brain wants to check"
			detail={reviews.length + draftNotes}
		>
			<div className="-mx-4">
				{reviews.slice(0, 2).map((review) => (
					<ReviewCard key={review.id} review={review} compact />
				))}
			</div>
			{!reviews.length && draftNotes > 0 && (
				<P className="py-3 text-muted-foreground text-sm">
					{draftNotes} {draftNotes === 1 ? "note is" : "notes are"}{" "}
					ready for you to confirm in Brain.
				</P>
			)}
			{!reviews.length && !draftNotes && (
				<P className="py-3 text-muted-foreground text-sm">
					All caught up. No suggestions to check.
				</P>
			)}
			<Link
				to="/brain"
				className="mt-4 inline-flex border-b pb-1 font-mono text-sm hover:text-muted-foreground"
			>
				Open Brain →
			</Link>
		</BriefPanel>
	);
}
