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
	closedRoomIds: string[];
	setRoomClosed: (roomId: string, isClosed: boolean) => boolean;
	closeError: string;
	isLoading: boolean;
	error: string;
	hasMore: boolean;
	loadMore: () => void;
	refresh: () => void;
	retry: () => void;
	scrollTop: { current: number };
}

/** Keep previously loaded pages and scroll position when the route changes. */
export function useChatHistory(
	storageKey = "semoss:collaboration:closed-chats",
): ChatHistory {
	const { actions } = useInsight();
	const [closedRoomIds, setClosedRoomIds] = useState(() =>
		readClosedRoomIds(storageKey),
	);
	const [closeError, setCloseError] = useState("");
	const setRoomClosed = (roomId: string, isClosed: boolean): boolean => {
		const saved = readClosedRoomIds(storageKey);
		const next = isClosed
			? [...new Set([...saved, roomId])]
			: saved.filter((id) => id !== roomId);
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify({ version: 1, roomIds: next }),
			);
			setClosedRoomIds(next);
			setCloseError("");
			return true;
		} catch {
			setCloseError(
				"Could not save the chat list. Try again when browser storage is available.",
			);
			return false;
		}
	};
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
						roomId: z.string().min(1),
						roomName: z.string().optional(),
						modelId: z.string().optional(),
						dateCreated: z.string().optional(),
					})
					.safeParse(event.detail);
				if (row.success)
					setRooms((current) => [
						row.data,
						...current.filter(
							(room) => room.roomId !== row.data.roomId,
						),
					]);
			}
			refresh();
		};
		window.addEventListener(ROOM_HISTORY_CHANGED, changed);
		return () => {
			epoch.current++;
			busy.current = false;
			window.removeEventListener(ROOM_HISTORY_CHANGED, changed);
		};
	}, [refresh]);
	useEffect(() => {
		if (!isLoading && refreshQueued.current) {
			refreshQueued.current = false;
			refresh();
		}
	}, [isLoading, refresh]);
	return {
		rooms,
		closedRoomIds,
		setRoomClosed,
		closeError,
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

/** Closing stores identifiers only; chat messages and drafts stay in their existing stores. */
function readClosedRoomIds(key: string): string[] {
	try {
		const parsed = z
			.object({
				version: z.literal(1),
				roomIds: z.array(z.string().min(1)),
			})
			.safeParse(JSON.parse(localStorage.getItem(key) || "null"));
		return parsed.success ? [...new Set(parsed.data.roomIds)] : [];
	} catch {
		return [];
	}
}
