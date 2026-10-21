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

import type { RequestOptions } from "@/types";
import { post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Sends a prompt to the model and waits for the full answer (`LLM`).
 *
 * @name llm
 * @endpoint POST /api/model-{modelId}/llm
 * @source Monolith/src/prerna/semoss/web/services/local/ModelEngineResource.java#llm
 * @param params - Path parameter and JSON body.
 * @param params.modelId - The model engine.
 * @param params.command - The prompt.
 * @param params.context - System context for the model.
 * @param params.useHistory - Include the room's earlier messages.
 * @param params.paramValues - Model options (for example `temperature`, `max_new_tokens`).
 * @param params.roomId - The room whose history to use and record to.
 * @param params.image - An image location or encoding to send with the prompt.
 * @param params.url - A URL to send with the prompt.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the model response.
 * @remarks Unverified response shape of `output`.
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
		output: unknown;
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
 * ends with `data: [DONE]`.
 *
 * @name llmStreaming
 * @endpoint POST /api/model-{modelId}/llmStreaming
 * @source Monolith/src/prerna/semoss/web/services/local/ModelEngineResource.java#llmStreaming
 * @param params - Path parameter and JSON body.
 * @param params.modelId - The model engine.
 * @param params.command - The prompt.
 * @param params.context - System context for the model.
 * @param params.useHistory - Include the room's earlier messages.
 * @param params.paramValues - Model options; `stream` is always set to `true`.
 * @param params.roomId - The room whose history to use and record to.
 * @param params.image - An image location or encoding to send with the prompt.
 * @param params.url - A URL to send with the prompt.
 * @param options - Per-call overrides (signal, headers). Pass a `signal` to stop reading.
 * @returns The raw `text/event-stream` body.
 * @remarks Unverified chunk shape.
 * @throws {ApiError} 401 if the session is invalid; 400 if `command` is empty.
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
 * Embeds one or more inputs with the model (`Embeddings`).
 *
 * @name embeddings
 * @endpoint POST /api/model-{modelId}/embeddings
 * @source Monolith/src/prerna/semoss/web/services/local/ModelEngineResource.java#embeddings
 * @param params - Path parameter and JSON body.
 * @param params.modelId - The model engine.
 * @param params.values - The text(s) to embed.
 * @param params.paramValues - Model options.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` holds the embeddings.
 * @remarks Unverified response shape of `output`.
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
		output: unknown;
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
 * Asks the model about an image (`Vision`).
 *
 * @name vision
 * @endpoint POST /api/model-{modelId}/vision
 * @source Monolith/src/prerna/semoss/web/services/local/ModelEngineResource.java#vision
 * @param params - Path parameter and JSON body.
 * @param params.modelId - The model engine.
 * @param params.command - The prompt.
 * @param params.image - The image location or encoding.
 * @param params.paramValues - Model options.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the model response.
 * @remarks Unverified response shape of `output`.
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
		output: unknown;
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
