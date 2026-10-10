import { FolderPlus, MessagesSquare, UserRoundPlus } from "lucide-react";
import { Link } from "react-router";
import { Badge, Button, cn, P, Small } from "@semoss/ui/next";
import { topicChoiceCandidates } from "../state/collaboration.selectors";
import type { ReviewEntry } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { topicTone } from "../topic-tone";

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
	const actionClassName = compact ? "h-7 px-2.5" : undefined;
	const choices =
		review.kind === "topic_choice" && thread
			? topicChoiceCandidates(review, thread).flatMap((topicId) => {
					const topic = state.topics.find(
						(candidate) => candidate.id === topicId,
					);
					return topic ? [topic] : [];
				})
			: [];
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
				"border-border border-b",
				compact
					? "px-4 py-3 last:border-0"
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
						"break-words text-sm leading-6",
						!compact && "font-semibold",
					)}
				>
					{review.text}
				</P>
				{review.detail && (
					<Small className="font-normal text-muted-foreground text-xs leading-5">
						{review.detail}
					</Small>
				)}
				{/* what the thread is about, so the owner can answer without opening it */}
				{review.kind === "topic_choice" && thread && !compact && (
					<P className="line-clamp-2 text-muted-foreground text-xs leading-5">
						{thread.summary && `${thread.summary} `}
						<Link
							to={`/brain/threads/${encodeURIComponent(thread.id)}`}
							className="whitespace-nowrap text-foreground underline underline-offset-2 hover:no-underline"
						>
							Open thread
						</Link>
					</P>
				)}
				{review.status === "open" && (
					<div className="flex flex-wrap gap-2 pt-1">
						{review.kind === "topic_choice" && thread ? (
							<>
								{choices.map((topic) => (
									<Button
										key={topic.id}
										variant="outline"
										size="sm"
										className={actionClassName}
										onClick={() =>
											resolve("accept", topic.id)
										}
									>
										<span
											aria-hidden="true"
											className={cn(
												"size-2 shrink-0 rounded-xs",
												topicTone(topic.id),
											)}
										/>
										{choices.length === 1
											? `File under ${topic.short}`
											: topic.short}
									</Button>
								))}
								{choices.length > 1 && (
									<Button
										variant="outline"
										size="sm"
										className={cn(
											actionClassName,
											"font-normal",
										)}
										onClick={() => resolve("both")}
									>
										Both
									</Button>
								)}
							</>
						) : review.kind === "unassigned" ? (
							<Button
								asChild
								variant="outline"
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
								variant="outline"
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
								variant="outline"
								size="sm"
								className={cn(actionClassName, "font-normal")}
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
							className={cn(
								actionClassName,
								"font-normal text-muted-foreground",
							)}
							onClick={() => resolve("dismiss")}
						>
							{review.kind !== "topic_choice" || !thread
								? "Dismiss"
								: choices.length > 1
									? "Neither"
									: "Not this topic"}
						</Button>
					</div>
				)}
			</div>
		</article>
	);
}
