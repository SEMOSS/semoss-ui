import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatOptions } from "../../chat-options";
import type {
	ChatMessage,
	RawPixelMessage,
	ResponseMessage,
	StreamChunk,
} from "../../types";
import { createChatStore } from "./chat-store";

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

const {
	createPlaygroundRoom,
	updateRoomOptions,
	askPlayground,
	runMcpTool,
	addPlaygroundToolExecution,
	getPlaygroundRoomHistory,
	submitFeedback,
	downloadMessageAsFile,
} = vi.hoisted(() => ({
	createPlaygroundRoom: vi.fn(),
	updateRoomOptions: vi.fn(),
	askPlayground: vi.fn(),
	runMcpTool: vi.fn(),
	addPlaygroundToolExecution: vi.fn(),
	getPlaygroundRoomHistory: vi.fn(),
	submitFeedback: vi.fn(),
	downloadMessageAsFile: vi.fn(),
}));

vi.mock("../../transport/pixel-calls", () => ({
	createPlaygroundRoom,
	updateRoomOptions,
	askPlayground,
	runMcpTool,
	addPlaygroundToolExecution,
	getPlaygroundRoomHistory,
	submitFeedback,
	downloadMessageAsFile,
}));

// biome-ignore lint/suspicious/noExplicitAny: test double, real InsightActions is a large SDK type
const actions = {} as any;
const insightId = "insight-1";

const baseOptions: ChatOptions = { engineId: "test-engine" };

function textResponse(text: string, messageId = "msg-1"): ResponseMessage {
	return { messageId, parts: [{ type: "TEXT", text }] };
}

function streamed(chunks: StreamChunk[], response: ResponseMessage) {
	return async (
		_insightId: string,
		_params: unknown,
		onChunk: (chunk: StreamChunk) => void,
	) => {
		for (const chunk of chunks) {
			onChunk(chunk);
		}
		return response;
	};
}

function contentChunk(text: string): StreamChunk {
	return { stream_type: "content", data: { content: text } };
}

function messageText(message: ChatMessage | undefined): string {
	if (!message) {
		return "";
	}
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => (part.type === "text" ? part.text : ""))
		.join("");
}

beforeEach(() => {
	createPlaygroundRoom.mockReset().mockResolvedValue({ roomId: "room-1" });
	updateRoomOptions.mockReset().mockResolvedValue(undefined);
	askPlayground.mockReset();
	runMcpTool.mockReset().mockResolvedValue({ ok: true });
	addPlaygroundToolExecution.mockReset();
	getPlaygroundRoomHistory
		.mockReset()
		.mockResolvedValue({ messages: [], mcp: [] });
	submitFeedback.mockReset().mockResolvedValue(undefined);
	downloadMessageAsFile.mockReset().mockResolvedValue(undefined);
});

describe("createChatStore", () => {
	it("can defer startup for a resumed room", async () => {
		const { start, dispose } = createChatStore(
			actions,
			insightId,
			{ ...baseOptions, roomId: "existing-room" },
			{ autoload: false },
		);

		expect(getPlaygroundRoomHistory).not.toHaveBeenCalled();

		await start();
		await start();

		expect(getPlaygroundRoomHistory).toHaveBeenCalledTimes(1);
		dispose();
	});

	it("returns a store whose initial state reflects the ChatSession defaults", () => {
		const { store, dispose } = createChatStore(
			actions,
			insightId,
			baseOptions,
		);

		const state = store.getState();
		expect(state.messages).toEqual([]);
		expect(state.isTyping).toBe(false);
		expect(state.error).toBeNull();
		expect(state.roomId).toBeNull();
		expect(state.engineId).toBe("test-engine");
		expect(state.isLoadingHistory).toBe(false);
		expect(state.mcp).toEqual([]);

		dispose();
	});

	it("syncs messages to Zustand store after sendMessage", async () => {
		askPlayground.mockImplementation(
			streamed(
				[contentChunk("hello "), contentChunk("world")],
				textResponse("hello world"),
			),
		);
		const { store, dispose } = createChatStore(
			actions,
			insightId,
			baseOptions,
		);

		await store.getState().sendMessage("hi");

		const state = store.getState();
		expect(state.messages).toHaveLength(2);
		expect(state.messages[0]).toMatchObject({ role: "user" });
		expect(messageText(state.messages[0])).toBe("hi");
		expect(state.messages[1]).toMatchObject({
			role: "assistant",
			status: "complete",
		});
		expect(messageText(state.messages[1])).toBe("hello world");
		expect(state.isTyping).toBe(false);

		dispose();
	});

	it("exposes setEngineId that updates the store", async () => {
		const { store, dispose } = createChatStore(
			actions,
			insightId,
			baseOptions,
		);

		store.getState().setEngineId("new-engine");
		await flushMicrotasks();

		expect(store.getState().engineId).toBe("new-engine");

		dispose();
	});

	it("syncs roomId after first message creates a room", async () => {
		askPlayground.mockImplementation(streamed([], textResponse("ok")));
		const { store, dispose } = createChatStore(
			actions,
			insightId,
			baseOptions,
		);

		expect(store.getState().roomId).toBeNull();
		await store.getState().sendMessage("hi");

		expect(store.getState().roomId).toBe("room-1");

		dispose();
	});

	it("subscribe() fires when state changes", async () => {
		askPlayground.mockImplementation(streamed([], textResponse("ok")));
		const { store, dispose } = createChatStore(
			actions,
			insightId,
			baseOptions,
		);

		const states: boolean[] = [];
		const unsub = store.subscribe((state) => {
			states.push(state.isTyping);
		});

		await store.getState().sendMessage("hi");

		// Should have received at least one notification
		expect(states.length).toBeGreaterThan(0);

		unsub();
		dispose();
	});

	it("syncs isLoadingHistory for a resumed room", async () => {
		getPlaygroundRoomHistory.mockResolvedValue({
			messages: [
				{
					messageId: "m1",
					io: "INPUT",
					dateCreated: "2026-06-22 12:00:00",
					parts: [{ type: "TEXT", text: "earlier question" }],
				} satisfies RawPixelMessage,
				{
					messageId: "m2",
					io: "OUTPUT",
					parentMessageId: "m1",
					dateCreated: "2026-06-22 12:00:01",
					parts: [{ type: "TEXT", text: "earlier answer" }],
				} satisfies RawPixelMessage,
			],
			mcp: [],
		});
		const { store, dispose } = createChatStore(actions, insightId, {
			...baseOptions,
			roomId: "existing-room",
		});

		// Initially true while history is loading
		expect(store.getState().isLoadingHistory).toBe(true);
		await flushMicrotasks();

		expect(store.getState().isLoadingHistory).toBe(false);
		expect(store.getState().roomId).toBe("existing-room");
		expect(store.getState().messages.length).toBeGreaterThan(0);

		dispose();
	});

	it("dispose tears down the subscription — no further syncs", async () => {
		askPlayground.mockImplementation(streamed([], textResponse("ok")));
		const { store, start, dispose } = createChatStore(
			actions,
			insightId,
			baseOptions,
		);

		dispose();

		// After dispose, the store state should remain frozen at its
		// last value — the subscription that pushes updates is gone.
		const stateBeforeSend = store.getState();
		// sendMessage still works on the underlying session, but the
		// store won't reflect it.
		await stateBeforeSend.sendMessage("hi").catch(() => {
			// May throw since room creation may have been called, but
			// the point is the store state should not change.
		});
		await flushMicrotasks();

		expect(store.getState().messages).toEqual(stateBeforeSend.messages);

		await start();
		expect(store.getState().messages).toHaveLength(2);
		dispose();
	});
});
