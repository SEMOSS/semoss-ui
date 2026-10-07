import { useEffect, useState, useSyncExternalStore } from "react";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { ROOM_PAGE_SIZE } from "@/features/rooms/api/list-rooms";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import { useDashboard } from "./dashboard.context";
import { useRoomSourceAssociations } from "./room-source-associations.context";

interface TopicSessionsState {
	rooms: RoomRow[];
	checkedCount: number;
	errorCount: number;
	isLoading: boolean;
	hasMore: boolean;
	loadMore: () => void;
	retry: () => void;
}

/** Match explicit source links while inspecting only user-requested history batches. */
export function useTopicSessions(topicId: string): TopicSessionsState {
	const { state } = useCollaborationSession();
	const { history } = useDashboard();
	const associations = useRoomSourceAssociations();
	const [activation] = useState(() => associations.createActivation());
	const [limit, setLimit] = useState(ROOM_PAGE_SIZE);
	useSyncExternalStore(
		associations.subscribe,
		associations.getSnapshot,
		associations.getSnapshot,
	);
	useEffect(() => activation.retain(), [activation]);
	useEffect(() => {
		activation.inspect(
			history.rooms.slice(0, limit).map((room) => room.roomId),
		);
	}, [activation, history.rooms, limit]);
	const threads = state.threads.filter((thread) =>
		thread.topicLinks.some((link) => link.topicId === topicId),
	);
	const threadIds = new Set(threads.map((thread) => thread.id));
	const legacyRoomIds = new Set(
		threads.flatMap((thread) => (thread.roomId ? [thread.roomId] : [])),
	);
	const inspected = history.rooms.slice(0, limit);
	const rooms: RoomRow[] = [];
	let errorCount = 0;
	let checkedCount = 0;
	let isLoading = history.isLoading;
	for (const room of inspected) {
		const entry = activation.get(room.roomId);
		if (!entry || entry.status === "loading") {
			isLoading = true;
		} else if (entry.status === "error") {
			errorCount += 1;
		} else {
			checkedCount += 1;
		}
		// Keep verified links visible while refreshes run or fail. An unverified
		// or malformed source never invents a legacy association.
		if (entry?.threadId !== undefined) {
			if (
				entry.threadId === null
					? legacyRoomIds.has(room.roomId)
					: threadIds.has(entry.threadId)
			)
				rooms.push(room);
		}
	}
	return {
		rooms,
		checkedCount,
		errorCount,
		isLoading,
		hasMore: history.rooms.length > limit || history.hasMore,
		loadMore: () => {
			if (isLoading) return;
			const nextLimit = limit + ROOM_PAGE_SIZE;
			setLimit(nextLimit);
			if (history.rooms.length < nextLimit && history.hasMore)
				history.loadMore();
		},
		retry: () =>
			activation.inspect(
				inspected.map((room) => room.roomId),
				true,
			),
	};
}
