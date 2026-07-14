import { autorun } from "mobx";
import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { useDebouncedValue } from "@semoss/ui/next";
import { ChatRoomsSession } from "./chat-rooms-session";
import type { RoomSummary } from "./types";

export interface UseChatRoomsResult {
	pinnedRooms: RoomSummary[];
	rooms: RoomSummary[];
	search: string;
	setSearch: (value: string) => void;
	isLoading: boolean;
	isLoadingMore: boolean;
	hasMore: boolean;
	error: string | null;
	loadMore: () => void;
	renameRoom: (roomId: string, name: string) => Promise<void>;
	pinRoom: (roomId: string, pinned: boolean) => Promise<void>;
	deleteRoom: (roomId: string) => Promise<void>;
}

/**
 * Headless room-list hook — separate from useChat() (one room's messages),
 * matching playground's own ChatStore (list) vs RoomStore (one room) split.
 * Same MobX-session-plus-autorun-bridge pattern as use-chat.ts.
 *
 * Debouncing the search input lives here, in the hook, not inside
 * ChatRoomsSession — matching where playground itself debounces
 * (GlobalNav), not ChatStore.
 */
export function useChatRooms(options?: {
	pageSize?: number;
}): UseChatRoomsResult {
	const { actions } = useInsight();
	const sessionRef = useRef<ChatRoomsSession | null>(null);
	if (!sessionRef.current) {
		sessionRef.current = new ChatRoomsSession(actions, options?.pageSize);
	}
	const session = sessionRef.current;

	const [searchInput, setSearchInput] = useState("");
	const debouncedSearch = useDebouncedValue(searchInput);
	useEffect(() => {
		session.setSearch(debouncedSearch);
	}, [session, debouncedSearch]);

	const [, setRenderTick] = useState(0);
	useEffect(() => {
		const dispose = autorun(() => {
			session.pinnedRooms.length;
			session.rooms.length;
			session.isLoading;
			session.isLoadingMore;
			session.hasMore;
			session.error;
			session.revision;
			setRenderTick((tick) => tick + 1);
		});
		return dispose;
	}, [session]);

	return {
		pinnedRooms: [...session.pinnedRooms],
		rooms: [...session.rooms],
		search: searchInput,
		setSearch: setSearchInput,
		isLoading: session.isLoading,
		isLoadingMore: session.isLoadingMore,
		hasMore: session.hasMore,
		error: session.error,
		loadMore: session.loadMore,
		renameRoom: session.renameRoom,
		pinRoom: session.pinRoom,
		deleteRoom: session.deleteRoom,
	};
}
