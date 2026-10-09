import { mapItem } from "@/features/collaboration/live/live-state";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { workItemSchema } from "./topic-api";

/** Supported, independently saved changes to a task. */
export type UpdateTopicTaskChanges = Partial<
	Pick<
		WorkItem,
		"status" | "priority" | "suggested" | "snoozeUntil" | "closedReason"
	>
>;

/** Save a task without requiring or opening its source conversation. */
export async function updateTopicTask(
	actions: InsightActions,
	itemId: string,
	changes: UpdateTopicTaskChanges,
): Promise<WorkItem> {
	const row = await callPixel(
		actions,
		pixel("WorkUpdateItem", {
			itemId,
			...changes,
			...(changes.priority === null ? { priority: [] } : {}),
		}),
		workItemSchema,
	);
	if (row.id !== itemId)
		throw new Error(
			"The saved task did not match this task. Refresh and try again.",
		);
	return mapItem(row);
}
