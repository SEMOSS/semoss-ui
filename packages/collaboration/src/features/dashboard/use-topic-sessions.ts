import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useInsight } from "@semoss/sdk/react";
import { ROOM_TREE_CHANGED } from "@/features/room-tree/room-tree-events";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import { listTopicRooms } from "@/features/rooms/api/room-topics";
import type { InsightActions } from "@/lib/pixel";

interface Snapshot {
	rooms: RoomRow[];
	total?: number;
	isLoading: boolean;
	error: string;
	hasMore: boolean;
}
interface Entry {
	scope: string;
	topicId: string;
	dirty: boolean;
	queued: boolean;
	value: Snapshot;
	offset: number;
	pending: Promise<void> | null;
	listeners: Set<() => void>;
}
const caches = new WeakMap<InsightActions, Map<string, Entry>>();

/** Cache server pages for this account and topic, without scanning unrelated room history. */
export function useTopicSessions(topicId: string) {
	const { actions, insightId } = useInsight();
	let cache = caches.get(actions);
	if (!cache) {
		cache = new Map();
		caches.set(actions, cache);
	}
	const key = JSON.stringify([insightId, topicId]);
	let entry = cache.get(key);
	if (!entry) {
		entry = {
			scope: insightId,
			topicId,
			dirty: false,
			queued: false,
			value: { rooms: [], isLoading: false, error: "", hasMore: false },
			offset: 0,
			pending: null,
			listeners: new Set(),
		};
		cache.set(key, entry);
	}
	const current = entry;
	const subscribe = useCallback(
		(listener: () => void) => {
			current.listeners.add(listener);
			return () => {
				current.listeners.delete(listener);
			};
		},
		[current],
	);
	const snapshot = useSyncExternalStore(
		subscribe,
		() => current.value,
		() => current.value,
	);
	const read = useCallback(
		(reset = false) => {
			if (current.pending) {
				if (reset) current.queued = true;
				return current.pending;
			}
			current.dirty = false;
			const publish = (value: Snapshot) => {
				current.value = value;
				for (const listener of current.listeners) listener();
			};
			publish({ ...current.value, isLoading: true, error: "" });
			current.pending = listTopicRooms(
				actions,
				topicId,
				reset ? 0 : current.offset,
			)
				.then((page) => {
					if (
						!reset &&
						current.value.total !== undefined &&
						current.value.total !== page.total
					)
						throw new Error(
							"Topic rooms changed. Refresh to load the current list.",
						);
					if (
						!reset &&
						page.rooms.some((room) =>
							current.value.rooms.some(
								(old) => old.roomId === room.roomId,
							),
						)
					)
						throw new Error(
							"Topic rooms returned overlapping pages. Refresh to try again.",
						);
					const rooms = reset
						? page.rooms
						: [...current.value.rooms, ...page.rooms];
					current.offset = page.nextOffset;
					publish({
						rooms,
						total: page.total,
						isLoading: false,
						hasMore: page.hasMore,
						error: "",
					});
				})
				.catch((cause: unknown) =>
					publish({
						...current.value,
						isLoading: false,
						error:
							cause instanceof Error
								? cause.message
								: "Could not load topic rooms.",
					}),
				)
				.finally(() => {
					current.pending = null;
					if (current.queued) {
						current.queued = false;
						void read(true);
					}
				});
			return current.pending;
		},
		[actions, topicId, current],
	);
	useEffect(() => {
		if (current.dirty) void read(true);
		else if (snapshot.total === undefined && !snapshot.error) void read();
	}, [current, read, snapshot]);
	return {
		...snapshot,
		checkedCount: snapshot.rooms.length,
		errorCount: snapshot.error ? 1 : 0,
		retry: () => {
			void read(true);
		},
		loadMore: () => {
			if (snapshot.hasMore) void read();
		},
	};
}

/** The shell keeps already-used topic room pages current even while their tab is closed. */
export function useTopicSessionEvents() {
	const { actions, insightId } = useInsight();
	useEffect(() => {
		const changed = (event: Event) => {
			if (!(event instanceof CustomEvent)) return;
			const patch = event.detail;
			if (
				!patch ||
				(patch.actions && patch.actions !== actions) ||
				(patch.scope !== undefined && patch.scope !== insightId)
			)
				return;
			for (const entry of caches.get(actions)?.values() ?? []) {
				if (entry.scope !== insightId) continue;
				const hasRoom = entry.value.rooms.some(
					(room) => room.roomId === patch.roomId,
				);
				if (event.type === ROOM_TREE_CHANGED) {
					if (
						entry.topicId !== patch.topicId &&
						!patch.topicIds?.includes(entry.topicId) &&
						!hasRoom
					)
						continue;
					entry.dirty = true;
				} else {
					if (!hasRoom) continue;
					entry.value = {
						...entry.value,
						rooms: patch.deleted
							? entry.value.rooms.filter(
									(room) => room.roomId !== patch.roomId,
								)
							: entry.value.rooms.map((room) =>
									room.roomId === patch.roomId
										? {
												...room,
												...(typeof patch.roomName ===
												"string"
													? {
															roomName:
																patch.roomName,
														}
													: {}),
												...(typeof patch.dateUpdated ===
												"string"
													? {
															dateUpdated:
																patch.dateUpdated,
														}
													: {}),
											}
										: room,
								),
						total:
							patch.deleted && entry.value.total !== undefined
								? Math.max(0, entry.value.total - 1)
								: entry.value.total,
					};
					if (patch.deleted)
						entry.offset = Math.max(0, entry.offset - 1);
					if (entry.pending) entry.dirty = true;
				}
				entry.value = { ...entry.value };
				for (const listener of entry.listeners) listener();
			}
		};
		window.addEventListener(ROOM_HISTORY_CHANGED, changed);
		window.addEventListener(ROOM_TREE_CHANGED, changed);
		return () => {
			window.removeEventListener(ROOM_HISTORY_CHANGED, changed);
			window.removeEventListener(ROOM_TREE_CHANGED, changed);
		};
	}, [actions, insightId]);
}
