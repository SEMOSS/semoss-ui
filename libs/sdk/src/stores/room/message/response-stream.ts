import type { PixelStreamMessage } from "../../../api/base";
import { readPixelStreamChunk } from "../../../api/pixel-stream";
import type { PixelMessageToolCallPart } from "../room.types";
import type { ResponseMessageStore } from "./response-message.store";

/**
 * Shape of the `stream_type: "tool"` chunk's `data` payload — OpenAI-style
 * function-calling deltas:
 *   - opening chunk:  `{ index, id }`
 *   - type chunk:     `{ index, type: "function" }`
 *   - name chunk:     `{ index, function: { name } }`
 *   - args chunks:    `{ index, function: { arguments: "<JSON delta>" } }`
 *   - closing chunk:  `{ finish_reason }`
 */
export interface ToolStreamChunkData {
	index?: number;
	id?: string;
	type?: string;
	function?: { name?: string; arguments?: string };
	finish_reason?: string;
}

/**
 * Apply one streaming tool chunk to a response message.
 *
 * On the opening chunk (the one that carries `id`) a placeholder TOOL_CALL
 * part is added and a tool call store registered, so the call shows at once.
 * Later chunks accumulate the wire name and the JSON arguments on that store.
 * The final `sync()` after the stream replaces the placeholder with the
 * resolved part — same `toolCall.id`, so the store is reused.
 *
 * @param message - The response the stream is filling.
 * @param indexToToolId - The stream's tool delta indexes and their call ids,
 * kept across one stream's chunks.
 * @param data - One tool chunk.
 */
export const applyToolStreamChunk = (
	message: ResponseMessageStore,
	indexToToolId: Record<number, string>,
	data: ToolStreamChunkData,
): void => {
	// the terminal chunk has no index: every tracked call stops streaming
	if (data.finish_reason) {
		for (const toolId of Object.values(indexToToolId)) {
			message.room.getTool(toolId)?.endStreaming();
		}
		return;
	}

	if (data.index === undefined) {
		return;
	}

	if (data.id) {
		indexToToolId[data.index] = data.id;

		const placeholderPart: PixelMessageToolCallPart = {
			type: "TOOL_CALL",
			toolCall: {
				id: data.id,
				type: data.type || "function",
				name: "",
				arguments: {},
				_tool_found: false,
				original_name: "",
				description: "",
				_meta: {
					SMSS_ENGINE_NAME: "",
					SMSS_ENGINE_ID: "",
					SMSS_ENGINE_TYPE: "",
					SMSS_PROJECT_NAME: "",
					SMSS_PROJECT_ID: "",
					SMSS_MCP_EXECUTION: "ask",
				},
			},
		};
		message.appendPart(placeholderPart);

		// the placeholder flag keeps the store's `json` on the streamed name
		// (and a non-executable `_meta`) until the real part arrives
		message.room.syncTool(data.id, message, placeholderPart, {
			placeholder: true,
		});
		message.room.getTool(data.id)?.beginStreaming();
	}

	const toolId = indexToToolId[data.index];
	const tool = toolId ? message.room.getTool(toolId) : null;
	if (!tool) {
		return;
	}

	if (data.function?.name) {
		tool.setStreamingName(data.function.name);
	}
	if (data.function?.arguments !== undefined) {
		tool.appendStreamingArguments(data.function.arguments);
	}
};

/**
 * Apply one streamed chunk to a response message: text and reasoning become
 * its parts, and tool deltas its streaming tool calls.
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
