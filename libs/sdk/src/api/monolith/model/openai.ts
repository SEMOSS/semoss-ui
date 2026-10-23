/**
 * OpenAI-compatible model endpoints — `/api/model/openai`.
 *
 * Backend: `OpenAIEndpoints`
 * (Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java).
 * Response maps are built by the helpers in
 * Semoss/src/prerna/engine/impl/model/openai (`OpenAIChatCompletionsHelper`,
 * `OpenAIResponsesHelper`, `OpenAIImagesHelper`, `OpenAIEmbeddingsHelper`,
 * `OpenAIModelsHelper`).
 *
 * Every request body is JSON. `model` is the SEMOSS model engine id, and the
 * caller must be able to view that engine. When no `insight_id` is sent the
 * call runs in the session's first insight (one is created if none exists),
 * and `room_id` picks or creates the chat room the call is logged to.
 *
 * Errors: 401 `{ errorMessage }` when the session is invalid, 400 for bad input
 * or a failed model call, 403 when the model cannot be viewed, and 429 / 503
 * with an OpenAI `{ error: { message, type, code }, errorMessage }` body when a
 * usage limit refuses the call (surfaced as `ApiError`).
 *
 * Every `/v1/...` route is an alias that runs the same code as the route
 * without the prefix.
 */

import type { RequestOptions } from "../../../lib/api-types";
import { get, post } from "../../../utility/http";
import { path } from "../../../utility/url";

/**
 * Runs a chat completion against a SEMOSS model in the OpenAI Chat Completions
 * format. With `stream: true` the response is a `text/event-stream` of
 * `data: {chat.completion.chunk}` lines; otherwise it is one
 * `chat.completion` object.
 *
 * @name chatCompletions
 * @endpoint POST /api/model/openai/chat/completions
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#runModelChatCompletion
 * @param params - JSON body. Unlisted OpenAI fields (`temperature`, `tools`, `max_tokens`, …) are passed through to the model.
 * @param params.model - The model engine id.
 * @param params.messages - The full chat history in OpenAI message format.
 * @param params.stream - Stream the answer as server-sent events.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to; defaults to the room id carried by the bearer token, else a new room.
 * @param params.append_full_prompt - `"true"` to keep the room history while sending the full prompt. Must be a string: the Java casts it to `String`.
 * @param options - Per-call overrides (signal, headers).
 * @returns A `chat.completion` with one choice (text or tool calls), or the raw SSE stream when `stream` is `true`.
 * @throws {ApiError} 400 for a missing `model` / `messages` or a failed model call, 403 if the model cannot be viewed, 429 / 503 on a usage limit.
 */
export function chatCompletions<S extends boolean = false>(
	params: {
		model: string;
		messages: Array<{
			role: string;
			content?: unknown;
			[key: string]: unknown;
		}>;
		stream?: S;
		insight_id?: string;
		room_id?: string;
		append_full_prompt?: "true" | "false";
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<
	S extends true
		? ReadableStream<Uint8Array>
		: {
				id: string;
				object: "chat.completion";
				created: number;
				model: string;
				usage: {
					prompt_tokens?: number;
					completion_tokens?: number;
					total_tokens?: number;
				};
				choices: Array<{
					index: number;
					finish_reason: "stop" | "tool_calls";
					message: {
						role: "assistant";
						content?: string;
						tool_calls?: Array<{
							id: string;
							type: "function";
							/** `arguments` is a JSON string. */
							function: { name: string; arguments: string };
						}>;
					};
				}>;
			}
> {
	return post(path`/api/model/openai/chat/completions`, params, options, {
		bodyType: "json",
		responseType: params.stream ? "stream" : "json",
	});
}

/**
 * Alias of {@link chatCompletions} under the `/v1` prefix that OpenAI SDKs use.
 *
 * @name chatCompletionsV1
 * @endpoint POST /api/model/openai/v1/chat/completions
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#runV1ModelChatCompletion
 * @param params - JSON body; same fields as {@link chatCompletions}.
 * @param params.model - The model engine id.
 * @param params.messages - The full chat history in OpenAI message format.
 * @param params.stream - Stream the answer as server-sent events.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to.
 * @param params.append_full_prompt - `"true"` to keep the room history while sending the full prompt.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same as {@link chatCompletions}.
 * @throws {ApiError} 400 for bad input or a failed model call, 403 if the model cannot be viewed, 429 / 503 on a usage limit.
 */
export function chatCompletionsV1<S extends boolean = false>(
	params: {
		model: string;
		messages: Array<{
			role: string;
			content?: unknown;
			[key: string]: unknown;
		}>;
		stream?: S;
		insight_id?: string;
		room_id?: string;
		append_full_prompt?: "true" | "false";
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<
	S extends true
		? ReadableStream<Uint8Array>
		: {
				id: string;
				object: "chat.completion";
				created: number;
				model: string;
				usage: {
					prompt_tokens?: number;
					completion_tokens?: number;
					total_tokens?: number;
				};
				choices: Array<{
					index: number;
					finish_reason: "stop" | "tool_calls";
					message: {
						role: "assistant";
						content?: string;
						tool_calls?: Array<{
							id: string;
							type: "function";
							function: { name: string; arguments: string };
						}>;
					};
				}>;
			}
> {
	return post(path`/api/model/openai/v1/chat/completions`, params, options, {
		bodyType: "json",
		responseType: params.stream ? "stream" : "json",
	});
}

/**
 * Runs a model call in the OpenAI Responses API format. `input` may be a plain
 * string or a list of Responses input items (messages, `function_call`,
 * `function_call_output`), which are normalized to chat messages. The room id
 * also falls back to the `thread-id` / `session-id` headers Codex sends (pass
 * them in `options.headers`). With `stream: true` the response is a
 * `text/event-stream` of `response.*` events.
 *
 * @name responses
 * @endpoint POST /api/model/openai/responses
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#runResponses
 * @param params - JSON body. Unlisted Responses fields are passed through to the model.
 * @param params.model - The model engine id.
 * @param params.input - The prompt: a string or a list of Responses input items.
 * @param params.stream - Stream the answer as server-sent events.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to; falls back to the bearer token's room, then the Codex headers.
 * @param options - Per-call overrides (signal, headers).
 * @returns A `response` object whose `output` holds the message, tool calls, generated images and reasoning summary, or the raw SSE stream when `stream` is `true`.
 * @throws {ApiError} 400 for a missing `model`, an unknown insight or a failed model call, 403 if the model cannot be viewed, 429 / 503 on a usage limit.
 */
export function responses<S extends boolean = false>(
	params: {
		model: string;
		input: string | Array<Record<string, unknown>>;
		stream?: S;
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
				object: "response";
				model: string;
				created_at: number;
				status: "completed";
				usage: {
					input_tokens?: number;
					output_tokens?: number;
					total_tokens?: number;
				};
				output: Array<
					| {
							type: "message";
							id: string;
							status: "completed";
							role: "assistant";
							content: Array<{
								type: "output_text";
								text: string;
							}>;
					  }
					| {
							type: "function_call";
							id: string;
							call_id: string;
							name: string;
							/** JSON string. */
							arguments: string;
							status: "completed";
					  }
					| {
							type: "image_generation_call";
							id: string;
							status: "completed";
							/** Base64 image, or its URL. */
							result?: string;
					  }
					| {
							type: "reasoning";
							id: string;
							summary: Array<{
								type: "summary_text";
								text: string;
							}>;
					  }
				>;
			}
> {
	return post(path`/api/model/openai/responses`, params, options, {
		bodyType: "json",
		responseType: params.stream ? "stream" : "json",
	});
}

/**
 * Alias of {@link responses} under the `/v1` prefix.
 *
 * @name responsesV1
 * @endpoint POST /api/model/openai/v1/responses
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#runV1Responses
 * @param params - JSON body; same fields as {@link responses}.
 * @param params.model - The model engine id.
 * @param params.input - The prompt: a string or a list of Responses input items.
 * @param params.stream - Stream the answer as server-sent events.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same as {@link responses}.
 * @throws {ApiError} 400 for bad input or a failed model call, 403 if the model cannot be viewed, 429 / 503 on a usage limit.
 */
export function responsesV1<S extends boolean = false>(
	params: {
		model: string;
		input: string | Array<Record<string, unknown>>;
		stream?: S;
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
				object: "response";
				model: string;
				created_at: number;
				status: "completed";
				usage: {
					input_tokens?: number;
					output_tokens?: number;
					total_tokens?: number;
				};
				output: Array<
					| {
							type: "message";
							id: string;
							status: "completed";
							role: "assistant";
							content: Array<{
								type: "output_text";
								text: string;
							}>;
					  }
					| {
							type: "function_call";
							id: string;
							call_id: string;
							name: string;
							arguments: string;
							status: "completed";
					  }
					| {
							type: "image_generation_call";
							id: string;
							status: "completed";
							result?: string;
					  }
					| {
							type: "reasoning";
							id: string;
							summary: Array<{
								type: "summary_text";
								text: string;
							}>;
					  }
				>;
			}
> {
	return post(path`/api/model/openai/v1/responses`, params, options, {
		bodyType: "json",
		responseType: params.stream ? "stream" : "json",
	});
}

/**
 * Generates images from a text prompt in the OpenAI Images format. With
 * `stream: true` the response is a `text/event-stream` of partial and completed
 * image events.
 *
 * @name generations
 * @endpoint POST /api/model/openai/images/generations
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#runImagesGenerationsAlias
 * @param params - JSON body. Unlisted fields are passed through to the model.
 * @param params.model - The image model engine id.
 * @param params.prompt - What to draw.
 * @param params.stream - Stream partial images as server-sent events.
 * @param params.output_format - Image format, e.g. `"png"`; echoed on stream events.
 * @param params.quality - Image quality; echoed on stream events.
 * @param params.size - Image size, e.g. `"1024x1024"`; echoed on stream events.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ created, data }` with one entry per generated image (base64 or URL), or the raw SSE stream when `stream` is `true`.
 * @throws {ApiError} 400 for a missing `model` / `prompt` or a failed model call, 403 if the model cannot be viewed, 429 / 503 on a usage limit.
 */
export function generations<S extends boolean = false>(
	params: {
		model: string;
		prompt: string;
		stream?: S;
		output_format?: string;
		quality?: string;
		size?: string;
		insight_id?: string;
		room_id?: string;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<
	S extends true
		? ReadableStream<Uint8Array>
		: {
				created: number;
				data: Array<{ b64_json?: string; url?: string }>;
			}
> {
	return post(path`/api/model/openai/images/generations`, params, options, {
		bodyType: "json",
		responseType: params.stream ? "stream" : "json",
	});
}

/**
 * Alias of {@link generations} under the `/v1` prefix.
 *
 * @name generationsV1
 * @endpoint POST /api/model/openai/v1/images/generations
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#runV1ImagesGenerations
 * @param params - JSON body; same fields as {@link generations}.
 * @param params.model - The image model engine id.
 * @param params.prompt - What to draw.
 * @param params.stream - Stream partial images as server-sent events.
 * @param params.output_format - Image format, e.g. `"png"`.
 * @param params.quality - Image quality.
 * @param params.size - Image size, e.g. `"1024x1024"`.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same as {@link generations}.
 * @throws {ApiError} 400 for bad input or a failed model call, 403 if the model cannot be viewed, 429 / 503 on a usage limit.
 */
export function generationsV1<S extends boolean = false>(
	params: {
		model: string;
		prompt: string;
		stream?: S;
		output_format?: string;
		quality?: string;
		size?: string;
		insight_id?: string;
		room_id?: string;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<
	S extends true
		? ReadableStream<Uint8Array>
		: {
				created: number;
				data: Array<{ b64_json?: string; url?: string }>;
			}
> {
	return post(
		path`/api/model/openai/v1/images/generations`,
		params,
		options,
		{
			bodyType: "json",
			responseType: params.stream ? "stream" : "json",
		},
	);
}

/**
 * Runs a legacy OpenAI text completion: the prompt is sent to the model as a
 * single user message. Streaming is simulated — the full answer arrives as one
 * `data:` chunk followed by `data: [DONE]`. There is no `/v1` alias.
 *
 * @name completions
 * @endpoint POST /api/model/openai/completions
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#runModelCompletion
 * @param params - JSON body. Unlisted fields are passed through to the model.
 * @param params.model - The model engine id.
 * @param params.prompt - The prompt text (must be a string).
 * @param params.stream - Return the answer as a single-chunk SSE stream.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param params.room_id - Room to log the call to; defaults to a new room.
 * @param options - Per-call overrides (signal, headers).
 * @returns A `text_completion` with one choice, or the raw SSE stream when `stream` is `true`.
 * @throws {ApiError} 400 for a missing `model` / `prompt` or a failed model call, 403 if the model cannot be viewed, 429 / 503 on a usage limit.
 */
export function completions<S extends boolean = false>(
	params: {
		model: string;
		prompt: string;
		stream?: S;
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
				object: "text_completion";
				created: number;
				model: string;
				choices: Array<{
					index: number;
					text: string;
					logprobs?: null;
					/** Always `"length"` on the non-streaming path. */
					finish_reason: "length";
				}>;
				usage: {
					prompt_tokens?: number;
					completion_tokens?: number;
					total_tokens?: number;
				};
			}
> {
	return post(path`/api/model/openai/completions`, params, options, {
		bodyType: "json",
		responseType: params.stream ? "stream" : "json",
	});
}

/**
 * Computes embeddings for a list of strings with a SEMOSS embedding model, in
 * the OpenAI Embeddings format.
 *
 * @name embeddings
 * @endpoint POST /api/model/openai/embeddings
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#runModelEmbeddings
 * @param params - JSON body. Unlisted fields are passed through to the model.
 * @param params.model - The embedding model engine id.
 * @param params.input - The strings to embed. Must be an array: the Java casts it to `List<String>`.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param options - Per-call overrides (signal, headers).
 * @returns A `list` with one embedding per input, in input order.
 * @throws {ApiError} 400 for a missing `model` / `input` or a failed model call, 403 if the model cannot be viewed, 429 / 503 on a usage limit.
 */
export function embeddings(
	params: {
		model: string;
		input: string[];
		insight_id?: string;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<{
	object: "list";
	model: string;
	data: Array<{ object: "embedding"; index: number; embedding: number[] }>;
	usage: { prompt_tokens?: number; total_tokens?: number };
}> {
	return post(path`/api/model/openai/embeddings`, params, options, {
		bodyType: "json",
	});
}

/**
 * Alias of {@link embeddings} under the `/v1` prefix.
 *
 * @name embeddingsV1
 * @endpoint POST /api/model/openai/v1/embeddings
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#runV1ModelEmbeddings
 * @param params - JSON body; same fields as {@link embeddings}.
 * @param params.model - The embedding model engine id.
 * @param params.input - The strings to embed.
 * @param params.insight_id - Insight to run in; defaults to the session's insight.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same as {@link embeddings}.
 * @throws {ApiError} 400 for bad input or a failed model call, 403 if the model cannot be viewed, 429 / 503 on a usage limit.
 */
export function embeddingsV1(
	params: {
		model: string;
		input: string[];
		insight_id?: string;
		[key: string]: unknown;
	},
	options?: RequestOptions,
): Promise<{
	object: "list";
	model: string;
	data: Array<{ object: "embedding"; index: number; embedding: number[] }>;
	usage: { prompt_tokens?: number; total_tokens?: number };
}> {
	return post(path`/api/model/openai/v1/embeddings`, params, options, {
		bodyType: "json",
	});
}

/**
 * Lists the model engines the caller can view, in the OpenAI model-list format
 * (built from `MyEngines` for the `MODEL` catalog type).
 *
 * @name models
 * @endpoint GET /api/model/openai/models
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#listModels
 * @param params - Takes no parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ object: "list", data }`, one entry per model. `created` is the engine creation time in epoch seconds, when known.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function models(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	object: "list";
	data: Array<{
		object: "model";
		/** The engine id. */
		id: string;
		/** The engine name. */
		alias: string;
		owned_by?: string;
		created?: number;
	}>;
}> {
	return get(path`/api/model/openai/models`, params, options);
}

/**
 * Alias of {@link models} under the `/v1` prefix.
 *
 * @name modelsV1
 * @endpoint GET /api/model/openai/v1/models
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#listV1Models
 * @param params - Takes no parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same as {@link models}.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function modelsV1(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	object: "list";
	data: Array<{
		object: "model";
		id: string;
		alias: string;
		owned_by?: string;
		created?: number;
	}>;
}> {
	return get(path`/api/model/openai/v1/models`, params, options);
}

/**
 * Returns one model engine the caller can view, in the OpenAI model format.
 *
 * @name model
 * @endpoint GET /api/model/openai/models/{modelId}
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#retrieveModel
 * @param params - Path parameters.
 * @param params.modelId - The model engine id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The model object.
 * @throws {ApiError} 400 if the model does not exist or the caller cannot view it, 401 if the session is invalid.
 */
export function model(
	params: { modelId: string },
	options?: RequestOptions,
): Promise<{
	object: "model";
	id: string;
	alias: string;
	owned_by?: string;
	created?: number;
}> {
	const { modelId } = params;
	return get(path`/api/model/openai/models/${modelId}`, undefined, options);
}

/**
 * Alias of {@link model} under the `/v1` prefix.
 *
 * @name modelV1
 * @endpoint GET /api/model/openai/v1/models/{modelId}
 * @source Monolith/src/prerna/semoss/web/services/local/OpenAIEndpoints.java#retrieveV1Model
 * @param params - Path parameters.
 * @param params.modelId - The model engine id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same as {@link model}.
 * @throws {ApiError} 400 if the model does not exist or the caller cannot view it, 401 if the session is invalid.
 */
export function modelV1(
	params: { modelId: string },
	options?: RequestOptions,
): Promise<{
	object: "model";
	id: string;
	alias: string;
	owned_by?: string;
	created?: number;
}> {
	const { modelId } = params;
	return get(
		path`/api/model/openai/v1/models/${modelId}`,
		undefined,
		options,
	);
}
