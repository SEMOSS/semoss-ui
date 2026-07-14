import { makeAutoObservable, runInAction } from "mobx";
import type { InsightActions } from "./transport/pixel-calls";
import {
	deletePlaygroundRoom,
	listPinnedPlaygroundRooms,
	listPlaygroundRooms,
	pinPlaygroundRoom,
	renamePlaygroundRoom,
} from "./transport/pixel-calls";
import type { RoomSummary } from "./types";

const DEFAULT_PAGE_SIZE = 25;

/**
 * Headless engine behind useChatRooms() — a separate concern from
 * ChatSession (one room's messages), matching playground's own ChatStore
 * (room list) vs RoomStore (one room) split. Owns listing/searching
 * (paged + a separate always-visible favorites list, matching real
 * playground's GlobalNav) and renaming/pinning/deleting rooms.
 *
 * Deliberately no createRoom(): "New Chat" stays pure client-side
 * navigation with zero pixel calls until the first real message, exactly
 * like ChatSession.ensureRoom()'s existing lazy pattern and real
 * playground's /new route — see docs/chat-components/PLAN.md.
 */
export class ChatRoomsSession {
	pinnedRooms: RoomSummary[] = [];
	rooms: RoomSummary[] = [];
	search = "";
	isLoading = false;
	isLoadingMore = false;
	hasMore = true;
	error: string | null = null;
	/** Bumped on any in-place patch (rename) that doesn't change list length, so useChatRooms()'s autorun bridge re-renders for it. */
	revision = 0;

	private offset = 0;
	/**
	 * Bumped every time the search term changes, so a stale in-flight
	 * request (old search) can't overwrite results from a newer one that
	 * resolved first — plain offset/reset booleans alone don't protect
	 * against out-of-order resolution.
	 */
	private searchGeneration = 0;

	constructor(
		private readonly actions: InsightActions,
		private readonly pageSize: number = DEFAULT_PAGE_SIZE,
	) {
		makeAutoObservable(this, {}, { autoBind: true });
		void this.loadPinned();
		void this.loadPage(true);
	}

	setSearch(value: string): void {
		if (value === this.search) {
			return;
		}
		this.search = value;
		this.searchGeneration += 1;
		void this.loadPage(true);
	}

	async loadMore(): Promise<void> {
		if (this.isLoading || this.isLoadingMore || !this.hasMore) {
			return;
		}
		await this.loadPage(false);
	}

	async renameRoom(roomId: string, name: string): Promise<void> {
		await renamePlaygroundRoom(this.actions, { roomId, name });
		runInAction(() => {
			for (const list of [this.pinnedRooms, this.rooms]) {
				const room = list.find(
					(candidate) => candidate.roomId === roomId,
				);
				if (room) {
					room.name = name;
				}
			}
			this.revision += 1;
		});
	}

	async pinRoom(roomId: string, pinned: boolean): Promise<void> {
		await pinPlaygroundRoom(this.actions, { roomId, pinned });
		// Pinning/unpinning changes which list a room belongs to — a local
		// patch can't fix membership, so refetch both.
		await Promise.all([this.loadPinned(), this.loadPage(true)]);
	}

	async deleteRoom(roomId: string): Promise<void> {
		await deletePlaygroundRoom(this.actions, roomId);
		runInAction(() => {
			this.pinnedRooms = this.pinnedRooms.filter(
				(room) => room.roomId !== roomId,
			);
			this.rooms = this.rooms.filter((room) => room.roomId !== roomId);
			this.revision += 1;
		});
	}

	private async loadPinned(): Promise<void> {
		try {
			const rooms = await listPinnedPlaygroundRooms(this.actions);
			runInAction(() => {
				this.pinnedRooms = rooms;
			});
		} catch (err) {
			runInAction(() => {
				this.error = err instanceof Error ? err.message : String(err);
			});
		}
	}

	private async loadPage(reset: boolean): Promise<void> {
		const generation = this.searchGeneration;
		const offset = reset ? 0 : this.offset;

		runInAction(() => {
			if (reset) {
				this.isLoading = true;
			} else {
				this.isLoadingMore = true;
			}
			this.error = null;
		});

		try {
			const page = await listPlaygroundRooms(this.actions, {
				search: this.search || undefined,
				limit: this.pageSize,
				offset,
			});
			if (generation !== this.searchGeneration) {
				// A newer search superseded this request while it was in
				// flight — drop the stale result rather than show it.
				return;
			}
			runInAction(() => {
				this.rooms = reset ? page : [...this.rooms, ...page];
				this.offset = offset + page.length;
				this.hasMore = page.length === this.pageSize;
			});
		} catch (err) {
			if (generation !== this.searchGeneration) {
				return;
			}
			runInAction(() => {
				this.error = err instanceof Error ? err.message : String(err);
			});
		} finally {
			if (generation === this.searchGeneration) {
				runInAction(() => {
					this.isLoading = false;
					this.isLoadingMore = false;
				});
			}
		}
	}
}
