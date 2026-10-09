import { useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { tomorrowAtEight } from "@/features/collaboration/state/collaboration.reducer";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import {
	type UpdateTopicTaskChanges,
	updateTopicTask,
} from "./api/update-topic-task";

interface TopicTaskAction {
	isPending: boolean;
	error: string | null;
	update: (changes: UpdateTopicTaskChanges) => Promise<boolean>;
}

/** Keep the last confirmed task visible until its update succeeds. */
export function useTopicTaskAction(item: WorkItem | null): TopicTaskAction {
	const { actions } = useInsight();
	const { state, dispatch } = useCollaborationSession();
	const updates = useWorkUpdates();
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const pending = useRef(false);
	const update = async (
		changes: UpdateTopicTaskChanges,
	): Promise<boolean> => {
		if (!item || pending.current) return false;
		pending.current = true;
		setIsPending(true);
		setError(null);
		const savedChanges = { ...changes };
		if (changes.status === "snoozed" && !changes.snoozeUntil) {
			savedChanges.snoozeUntil = tomorrowAtEight(
				new Date().toISOString(),
				state.liveProfile?.timezone || state.profile.timezone,
			);
		}
		try {
			if (item.isSample) {
				dispatch({
					type: "item.update",
					itemId: item.id,
					changes: savedChanges,
				});
			} else {
				await updates?.settled?.();
				const saved = await updateTopicTask(
					actions,
					updates?.serverId?.(item.id) ?? item.id,
					savedChanges,
				);
				const localId = (id: string): string =>
					updates?.localId?.(id) ?? id;
				dispatch({
					type: "item.received",
					item: {
						...saved,
						id: localId(saved.id),
						topicIds: saved.topicIds.map(localId),
						linkTopicId: saved.linkTopicId
							? localId(saved.linkTopicId)
							: null,
						assignee: saved.assignee
							? localId(saved.assignee)
							: null,
					},
				});
				for (const id of new Set([
					...item.topicIds,
					...saved.topicIds.map(localId),
					item.linkTopicId,
					saved.linkTopicId ? localId(saved.linkTopicId) : null,
				])) {
					if (!id) continue;
					const scope = `topic:${id}` as const;
					if (updates?.resources?.[scope])
						void updates.loadResource?.(scope, true);
				}
			}
			return true;
		} catch (cause: unknown) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not save this task. Try again.",
			);
			return false;
		} finally {
			pending.current = false;
			setIsPending(false);
		}
	};
	return { isPending, error, update };
}
