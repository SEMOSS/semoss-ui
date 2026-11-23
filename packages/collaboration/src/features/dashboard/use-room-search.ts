import { useEffect, useState } from "react";
import { useDebouncedValue } from "@semoss/ui/next";
import { listRoomsPage } from "@/features/rooms/api/list-rooms";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import type { InsightActions } from "@/lib/pixel";

interface RoomSearch {
	/** The newest chats whose name matches; empty while the query is blank. */
	rooms: RoomRow[];
	/** More chats match than are listed. */
	hasMore: boolean;
	isLoading: boolean;
	error: string;
	retry: () => void;
}

const IDLE = { term: "", rooms: [] as RoomRow[], hasMore: false, error: "" };

/** Finds the owner's chats by name on the server, so a chat outside the loaded history can still be found. */
export function useRoomSearch(
	actions: InsightActions,
	query: string,
): RoomSearch {
	const typed = query.trim();
	const term = useDebouncedValue(typed, 300);
	const [found, setFound] = useState(IDLE);
	const [attempt, setAttempt] = useState(0);
	useEffect(() => {
		void attempt;
		if (!term) return;
		let isCurrent = true;
		// shortcut: lists the first page of matches only, add paging if narrowing by name is not enough
		listRoomsPage(actions, 0, term).then(
			(page) => {
				if (isCurrent)
					setFound({
						term,
						rooms: page.rooms,
						hasMore: page.hasMore,
						error: "",
					});
			},
			(cause: unknown) => {
				if (isCurrent)
					setFound({
						...IDLE,
						term,
						error:
							cause instanceof Error
								? cause.message
								: "Could not search chats.",
					});
			},
		);
		return () => {
			isCurrent = false;
		};
	}, [actions, term, attempt]);
	// an answer for an earlier query is not this query's answer
	const isAnswered = found.term === typed;
	return {
		rooms: isAnswered ? found.rooms : [],
		hasMore: isAnswered && found.hasMore,
		isLoading: typed !== "" && !isAnswered,
		error: isAnswered ? found.error : "",
		retry: () => {
			setFound(IDLE);
			setAttempt((count) => count + 1);
		},
	};
}
