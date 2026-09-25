import { Sparkles } from "lucide-react";
import { Link } from "react-router";
import { Badge, Button, P, Small } from "@semoss/ui/next";
import type { ReviewEntry } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

/** Resolves review intentions by record identity, independently of button copy. */
export function ReviewCard({
	review,
	compact = false,
}: {
	review: ReviewEntry;
	compact?: boolean;
}) {
	const { state, dispatch } = useCollaborationSession();
	const thread = state.threads.find(
		(candidate) => candidate.id === review.refId,
	);
	const resolve = (
		decision: "accept" | "dismiss" | "both" | "merge",
		targetTopicId?: string,
	): void =>
		dispatch({
			type: "review.resolve",
			reviewId: review.id,
			decision,
			targetTopicId,
		});
	return (
		<article
			className={
				compact
					? "space-y-2 border-b py-3 last:border-0"
					: "space-y-3 border-b px-4 py-5 md:px-6"
			}
		>
			{!compact && (
				<div className="flex items-center gap-2">
					<Sparkles
						className="size-4 text-primary"
						aria-hidden="true"
					/>
					<Small className="font-medium">Brain</Small>
					<Badge variant="outline">
						{review.status === "open"
							? "To confirm"
							: review.status}
					</Badge>
				</div>
			)}
			<P className="font-medium text-sm">{review.text}</P>
			<Small className="text-muted-foreground">{review.detail}</Small>
			{review.status === "open" && (
				<div className="flex flex-wrap gap-2">
					{review.kind === "topic_choice" && thread ? (
						<>
							{thread.topicLinks.map((link) => {
								const topic = state.topics.find(
									(candidate) =>
										candidate.id === link.topicId,
								);
								return (
									topic && (
										<Button
											key={link.topicId}
											variant="outline"
											size="sm"
											onClick={() =>
												resolve("accept", topic.id)
											}
										>
											{topic.short}
										</Button>
									)
								);
							})}
							<Button
								variant="outline"
								size="sm"
								onClick={() => resolve("both")}
							>
								Both
							</Button>
						</>
					) : review.kind === "unassigned" ? (
						<Button asChild variant="outline" size="sm">
							<Link
								to={
									thread
										? `/brain/threads/${encodeURIComponent(thread.id)}`
										: "/brain/threads?filter=needs"
								}
							>
								Review thread
							</Link>
						</Button>
					) : (
						<Button
							variant="outline"
							size="sm"
							onClick={() => resolve("accept")}
						>
							{review.kind === "new_topic"
								? "Add topic"
								: "Add person"}
						</Button>
					)}
					{review.candidate?.mergeCandidate && (
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								resolve(
									"merge",
									review.candidate?.mergeCandidate ??
										undefined,
								)
							}
						>
							Merge into existing topic
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => resolve("dismiss")}
					>
						Dismiss
					</Button>
				</div>
			)}
		</article>
	);
}
