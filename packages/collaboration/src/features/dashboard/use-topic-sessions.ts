import { useEffect, useState, useSyncExternalStore } from "react";
import { useRecordIds } from "@/features/collaboration/live/work-updates.context";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { ROOM_PAGE_SIZE } from "@/features/rooms/api/list-rooms";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import {
	linkRoomTopic,
	listTopicRooms,
	type TopicRoom,
} from "@/features/rooms/api/room-topics";
import { useDashboard } from "./dashboard.context";
import { useRoomSourceAssociations } from "./room-source-associations.context";

/** A chat in the topic, and how it got there when the owner did not add it. */
export interface TopicSessionRoom extends RoomRow {
	via?: "thread" | "assistant";
}

export interface TopicSessionsState {
	rooms: TopicSessionRoom[];
	checkedCount: number;
	errorCount: number;
	/** Set when the topic's linked chats could not be read, so chats outside the loaded history may be missing. */
	linkedError: string;
	isLoading: boolean;
	hasMore: boolean;
	loadMore: () => void;
	retry: () => void;
	/** Adds the chat to the topic or takes it off, where it stays off; rejects when the save fails. */
	setInTopic: (room: RoomRow, isInTopic: boolean) => Promise<void>;
}

/** The topic's chats: the ones linked to it, and chats from its threads found in user-requested history batches. */
export function useTopicSessions(topicId: string): TopicSessionsState {
	const { state } = useCollaborationSession();
	const { localId, serverId } = useRecordIds();
	const { actions, history } = useDashboard();
	const associations = useRoomSourceAssociations();
	const [activation] = useState(() => associations.createActivation());
	const [limit, setLimit] = useState(ROOM_PAGE_SIZE);
	// the chats the server has linked to the topic, including ones outside the loaded history
	const [linked, setLinked] = useState<{
		rooms: TopicRoom[];
		error: string;
		isLoading: boolean;
	}>({ rooms: [], error: "", isLoading: true });
	const [linkedRead, setLinkedRead] = useState(0);
	// chats taken off here; a cached link or a source thread would otherwise keep them listed
	const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
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
	useEffect(() => {
		void linkedRead;
		let isCurrent = true;
		const read = async (): Promise<void> => {
			try {
				const rooms = await listTopicRooms(
					actions,
					await serverId(topicId),
				);
				if (isCurrent)
					setLinked({ rooms, error: "", isLoading: false });
			} catch (cause) {
				if (isCurrent)
					setLinked((current) => ({
						...current,
						isLoading: false,
						error:
							cause instanceof Error
								? cause.message
								: "Could not load this topic's chats.",
					}));
			}
		};
		void read();
		return () => {
			isCurrent = false;
		};
	}, [actions, serverId, topicId, linkedRead]);
	const threads = state.threads.filter((thread) =>
		thread.topicLinks.some((link) => link.topicId === topicId),
	);
	const threadIds = new Set(threads.map((thread) => thread.id));
	const legacyRoomIds = new Set(
		threads.flatMap((thread) => (thread.roomId ? [thread.roomId] : [])),
	);
	const origins = new Map(
		linked.rooms.map((room) => [room.roomId, room.origin]),
	);
	const viaOf = (
		roomId: string,
		isFromThread: boolean,
	): TopicSessionRoom["via"] => {
		const origin = origins.get(roomId);
		if (origin === "thread" || (!origin && isFromThread)) return "thread";
		return origin === "brain" || origin === "agent"
			? "assistant"
			: undefined;
	};
	// a chat's topic links carry server ids; a topic made on this page keeps its own
	const hasTopic = (ids: string[] | undefined): boolean =>
		ids?.some((id) => localId(id) === topicId) === true;
	const inspected = history.rooms.slice(0, limit);
	const rooms: TopicSessionRoom[] = [];
	let errorCount = 0;
	let checkedCount = 0;
	let isLoading = history.isLoading || linked.isLoading;
	for (const room of inspected) {
		const entry = activation.get(room.roomId);
		if (!entry || entry.status === "loading") {
			isLoading = true;
		} else if (entry.status === "error") {
			errorCount += 1;
		} else {
			checkedCount += 1;
		}
		if (removed.has(room.roomId)) continue;
		// Keep verified links visible while refreshes run or fail. An unverified
		// or malformed source never invents a legacy association, and a topic
		// the owner took off the chat stays off whatever its thread is in.
		const isFromThread =
			entry?.threadId !== undefined &&
			!hasTopic(entry.dismissedTopicIds) &&
			(entry.threadId === null
				? legacyRoomIds.has(room.roomId)
				: threadIds.has(entry.threadId));
		if (
			hasTopic(entry?.topicIds) ||
			origins.has(room.roomId) ||
			isFromThread
		)
			rooms.push({ ...room, via: viaOf(room.roomId, isFromThread) });
	}
	// linked chats older than the loaded history follow it, as the server orders them
	const listed = new Set(rooms.map((room) => room.roomId));
	for (const room of linked.rooms)
		if (!listed.has(room.roomId) && !removed.has(room.roomId))
			rooms.push({ ...room, via: viaOf(room.roomId, false) });
	return {
		rooms,
		checkedCount,
		errorCount,
		linkedError: linked.error,
		isLoading,
		hasMore: history.rooms.length > limit || history.hasMore,
		loadMore: () => {
			if (isLoading) return;
			const nextLimit = limit + ROOM_PAGE_SIZE;
			setLimit(nextLimit);
			if (history.rooms.length < nextLimit && history.hasMore)
				history.loadMore();
		},
		retry: () => {
			activation.inspect(
				inspected.map((room) => room.roomId),
				true,
			);
			if (linked.error) {
				setLinked((current) => ({ ...current, isLoading: true }));
				setLinkedRead((count) => count + 1);
			}
		},
		setInTopic: async (room, isInTopic) => {
			await linkRoomTopic(
				actions,
				room.roomId,
				await serverId(topicId),
				!isInTopic,
			);
			setLinked((current) => ({
				...current,
				rooms: [
					...(isInTopic ? [{ ...room, origin: "you" }] : []),
					...current.rooms.filter(
						(row) => row.roomId !== room.roomId,
					),
				],
			}));
			setRemoved((current) => {
				const next = new Set(current);
				if (isInTopic) next.delete(room.roomId);
				else next.add(room.roomId);
				return next;
			});
		},
	};
}
