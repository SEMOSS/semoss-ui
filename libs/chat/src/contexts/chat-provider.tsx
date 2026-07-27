import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { type StoreApi, useStore } from "zustand";
import { useInsight } from "@semoss/sdk/react";
import {
	type ChatStoreRegistration,
	getChatStoreByRoomId,
	registerChatStore,
	setActiveChatStore,
} from "../chat-imperative";
import type { ChatOptions } from "../chat-options";
import {
	type ChatStoreState,
	createChatStore,
} from "../stores/chat/chat-store";
import type { ChatMessage } from "../types";

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
 * React render cycle
 */
export function useChatStore(): StoreApi<ChatStoreState> {
	return useChatStoreFromContext();
}

/**
 * Reactively reads a room's messages from *outside* that room's own
 * `<ChatProvider>` tree — for a sibling component (e.g. one driving
 * navigation off the latest tool call's `_meta.SMSS_MCP_UI.resourceURI`,
 * or refreshing other UI when a specific tool call resolves) that isn't
 * nested inside the chat UI itself, given only the roomId.
 *
 * Backed by `getChatStoreByRoomId` — the same room registry
 * `sendToActiveRoom` already uses — so this needs no prop-drilling or
 * lifting the chat session above both components. Returns `[]` until a
 * `<ChatProvider>` for that room mounts and registers (registration
 * happens in that provider's own mount effect, so there's a brief window
 * on first render where the store doesn't exist yet); a short poll below
 * closes that window without requiring callers to coordinate mount order.
 */
export function useRoomMessages(roomId: string | null): ChatMessage[] {
	const [messages, setMessages] = useState<ChatMessage[]>(
		() =>
			(roomId && getChatStoreByRoomId(roomId)?.getState().messages) || [],
	);

	useEffect(() => {
		if (!roomId) {
			setMessages([]);
			return;
		}

		let unsubscribe: (() => void) | null = null;

		const attach = (store: StoreApi<ChatStoreState>) => {
			setMessages(store.getState().messages);
			unsubscribe = store.subscribe((state) => {
				setMessages(state.messages);
			});
		};

		const existing = getChatStoreByRoomId(roomId);
		if (existing) {
			attach(existing);
			return () => unsubscribe?.();
		}

		const interval = setInterval(() => {
			const store = getChatStoreByRoomId(roomId);
			if (store) {
				clearInterval(interval);
				attach(store);
			}
		}, 200);

		return () => {
			clearInterval(interval);
			unsubscribe?.();
		};
	}, [roomId]);

	return messages;
}
