import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useRoomSourceAssociations } from "@/features/dashboard/room-source-associations.context";
import { useAgentAttention } from "@/features/dashboard/use-agent-attention";
import type { AttentionState } from "./attention.context";
import { buildAttentionItems } from "./attention.model";
import { attentionPriorityStorageKey } from "./attention-priorities";
import { useAttentionPriorities } from "./use-attention-priorities";

/** Share one durable attention scan and bounded topic reads across the full queue and overview. */
export function useAttentionState(
	account: string,
	deployment: string,
	refreshRevision: number,
): AttentionState {
	const { state } = useCollaborationSession();
	const updates = useWorkUpdates();
	const agentAttention = useAgentAttention(true, refreshRevision);
	const preferences = useAttentionPriorities(
		attentionPriorityStorageKey(account, deployment),
	);
	const associations = useRoomSourceAssociations();
	const [activation] = useState(() => associations.createActivation());
	useSyncExternalStore(
		associations.subscribe,
		associations.getSnapshot,
		associations.getSnapshot,
	);
	const roomIds = useMemo(
		() => [
			...new Set([
				...agentAttention.runs.flatMap((run) =>
					run.roomId ? [run.roomId] : [],
				),
				...(agentAttention.delegations.data ?? []).flatMap(
					(delegation) =>
						delegation.roomId ? [delegation.roomId] : [],
				),
				...state.memories.flatMap((memory) =>
					memory.state === "suggested" &&
					memory.source.roomId &&
					!memory.source.threadId
						? [memory.source.roomId]
						: [],
				),
			]),
		],
		[agentAttention.runs, agentAttention.delegations.data, state.memories],
	);
	useEffect(() => activation.retain(), [activation]);
	useEffect(() => activation.inspect(roomIds), [activation, roomIds]);
	const refreshWork = updates?.refresh;
	useEffect(() => {
		refreshWork?.();
	}, [refreshWork]);
	const items = buildAttentionItems(state, {
		runs: agentAttention.runs,
		delegations: agentAttention.delegations.data ?? [],
		roomSource: activation.get,
		priorities: preferences.priorities,
	});
	const topicsLoading = items.some((item) => item.topicStatus === "loading");
	const topicsUnavailable = items.some(
		(item) => item.topicStatus === "error",
	);
	const errors = [
		...new Set(
			[
				updates?.error,
				...agentAttention.scan.errors,
				agentAttention.delegations.error,
				preferences.error,
				state.items.filter((item) => !item.isSample).length >= 5000 ||
				state.threads.filter((thread) => !thread.isSample).length >=
					5000
					? "Conversation actions reached the loaded limit. Some pending actions may be unavailable."
					: "",
				topicsUnavailable
					? "Some topic links could not be checked. All pending items remain available."
					: "",
				(agentAttention.delegations.data?.length ?? 0) >= 200
					? "The first 200 pending delegations are shown. More may be available."
					: "",
			].filter((message): message is string => Boolean(message)),
		),
	];
	const workComplete = !updates || Boolean(updates.pendingCoverage);
	const isLoading = Boolean(
		updates?.isRefreshing ||
			agentAttention.isLoading ||
			agentAttention.delegations.isLoading ||
			topicsLoading ||
			(!workComplete && !updates?.error),
	);
	return {
		items,
		isLoading,
		isComplete:
			!isLoading &&
			!errors.length &&
			workComplete &&
			agentAttention.scan.complete &&
			Boolean(agentAttention.delegations.checkedAt),
		errors,
		agentAttention,
		refresh: () => {
			refreshWork?.();
			agentAttention.refresh();
			activation.inspect(roomIds, true);
		},
		setPriority: (item, priority) =>
			preferences.setPriority(item.id, priority),
	};
}
