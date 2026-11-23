import { useCacheState } from "@semoss/ui/next";
import {
	DEFAULT_ROOM_LIST_VIEW,
	isRoomListView,
	type RoomListView,
} from "./room-list";

/** The saved room list view, and a way to change it. */
export interface UseRoomListViewReturn {
	view: RoomListView;
	/** Whether the view is anything but the default. */
	isCustomized: boolean;
	setView: (view: RoomListView) => void;
}

/**
 * The user's order and grouping for the room list, kept in localStorage. A
 * stored value that is not a known view falls back to the default.
 */
export const useRoomListView = (): UseRoomListViewReturn => {
	const [stored, setView] = useCacheState<unknown>(
		DEFAULT_ROOM_LIST_VIEW,
		"sidebar--roomListView--v2",
	);
	const view = isRoomListView(stored) ? stored : DEFAULT_ROOM_LIST_VIEW;
	const isCustomized =
		view.sortBy !== DEFAULT_ROOM_LIST_VIEW.sortBy ||
		view.sortDir !== DEFAULT_ROOM_LIST_VIEW.sortDir ||
		view.groupBy !== DEFAULT_ROOM_LIST_VIEW.groupBy;
	return { view, isCustomized, setView };
};
