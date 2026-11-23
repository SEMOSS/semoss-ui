import { useSessionPixel } from "@semoss/sdk/react";
import {
	buildPlaygroundRoomsPixel,
	type RoomListItem,
	type RoomListView,
} from "@/features/room-list/room-list";

/** Most recently active rooms first, favorites leading. */
const SEARCH_VIEW: RoomListView = {
	sortBy: "dateUpdated",
	sortDir: "DESC",
	groupBy: "date",
};

const RECENT_LIMIT = 8;
const MATCH_LIMIT = 30;

/** The rooms the search dialog lists. */
export interface UseRoomSearchReturn {
	/** Matching rooms, name matches first; the latest rooms with no query. */
	rooms: RoomListItem[];
	isLoading: boolean;
	isError: boolean;
}

/**
 * Find rooms by name or message text in one `GetPlaygroundRooms` call, which
 * also returns each room's agent, whether it is a favorite, and its pending
 * actions.
 *
 * @param query - The debounced search text; empty lists recent rooms.
 * @param workspaceId - Only rooms started with this agent; null for all.
 * @param isEnabled - Whether to run the query, i.e. the dialog is open.
 */
export const useRoomSearch = (
	query: string,
	workspaceId: string | null,
	isEnabled: boolean,
): UseRoomSearchReturn => {
	const search = query.trim();
	const pixel = isEnabled
		? buildPlaygroundRoomsPixel(SEARCH_VIEW, {
				search: search || undefined,
				searchMessages: true,
				workspaceId: workspaceId ?? undefined,
				limit: search ? MATCH_LIMIT : RECENT_LIMIT,
			})
		: "";
	const result = useSessionPixel<RoomListItem[]>(pixel, { data: [] });

	return {
		rooms: isEnabled ? (result.data ?? []) : [],
		isLoading: result.status === "LOADING",
		isError: result.status === "ERROR",
	};
};
