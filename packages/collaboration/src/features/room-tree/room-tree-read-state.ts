import { z } from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";
import type { RoomTreeRoom } from "./room-tree.types";

interface RoomReadEntry {
	latestActivityAt: string;
	readActivityAt?: string;
}

/** Browser read markers belong to the account and deployment supplied by the owner. */
export interface RoomReadState {
	/** Observe complete history before the visible room list is paginated. */
	observeRooms(rooms: readonly RoomTreeRoom[]): boolean;
	/** Record live activity, including activity arriving before the first snapshot. */
	observeActivity(roomId: string, activityAt: string): boolean;
	/** Consume only the latest activity already known to this instance. */
	markRead(roomId: string): boolean;
	isUnread(roomId: string): boolean;
	/** Merge another tab's saved markers without writing them back. */
	sync(): boolean;
}

const timestampSchema = z.iso.datetime({ offset: true });
const entrySchema = z.object({
	latestActivityAt: timestampSchema,
	readActivityAt: timestampSchema.optional(),
});

/** Validate before normalizing so invalid dates cannot become read markers. */
function normalizeTimestamp(value: unknown): string | undefined {
	const result = timestampSchema.safeParse(value);
	return result.success ? new Date(result.data).toISOString() : undefined;
}

/** Keep versioned IDs and timestamps only; optional persistence can fail safely. */
export function createRoomReadState(storageKey: string): RoomReadState {
	const entries = new Map<string, RoomReadEntry>();
	let isInitialized = false;

	/** Merge each timestamp independently so stale tabs cannot undo a read. */
	function merge(roomId: string, entry: RoomReadEntry): boolean {
		const previous = entries.get(roomId);
		const latestActivityAt =
			previous && previous.latestActivityAt > entry.latestActivityAt
				? previous.latestActivityAt
				: entry.latestActivityAt;
		const readActivityAt =
			previous?.readActivityAt &&
			(!entry.readActivityAt ||
				previous.readActivityAt > entry.readActivityAt)
				? previous.readActivityAt
				: entry.readActivityAt;
		if (
			previous?.latestActivityAt === latestActivityAt &&
			previous?.readActivityAt === readActivityAt
		)
			return false;
		entries.set(roomId, { latestActivityAt, readActivityAt });
		return true;
	}

	/** Storage events can call this without triggering a write echo in other tabs. */
	function sync(): boolean {
		let isChanged = false;
		try {
			const saved = window.localStorage.getItem(storageKey);
			if (!saved) return false;
			const parsed: unknown = JSON.parse(saved);
			if (
				!isRecord(parsed) ||
				parsed.version !== 1 ||
				typeof parsed.initialized !== "boolean" ||
				!isRecord(parsed.rooms)
			)
				return false;
			if (parsed.initialized && !isInitialized) {
				isInitialized = true;
				isChanged = true;
			}
			for (const [roomId, value] of Object.entries(parsed.rooms)) {
				if (!roomId.trim()) continue;
				const entry = entrySchema.safeParse(value);
				if (!entry.success) continue;
				isChanged =
					merge(roomId, {
						latestActivityAt: new Date(
							entry.data.latestActivityAt,
						).toISOString(),
						readActivityAt: normalizeTimestamp(
							entry.data.readActivityAt,
						),
					}) || isChanged;
			}
		} catch {
			// Read state remains available in memory when browser storage is blocked.
		}
		return isChanged;
	}

	/** Merge immediately before writing to retain markers saved by other tabs. */
	function persist(isChanged: boolean): boolean {
		const isSynced = sync();
		if (isChanged) {
			try {
				window.localStorage.setItem(
					storageKey,
					JSON.stringify({
						version: 1,
						initialized: isInitialized,
						rooms: Object.fromEntries(entries),
					}),
				);
			} catch {
				// Optional persistence must not prevent the current view from updating.
			}
		}
		return isChanged || isSynced;
	}

	sync();
	return {
		observeRooms(rooms) {
			const isSynced = sync();
			const isBaseline = !isInitialized;
			const knownRooms = isBaseline ? new Set(entries.keys()) : undefined;
			let isChanged = isBaseline;
			for (const room of rooms) {
				if (!room.roomId.trim()) continue;
				const latestActivityAt =
					normalizeTimestamp(room.activityAt) ??
					normalizeTimestamp(room.dateUpdated) ??
					normalizeTimestamp(room.dateCreated);
				if (!latestActivityAt) continue;
				isChanged =
					merge(room.roomId, {
						latestActivityAt,
						readActivityAt:
							isBaseline && !knownRooms?.has(room.roomId)
								? latestActivityAt
								: undefined,
					}) || isChanged;
			}
			isInitialized = true;
			return persist(isChanged) || isSynced;
		},
		observeActivity(roomId, activityAt) {
			const latestActivityAt = normalizeTimestamp(activityAt);
			if (!roomId.trim() || !latestActivityAt) return false;
			return persist(merge(roomId, { latestActivityAt }));
		},
		markRead(roomId) {
			const latestActivityAt = entries.get(roomId)?.latestActivityAt;
			return persist(
				latestActivityAt
					? merge(roomId, {
							latestActivityAt,
							readActivityAt: latestActivityAt,
						})
					: false,
			);
		},
		isUnread(roomId) {
			const entry = entries.get(roomId);
			return Boolean(
				entry &&
					(!entry.readActivityAt ||
						entry.latestActivityAt > entry.readActivityAt),
			);
		},
		sync,
	};
}
