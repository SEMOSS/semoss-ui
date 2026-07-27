import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import { registerChatStore, setActiveChatStore } from "../chat-imperative";
import type { ChatStoreState } from "../stores/chat/chat-store";
import type { ChatMessage } from "../types";
import { useRoomMessages } from "./chat-provider";

const registrations: Array<{ dispose: () => void }> = [];

function createFakeStore(roomId: string | null, messages: ChatMessage[] = []) {
	return createStore<ChatStoreState>(() => ({
		messages,
		isTyping: false,
		error: null,
		roomId,
		engineId: "engine-1",
		isLoadingHistory: false,
		mcp: [],
		workspaceId: null,
		setEngineId: vi.fn(),
		setWorkspaceId: vi.fn(async () => undefined),
		sendMessage: vi.fn(async () => undefined),
		recordFeedback: vi.fn(async () => undefined),
		downloadMessage: vi.fn(async () => undefined),
		setMcp: vi.fn(async () => undefined),
	}));
}

afterEach(() => {
	while (registrations.length > 0) {
		registrations.pop()?.dispose();
	}
	setActiveChatStore(null);
	vi.clearAllMocks();
});

describe("useRoomMessages", () => {
	it("returns [] for a room with no registered store", () => {
		const { result } = renderHook(() => useRoomMessages("room-unknown"));
		expect(result.current).toEqual([]);
	});

	it("returns [] when roomId is null", () => {
		const { result } = renderHook(() => useRoomMessages(null));
		expect(result.current).toEqual([]);
	});

	it("reads the already-registered store's current messages immediately", () => {
		const message: ChatMessage = {
			id: "m1",
			role: "user",
			parts: [{ type: "text", text: "hi" }],
			status: "complete",
		} as ChatMessage;
		const store = createFakeStore("room-1", [message]);
		registrations.push(registerChatStore(store));

		const { result } = renderHook(() => useRoomMessages("room-1"));
		expect(result.current).toEqual([message]);
	});

	it("reacts to new messages pushed onto an already-registered store", () => {
		const store = createFakeStore("room-1", []);
		registrations.push(registerChatStore(store));

		const { result } = renderHook(() => useRoomMessages("room-1"));
		expect(result.current).toEqual([]);

		const message: ChatMessage = {
			id: "m1",
			role: "assistant",
			parts: [{ type: "text", text: "hello" }],
			status: "complete",
		} as ChatMessage;
		act(() => {
			store.setState({ messages: [message] });
		});

		expect(result.current).toEqual([message]);
	});

	it("picks up a store that registers after the hook has already mounted", async () => {
		const { result } = renderHook(() => useRoomMessages("room-late"));
		expect(result.current).toEqual([]);

		const message: ChatMessage = {
			id: "m1",
			role: "user",
			parts: [{ type: "text", text: "late" }],
			status: "complete",
		} as ChatMessage;
		const store = createFakeStore("room-late", [message]);

		act(() => {
			registrations.push(registerChatStore(store));
		});

		await waitFor(() => {
			expect(result.current).toEqual([message]);
		});
	});

	it("switches subscriptions when roomId changes", () => {
		const storeA = createFakeStore("room-a", []);
		const storeB = createFakeStore("room-b", []);
		registrations.push(
			registerChatStore(storeA),
			registerChatStore(storeB),
		);

		const { result, rerender } = renderHook(
			({ roomId }: { roomId: string | null }) => useRoomMessages(roomId),
			{ initialProps: { roomId: "room-a" } },
		);
		expect(result.current).toEqual([]);

		const messageB: ChatMessage = {
			id: "b1",
			role: "user",
			parts: [{ type: "text", text: "b" }],
			status: "complete",
		} as ChatMessage;
		act(() => {
			storeB.setState({ messages: [messageB] });
		});
		// Still subscribed to room-a, so storeB's update shouldn't show yet.
		expect(result.current).toEqual([]);

		rerender({ roomId: "room-b" });
		expect(result.current).toEqual([messageB]);

		const messageA: ChatMessage = {
			id: "a1",
			role: "user",
			parts: [{ type: "text", text: "a" }],
			status: "complete",
		} as ChatMessage;
		act(() => {
			storeA.setState({ messages: [messageA] });
		});
		// No longer subscribed to room-a after switching to room-b.
		expect(result.current).toEqual([messageB]);
	});
});
