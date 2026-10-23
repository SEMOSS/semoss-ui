/**
 * Ollama-compatible model endpoints — `/api/model/ollama`.
 *
 * Backend: `OllamaEndpoints`
 * (Monolith/src/prerna/semoss/web/services/local/OllamaEndpoints.java).
 * Response maps are built in `OllamaResponsesHelper`
 * (Monolith/src/prerna/semoss/web/services/local/OllamaResponsesHelper.java).
 *
 * Every request body is JSON. `model` is the SEMOSS model engine id, and the
 * caller must be able to view that engine. Unlike OpenAI, Ollama **streams by
 * default**: the response is `application/x-ndjson` (one JSON object per line)
 * unless `stream: false` is sent. The Ollama-only fields `options`, `think` and
 * `keep_alive` are dropped unless the engine is an Ollama model.
 *
 * Errors: 401 `{ errorMessage }` when the session is invalid, 400 for bad input
 * or a failed model call, 403 when the model cannot be viewed, 404 when the
 * engine cannot be loaded, and 429 / 503 with `{ error, code, errorMessage }`
 * when a usage limit refuses the call (surfaced as `ApiError`).
 *
 * The `/api/...` routes are aliases that run the same code as the routes
 * without the prefix.
 */

import type { RequestOptions } from "../../../lib/api-types";
import { post } from "../../../lib/http";
import { path } from "../../../lib/url";

/**
 * Runs a chat turn in the Ollama `/api/chat` format. Streams NDJSON chunks
 * (`{ model, created_at, message, done: false }`, then a final `done: true`
 * chunk with token counts) unless `stream` is `false`.
 *
 * @name chat
 * @endpoint POST /api/model/ollama/chat
 * @source Monolith/src/prerna/semoss/web/services/local/OllamaEndpoints.java#chat
 * @param params - JSON body. Unlisted fields are passed through to the model.
 * @param params.model - The model engine id.
 * @param params.messages - The chat history; a plain string is treated as one user message.
 * @param params.stream - `false` for one JSON response; streams NDJSON when omitted or `true`.
 * @param params.append_full_prompt - Keep the room history while sending the full prompt.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to; defaults to a new room.
 * @param params.options - Ollama model options (Ollama engines only).
 * @param params.think - Ollama thinking switch (Ollama engines only).
 * @param params.keep_alive - Ollama keep-alive (Ollama engines only).
 * @param options - Per-call overrides (signal, headers).
 * @returns The final chat response when `stream` is `false`, otherwise the raw NDJSON stream.
 * @throws {ApiError} 400 for a missing `model` / `messages` or a failed model call, 403 if the model cannot be viewed, 404 if it cannot be loaded, 429 / 503 on a usage limit.
 */
export function chat<S extends boolean = true>(
	params: {
		model: string;
		messages:
			| string
			| Array<{
					role: string;
					content?: unknown;
					[key: string]: unknown;
			  }>;
		stream?: S;
		append_full_prompt?: boolean;
		insight_id?: string;
		room_id?: string;
		options?: Record<string, unknown>;
		think?: boolean | string;
		keep_alive?: string | number;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<
	S extends false
		? {
				model: string;
				created_at: string;
				done: true;
				done_reason: "stop" | "tool_calls";
				message: {
					role: "assistant";
					content: string;
					tool_calls?: Array<{
						id?: string;
						function: { name: string; arguments: unknown };
					}>;
				};
				prompt_eval_count?: number;
				eval_count?: number;
			}
		: ReadableStream<Uint8Array>
> {
	return post(path`/api/model/ollama/chat`, params, options, {
		bodyType: "json",
		responseType: params.stream === false ? "json" : "stream",
	});
}

/**
 * Alias of {@link chat} at the path the Ollama client uses.
 *
 * @name apiChat
 * @endpoint POST /api/model/ollama/api/chat
 * @source Monolith/src/prerna/semoss/web/services/local/OllamaEndpoints.java#apiChat
 * @param params - JSON body; same fields as {@link chat}.
 * @param params.model - The model engine id.
 * @param params.messages - The chat history; a plain string is treated as one user message.
 * @param params.stream - `false` for one JSON response; streams NDJSON when omitted or `true`.
 * @param params.append_full_prompt - Keep the room history while sending the full prompt.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to.
 * @param params.options - Ollama model options (Ollama engines only).
 * @param params.think - Ollama thinking switch (Ollama engines only).
 * @param params.keep_alive - Ollama keep-alive (Ollama engines only).
 * @param options - Per-call overrides (signal, headers).
 * @returns The same as {@link chat}.
 * @throws {ApiError} 400 for bad input or a failed model call, 403 if the model cannot be viewed, 404 if it cannot be loaded, 429 / 503 on a usage limit.
 */
export function apiChat<S extends boolean = true>(
	params: {
		model: string;
		messages:
			| string
			| Array<{
					role: string;
					content?: unknown;
					[key: string]: unknown;
			  }>;
		stream?: S;
		append_full_prompt?: boolean;
		insight_id?: string;
		room_id?: string;
		options?: Record<string, unknown>;
		think?: boolean | string;
		keep_alive?: string | number;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<
	S extends false
		? {
				model: string;
				created_at: string;
				done: true;
				done_reason: "stop" | "tool_calls";
				message: {
					role: "assistant";
					content: string;
					tool_calls?: Array<{
						id?: string;
						function: { name: string; arguments: unknown };
					}>;
				};
				prompt_eval_count?: number;
				eval_count?: number;
			}
		: ReadableStream<Uint8Array>
> {
	return post(path`/api/model/ollama/api/chat`, params, options, {
		bodyType: "json",
		responseType: params.stream === false ? "json" : "stream",
	});
}

/**
 * Runs a single-prompt completion in the Ollama `/api/generate` format (the
 * prompt is sent to the model as one user message). Streams NDJSON chunks
 * (`{ model, created_at, response, done: false }`, then a final `done: true`
 * chunk) unless `stream` is `false`.
 *
 * @name generate
 * @endpoint POST /api/model/ollama/generate
 * @source Monolith/src/prerna/semoss/web/services/local/OllamaEndpoints.java#generate
 * @param params - JSON body. Unlisted fields are passed through to the model.
 * @param params.model - The model engine id.
 * @param params.prompt - The prompt text.
 * @param params.input - Fallback prompt when `prompt` is blank.
 * @param params.stream - `false` for one JSON response; streams NDJSON when omitted or `true`.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to; defaults to a new room.
 * @param params.options - Ollama model options (Ollama engines only).
 * @param params.think - Ollama thinking switch (Ollama engines only).
 * @param params.keep_alive - Ollama keep-alive (Ollama engines only).
 * @param options - Per-call overrides (signal, headers).
 * @returns The final generate response when `stream` is `false` (tool calls are JSON-encoded into `response`), otherwise the raw NDJSON stream.
 * @throws {ApiError} 400 for a missing `model` / `prompt` or a failed model call, 403 if the model cannot be viewed, 404 if it cannot be loaded, 429 / 503 on a usage limit.
 */
export function generate<S extends boolean = true>(
	params: {
		model: string;
		prompt?: unknown;
		input?: unknown;
		stream?: S;
		insight_id?: string;
		room_id?: string;
		options?: Record<string, unknown>;
		think?: boolean | string;
		keep_alive?: string | number;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<
	S extends false
		? {
				model: string;
				created_at: string;
				done: true;
				done_reason: "stop" | "tool_calls";
				response: string;
				prompt_eval_count?: number;
				eval_count?: number;
			}
		: ReadableStream<Uint8Array>
> {
	return post(path`/api/model/ollama/generate`, params, options, {
		bodyType: "json",
		responseType: params.stream === false ? "json" : "stream",
	});
}

/**
 * Alias of {@link generate} at the path the Ollama client uses.
 *
 * @name apiGenerate
 * @endpoint POST /api/model/ollama/api/generate
 * @source Monolith/src/prerna/semoss/web/services/local/OllamaEndpoints.java#apigenerate
 * @param params - JSON body; same fields as {@link generate}.
 * @param params.model - The model engine id.
 * @param params.prompt - The prompt text.
 * @param params.input - Fallback prompt when `prompt` is blank.
 * @param params.stream - `false` for one JSON response; streams NDJSON when omitted or `true`.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to.
 * @param params.options - Ollama model options (Ollama engines only).
 * @param params.think - Ollama thinking switch (Ollama engines only).
 * @param params.keep_alive - Ollama keep-alive (Ollama engines only).
 * @param options - Per-call overrides (signal, headers).
 * @returns The same as {@link generate}.
 * @throws {ApiError} 400 for bad input or a failed model call, 403 if the model cannot be viewed, 404 if it cannot be loaded, 429 / 503 on a usage limit.
 */
export function apiGenerate<S extends boolean = true>(
	params: {
		model: string;
		prompt?: unknown;
		input?: unknown;
		stream?: S;
		insight_id?: string;
		room_id?: string;
		options?: Record<string, unknown>;
		think?: boolean | string;
		keep_alive?: string | number;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<
	S extends false
		? {
				model: string;
				created_at: string;
				done: true;
				done_reason: "stop" | "tool_calls";
				response: string;
				prompt_eval_count?: number;
				eval_count?: number;
			}
		: ReadableStream<Uint8Array>
> {
	return post(path`/api/model/ollama/api/generate`, params, options, {
		bodyType: "json",
		responseType: params.stream === false ? "json" : "stream",
	});
}

/**
 * Computes embeddings in the Ollama format. A single input returns its vector
 * under `embedding`; several inputs return all vectors under `embeddings`. Not
 * streamed. There is no `/api/embeddings` alias.
 *
 * @name embeddings
 * @endpoint POST /api/model/ollama/embeddings
 * @source Monolith/src/prerna/semoss/web/services/local/OllamaEndpoints.java#embeddings
 * @param params - JSON body. Unlisted fields are passed through to the model.
 * @param params.model - The embedding model engine id.
 * @param params.prompt - The text to embed (legacy Ollama field).
 * @param params.input - The text or texts to embed.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.options - Ollama model options (Ollama engines only).
 * @param params.keep_alive - Ollama keep-alive (Ollama engines only).
 * @param options - Per-call overrides (signal, headers).
 * @returns The vector(s) and token counts when the model reported them.
 * @throws {ApiError} 400 for a missing `model` / input or a failed model call, 403 if the model cannot be viewed, 404 if it cannot be loaded, 429 / 503 on a usage limit.
 */
export function embeddings(
	params: {
		model: string;
		prompt?: string;
		input?: string | string[];
		insight_id?: string;
		options?: Record<string, unknown>;
		keep_alive?: string | number;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<{
	model: string;
	/** Present when one input was sent. */
	embedding?: number[];
	/** Present when several inputs were sent. */
	embeddings?: number[][];
	prompt_eval_count?: number;
	eval_count?: number;
}> {
	return post(path`/api/model/ollama/embeddings`, params, options, {
		bodyType: "json",
	});
}
