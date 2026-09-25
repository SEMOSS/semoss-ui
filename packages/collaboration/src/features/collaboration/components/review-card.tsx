import { FolderPlus, MessagesSquare, UserRoundPlus } from "lucide-react";
import { Link } from "react-router";
import { Badge, Button, cn, P, Small } from "@semoss/ui/next";
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
	const Icon =
		review.kind === "add_person"
			? UserRoundPlus
			: review.kind === "new_topic"
				? FolderPlus
				: MessagesSquare;
	const kindLabel =
		review.kind === "new_topic"
			? "New topic"
			: review.kind === "add_person"
				? "Person"
				: "Topic choice";
	const actionClassName = compact ? "h-7 px-2 text-xs" : undefined;
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
			className={cn(
				"border-b",
				compact
					? "py-2 last:border-0"
					: "flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/30 md:gap-4 md:px-6",
			)}
		>
			{!compact && (
				<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<Icon className="size-4" aria-hidden="true" />
				</div>
			)}
			<div
				className={cn(
					"min-w-0 flex-1",
					compact ? "space-y-1" : "space-y-2",
				)}
			>
				{!compact && (
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<span className="font-semibold">Brain</span>
						<span className="text-muted-foreground">
							{review.status === "open"
								? "· needs your review"
								: `· ${review.status}`}
						</span>
						<Badge
							variant="secondary"
							className="font-normal text-xs"
						>
							{kindLabel}
						</Badge>
					</div>
				)}
				<P
					className={cn(
						"break-words text-sm",
						compact
							? "font-medium leading-5"
							: "font-semibold leading-6",
					)}
				>
					{review.text}
				</P>
				<Small className="font-normal text-muted-foreground text-xs leading-5">
					{review.detail}
				</Small>
				{review.status === "open" && (
					<div className="-ml-2 flex flex-wrap gap-1 pt-1">
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
												variant="ghost"
												size="sm"
												className={actionClassName}
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
									variant="ghost"
									size="sm"
									className={actionClassName}
									onClick={() => resolve("both")}
								>
									Both
								</Button>
							</>
						) : review.kind === "unassigned" ? (
							<Button
								asChild
								variant="ghost"
								size="sm"
								className={actionClassName}
							>
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
								variant="ghost"
								size="sm"
								className={actionClassName}
								onClick={() => resolve("accept")}
							>
								{review.kind === "new_topic"
									? "Add topic"
									: "Add person"}
							</Button>
						)}
						{review.candidate?.mergeCandidate && (
							<Button
								variant="ghost"
								size="sm"
								className={actionClassName}
								aria-label="Merge into existing topic"
								onClick={() =>
									resolve(
										"merge",
										review.candidate?.mergeCandidate ??
											undefined,
									)
								}
							>
								{compact
									? "Merge"
									: "Merge into existing topic"}
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							className={actionClassName}
							onClick={() => resolve("dismiss")}
						>
							Dismiss
						</Button>
					</div>
				)}
			</div>
		</article>
	);
}
