import { describe, expect, it, vi } from "vitest";
import type { PixelStreamMessage } from "./base";
import { readPixelStreamChunk } from "./pixel-stream";

/** Handlers that record every call. */
const createHandlers = () => ({
	onText: vi.fn(),
	onThinking: vi.fn(),
	onTool: vi.fn(),
	onUsage: vi.fn(),
});

describe("readPixelStreamChunk", () => {
	it("hands text, reasoning, tool deltas, and usage to their handlers", () => {
		const handlers = createHandlers();
		const tool = { index: 0, id: "call-1", function: { name: "search" } };
		const chunks: PixelStreamMessage[] = [
			{ stream_type: "thinking", data: { thinking: "Weighing it" } },
			{ stream_type: "content", data: { content: "Hello" } },
			{ stream_type: "tool", data: tool },
			{ stream_type: "tool", data: { finish_reason: "tool_calls" } },
			{ stream_type: "usage", data: { input_tokens: 45 } },
		];

		for (const chunk of chunks) readPixelStreamChunk(chunk, handlers);

		expect(handlers.onThinking).toHaveBeenCalledWith("Weighing it");
		expect(handlers.onText).toHaveBeenCalledWith("Hello");
		expect(handlers.onTool.mock.calls).toEqual([
			[tool],
			[{ finish_reason: "tool_calls" }],
		]);
		expect(handlers.onUsage).toHaveBeenCalledWith({ input_tokens: 45 });
	});

	it("skips empty text and reasoning, and the content chunk that only stops", () => {
		const handlers = createHandlers();
		const chunks: PixelStreamMessage[] = [
			{ stream_type: "thinking", data: { thinking: "" } },
			{ stream_type: "content", data: { content: "" } },
			{ stream_type: "content", data: { finish_reason: "stop" } },
		];

		for (const chunk of chunks) readPixelStreamChunk(chunk, handlers);

		expect(handlers.onThinking).not.toHaveBeenCalled();
		expect(handlers.onText).not.toHaveBeenCalled();
	});

	it("ignores a kind it does not know instead of taking it for a tool call", () => {
		const handlers = createHandlers();
		const unknown = {
			stream_type: "citations",
			data: { index: 0 },
		} as unknown as PixelStreamMessage;

		readPixelStreamChunk(unknown, handlers);

		for (const handler of Object.values(handlers)) {
			expect(handler).not.toHaveBeenCalled();
		}
	});

	it("skips a kind that has no handler", () => {
		expect(() =>
			readPixelStreamChunk(
				{ stream_type: "usage", data: { output_tokens: 100 } },
				{},
			),
		).not.toThrow();
	});
});
