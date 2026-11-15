import { FolderPlus, MessagesSquare, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	cn,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
} from "@semoss/ui/next";
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
	// a new topic can instead go into a topic that is already in use
	const mergeTargets =
		review.kind === "new_topic"
			? state.topics.filter(
					(topic) =>
						topic.status === "active" && topic.id !== review.refId,
				)
			: [];
	const [mergeTarget, setMergeTarget] = useState(
		review.candidate?.mergeCandidate ?? "",
	);
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
						<span className="font-semibold">Filing</span>
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
					{/* the card names the thread, so the name itself opens it */}
					{review.kind === "topic_choice" && thread ? (
						<Link
							to={`/brain/threads/${encodeURIComponent(thread.id)}`}
							className="hover:underline"
						>
							{review.text}
						</Link>
					) : (
						review.text
					)}
				</P>
				{review.detail && (
					<Small className="font-normal text-muted-foreground text-xs leading-5">
						{review.detail}
					</Small>
				)}
				{/* what the thread is about, so the owner can answer without opening it */}
				{review.kind === "topic_choice" &&
					thread?.summary &&
					!compact && (
						<P className="line-clamp-2 text-muted-foreground text-xs leading-5">
							{thread.summary}
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
						{mergeTargets.length > 0 && (
							<div className="flex items-center gap-2">
								<Select
									value={mergeTarget}
									onValueChange={setMergeTarget}
								>
									<SelectTrigger
										aria-label="Existing topic"
										size="sm"
										className="w-48"
									>
										<SelectValue placeholder="An existing topic" />
									</SelectTrigger>
									<SelectContent>
										{mergeTargets.map((topic) => (
											<SelectItem
												key={topic.id}
												value={topic.id}
											>
												{topic.short || topic.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									size="sm"
									className={cn(
										actionClassName,
										"font-normal",
									)}
									disabled={!mergeTarget}
									onClick={() =>
										resolve("merge", mergeTarget)
									}
								>
									Add to an existing topic
								</Button>
							</div>
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
				{review.status !== "open" &&
					(review.kind === "topic_choice" ||
						review.kind === "add_person") && (
						<div className="pt-1">
							<Button
								variant="ghost"
								size="sm"
								className={cn(
									actionClassName,
									"font-normal text-muted-foreground",
								)}
								onClick={() =>
									dispatch({
										type: "review.reopen",
										reviewId: review.id,
									})
								}
							>
								Undo
							</Button>
						</div>
					)}
			</div>
		</article>
	);
}
