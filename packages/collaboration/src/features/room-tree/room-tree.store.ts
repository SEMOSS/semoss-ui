import type { InsightActions } from "@/lib/pixel";
import { listRoomTree } from "./api/list-room-tree";
import type {
	RoomTreeResponse,
	RoomTreeRoom,
	RoomTreeSnapshot,
	RoomTreeState,
} from "./room-tree.types";
import type { RoomReadState } from "./room-tree-read-state";

const PAGE_SIZE = 25;

export interface RoomTreeStore
	extends Pick<
		RoomTreeState,
		"refresh" | "loadMore" | "retry" | "scrollTop"
	> {
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => RoomTreeSnapshot;
	retain: () => () => void;
	/** Consume known activity while the loaded conversation is visible. */
	viewRoom: (roomId: string) => () => void;
	/** Update the dot immediately, even if the following history refresh fails. */
	recordActivity: (roomId: string, activityAt: string) => void;
	/** Apply a confirmed pin write while its metadata refresh is pending. */
	recordPin: (roomId: string, pinned: boolean) => void;
	/** Merge browser read markers from another tab without reloading history. */
	syncReadState: () => void;
}

/** One account's browser-built room list survives route changes and pages locally. */
export function createRoomTreeStore(
	getActions: () => InsightActions,
	activity: ReadonlyMap<string, string> = new Map(),
	readState?: RoomReadState,
): RoomTreeStore {
	let snapshot: RoomTreeSnapshot = {
		rooms: [],
		hasMore: false,
		isLoading: false,
		error: "",
	};
	let tree: RoomTreeResponse | null = null;
	const listeners = new Set<() => void>();
	let depth = PAGE_SIZE;
	const visibleRooms = new Map<string, number>();
	let owners = 0;
	let generation = 0;
	let refreshing = false;
	let refreshQueued = false;
	let pinRevision = 0;
	const pinChanges = new Map<string, { pinned: boolean; revision: number }>();
	const newlyPinnedRooms = new Set<string>();
	const scrollTop = { current: 0 };
	const publish = (next: RoomTreeSnapshot): void => {
		snapshot = next;
		for (const listener of listeners) listener();
	};
	const isCurrent = (token: number): boolean =>
		owners > 0 && token === generation;
	const roomsFrom = (data: RoomTreeResponse): RoomTreeRoom[] =>
		data.rooms
			.slice(0, depth)
			.map((room) =>
				readState
					? { ...room, isUnread: readState.isUnread(room.roomId) }
					: room,
			);
	const publishReadState = (): void => {
		if (!readState) return;
		let hasChanged = false;
		const rooms = snapshot.rooms.map((room) => {
			const isUnread = readState.isUnread(room.roomId);
			if (Boolean(room.isUnread) === isUnread) return room;
			hasChanged = true;
			return { ...room, isUnread };
		});
		if (hasChanged) publish({ ...snapshot, rooms });
	};

	const refresh = (): void => {
		if (owners === 0) return;
		if (refreshing) {
			refreshQueued = true;
			return;
		}
		refreshing = true;
		const token = ++generation;
		const requestedPinRevision = pinRevision;
		publish({ ...snapshot, isLoading: true, error: "" });
		void listRoomTree(getActions(), activity, () => isCurrent(token))
			.then((data) => {
				if (!isCurrent(token)) return;
				for (const [roomId, change] of pinChanges)
					if (change.revision <= requestedPinRevision)
						pinChanges.delete(roomId);
				const pinnedIds = new Set(
					data.rooms.map((room) => room.roomId),
				);
				for (const [roomId, change] of pinChanges) {
					if (change.pinned) pinnedIds.add(roomId);
					else pinnedIds.delete(roomId);
				}
				tree = {
					...data,
					rooms: data.rooms.filter((room) =>
						pinnedIds.has(room.roomId),
					),
				};
				readState?.observeRooms(data.rooms, newlyPinnedRooms);
				for (const room of data.rooms)
					newlyPinnedRooms.delete(room.roomId);
				for (const roomId of visibleRooms.keys())
					readState?.markRead(roomId);
				publish({
					rooms: roomsFrom(tree),
					pinnedRoomIds: [...pinnedIds],
					hasMore: tree.rooms.length > depth,
					isLoading: false,
					error: data.warning ?? "",
				});
			})
			.catch((cause: unknown) => {
				if (isCurrent(token))
					publish({
						...snapshot,
						isLoading: false,
						error:
							cause instanceof Error
								? cause.message
								: "Could not load rooms.",
					});
			})
			.finally(() => {
				if (!isCurrent(token)) return;
				refreshing = false;
				if (refreshQueued) {
					refreshQueued = false;
					refresh();
				}
			});
	};
	return {
		scrollTop,
		recordPin: (roomId, pinned) => {
			pinChanges.set(roomId, { pinned, revision: ++pinRevision });
			if (pinned) newlyPinnedRooms.add(roomId);
			else newlyPinnedRooms.delete(roomId);
			const pinnedIds = new Set(snapshot.pinnedRoomIds ?? []);
			if (pinned) pinnedIds.add(roomId);
			else pinnedIds.delete(roomId);
			if (tree && !pinned)
				tree = {
					...tree,
					rooms: tree.rooms.filter((room) => room.roomId !== roomId),
				};
			publish({
				...snapshot,
				pinnedRoomIds: snapshot.pinnedRoomIds
					? [...pinnedIds]
					: undefined,
				rooms: tree ? roomsFrom(tree) : snapshot.rooms,
				hasMore: tree ? tree.rooms.length > depth : snapshot.hasMore,
			});
		},
		viewRoom: (roomId) => {
			visibleRooms.set(roomId, (visibleRooms.get(roomId) ?? 0) + 1);
			if (readState?.markRead(roomId)) publishReadState();
			let isReleased = false;
			return () => {
				if (isReleased) return;
				isReleased = true;
				const remaining = (visibleRooms.get(roomId) ?? 1) - 1;
				if (remaining > 0) visibleRooms.set(roomId, remaining);
				else visibleRooms.delete(roomId);
			};
		},
		recordActivity: (roomId, activityAt) => {
			if (!readState?.observeActivity(roomId, activityAt)) return;
			if (visibleRooms.has(roomId)) readState.markRead(roomId);
			publishReadState();
		},
		syncReadState: () => {
			if (readState?.sync()) publishReadState();
		},
		refresh,
		retry: refresh,
		loadMore: () => {
			if (owners === 0 || refreshing || !tree) return;
			if (!snapshot.hasMore) return;
			depth += PAGE_SIZE;
			publish({
				...snapshot,
				rooms: roomsFrom(tree),
				hasMore: tree.rooms.length > depth,
			});
		},
		getSnapshot: () => snapshot,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		retain: () => {
			owners += 1;
			if (owners === 1) refresh();
			return () => {
				owners -= 1;
				if (owners === 0) {
					generation += 1;
					refreshing = false;
					refreshQueued = false;
				}
			};
		},
	};
}
