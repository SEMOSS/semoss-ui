import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
} from "react";
import { type StoreApi, useStore } from "zustand";
import { useInsight } from "@semoss/sdk/react";
import { useDebouncedValue } from "@semoss/ui/next";
import {
	type ChatRoomsStoreHandle,
	type ChatRoomsStoreState,
	createChatRoomsStore,
} from "./chat-rooms-store";

const ChatRoomsStoreContext =
	createContext<StoreApi<ChatRoomsStoreState> | null>(null);

/**
 * Context for the ChatRoomsSession — needed so the provider can call
 * session.setSearch(debounced) without going through the Zustand store.
 */
const ChatRoomsSessionContext = createContext<
	ChatRoomsStoreHandle["session"] | null
>(null);

export interface ChatRoomsProviderProps {
	pageSize?: number;
	children: ReactNode;
}

/**
 * Wraps a subtree with a Zustand-backed chat-rooms store. Handles
 * debouncing the search input internally (via `useDebouncedValue`),
 * matching the original `useChatRooms()` hook's behavior.
 */
export function ChatRoomsProvider({
	pageSize,
	children,
}: ChatRoomsProviderProps) {
	const { actions } = useInsight();

	const handleRef = useRef<ChatRoomsStoreHandle>(
		createChatRoomsStore(actions, pageSize),
	);
	const { store, session } = handleRef.current;

	// Read the raw search value from the store and debounce it before
	// forwarding to the session (which triggers the actual fetch).
	const rawSearch = useStore(store, (s) => s.search);
	const debouncedSearch = useDebouncedValue(rawSearch);
	useEffect(() => {
		session.setSearch(debouncedSearch);
	}, [session, debouncedSearch]);

	useEffect(() => {
		return () => {
			handleRef.current.dispose();
		};
	}, []);

	return (
		<ChatRoomsStoreContext.Provider value={store}>
			<ChatRoomsSessionContext.Provider value={session}>
				{children}
			</ChatRoomsSessionContext.Provider>
		</ChatRoomsStoreContext.Provider>
	);
}

function useChatRoomsStoreFromContext(): StoreApi<ChatRoomsStoreState> {
	const store = useContext(ChatRoomsStoreContext);
	if (!store) {
		throw new Error(
			"useChatRoomsContext must be used within a <ChatRoomsProvider>",
		);
	}
	return store;
}

/**
 * Selector hook — reads from the nearest `ChatRoomsProvider`'s Zustand
 * store. Accepts an optional selector for fine-grained re-renders:
 *
 * ```ts
 * const rooms = useChatRoomsContext((s) => s.rooms);
 * const { pinnedRooms, loadMore } = useChatRoomsContext();
 * ```
 */
export function useChatRoomsContext(): ChatRoomsStoreState;
export function useChatRoomsContext<T>(
	selector: (state: ChatRoomsStoreState) => T,
): T;
export function useChatRoomsContext<T>(
	selector?: (state: ChatRoomsStoreState) => T,
): T | ChatRoomsStoreState {
	const store = useChatRoomsStoreFromContext();
	return useStore(
		store,
		selector ?? ((s: ChatRoomsStoreState) => s as unknown as T),
	);
}

/**
 * Returns the raw Zustand `StoreApi` from the nearest
 * `ChatRoomsProvider` — for imperative access via `getState()` /
 * `subscribe()` outside the React render cycle.
 */
export function useChatRoomsStore(): StoreApi<ChatRoomsStoreState> {
	return useChatRoomsStoreFromContext();
}
