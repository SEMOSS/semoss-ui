import type {
	CollaborationState,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";

/** Match the server's priority, score, recency, and stable identity ordering. */
export function compareTopicTasks(first: WorkItem, second: WorkItem): number {
	return (
		(first.priority ?? "P9").localeCompare(second.priority ?? "P9") ||
		(second.score ?? -1) - (first.score ?? -1) ||
		second.received.localeCompare(first.received) ||
		first.id.localeCompare(second.id)
	);
}

/** Reviews are separate from ordinary next actions and never imply tool approval. */
export function taskNeedsInput(item: WorkItem): boolean {
	return (
		item.status === "open" &&
		!item.suggested &&
		!item.assignee &&
		(item.askType === "approve" || item.askType === "review")
	);
}

/** Delegated and explicitly waiting tasks follow the backend's waiting view. */
function taskIsWaiting(item: WorkItem): boolean {
	return (
		item.status === "waiting" ||
		(item.status === "open" &&
			(item.askType === "waiting_on" || Boolean(item.assignee)))
	);
}

/** Topic task groups retain explicit links and the existing exclusion policy. */
export function selectTopicTasks(
	items: WorkItem[],
	threads: CollaborationState["threads"],
	topicId: string,
): {
	needsInput: WorkItem[];
	next: WorkItem[];
	waiting: WorkItem[];
	completed: WorkItem[];
	snoozed: WorkItem[];
} {
	const sources = new Map(threads.map((thread) => [thread.id, thread]));
	const related = items
		.filter((item) => {
			if (
				!item.topicIds.includes(topicId) &&
				item.linkTopicId !== topicId
			)
				return false;
			const thread = sources.get(item.threadId);
			return (
				!thread?.muted && (!thread?.automated || item.status === "done")
			);
		})
		.sort(compareTopicTasks);
	return {
		needsInput: related.filter(taskNeedsInput),
		next: related.filter(
			(item) =>
				item.status === "open" &&
				!taskNeedsInput(item) &&
				!taskIsWaiting(item),
		),
		waiting: related.filter(taskIsWaiting),
		completed: related
			.filter((item) => item.status === "done")
			.sort(
				(a, b) =>
					(b.completedAt ?? b.received).localeCompare(
						a.completedAt ?? a.received,
					) || a.id.localeCompare(b.id),
			),
		snoozed: related.filter((item) => item.status === "snoozed"),
	};
}
