import type { StoreApi } from "zustand";
import type { ChatStoreState } from "./chat-store";

interface RegisteredChatStore {
	id: string;
	store: StoreApi<ChatStoreState>;
	roomId: string | null;
	unsubscribe: () => void;
}

export interface ChatStoreRegistration {
	id: string;
	dispose: () => void;
}

const storesById = new Map<string, RegisteredChatStore>();
const storeIdByRoomId = new Map<string, string>();
let activeStoreId: string | null = null;
let storeCounter = 0;

function nextStoreId(): string {
	storeCounter += 1;
	return `chat-store-${storeCounter}`;
}

function unregisterStore(id: string): void {
	const registered = storesById.get(id);
	if (!registered) {
		return;
	}

	registered.unsubscribe();
	storesById.delete(id);
	if (registered.roomId) {
		storeIdByRoomId.delete(registered.roomId);
	}

	if (activeStoreId === id) {
		const next = storesById.keys().next();
		activeStoreId = next.done ? null : next.value;
	}
}

function getActiveStoreOrThrow(): StoreApi<ChatStoreState> {
	if (!activeStoreId) {
		throw new Error("No active chat store is registered");
	}
	const registered = storesById.get(activeStoreId);
	if (!registered) {
		activeStoreId = null;
		throw new Error("No active chat store is registered");
	}
	return registered.store;
}

export function registerChatStore(
	store: StoreApi<ChatStoreState>,
): ChatStoreRegistration {
	const id = nextStoreId();
	const initialRoomId = store.getState().roomId;

	const registered: RegisteredChatStore = {
		id,
		store,
		roomId: initialRoomId,
		unsubscribe: () => {
			// Initialized below once subscribe() returns the real callback.
		},
	};

	if (initialRoomId) {
		storeIdByRoomId.set(initialRoomId, id);
	}

	registered.unsubscribe = store.subscribe((state) => {
		const current = storesById.get(id);
		if (!current) {
			return;
		}

		if (current.roomId !== state.roomId) {
			if (current.roomId) {
				storeIdByRoomId.delete(current.roomId);
			}
			if (state.roomId) {
				storeIdByRoomId.set(state.roomId, id);
			}
			current.roomId = state.roomId;
		}
	});

	storesById.set(id, registered);

	if (!activeStoreId) {
		activeStoreId = id;
	}

	return {
		id,
		dispose: () => unregisterStore(id),
	};
}

export function setActiveChatStore(
	storeOrId: StoreApi<ChatStoreState> | string | null,
): void {
	if (storeOrId === null) {
		activeStoreId = null;
		return;
	}

	if (typeof storeOrId === "string") {
		if (!storesById.has(storeOrId)) {
			throw new Error(`Chat store is not registered: ${storeOrId}`);
		}
		activeStoreId = storeOrId;
		return;
	}

	for (const [id, registered] of storesById.entries()) {
		if (registered.store === storeOrId) {
			activeStoreId = id;
			return;
		}
	}

	throw new Error("Chat store is not registered");
}

export function setActiveChatRoom(roomId: string): void {
	const storeId = storeIdByRoomId.get(roomId);
	if (!storeId) {
		throw new Error(`No registered chat store found for room ${roomId}`);
	}
	activeStoreId = storeId;
}

export function getActiveChatRoomId(): string | null {
	if (!activeStoreId) {
		return null;
	}
	const registered = storesById.get(activeStoreId);
	if (!registered) {
		activeStoreId = null;
		return null;
	}
	return registered.store.getState().roomId;
}

export async function sendToActiveChat(text: string): Promise<void> {
	const store = getActiveStoreOrThrow();
	await store.getState().sendMessage(text);
}

export async function sendToActiveRoom(
	roomId: string,
	text: string,
): Promise<void> {
	const storeId = storeIdByRoomId.get(roomId);
	if (!storeId) {
		throw new Error(`No registered chat store found for room ${roomId}`);
	}
	const registered = storesById.get(storeId);
	if (!registered) {
		storeIdByRoomId.delete(roomId);
		throw new Error(`No registered chat store found for room ${roomId}`);
	}
	await registered.store.getState().sendMessage(text);
}
