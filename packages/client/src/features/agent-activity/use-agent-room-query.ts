import { useState } from "react";
import { useDebouncedValue } from "@semoss/ui/next";
import type { AgentRunRoomStatusFilter } from "@/api/agent-runs";

/** How long typing pauses before the room search applies */
const SEARCH_DELAY_MS = 300;

/** The status filter and the page, which every other filter sends back to 0 */
interface RoomListPosition {
	status: AgentRunRoomStatusFilter;
	page: number;
}

const FIRST_PAGE: RoomListPosition = { status: "all", page: 0 };

export interface UseAgentRoomQueryResult {
	/** The room search as typed */
	search: string;
	/** The room search to read with: trimmed, once typing pauses */
	appliedSearch: string;
	/** Which runs a listed room must hold */
	status: AgentRunRoomStatusFilter;
	/** The page shown, from 0 */
	page: number;
	/** Whether the search or the status narrows the list */
	hasFilters: boolean;
	/** Changes the room search, from the first page */
	setSearch: (search: string) => void;
	/** Changes the status filter, from the first page */
	setStatus: (status: AgentRunRoomStatusFilter) => void;
	/** Shows another page */
	setPage: (page: number) => void;
	/** Goes back to the first page, such as when a page's own filter changes */
	resetPage: () => void;
	/** Clears the search and the status, from the first page */
	clear: () => void;
}

/**
 * The room search, status filter and page a room list reads with. Keep it in
 * the page that shows the list, so they are kept while a room is open.
 *
 * @returns The search, status and page, and the actions that change them.
 */
export const useAgentRoomQuery = (): UseAgentRoomQueryResult => {
	const [search, setSearchText] = useState("");
	const [position, setPosition] = useState<RoomListPosition>(FIRST_PAGE);
	const appliedSearch = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);

	return {
		search,
		appliedSearch,
		status: position.status,
		page: position.page,
		hasFilters: Boolean(search.trim()) || position.status !== "all",
		setSearch: (value) => {
			setSearchText(value);
			setPosition((previous) => ({ ...previous, page: 0 }));
		},
		setStatus: (status) => setPosition({ status, page: 0 }),
		setPage: (page) => setPosition((previous) => ({ ...previous, page })),
		resetPage: () => setPosition((previous) => ({ ...previous, page: 0 })),
		clear: () => {
			setSearchText("");
			setPosition(FIRST_PAGE);
		},
	};
};
