import { toast } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { pixel } from "@/lib/pixel";
import { runBatch } from "./live-state";
import type { TopicChange } from "./live-sync";

/** The toast the topic dialogs open; the saved change replaces it with one that can undo. */
export const topicChangeToastId = (topicId: string) =>
	`topic-change-${topicId}`;

/**
 * Puts a saved topic merge or delete back (`BrainUndoTopicChange`), then reads the owner's data again.
 * The server refuses when something changed since, and the toast says so.
 */
export async function undoTopicChange(
	actions: InsightActions,
	change: TopicChange,
	reload: () => Promise<void>,
): Promise<void> {
	try {
		await runBatch(actions, [
			pixel("BrainUndoTopicChange", { changeId: change.changeId }),
		]);
		await reload();
		toast.success(`${change.name} is back.`);
	} catch (cause) {
		toast.error(
			`Could not undo: ${cause instanceof Error ? cause.message : String(cause)}`,
		);
	}
}

/** Says a topic merge or delete is saved, with an Undo that puts it back. */
export function offerTopicUndo(change: TopicChange, undo: () => void) {
	toast.success(
		change.kind === "merge"
			? `Merged ${change.name} into ${change.intoName}.`
			: `Deleted ${change.name}.`,
		{
			id: topicChangeToastId(change.topicId),
			// long enough to notice and reach for
			duration: 15_000,
			action: { label: "Undo", onClick: undo },
		},
	);
}
