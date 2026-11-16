import { useSessionPixel } from "@semoss/sdk/react";
import {
	buildPlaygroundRoomsPixel,
	type RoomListItem,
	type RoomListView,
} from "../room-list/room-list-groups";

/** Most recently active rooms first, favorites leading. */
const SEARCH_VIEW: RoomListView = {
	sortBy: "dateUpdated",
	sortDir: "DESC",
	groupBy: "date",
};

/** How many recent rooms show before the user types. */
const RECENT_LIMIT = 8;
/** How many rooms a search returns. */
const MATCH_LIMIT = 30;

/** The rooms the search dialog lists. */
export interface UseRoomSearchReturn {
	/** Matching rooms, name matches first; the latest rooms with no query. */
	rooms: RoomListItem[];
	/** Whether a search is on its way. */
	isLoading: boolean;
	/** Whether the last search failed. */
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
 * @returns The rooms found, and whether the search is loading or failed; no
 * rooms while it is off.
 */
export const useRoomSearch = (
	query: string,
	workspaceId: string | null,
	isEnabled: boolean,
): UseRoomSearchReturn => {
	const search = query.trim();
	// an empty pixel does not run, so a closed dialog asks for nothing
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
