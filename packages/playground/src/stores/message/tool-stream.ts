import type { PixelMessageToolCallPart } from "@/types";
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
 * On the opening chunk (the one that carries `id`) we push a placeholder
 * TOOL_CALL part into the message and register a ToolStore so the pill can
 * render immediately. Subsequent chunks accumulate the wire name and JSON
 * arguments buffer on that ToolStore. The final `sync()` after the stream
 * completes replaces the placeholder with the fully-resolved part — same
 * `toolCall.id`, so the existing ToolStore is reused.
 *
 * Callers maintain `indexToToolId` across chunks (per-stream closure) and must
 * already be inside a mobx action.
 */
export const applyToolStreamChunk = (
	message: ResponseMessageStore,
	indexToToolId: Record<number, string>,
	data: ToolStreamChunkData,
) => {
	// The terminal chunk has no index — flip the streaming flag off for every
	// tool we've been tracking in this turn.
	if (data.finish_reason) {
		for (const toolId of Object.values(indexToToolId)) {
			const tool = message.room.getTool(toolId);
			if (tool) {
				tool.endStreaming();
			}
		}
		return;
	}

	if (data.index === undefined) {
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
				title: "",
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
		message.parts.push(placeholderPart);

		// ToolStore.syncMessage will store the placeholder as toolCall.part, but
		// the `json` getter sees the empty title and falls back to `streamingName`
		// until the real part arrives.
		message.room.syncTool(data.id, message, placeholderPart);
		const tool = message.room.getTool(data.id);
		if (tool) {
			tool.beginStreaming();
		}
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
