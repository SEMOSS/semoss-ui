import { createStore, type StoreApi } from "zustand/vanilla";
import {
	ChatRoomsSession,
	type ChatRoomsSessionState,
} from "../../chat-rooms-session";
import type { InsightActions } from "../../transport/pixel-calls";

export interface ChatRoomsStoreState extends ChatRoomsSessionState {
	setSearch: (value: string) => void;
	loadMore: () => void;
	renameRoom: (roomId: string, name: string) => Promise<void>;
	pinRoom: (roomId: string, pinned: boolean) => Promise<void>;
	deleteRoom: (roomId: string) => Promise<void>;
	setActiveRoom: (roomId: string) => void;
	newChat: () => void;
	refetch: () => Promise<void>;
}

export interface ChatRoomsStoreHandle {
	store: StoreApi<ChatRoomsStoreState>;
	session: ChatRoomsSession;
	start: () => Promise<void>;
	dispose: () => void;
}

export interface ChatRoomsStoreOptions {
	autoload?: boolean;
}

/**
 * Creates a Zustand store for the paginated room list. The
 * `ChatRoomsSession` class owns state internally via its own vanilla
 * Zustand store — this factory merges the session's reactive state
 * with bound action methods into a single `ChatRoomsStoreState` shape.
 *
 * `setSearch` on the store writes the raw value — debouncing is the
 * provider's responsibility (matching the original useChatRooms hook).
 * The `session` is also returned so the provider can call
 * `session.setSearch(debounced)` directly.
 */
export function createChatRoomsStore(
	actions: InsightActions,
	pageSize?: number,
	options?: ChatRoomsStoreOptions,
): ChatRoomsStoreHandle {
	const session = new ChatRoomsSession(
		actions,
		pageSize,
		options?.autoload ?? true,
	);

	const store = createStore<ChatRoomsStoreState>(() => ({
		...session.store.getState(),
		setSearch: (value: string) => {
			store.setState({ search: value });
		},
		loadMore: session.loadMore,
		renameRoom: session.renameRoom,
		pinRoom: session.pinRoom,
		deleteRoom: session.deleteRoom,
		setActiveRoom: session.setActiveRoom,
		newChat: session.newChat,
		refetch: session.refetch,
	}));

	let unsubscribe: (() => void) | null = null;
	const start = async () => {
		if (!unsubscribe) {
			unsubscribe = session.store.subscribe((sessionState) => {
				store.setState(sessionState);
			});
			store.setState(session.store.getState());
		}
		await session.start();
	};
	const dispose = () => {
		unsubscribe?.();
		unsubscribe = null;
	};

	if (options?.autoload ?? true) {
		void start();
	}

	return {
		store,
		session,
		start,
		dispose,
	};
}
