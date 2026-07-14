import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatOptions } from "./chat-options";
import { useChat } from "./use-chat";

const {
	useInsight,
	askPlayground,
	createPlaygroundRoom,
	getPlaygroundRoomHistory,
} = vi.hoisted(() => ({
	useInsight: vi.fn(),
	askPlayground: vi.fn(),
	createPlaygroundRoom: vi.fn(),
	getPlaygroundRoomHistory: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({ useInsight }));

vi.mock("./transport/pixel-calls", () => ({
	createPlaygroundRoom,
	updateRoomOptions: vi.fn().mockResolvedValue(undefined),
	askPlayground,
	runMcpTool: vi.fn(),
	addPlaygroundToolExecution: vi.fn(),
	getPlaygroundRoomHistory,
}));

const options: ChatOptions = { engineId: "test-engine" };

beforeEach(() => {
	useInsight.mockReturnValue({
		// biome-ignore lint/suspicious/noExplicitAny: minimal fake of the real InsightActions surface
		actions: {} as any,
		insightId: "insight-1",
	});
	createPlaygroundRoom.mockResolvedValue({ roomId: "room-1" });
	getPlaygroundRoomHistory.mockResolvedValue({ messages: [], mcp: [] });
	askPlayground.mockImplementation(
		async (
			_insightId: string,
			_params: unknown,
			onChunk: (chunk: unknown) => void,
		) => {
			onChunk({ stream_type: "content", data: { content: "hi back" } });
			return {
				messageId: "msg-1",
				parts: [{ type: "TEXT", text: "hi back" }],
			};
		},
	);
});

describe("useChat", () => {
	it("starts empty and re-renders as content streams in after sendMessage", async () => {
		const { result } = renderHook(() => useChat(options));

		expect(result.current.messages).toHaveLength(0);
		expect(result.current.isTyping).toBe(false);

		await act(async () => {
			await result.current.sendMessage("hello");
		});

		await waitFor(() => {
			expect(result.current.messages).toHaveLength(2);
		});
		expect(result.current.messages[0]).toMatchObject({ role: "user" });
		expect(result.current.messages[0]?.parts).toEqual([
			expect.objectContaining({ type: "text", text: "hello" }),
		]);
		expect(result.current.messages[1]).toMatchObject({
			role: "assistant",
			status: "complete",
		});
		expect(result.current.messages[1]?.parts).toEqual([
			expect.objectContaining({ type: "text", text: "hi back" }),
		]);
		expect(result.current.roomId).toBe("room-1");
	});

	it("starts at options.engineId and re-renders after setEngineId", () => {
		const { result } = renderHook(() => useChat(options));

		expect(result.current.engineId).toBe("test-engine");

		act(() => {
			result.current.setEngineId("other-engine");
		});

		expect(result.current.engineId).toBe("other-engine");
	});

	it("reports isLoadingHistory while a resumed room's history loads, then re-renders with the messages", async () => {
		let resolveHistory: (value: unknown) => void = () => {};
		getPlaygroundRoomHistory.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveHistory = resolve;
				}),
		);

		const { result } = renderHook(() =>
			useChat({ ...options, roomId: "room-1" }),
		);

		expect(result.current.isLoadingHistory).toBe(true);
		expect(result.current.messages).toHaveLength(0);

		await act(async () => {
			resolveHistory({
				messages: [
					{
						io: "INPUT",
						messageId: "m1",
						dateCreated: "2026-06-22 12:00:00",
						parts: [{ type: "TEXT", text: "earlier question" }],
					},
				],
				mcp: [],
			});
			await Promise.resolve();
		});

		await waitFor(() => {
			expect(result.current.isLoadingHistory).toBe(false);
		});
		expect(result.current.messages).toHaveLength(1);
		expect(result.current.messages[0]?.parts).toEqual([
			expect.objectContaining({
				type: "text",
				text: "earlier question",
			}),
		]);
	});

	it("never has isLoadingHistory true for a fresh session (no roomId)", () => {
		const { result } = renderHook(() => useChat(options));

		expect(result.current.isLoadingHistory).toBe(false);
	});
});
