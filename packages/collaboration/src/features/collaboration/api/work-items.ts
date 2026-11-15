import type { InsightActions } from "@/lib/pixel";
import { pixel } from "@/lib/pixel";
import { runBatch } from "../live/live-state";

/** How much a work item matters to its owner. */
export type WorkItemPriority = "high" | "medium" | "low";

/** What the owner can change on a work item; only the keys given are sent. */
export interface WorkItemChange {
	title?: string;
	/** A day as `YYYY-MM-DD`; an empty string clears it. */
	due?: string;
	priority?: WorkItemPriority;
	/** `done` finishes the whole item; `active` reopens it. */
	status?: "active" | "done";
}

/** Change one work item (`WorkSaveWork` with its `taskId`). Throws when the server refuses. */
export async function updateWorkItem(
	actions: InsightActions,
	taskId: string,
	change: WorkItemChange,
): Promise<void> {
	await runBatch(actions, [pixel("WorkSaveWork", { taskId, ...change })]);
}

/**
 * Make a work item by hand (`WorkSaveWork` without a `taskId`), optionally under one topic.
 * Returns the new item's id. Throws when the server refuses.
 */
export async function createWorkItem(
	actions: InsightActions,
	input: { title: string; topicId?: string },
): Promise<string> {
	const [created] = (await runBatch(actions, [
		pixel("WorkSaveWork", {
			title: input.title,
			topicIds: input.topicId ? [input.topicId] : undefined,
		}),
	])) as { id?: string }[];
	return created?.id ?? "";
}
