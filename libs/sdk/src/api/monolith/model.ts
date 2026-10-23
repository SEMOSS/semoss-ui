/**
 * One model engine (LLM, embeddings, vision) — `/api/model-{modelId}`.
 *
 * Backend: `ModelEngineResource`
 * (Monolith/src/prerna/semoss/web/services/local/ModelEngineResource.java).
 * The JSON endpoints run one pixel through `ResourceUtility.runPixel`
 * (Monolith/src/prerna/semoss/web/services/local/ResourceUtility.java) in a
 * fresh insight and stream it with `PixelStreamUtility.collectPixelData`
 * (Semoss/src/prerna/sablecc2).
 *
 * A pixel that fails (an `ERROR` or `INVALID_SYNTAX` operation type) answers
 * 400; the `ApiError.data` is then the full pixel return. Access is enforced
 * by the reactor the endpoint runs.
 */

import type { RequestOptions } from "../../lib/api-types";
import { post } from "../../lib/http";
import { path } from "../../lib/url";

/** One billed or ceiling rule from `ModelUsageTicket.ruleUsage`. */
export interface ModelResponseUsageRule {
	metric: "TOKENS" | "COST" | "COMPUTE_TIME";
	/** Tokens, millionths of a US dollar, or compute milliseconds. */
	amount: number;
	window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
	/** Present only for minute/hour windows longer than one unit. */
	windowLength?: number;
	/** Omitted when the rule has no explicit counting mode. */
	counts?: "EACH_PERSON" | "SHARED";
	/** Whether this rule belongs to the billed team's total across models. */
	teamTotal: boolean;
	/** Recorded use, including this call once billed, in the metric's unit. */
	used: number;
	/** ISO-8601 UTC reset time, to the second. */
	resetsAt: string;
}

/**
 * Billing evidence from `ModelUsageTicket.responseUsageLimits`, attached by
 * `ModelUsageRestrictionUtility.attach`. Gson omits null `billedTo`, subject
 * identifiers, limit types, counting modes and window lengths.
 */
export interface ModelResponseUsageLimits {
	/** Absent when only a model-total ceiling applies. */
	billedTo?: {
		sourceType: "USER" | "TEAM" | "PUBLIC" | "ALL_MODELS" | "PLATFORM";
		/** Person login id or team id; omitted for public/platform billing. */
		subjectId?: string;
		/** Login-provider or team type; omitted for public/platform billing. */
		subjectType?: string;
		limitType?: "DIRECT" | "TEAM" | "PUBLIC" | "ALL_MODELS" | "PLATFORM";
	};
	unlimited: boolean;
	/** Rules for the billed source, including its team-total rules. */
	rules: ModelResponseUsageRule[];
	/** `ModelUsageLimitResolver` currently supplies only the model-total ceiling. */
	ceilings: Array<{
		limitType: "MODEL_TOTAL";
		rules: ModelResponseUsageRule[];
	}>;
	/** The answer stopped at an output maximum lowered by its usage ceiling. */
	capped: boolean;
}

/**
 * Sends a prompt to the model and waits for the full answer (`LLM`). Requires
 * view access to the model. A model-side error (an `ERROR` answer) fails the
 * pixel, so it surfaces as a 400.
 *
 * @name llm
 * @endpoint POST /api/model-{modelId}/llm
 * @source Monolith/src/prerna/semoss/web/services/local/ModelEngineResource.java#llm
 * @param params - Path parameter and JSON body.
 * @param params.modelId - The model engine.
 * @param params.command - The prompt.
 * @param params.context - System context for the model.
 * @param params.useHistory - Include the room's earlier messages (default `true`).
 * @param params.paramValues - Model options, for example `{ temperature: 0.2, max_tokens: 500 }` or `max_completion_tokens`.
 * @param params.roomId - The room whose history to use and record to.
 * @param params.image - A media file already uploaded to the insight, or a base64 data URI (the reactor's legacy alias of `media`).
 * @param params.url - A media URL whose contents are sent with the prompt.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the model response
 * (`AskModelEngineResponse.toMap`): `response` is the text for `CHAT`, the tool
 * calls for `TOOL`, and an image or speech map for `IMAGE` / `TTS`.
 * @throws {ApiError} 401 if the session is invalid; 400 if `command` is empty or the pixel fails.
 */
export function llm(
	params: {
		modelId: string;
		command: string;
		context?: string;
		useHistory?: boolean;
		paramValues?: Record<string, unknown>;
		roomId?: string;
		image?: string;
		url?: string;
	},
	options?: RequestOptions,
): Promise<{
	insightID: string;
	pixelReturn: Array<{
		pixelId: string;
		pixelExpression?: string;
		isMeta: boolean;
		timeToRun: number;
		output: {
			numberOfTokensInPrompt?: number;
			numberOfTokensInResponse?: number;
			numberOfCacheReadTokens?: number;
			numberOfCacheCreationTokens?: number;
			numberOfThinkingTokens?: number;
			/** The usage rule closest to its limit, when one applies. */
			usageRestriction?: {
				restrictedBy: "token" | "cost" | "compute";
				currentValue: number;
				maxValue: number;
			};
			/** The usage limits the call was billed under, when any apply. */
			usageLimits?: ModelResponseUsageLimits;
			messageId: string;
			roomId: string;
			schemaVersion?: number;
			io?: "INPUT" | "OUTPUT";
			parts?: Array<{
				type:
					| "TEXT"
					| "MEDIA"
					| "TOOL_CALL"
					| "TOOL_RESULT"
					| "THINKING"
					| "SYSTEM"
					| "UNKNOWN";
				text?: string;
				[key: string]: unknown;
			}>;
			thinking?: string;
			metadata?: Record<string, unknown>;
		} & (
			| { messageType: "CHAT"; response: string }
			| {
					messageType: "TOOL";
					response: Array<{
						id?: string;
						type?: string;
						name?: string;
						arguments?: string | Record<string, unknown>;
						[key: string]: unknown;
					}>;
			  }
			| {
					messageType: "IMAGE" | "TTS";
					response: Record<string, unknown>;
			  }
		);
		operationType: string[];
		additionalOutput?: Array<{
			output: unknown;
			operationType: string[];
			[key: string]: unknown;
		}>;
	}>;
}> {
	const { modelId, ...body } = params;
	return post(path`/api/model-${modelId}/llm`, body, options, {
		bodyType: "json",
	});
}

/**
 * Sends a prompt to the model and streams the answer as Server-Sent Events.
 * `paramValues.stream` is forced to `true`. Each event is `data: <chunk JSON>`
 * (the raw map the model engine pushed, no OpenAI translation), and the stream
 * ends with `data: [DONE]`. The final {@link llm} response map is not sent.
 *
 * @name llmStreaming
 * @endpoint POST /api/model-{modelId}/llmStreaming
 * @source Monolith/src/prerna/semoss/web/services/local/ModelEngineResource.java#llmStreaming
 * @param params - Path parameter and JSON body.
 * @param params.modelId - The model engine.
 * @param params.command - The prompt.
 * @param params.context - System context for the model.
 * @param params.useHistory - Include the room's earlier messages (default `true`).
 * @param params.paramValues - Model options, for example `{ temperature: 0.2, max_tokens: 500 }`; `stream` is always set to `true`.
 * @param params.roomId - The room whose history to use and record to.
 * @param params.image - A media file already uploaded to the insight, or a base64 data URI (the reactor's legacy alias of `media`).
 * @param params.url - A media URL whose contents are sent with the prompt.
 * @param options - Per-call overrides (signal, headers). Pass a `signal` to stop reading.
 * @returns The raw `text/event-stream` body.
 * @throws {ApiError} 401 if the session is invalid; 400 if `command` is empty.
 * @remarks Each chunk is the model engine's map forwarded from the job's stream; provider-specific keys remain dynamic. The backend currently stops only on `PROGRESS_COMPLETE`, so use an abort signal when enforcing a deadline after a failed job.
 */
export function llmStreaming(
	params: {
		modelId: string;
		command: string;
		context?: string;
		useHistory?: boolean;
		paramValues?: Record<string, unknown>;
		roomId?: string;
		image?: string;
		url?: string;
	},
	options?: RequestOptions,
): Promise<ReadableStream<Uint8Array> | null> {
	const { modelId, ...body } = params;
	return post(path`/api/model-${modelId}/llmStreaming`, body, options, {
		bodyType: "json",
		responseType: "stream",
	});
}

/**
 * Embeds one or more inputs with the model (`Embeddings`). Requires view
 * access to the model.
 *
 * @name embeddings
 * @endpoint POST /api/model-{modelId}/embeddings
 * @source Monolith/src/prerna/semoss/web/services/local/ModelEngineResource.java#embeddings
 * @param params - Path parameter and JSON body.
 * @param params.modelId - The model engine.
 * @param params.values - The text(s) to embed.
 * @param params.paramValues - Model options.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the
 * `EmbeddingsModelEngineResponse` map: one vector per input, in input order.
 * @throws {ApiError} 401 if the session is invalid; 400 if `values` is missing or the pixel fails.
 */
export function embeddings(
	params: {
		modelId: string;
		values: string | string[];
		paramValues?: Record<string, unknown>;
	},
	options?: RequestOptions,
): Promise<{
	insightID: string;
	pixelReturn: Array<{
		pixelId: string;
		pixelExpression?: string;
		isMeta: boolean;
		timeToRun: number;
		output: {
			response: number[][];
			numberOfTokensInPrompt?: number;
			numberOfTokensInResponse?: number;
			/** The usage rule closest to its limit, when one applies. */
			usageRestriction?: {
				restrictedBy: "token" | "cost" | "compute";
				currentValue: number;
				maxValue: number;
			};
			/** The usage limits the call was billed under, when any apply. */
			usageLimits?: ModelResponseUsageLimits;
			metadata?: Record<string, unknown>;
		};
		operationType: string[];
		additionalOutput?: Array<{
			output: unknown;
			operationType: string[];
			[key: string]: unknown;
		}>;
	}>;
}> {
	const { modelId, ...body } = params;
	return post(path`/api/model-${modelId}/embeddings`, body, options, {
		bodyType: "json",
	});
}

/**
 * Asks the model about an image (`Vision`). Requires view access to the
 * model. A model-side error (an `ERROR` answer) fails the pixel, so it
 * surfaces as a 400.
 *
 * @name vision
 * @endpoint POST /api/model-{modelId}/vision
 * @source Monolith/src/prerna/semoss/web/services/local/ModelEngineResource.java#vision
 * @param params - Path parameter and JSON body.
 * @param params.modelId - The model engine.
 * @param params.command - The prompt.
 * @param params.image - The image URL or base64 encoding, sent as `paramValues.image_url`.
 * @param params.paramValues - Model options, for example `{ max_tokens: 500 }`.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the model response
 * (`AskModelEngineResponse.toMap`), the same map {@link llm} returns.
 * @throws {ApiError} 401 if the session is invalid; 400 if `command` or `image` is empty or the pixel fails.
 */
export function vision(
	params: {
		modelId: string;
		command: string;
		image: string;
		paramValues?: Record<string, unknown>;
	},
	options?: RequestOptions,
): Promise<{
	insightID: string;
	pixelReturn: Array<{
		pixelId: string;
		pixelExpression?: string;
		isMeta: boolean;
		timeToRun: number;
		output: {
			numberOfTokensInPrompt?: number;
			numberOfTokensInResponse?: number;
			numberOfCacheReadTokens?: number;
			numberOfCacheCreationTokens?: number;
			numberOfThinkingTokens?: number;
			/** The usage rule closest to its limit, when one applies. */
			usageRestriction?: {
				restrictedBy: "token" | "cost" | "compute";
				currentValue: number;
				maxValue: number;
			};
			/** The usage limits the call was billed under, when any apply. */
			usageLimits?: ModelResponseUsageLimits;
			messageId: string;
			roomId: string;
			schemaVersion?: number;
			io?: "INPUT" | "OUTPUT";
			parts?: Array<{
				type:
					| "TEXT"
					| "MEDIA"
					| "TOOL_CALL"
					| "TOOL_RESULT"
					| "THINKING"
					| "SYSTEM"
					| "UNKNOWN";
				text?: string;
				[key: string]: unknown;
			}>;
			thinking?: string;
			metadata?: Record<string, unknown>;
		} & (
			| { messageType: "CHAT"; response: string }
			| {
					messageType: "TOOL";
					response: Array<{
						id?: string;
						type?: string;
						name?: string;
						arguments?: string | Record<string, unknown>;
						[key: string]: unknown;
					}>;
			  }
			| {
					messageType: "IMAGE" | "TTS";
					response: Record<string, unknown>;
			  }
		);
		operationType: string[];
		additionalOutput?: Array<{
			output: unknown;
			operationType: string[];
			[key: string]: unknown;
		}>;
	}>;
}> {
	const { modelId, ...body } = params;
	return post(path`/api/model-${modelId}/vision`, body, options, {
		bodyType: "json",
	});
}
