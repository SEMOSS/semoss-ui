import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
} from "react";
import { type StoreApi, useStore } from "zustand";
import { useInsight } from "@semoss/sdk/react";
import {
	type ChatStoreRegistration,
	registerChatStore,
	setActiveChatStore,
} from "../chat-imperative";
import type { ChatOptions } from "../chat-options";
import {
	type ChatStoreState,
	createChatStore,
} from "../stores/chat/chat-store";

const ChatStoreContext = createContext<StoreApi<ChatStoreState> | null>(null);

export interface ChatProviderProps {
	options: ChatOptions;
	/**
	 * Marks this provider's store as the active chat target for global
	 * imperative helpers like sendToActiveChat(). Defaults to true.
	 */
	isActive?: boolean;
	children: ReactNode;
}

/**
 * Wraps a subtree with a Zustand-backed chat store bound to one
 * `ChatSession`. Nested components read state via `useChatContext()`
 * (React-friendly selector hook) or grab the raw store via
 * `useChatStore()` for imperative access outside the render cycle.
 */
export function ChatProvider({
	options,
	isActive = true,
	children,
}: ChatProviderProps) {
	const { actions, insightId } = useInsight();

	const handleRef = useRef<ReturnType<typeof createChatStore> | null>(null);
	if (!handleRef.current) {
		handleRef.current = createChatStore(actions, insightId, options, {
			autoload: false,
		});
	}
	const handle = handleRef.current;
	const registrationRef = useRef<ChatStoreRegistration | null>(null);

	useEffect(() => {
		void handle.start();
		registrationRef.current = registerChatStore(handle.store);
		return () => {
			registrationRef.current?.dispose();
		};
	}, [handle]);

	useEffect(() => {
		if (isActive) {
			setActiveChatStore(handle.store);
		}
	}, [handle, isActive]);

	useEffect(() => {
		return () => {
			handle.dispose();
		};
	}, [handle]);

	return (
		<ChatStoreContext.Provider value={handle.store}>
			{children}
		</ChatStoreContext.Provider>
	);
}

function useChatStoreFromContext(): StoreApi<ChatStoreState> {
	const store = useContext(ChatStoreContext);
	if (!store) {
		throw new Error("useChatContext must be used within a <ChatProvider>");
	}
	return store;
}

/**
 * Selector hook — reads from the nearest `ChatProvider`'s Zustand store.
 * Accepts an optional selector for fine-grained re-renders:
 *
 * ```ts
 * const messages = useChatContext((s) => s.messages);
 * const { isTyping, sendMessage } = useChatContext();
 * ```
 */
export function useChatContext(): ChatStoreState;
export function useChatContext<T>(selector: (state: ChatStoreState) => T): T;
export function useChatContext<T>(
	selector?: (state: ChatStoreState) => T,
): T | ChatStoreState {
	const store = useChatStoreFromContext();
	// When no selector is provided, return the full state (identity selector).
	return useStore(
		store,
		selector ?? ((s: ChatStoreState) => s as unknown as T),
	);
}

/**
 * Returns the raw Zustand `StoreApi` from the nearest `ChatProvider` —
 * for imperative access via `getState()` / `subscribe()` outside the
 * React render cycle (e.g. send-to-chat from anywhere, #3432).
 */
export function useChatStore(): StoreApi<ChatStoreState> {
	return useChatStoreFromContext();
}
