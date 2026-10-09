import { Link } from "react-router";
import { P } from "@semoss/ui/next";
import { ReviewCard } from "@/features/collaboration/components/review-card";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { suggestedMemories } from "@/features/collaboration/state/memory";
import { BriefPanel } from "./brief-panel";

/** Human topic decisions stay connected to the same Brain review commands. */
export function BriefBrain() {
	const { state } = useCollaborationSession();
	const reviews = state.reviews.filter((review) => review.status === "open");
	const draftNotes = suggestedMemories(state.memories).length;
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
			{draftNotes > 0 && (
				<P className="py-3 text-muted-foreground text-sm">
					{draftNotes}{" "}
					{draftNotes === 1 ? "memory is" : "memories are"} waiting
					for you to keep or dismiss in Brain.
				</P>
			)}
			{!reviews.length && !draftNotes && (
				<P className="py-3 text-muted-foreground text-sm">
					All caught up. No suggestions to check.
				</P>
			)}
			<Link
				to="/brain"
				className="mt-4 inline-flex min-h-8 pointer-coarse:min-h-11 items-center rounded-sm border-b pb-1 font-mono text-sm hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
			>
				Open Brain →
			</Link>
			<nav
				aria-label="Brain directories"
				className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3"
			>
				{[
					["Topics", "/work"],
					["People", "/brain/people"],
					["Threads", "/brain/threads"],
					["Sources", "/brain/sources"],
				].map(([label, to]) => (
					<Link
						key={to}
						to={to}
						className="inline-flex min-h-8 pointer-coarse:min-h-11 items-center rounded-sm text-muted-foreground text-xs hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
					>
						{label}
					</Link>
				))}
			</nav>
		</BriefPanel>
	);
}
