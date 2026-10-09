import { useId, useState } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	Badge,
	Checkbox,
	cn,
	P,
	Spinner,
} from "@semoss/ui/next";
import { AttentionReviewSheet } from "@/features/attention/attention-review-sheet";
import { dateLabel } from "@/features/collaboration/date-label";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { roomPath, threadPath } from "@/lib/workspace-paths";
import type { UpdateTopicTaskChanges } from "./api/update-topic-task";
import { TopicTaskMenu } from "./topic-task-menu";
import { useTopicTaskAction } from "./use-topic-task-action";

const priorityLabels = {
	P0: "Urgent",
	P1: "High",
	P2: "Normal",
	P3: "Low",
} as const;

interface TopicTaskRowProps {
	item: WorkItem;
	/** Restore focus to the list when a successful status change moves its row. */
	onStatusChange?: () => void;
}

/** A compact, independently actionable task row, including source-less tasks. */
export function TopicTaskRow({ item, onStatusChange }: TopicTaskRowProps) {
	const { state } = useCollaborationSession();
	const action = useTopicTaskAction(item);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const detailsId = useId();
	const path = item.roomId
		? roomPath(item.roomId)
		: item.threadId
			? threadPath(item.threadId)
			: null;
	const isCompleted = item.status === "done";
	const update = async (
		changes: UpdateTopicTaskChanges,
	): Promise<boolean> => {
		const saved = await action.update(changes);
		if (saved && changes.status && changes.status !== item.status)
			onStatusChange?.();
		return saved;
	};
	return (
		<li
			className="min-w-0 space-y-3 border-border border-b py-5 last:border-b-0"
			aria-busy={action.isPending}
		>
			<div className="flex items-start gap-3 sm:gap-4">
				<div className="flex min-h-9 pointer-coarse:min-h-11 min-w-6 pointer-coarse:min-w-11 items-center justify-center">
					<Checkbox
						checked={isCompleted}
						disabled={action.isPending}
						aria-label={`${isCompleted ? "Reopen" : "Complete"} ${item.title}`}
						className="size-5 rounded-full border-muted-foreground"
						onCheckedChange={(checked) => {
							void update({
								status: checked === true ? "done" : "open",
								suggested: false,
							});
						}}
					/>
				</div>
				<div className="min-w-0 flex-1 space-y-2 pt-1">
					<P
						className={cn(
							"break-words font-medium text-base",
							isCompleted && "text-muted-foreground line-through",
						)}
					>
						{path ? (
							<Link
								to={path}
								className="rounded-sm hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
							>
								{item.title}
							</Link>
						) : (
							<button
								id={detailsId}
								type="button"
								onClick={() => setIsDetailsOpen(true)}
								className="rounded-sm text-start hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
							>
								{item.title}
							</button>
						)}
					</P>
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground text-sm">
						{item.priority && (
							<Badge
								variant="secondary"
								className={cn(
									"rounded-sm font-normal",
									item.priority === "P0" &&
										"bg-destructive/10 text-foreground",
									item.priority === "P1" &&
										"bg-warning/10 text-foreground",
								)}
							>
								{priorityLabels[item.priority]}
							</Badge>
						)}
						{item.suggested && (
							<Badge variant="outline">Suggested</Badge>
						)}
						{item.askType === "fyi" && (
							<Badge variant="outline">FYI</Badge>
						)}
						{item.status === "waiting" && (
							<span>Waiting on others</span>
						)}
						{item.assignee && (
							<span className="break-all">
								Assigned to{" "}
								{state.people.find(
									(person) => person.id === item.assignee,
								)?.name || item.assignee}
							</span>
						)}
						{item.due && (
							<span>
								Due {dateLabel(item.due, undefined, "date")}
							</span>
						)}
						{item.status === "snoozed" && item.snoozeUntil && (
							<span>
								Snoozed until {dateLabel(item.snoozeUntil)}
							</span>
						)}
						{isCompleted && (
							<span>
								Completed
								{item.completedAt
									? ` ${dateLabel(item.completedAt, undefined, "date")}`
									: ""}
							</span>
						)}
					</div>
					{item.reasons.length > 0 && (
						<P className="break-words text-muted-foreground text-sm leading-relaxed">
							{item.reasons.join(" · ")}
						</P>
					)}
					{action.isPending && (
						<output className="flex items-center gap-2 text-muted-foreground text-sm">
							<Spinner aria-hidden="true" className="size-4" />
							Saving task…
						</output>
					)}
				</div>
				<TopicTaskMenu
					item={item}
					isPending={action.isPending}
					onUpdate={update}
				/>
			</div>
			{action.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{action.error} Your task has not changed. Try the action
						again.
					</AlertDescription>
				</Alert>
			)}
			{isDetailsOpen && (
				<AttentionReviewSheet
					item={{
						kind: "work",
						item,
						id: `work:${item.id}`,
						title: item.title,
						detail: item.reasons.join(" · "),
						sourceLabel: "Task details",
						topicIds: item.topicIds,
						topicStatus: "ready",
						priority: item.priority,
						due: item.due,
						received: item.received,
						score: item.score,
						isSample: item.isSample,
					}}
					isOpen={isDetailsOpen}
					onOpenChange={setIsDetailsOpen}
					triggerId={detailsId}
				/>
			)}
		</li>
	);
}
