import type { PixelMessageToolCallPart } from "../../../types";
import type { ResponseMessageStore } from "../store/response-message.store";
import { EMPTY_ENGINE_META } from "../store/tool.store";

/**
 * Shape of the `stream_type: "tool"` chunk's `data` payload — OpenAI-style
 * function-calling deltas:
 *   - opening chunk:  `{ index, id }`
 *   - type chunk:     `{ index, type: "function" }`
 *   - name chunk:     `{ index, function: { name } }`
 *   - args chunks:    `{ index, function: { arguments: "<JSON delta>" } }`
 *   - closing chunk:  `{ finish_reason }`
 */
interface ToolStreamChunkData {
	/** Which of the turn's tool calls the delta is for; absent on the closing chunk. */
	index?: number;
	/** The call's id, on its opening chunk only. */
	id?: string;
	/** The call's type, normally `function`. */
	type?: string;
	/** The call's name, or the next piece of its JSON arguments. */
	function?: { name?: string; arguments?: string };
	/** Set on the closing chunk, once every call has streamed. */
	finish_reason?: string;
}

/**
 * Apply one streaming tool chunk to a response message.
 *
 * On the opening chunk (the one that carries `id`) we push a placeholder
 * TOOL_CALL part into the message and register a ToolStore so the pill can
 * render immediately. Subsequent chunks accumulate the wire name and JSON
 * arguments buffer on that ToolStore. The final `sync()` after the stream
 * completes replaces the placeholder with the fully-resolved part — same
 * `toolCall.id`, so the existing ToolStore is reused.
 *
 * Callers maintain `indexToToolId` across chunks (per-stream closure).
 *
 * @param message - The response the stream is filling.
 * @param indexToToolId - The stream's delta indexes and their call ids; the
 * opening chunk adds to it.
 * @param data - The chunk's `data` payload.
 */
export const applyToolStreamChunk = (
	message: ResponseMessageStore,
	indexToToolId: Record<number, string>,
	data: ToolStreamChunkData,
): void => {
	// The terminal chunk has no index; the final sync ends each call's streaming.
	if (data.finish_reason || data.index === undefined) {
		return;
	}

	// Opening chunk for this index: register the tool and seed a placeholder
	// part so the UI shows the pill while name/args still stream in.
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
					...EMPTY_ENGINE_META,
					SMSS_MCP_EXECUTION: "ask",
				},
			},
		};
		message.addPart(placeholderPart);

		// ToolStore.syncMessage stores the placeholder as toolCall.part, but the
		// `placeholder` flag keeps the `json` getter falling back to
		// `streamingName` (and to a non-executable `_meta`) until the real part
		// arrives with the tool's actual metadata.
		message.room.syncTool(data.id, message, placeholderPart, {
			placeholder: true,
		});
	}

	const toolId = indexToToolId[data.index];
	if (!toolId) {
		return;
	}
	const tool = message.room.getTool(toolId);
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
