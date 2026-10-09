import type { InsightActions } from "@/lib/pixel";
import { listRoomTree } from "./api/list-room-tree";
import type {
	RoomTreeResponse,
	RoomTreeRoom,
	RoomTreeSnapshot,
	RoomTreeState,
} from "./room-tree.types";
import type { RoomReadState } from "./room-tree-read-state";

export interface RoomTreeStore
	extends Pick<
		RoomTreeState,
		"refresh" | "loadMore" | "retry" | "scrollTop"
	> {
	recordRoom: (patch: {
		roomId: string;
		roomName?: string;
		dateUpdated?: string;
		deleted?: boolean;
		pinned?: boolean;
	}) => void;
	recordTopics: (
		roomId: string,
		topics: import("@/features/rooms/api/room-topics").RoomTopic[],
	) => void;
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

/** One account's pinned server pages survive route changes. */
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
	let offset = 0;
	let scannedIds = new Set<string>();
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
		data.rooms.map((room) =>
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

	const read = (append = false): void => {
		if (owners === 0) return;
		if (refreshing) {
			refreshQueued = true;
			return;
		}
		refreshing = true;
		const token = ++generation;
		const requestedPinRevision = pinRevision;
		publish({ ...snapshot, isLoading: true, error: "" });
		void listRoomTree(
			getActions(),
			activity,
			() => isCurrent(token),
			append ? offset : 0,
		)
			.then((data) => {
				if (!isCurrent(token)) return;
				if (
					append &&
					data.rooms.some((room) => scannedIds.has(room.roomId))
				)
					throw new Error(
						"Pinned rooms changed while loading. Refresh to try again.",
					);
				scannedIds = new Set([
					...(append ? scannedIds : []),
					...data.rooms.map((room) => room.roomId),
				]);
				data = {
					...data,
					rooms: data.rooms.map((room) =>
						room.topicUnavailable
							? {
									...room,
									topics:
										tree?.rooms.find(
											(old) => old.roomId === room.roomId,
										)?.topics ?? room.topics,
								}
							: room,
					),
				};
				for (const [roomId, change] of pinChanges)
					if (change.revision <= requestedPinRevision)
						pinChanges.delete(roomId);
				const combined =
					append || data.hasMore
						? [
								...new Map(
									[...(tree?.rooms ?? []), ...data.rooms].map(
										(room) => [room.roomId, room],
									),
								).values(),
							]
						: data.rooms;
				const pinnedIds = new Set(
					combined
						.filter(
							(room) =>
								data.hasMore || scannedIds.has(room.roomId),
						)
						.map((room) => room.roomId),
				);
				offset = data.nextOffset ?? combined.length;
				for (const [roomId, change] of pinChanges) {
					if (change.pinned) pinnedIds.add(roomId);
					else pinnedIds.delete(roomId);
				}
				tree = {
					...data,
					rooms: combined.filter((room) =>
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
					hasMore: data.hasMore ?? false,
					pinsComplete: !data.hasMore,
					pinStates: {
						...(data.hasMore ? snapshot.pinStates : {}),
						...Object.fromEntries(
							data.rooms.map((room) => [room.roomId, true]),
						),
						...Object.fromEntries(
							[...pinChanges].map(([id, change]) => [
								id,
								change.pinned,
							]),
						),
					},
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
					read();
				}
			});
	};
	return {
		scrollTop,
		recordRoom: (patch) => {
			if (!tree) return;
			let rooms = tree.rooms;
			if (patch.deleted)
				rooms = rooms.filter((room) => room.roomId !== patch.roomId);
			else if (rooms.some((room) => room.roomId === patch.roomId))
				rooms = rooms.map((room) =>
					room.roomId === patch.roomId ? { ...room, ...patch } : room,
				);
			else if (patch.pinned) rooms = [{ ...patch, topics: [] }, ...rooms];
			tree = { ...tree, rooms };
			publish({
				...snapshot,
				rooms: roomsFrom(tree),
				...(patch.deleted
					? {
							pinnedRoomIds: snapshot.pinnedRoomIds?.filter(
								(id) => id !== patch.roomId,
							),
							pinStates: {
								...snapshot.pinStates,
								[patch.roomId]: false,
							},
						}
					: {}),
			});
		},
		recordTopics: (roomId, topics) => {
			if (!tree) return;
			tree = {
				...tree,
				rooms: tree.rooms.map((room) =>
					room.roomId === roomId
						? {
								...room,
								topics: topics
									.filter((topic) => topic.state === "linked")
									.map((topic) => ({
										topicId: topic.topicId,
										name: topic.name || "Topic",
									})),
								topicUnavailable: false,
							}
						: room,
				),
			};
			publish({ ...snapshot, rooms: roomsFrom(tree) });
		},
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
				hasMore: snapshot.hasMore,
				pinStates: { ...snapshot.pinStates, [roomId]: pinned },
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
			if (tree) {
				tree = {
					...tree,
					rooms: tree.rooms.map((room) =>
						room.roomId === roomId &&
						(!room.activityAt || room.activityAt < activityAt)
							? { ...room, activityAt }
							: room,
					),
				};
				tree.rooms.sort(
					(left, right) =>
						(right.activityAt ?? "").localeCompare(
							left.activityAt ?? "",
						) || right.roomId.localeCompare(left.roomId),
				);
				publish({ ...snapshot, rooms: roomsFrom(tree) });
			}
			if (!readState?.observeActivity(roomId, activityAt)) return;
			if (visibleRooms.has(roomId)) readState.markRead(roomId);
			publishReadState();
		},
		syncReadState: () => {
			if (readState?.sync()) publishReadState();
		},
		refresh: () => read(),
		retry: () => read(),
		loadMore: () => {
			if (owners && !refreshing && snapshot.hasMore) read(true);
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
			if (owners === 1 && !tree) read();
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
