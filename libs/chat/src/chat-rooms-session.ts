import { createStore, type StoreApi } from "zustand/vanilla";
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
 * Observable state held in the Zustand store — the public shape
 * consumers read via `store.getState()` or `useStore()`.
 */
export interface ChatRoomsSessionState {
	pinnedRooms: RoomSummary[];
	rooms: RoomSummary[];
	search: string;
	isLoading: boolean;
	isLoadingMore: boolean;
	hasMore: boolean;
	error: string | null;
}

/**
 * Headless engine behind the room-list store — a separate concern from
 * ChatSession (one room's messages), matching playground's own ChatStore
 * (room list) vs RoomStore (one room) split. Owns listing/searching
 * (paged + a separate always-visible favorites list, matching real
 * playground's GlobalNav) and renaming/pinning/deleting rooms.
 *
 * All reactive state lives in a vanilla Zustand store (`this.store`).
 * No MobX.
 *
 * Deliberately no createRoom(): "New Chat" stays pure client-side
 * navigation with zero pixel calls until the first real message, exactly
 * like ChatSession.ensureRoom()'s existing lazy pattern and real
 * playground's /new route — see docs/chat-components/PLAN.md.
 */
export class ChatRoomsSession {
	readonly store: StoreApi<ChatRoomsSessionState>;

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
		this.store = createStore<ChatRoomsSessionState>(() => ({
			pinnedRooms: [],
			rooms: [],
			search: "",
			isLoading: false,
			isLoadingMore: false,
			hasMore: true,
			error: null,
		}));

		// Bind public methods so they work when destructured.
		this.setSearch = this.setSearch.bind(this);
		this.loadMore = this.loadMore.bind(this);
		this.renameRoom = this.renameRoom.bind(this);
		this.pinRoom = this.pinRoom.bind(this);
		this.deleteRoom = this.deleteRoom.bind(this);

		void this.loadPinned();
		void this.loadPage(true);
	}

	// -- Convenience getters so tests can read `session.rooms` etc. --

	get pinnedRooms(): RoomSummary[] {
		return this.store.getState().pinnedRooms;
	}
	get rooms(): RoomSummary[] {
		return this.store.getState().rooms;
	}
	get search(): string {
		return this.store.getState().search;
	}
	get isLoading(): boolean {
		return this.store.getState().isLoading;
	}
	get isLoadingMore(): boolean {
		return this.store.getState().isLoadingMore;
	}
	get hasMore(): boolean {
		return this.store.getState().hasMore;
	}
	get error(): string | null {
		return this.store.getState().error;
	}

	private setState(partial: Partial<ChatRoomsSessionState>): void {
		this.store.setState(partial);
	}

	setSearch(value: string): void {
		if (value === this.search) {
			return;
		}
		this.setState({ search: value });
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
		for (const list of [this.pinnedRooms, this.rooms]) {
			const room = list.find((candidate) => candidate.roomId === roomId);
			if (room) {
				room.name = name;
			}
		}
		this.setState({
			pinnedRooms: [...this.pinnedRooms],
			rooms: [...this.rooms],
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
		this.setState({
			pinnedRooms: this.pinnedRooms.filter(
				(room) => room.roomId !== roomId,
			),
			rooms: this.rooms.filter((room) => room.roomId !== roomId),
		});
	}

	private async loadPinned(): Promise<void> {
		try {
			const rooms = await listPinnedPlaygroundRooms(this.actions);
			this.setState({ pinnedRooms: rooms });
		} catch (err) {
			this.setState({
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	private async loadPage(reset: boolean): Promise<void> {
		const generation = this.searchGeneration;
		const offset = reset ? 0 : this.offset;

		if (reset) {
			this.setState({ isLoading: true, error: null });
		} else {
			this.setState({ isLoadingMore: true, error: null });
		}

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
			this.setState({
				rooms: reset ? page : [...this.rooms, ...page],
			});
			this.offset = offset + page.length;
			this.setState({
				hasMore: page.length === this.pageSize,
			});
		} catch (err) {
			if (generation !== this.searchGeneration) {
				return;
			}
			this.setState({
				error: err instanceof Error ? err.message : String(err),
			});
		} finally {
			if (generation === this.searchGeneration) {
				this.setState({
					isLoading: false,
					isLoadingMore: false,
				});
			}
		}
	}
}
