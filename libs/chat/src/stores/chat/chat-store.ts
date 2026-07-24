import { createStore, type StoreApi } from "zustand/vanilla";
import type { ChatOptions } from "../../chat-options";
import { ChatSession, type ChatSessionState } from "../../chat-session";
import type { InsightActions } from "../../transport/pixel-calls";
import type { MCPConfig } from "../../types";

export interface ChatStoreState extends ChatSessionState {
	setEngineId: (engineId: string) => void;
	setWorkspaceId: (workspaceId: string | null) => Promise<void>;
	sendMessage: (text: string, files?: File[]) => Promise<void>;
	recordFeedback: (messageId: string, rating: boolean) => Promise<void>;
	downloadMessage: (
		messageId: string,
		format: "word" | "pdf",
	) => Promise<void>;
	setMcp: (mcp: MCPConfig[]) => Promise<void>;
}

export interface ChatStoreHandle {
	store: StoreApi<ChatStoreState>;
	start: () => Promise<void>;
	dispose: () => void;
}

export interface ChatStoreOptions {
	autoload?: boolean;
}

/**
 * Creates a Zustand store for a single chat room. The `ChatSession`
 * class owns state internally via its own vanilla Zustand store — this
 * factory merges the session's reactive state with bound action methods
 * into a single `ChatStoreState` shape, and keeps the two in sync via
 * `session.store.subscribe()`.
 *
 * React consumers get fine-grained re-renders via Zustand's built-in
 * `useStore()` selector, and non-React code can call
 * `store.getState()` / `store.subscribe()` directly — the key enabler
 * for imperative "send-to-chat from anywhere" (#3432).
 *
 * Call `dispose()` when the store is no longer needed to tear down the
 * internal subscription.
 */
export function createChatStore(
	actions: InsightActions,
	insightId: string,
	options: ChatOptions,
	storeOptions?: ChatStoreOptions,
): ChatStoreHandle {
	const session = new ChatSession(actions, insightId, options, false);

	const actionSlice = {
		setEngineId: session.setEngineId,
		setWorkspaceId: session.setWorkspaceId,
		sendMessage: session.sendMessage,
		recordFeedback: session.recordFeedback,
		downloadMessage: session.downloadMessage,
		setMcp: session.setMcp,
	};

	const store = createStore<ChatStoreState>(() => ({
		...session.store.getState(),
		...actionSlice,
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

	if (storeOptions?.autoload ?? true) {
		void start();
	}

	return {
		store,
		start,
		dispose,
	};
}
