import { type PixelStreamMessage, readPixelStreamChunk } from "@semoss/sdk";
import type { ResponseMessageStore } from "./response-message.store";
import { applyToolStreamChunk } from "./tool-stream";

/**
 * Apply one streamed chunk to a response message: text and reasoning become
 * its parts, and tool deltas its streaming tool calls. The SDK decides what
 * kind each chunk is, so this reads streams the way every other chat does.
 *
 * Callers keep `indexToToolId` across one stream's chunks and must already be
 * inside a mobx action.
 *
 * @param message - The response the stream is filling.
 * @param indexToToolId - The stream's tool delta indexes and their call ids.
 * @param chunk - One streamed chunk.
 */
export const applyResponseStreamChunk = (
	message: ResponseMessageStore,
	indexToToolId: Record<number, string>,
	chunk: PixelStreamMessage,
): void => {
	readPixelStreamChunk(chunk, {
		onText: (text) =>
			message.savePart({ type: "TEXT", text, uiText: text }),
		onThinking: (thinking) =>
			message.savePart({ type: "THINKING", thinking }),
		onTool: (data) => applyToolStreamChunk(message, indexToToolId, data),
	});
};
