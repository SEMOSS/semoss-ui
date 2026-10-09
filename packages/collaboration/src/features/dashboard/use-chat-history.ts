import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";
import {
	listRoomsPage,
	ROOM_HISTORY_CHANGED,
} from "@/features/rooms/api/list-rooms";
import type { RoomRow } from "@/features/rooms/api/room-schemas";

export interface ChatHistory {
	rooms: RoomRow[];
	isLoading: boolean;
	error: string;
	hasMore: boolean;
	loadMore: () => void;
	refresh: () => void;
	retry: () => void;
	scrollTop: { current: number };
}

/** Keep previously loaded pages and scroll position when the route changes. */
export function useChatHistory(): ChatHistory {
	const { actions, insightId } = useInsight();
	const [rooms, setRooms] = useState<RoomRow[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [hasMore, setHasMore] = useState(true);
	const offset = useRef(0);
	const busy = useRef(false);
	const epoch = useRef(0);
	const refreshQueued = useRef(false);
	const failedReset = useRef(false);
	const scrollTop = useRef(0);
	const read = useCallback(
		async (reset: boolean): Promise<void> => {
			if (busy.current) {
				if (reset) refreshQueued.current = true;
				return;
			}
			busy.current = true;
			const token = epoch.current;
			setIsLoading(true);
			setError("");
			try {
				const page = await listRoomsPage(
					actions,
					reset ? 0 : offset.current,
				);
				if (token !== epoch.current) return;
				setRooms((current) => {
					const incoming = new Map(
						page.rooms.map((room) => [room.roomId, room]),
					);
					const values = reset
						? [
								...page.rooms,
								...current.filter(
									(room) => !incoming.has(room.roomId),
								),
							]
						: [
								...current.map(
									(room) => incoming.get(room.roomId) ?? room,
								),
								...page.rooms,
							];
					return [
						...new Map(
							values.map((room) => [room.roomId, room]),
						).values(),
					];
				});
				// Revisit server offsets after insertions; retained rows deduplicate overlapping pages.
				offset.current = page.nextOffset;
				setHasMore(page.hasMore);
			} catch (cause) {
				failedReset.current = reset;
				if (token === epoch.current)
					setError(
						cause instanceof Error
							? cause.message
							: "Could not load chats.",
					);
			} finally {
				if (token === epoch.current) {
					busy.current = false;
					setIsLoading(false);
				}
			}
		},
		[actions],
	);
	const refresh = useCallback(() => {
		void read(true);
	}, [read]);
	useEffect(() => {
		refresh();
		const changed = (event: Event) => {
			if (event instanceof CustomEvent) {
				const row = z
					.object({
						scope: z.string().optional(),
						roomId: z.string().min(1),
						roomName: z.string().optional(),
						modelId: z.string().optional(),
						dateCreated: z.string().optional(),
						dateUpdated: z.string().optional(),
						pinned: z.boolean().optional(),
					})
					.safeParse(event.detail);
				if (row.success) {
					const { scope, ...patch } = row.data;
					if (scope !== undefined && scope !== insightId) return;
					setRooms((current) =>
						patch.pinned !== undefined &&
						current.some((room) => room.roomId === patch.roomId)
							? current.map((room) =>
									room.roomId === patch.roomId
										? { ...room, ...patch }
										: room,
								)
							: [
									{
										...current.find(
											(room) =>
												room.roomId === patch.roomId,
										),
										...patch,
									},
									...current.filter(
										(room) => room.roomId !== patch.roomId,
									),
								],
					);
				}
			}
			refresh();
		};
		window.addEventListener(ROOM_HISTORY_CHANGED, changed);
		return () => {
			epoch.current++;
			busy.current = false;
			window.removeEventListener(ROOM_HISTORY_CHANGED, changed);
		};
	}, [insightId, refresh]);
	useEffect(() => {
		if (!isLoading && refreshQueued.current) {
			refreshQueued.current = false;
			refresh();
		}
	}, [isLoading, refresh]);
	return {
		rooms,
		isLoading,
		error,
		hasMore,
		scrollTop,
		refresh,
		retry: () => {
			void read(failedReset.current);
		},
		loadMore: () => {
			if (hasMore) void read(false);
		},
	};
}
