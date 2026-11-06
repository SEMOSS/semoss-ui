import { useEffect, useRef } from "react";
import {
	chatPixels,
	type OptimisticRoom,
	type PlaygroundRoomRow,
} from "@semoss/sdk";
import {
	useIteratorPixel,
	useRoomsClient,
	useSessionInsight,
} from "@semoss/sdk/react";
import { useChat } from "../../host/chat.context";

/** What a rooms query lists. */
export interface RoomsQueryOptions {
	/** Matches room names; ignored for the pinned list. */
	search?: string;
	/** List only the pinned rooms, all at once. */
	pinned?: boolean;
	/** Page size of the paged list. */
	limit?: number;
	/** By creation date; newest first by default. */
	sort?: "ASC" | "DESC";
	/** Set false to read nothing, as while the list is hidden. */
	enabled?: boolean;
	/**
	 * Also return the rooms created on this page whose first message has not
	 * landed yet, which `GetPlaygroundRooms` does not list. They are dropped
	 * from the chat store once the backend lists them.
	 */
	includeOptimistic?: boolean;
}

/** The rooms read so far and how to read more. */
export interface RoomsQueryResult {
	/** The rooms read so far, in the backend's order. */
	data: PlaygroundRoomRow[];
	/**
	 * Rooms created on this page and not listed yet, when asked for; empty
	 * while searching.
	 */
	optimisticRooms: OptimisticRoom[];
	isLoading: boolean;
	isError: boolean;
	/** Whether another page may follow. */
	hasMore: boolean;
	/** Read the next page. */
	next: () => void;
	/** Read again from the first page, keeping the rooms shown meanwhile. */
	reset: () => void;
}

/**
 * The one way the playground reads the user's rooms: `GetPlaygroundRooms` in
 * the session's insight. Every query reads again, keeping what it shows,
 * whenever the chat store's `roomsVersion` moves — after a room is created,
 * renamed, pinned or closed anywhere in the app — so the nav, the chats page
 * and the agent's chat list stay in step.
 *
 * @param options - What to list.
 * @returns The rooms and how to page through them.
 */
export const useRoomsQuery = ({
	search = "",
	pinned = false,
	limit = 25,
	sort = "DESC",
	enabled = true,
	includeOptimistic = false,
}: RoomsQueryOptions = {}): RoomsQueryResult => {
	const { chat } = useChat();
	const { roomsVersion, storedOptimisticRooms } = useRoomsClient(
		chat,
		(client) => ({
			roomsVersion: client.roomsVersion,
			storedOptimisticRooms: client.optimisticRooms,
		}),
	);
	// rooms belong to no room's insight; they are read in the session's
	const { insightId } = useSessionInsight();
	const isEnabled = enabled && Boolean(insightId);

	const query = useIteratorPixel<PlaygroundRoomRow[], PlaygroundRoomRow>(
		(pageLimit, offset) => {
			if (!isEnabled) {
				return "";
			}
			return chatPixels.getRooms(
				pinned
					? { pinned: true, sort: sort }
					: {
							search: search,
							limit: pageLimit,
							offset: offset,
							sort: sort,
						},
			);
		},
		// a short page is the last; the pinned list is one page
		(response) => (pinned || response.length < limit ? -1 : Infinity),
		(response) => response,
		{ limit: limit, insightId: insightId },
		[search, pinned, sort, isEnabled, insightId],
	);

	// read again when the rooms change, keeping the current rows meanwhile
	const seenVersion = useRef(roomsVersion);
	const { reset } = query;
	useEffect(() => {
		if (seenVersion.current === roomsVersion) {
			return;
		}
		seenVersion.current = roomsVersion;
		reset();
	}, [roomsVersion, reset]);

	// a room the backend lists now is no longer optimistic
	useEffect(() => {
		if (!includeOptimistic) {
			return;
		}
		const fetched = new Set(query.data.map((room) => room.ROOM_ID));
		for (const roomId of Object.keys(storedOptimisticRooms)) {
			if (fetched.has(roomId)) {
				chat.removeOptimisticRoom(roomId);
			}
		}
	}, [includeOptimistic, query.data, chat, storedOptimisticRooms]);

	const fetchedIds = new Set(query.data.map((room) => room.ROOM_ID));
	const optimisticRooms =
		includeOptimistic && !search
			? Object.values(storedOptimisticRooms).filter(
					(room) => !fetchedIds.has(room.ROOM_ID),
				)
			: [];

	return {
		data: query.data,
		optimisticRooms: optimisticRooms,
		isLoading: query.isLoading,
		isError: query.isError,
		hasMore: query.hasMore,
		next: query.next,
		reset: query.reset,
	};
};
