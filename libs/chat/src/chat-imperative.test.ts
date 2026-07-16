import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore, type StoreApi } from "zustand/vanilla";
import {
	registerChatStore,
	sendToActiveChat,
	sendToActiveRoom,
	setActiveChatRoom,
	setActiveChatStore,
} from "./chat-imperative";
import type { ChatStoreState } from "./chat-store";

interface FakeChatStore {
	store: StoreApi<ChatStoreState>;
	sendMessage: ReturnType<typeof vi.fn>;
}

const registrations: Array<{ dispose: () => void }> = [];

function createFakeStore(initialRoomId: string | null): FakeChatStore {
	const sendMessage = vi.fn(async () => undefined);

	const store = createStore<ChatStoreState>(() => ({
		messages: [],
		isTyping: false,
		error: null,
		roomId: initialRoomId,
		engineId: "engine",
		isLoadingHistory: false,
		mcp: [],
		setEngineId: vi.fn(),
		sendMessage,
		recordFeedback: vi.fn(async () => undefined),
		downloadMessage: vi.fn(async () => undefined),
		setMcp: vi.fn(async () => undefined),
	}));

	return { store, sendMessage };
}

afterEach(() => {
	while (registrations.length > 0) {
		registrations.pop()?.dispose();
	}
	setActiveChatStore(null);
	vi.clearAllMocks();
});

describe("chat-imperative", () => {
	it("sendToActiveChat targets the active registered store", async () => {
		const first = createFakeStore("room-1");
		const second = createFakeStore("room-2");

		const firstReg = registerChatStore(first.store);
		const secondReg = registerChatStore(second.store);
		registrations.push(firstReg, secondReg);

		setActiveChatStore(second.store);
		await sendToActiveChat("hello");

		expect(second.sendMessage).toHaveBeenCalledWith("hello");
		expect(first.sendMessage).not.toHaveBeenCalled();
	});

	it("sendToActiveRoom routes by room id", async () => {
		const first = createFakeStore("room-1");
		const second = createFakeStore("room-2");

		const firstReg = registerChatStore(first.store);
		const secondReg = registerChatStore(second.store);
		registrations.push(firstReg, secondReg);

		await sendToActiveRoom("room-1", "first");
		await sendToActiveRoom("room-2", "second");

		expect(first.sendMessage).toHaveBeenCalledWith("first");
		expect(second.sendMessage).toHaveBeenCalledWith("second");
	});

	it("setActiveChatRoom switches the active store", async () => {
		const first = createFakeStore("room-1");
		const second = createFakeStore("room-2");

		const firstReg = registerChatStore(first.store);
		const secondReg = registerChatStore(second.store);
		registrations.push(firstReg, secondReg);

		setActiveChatRoom("room-1");
		await sendToActiveChat("one");
		setActiveChatRoom("room-2");
		await sendToActiveChat("two");

		expect(first.sendMessage).toHaveBeenCalledWith("one");
		expect(second.sendMessage).toHaveBeenCalledWith("two");
	});

	it("tracks room id updates for stores that start without a room", async () => {
		const pending = createFakeStore(null);
		const registration = registerChatStore(pending.store);
		registrations.push(registration);

		pending.store.setState({ roomId: "room-new" });
		await sendToActiveRoom("room-new", "hello");

		expect(pending.sendMessage).toHaveBeenCalledWith("hello");
	});
});
