import type { RefObject } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	P,
	Progress,
	Small,
	Spinner,
	toast,
} from "@semoss/ui/next";
import type { TopicMatchApplyResult } from "../api/topic-matches";
import { dateLabel } from "../date-label";
import type { WorkUpdatesStatus } from "../live/work-updates.context";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { TopicMatchRow } from "./topic-match-row";
import { useTopicMatches } from "./use-topic-matches";

interface TopicMatchesDialogProps {
	/** A live (not sample), active or dormant topic. */
	topic: Topic;
	/** The page's live connection: server ids for topics made here, and the reload after applying. */
	updates: WorkUpdatesStatus;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The button that opened the review; focus goes back to it on close while it is still on the page. */
	returnFocusRef: RefObject<HTMLElement | null>;
}

const conversations = (count: number) =>
	`${count} ${count === 1 ? "conversation" : "conversations"}`;

/** What applying did, for the toast; a skipped choice found the conversation changed since the check. */
function appliedSummary(result: TopicMatchApplyResult): string {
	const applied = (op: string) =>
		result.results.filter(
			(row) => row.status === "applied" && row.op === op,
		).length;
	const parts = [
		[applied("move"), "moved here"],
		[applied("also_link"), "added"],
		[applied("reject"), "marked not about this topic"],
		[result.skipped, "changed since the check and left as they are"],
	] as const;
	return parts
		.filter(([count]) => count > 0)
		.map(([count, text]) => `${count} ${text}`)
		.join(" · ");
}

/**
 * Finds existing conversations that fit a topic and lets the owner accept or turn each one down. The check
 * and the choices outlive closing the dialog; nothing changes until Apply.
 */
export function TopicMatchesDialog({
	topic,
	updates,
	open,
	onOpenChange,
	returnFocusRef,
}: TopicMatchesDialogProps) {
	const { actions } = useInsight();
	const { state } = useCollaborationSession();
	const review = useTopicMatches({
		actions,
		topicId: topic.id,
		serverId: updates.serverId,
		onApplied: updates.refresh,
	});
	const topicNames = new Map(
		state.topics.map((entry) => [entry.id, entry.name]),
	);
	const isBusy = review.isApplying;
	const isWorking = review.isStarting || review.isApplying;
	const counts = { move: 0, also_link: 0, reject: 0 };
	for (const change of review.changes) counts[change.op] += 1;
	const left = review.remaining.length - review.visible.length;
	const done = review.job?.counts.done;
	const total = review.job?.counts.total;

	const handleApply = async (): Promise<void> => {
		const result = await review.apply();
		if (!result) return;
		toast.success(`Updated ${topic.name}`, {
			description: appliedSummary(result),
		});
		if (left === 0) onOpenChange(false);
	};

	let description = `Brain checks your newest conversations against your topics and lists the ones that fit ${topic.name}. Nothing changes until you apply.`;
	if (review.phase === "checking")
		description =
			"Checking your newest conversations. You can close this; the check keeps going.";
	else if (review.phase === "failed")
		description = "The check could not finish.";
	else if (review.phase === "ready" && review.remaining.length)
		description = `${conversations(review.remaining.length)} may belong here. Checked ones are applied; unchecked ones are remembered as not about ${topic.name}.`;
	else if (review.phase === "ready" && review.found)
		description = "You went through every conversation this check found.";
	else if (review.phase === "ready")
		description = review.scanned
			? `Nothing else fits ${topic.name} in the ${conversations(review.scanned)} checked.`
			: "Every conversation is already in this topic or was turned down for it.";

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (next || !isBusy) onOpenChange(next);
			}}
		>
			<DialogContent
				className="min-w-0 sm:max-w-2xl"
				showCloseButton={!isBusy}
				onEscapeKeyDown={(event) => {
					if (isBusy) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isBusy) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					// without a button (the menu, a toast) the dialog's own restore applies
					const trigger = returnFocusRef.current;
					if (!trigger?.isConnected) return;
					event.preventDefault();
					trigger.focus();
				}}
			>
				<DialogHeader>
					{/* room for the close button, which sits inside the content's top corner */}
					<DialogTitle className="wrap-anywhere px-6 sm:pl-0">
						Find conversations for {topic.name}
					</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<output className="sr-only">
					{review.phase === "ready"
						? `${conversations(review.remaining.length)} to review`
						: ""}
				</output>
				{review.phase === "checking" && (
					<div className="space-y-2">
						<Progress
							aria-label="Checking conversations"
							value={review.job?.progress ?? 0}
							className="h-1.5"
						/>
						<Small className="font-normal text-muted-foreground text-xs tabular-nums">
							{typeof done === "number" &&
							typeof total === "number"
								? `${done} of ${total} checked`
								: "Starting..."}
						</Small>
					</div>
				)}
				{review.error && (
					<Alert variant="destructive">
						<AlertDescription>{review.error}</AlertDescription>
					</Alert>
				)}
				{review.phase === "ready" && review.remaining.length > 0 && (
					<div className="flex min-w-0 flex-col gap-3">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<Small className="font-normal text-muted-foreground text-xs">
								Checked {conversations(review.scanned)}
								{review.job?.finishedAt
									? ` on ${dateLabel(review.job.finishedAt)}`
									: ""}
							</Small>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={isWorking}
								onClick={() => void review.check()}
							>
								{review.isStarting && (
									<Spinner className="size-4" />
								)}
								Check again
							</Button>
						</div>
						{/* on wider screens only the rows scroll, so Apply stays in view; small ones scroll the dialog */}
						<div className="flex flex-col gap-3 sm:max-h-96 sm:overflow-y-auto">
							<ul
								aria-label={`Conversations for ${topic.name}`}
								className="divide-y divide-border rounded-lg border"
							>
								{review.visible.map((match) => (
									<TopicMatchRow
										key={match.threadId}
										match={match}
										topicName={topic.name}
										topicNames={topicNames}
										isChecked={review.isChecked(
											match.threadId,
										)}
										op={review.opOf(match)}
										disabled={isWorking}
										onCheckedChange={(isChecked) =>
											review.setChecked(
												match.threadId,
												isChecked,
											)
										}
										onOpChange={(op) =>
											review.setOp(match.threadId, op)
										}
									/>
								))}
							</ul>
							{left > 0 && (
								<Button
									type="button"
									variant="outline"
									className="self-start"
									disabled={isWorking}
									onClick={review.showMore}
								>
									Show more{" "}
									<span className="text-muted-foreground">
										({left} left)
									</span>
								</Button>
							)}
						</div>
						<P className="text-muted-foreground text-sm">
							{counts.move} to move · {counts.also_link} to add ·{" "}
							{counts.reject} not about this topic
						</P>
					</div>
				)}
				<DialogFooter>
					{review.phase === "ready" && review.remaining.length > 0 ? (
						<>
							{/* closing keeps the check and the choices for next time */}
							<Button
								type="button"
								variant="outline"
								disabled={isBusy}
								onClick={() => onOpenChange(false)}
							>
								Close
							</Button>
							<Button
								type="button"
								disabled={isWorking}
								onClick={() => void handleApply()}
							>
								{review.isApplying && (
									<Spinner className="size-4" />
								)}
								{review.isApplying
									? "Applying..."
									: `Apply ${review.changes.length} ${review.changes.length === 1 ? "change" : "changes"}`}
							</Button>
						</>
					) : (
						<>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								{review.phase === "intro" ? "Cancel" : "Close"}
							</Button>
							{review.phase !== "checking" && (
								<Button
									type="button"
									disabled={review.isStarting}
									onClick={() => void review.check()}
								>
									{review.isStarting && (
										<Spinner className="size-4" />
									)}
									{review.phase === "intro"
										? "Check conversations"
										: "Check again"}
								</Button>
							)}
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
