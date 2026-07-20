import { createStore, type StoreApi } from "zustand/vanilla";
import {
	ChatRoomsSession,
	type ChatRoomsSessionState,
} from "./chat-rooms-session";
import type { InsightActions } from "./transport/pixel-calls";

export interface ChatRoomsStoreState extends ChatRoomsSessionState {
	setSearch: (value: string) => void;
	loadMore: () => void;
	renameRoom: (roomId: string, name: string) => Promise<void>;
	pinRoom: (roomId: string, pinned: boolean) => Promise<void>;
	deleteRoom: (roomId: string) => Promise<void>;
	setActiveRoom: (roomId: string) => void;
	newChat: () => void;
}

export interface ChatRoomsStoreHandle {
	store: StoreApi<ChatRoomsStoreState>;
	session: ChatRoomsSession;
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
	}));

	const unsubscribe = session.store.subscribe((sessionState) => {
		store.setState(sessionState);
	});

	return {
		store,
		session,
		dispose: unsubscribe,
	};
}
