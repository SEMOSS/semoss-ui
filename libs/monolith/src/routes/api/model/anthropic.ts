/**
 * Anthropic-compatible model endpoint — `/api/model/anthropic`.
 *
 * Backend: `AnthropicEndpoints`
 * (Monolith/src/prerna/semoss/web/services/local/AnthropicEndpoints.java).
 * Requests are translated to the internal OpenAI-style format and responses
 * back in `AnthropicMessagesHelper`
 * (Monolith/src/prerna/semoss/web/services/local/AnthropicMessagesHelper.java).
 * This is what lets Claude Code and other Anthropic SDK clients talk to a
 * SEMOSS model.
 *
 * Errors use the Anthropic body `{ type: "error", error: { type, message } }`
 * (no `errorMessage`, so `ApiError.message` is the generic status text; read
 * `ApiError.data`): 400 for bad input, 403 when the model cannot be viewed, 404
 * when it cannot be loaded, 500 for a failed model call, 502 for an empty
 * model answer, and 429 / 503 when a usage limit refuses the call. An invalid
 * session is a 401 `{ errorMessage }`.
 */

import type { RequestOptions } from "../../../types";
import { post } from "../../../utility/http";
import { path } from "../../../utility/url";

/**
 * Sends a Messages API request to a SEMOSS model. `thinking.budget_tokens` is
 * clamped to 16384, and `context_management`, `output_config`, `metadata` and
 * `safeguards` are dropped. The room is taken from `room_id`, else the bearer
 * token, else the `x-semoss-room-id` header, else the `x-claude-code-session-id`
 * header (pass headers in `options.headers`); an existing room's insight is
 * reused. With `stream: true` the response is a `text/event-stream` of
 * Anthropic events (`message_start`, `content_block_*`, `message_delta`,
 * `message_stop`, `ping`, `error`).
 *
 * @name messages
 * @endpoint POST /api/model/anthropic/v1/messages
 * @source Monolith/src/prerna/semoss/web/services/local/AnthropicEndpoints.java#createMessage
 * @param params - JSON body. Unlisted Anthropic fields (`temperature`, `tool_choice`, …) are passed through to the model.
 * @param params.model - The model engine id.
 * @param params.messages - The conversation in Anthropic message format.
 * @param params.max_tokens - Maximum tokens to generate.
 * @param params.system - System prompt, as a string or text blocks.
 * @param params.stream - Stream the answer as server-sent events.
 * @param params.tools - Anthropic tool definitions; converted to OpenAI tools.
 * @param params.thinking - Extended-thinking settings; `budget_tokens` above 16384 (or negative) is clamped to 16384.
 * @param params.insight_id - Insight to run in; defaults to the room's insight, else a new one.
 * @param params.room_id - Room to log the call to.
 * @param options - Per-call overrides (signal, headers).
 * @returns An Anthropic `message` (thinking, text or tool-use content), or the raw SSE stream when `stream` is `true`.
 * @throws {ApiError} 400 for bad input or an invalid room id, 403 if the model cannot be viewed, 404 if it cannot be loaded, 500 if the model call fails, 502 on an empty answer, 429 / 503 on a usage limit.
 */
export function messages<S extends boolean = false>(
	params: {
		model: string;
		messages: Array<{
			role: string;
			content: unknown;
			[key: string]: unknown;
		}>;
		max_tokens?: number;
		system?:
			| string
			| Array<{ type: string; text?: string; [key: string]: unknown }>;
		stream?: S;
		tools?: Array<Record<string, unknown>>;
		thinking?: {
			type: string;
			budget_tokens?: number;
			[key: string]: unknown;
		};
		insight_id?: string;
		room_id?: string;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<
	S extends true
		? ReadableStream<Uint8Array>
		: {
				id: string;
				type: "message";
				role: "assistant";
				model: string;
				content: Array<
					| { type: "thinking"; thinking: string }
					| { type: "text"; text: string }
					| {
							type: "tool_use";
							id: string;
							name: string;
							input: unknown;
					  }
				>;
				stop_reason: "end_turn" | "tool_use";
				stop_sequence: null;
				usage: { input_tokens?: number; output_tokens?: number };
			}
> {
	return post(path`/api/model/anthropic/v1/messages`, params, options, {
		bodyType: "json",
		responseType: params.stream ? "stream" : "json",
	});
}
