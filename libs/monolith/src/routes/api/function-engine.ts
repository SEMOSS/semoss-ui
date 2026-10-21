/**
 * One function engine — `/api/function-{functionId}`.
 *
 * Backend: `FunctionEngineResource`
 * (Monolith/src/prerna/semoss/web/services/local/FunctionEngineResource.java).
 * Every endpoint runs one pixel through `ResourceUtility.runPixel`
 * (Monolith/src/prerna/semoss/web/services/local/ResourceUtility.java) in a
 * fresh insight and streams it with `PixelStreamUtility.collectPixelData`
 * (Semoss/src/prerna/sablecc2).
 *
 * A pixel that fails (an `ERROR` or `INVALID_SYNTAX` operation type) answers
 * 400; the `ApiError.data` is then the full pixel return. Access is enforced
 * by the reactor the endpoint runs.
 */

import type { RequestOptions } from "@/types";
import { get, post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Executes the function engine with the given inputs (`ExecuteFunctionEngine`).
 * The server reads `map`, falling back to `inputs`.
 *
 * @name execute
 * @endpoint POST /api/function-{functionId}/execute
 * @source Monolith/src/prerna/semoss/web/services/local/FunctionEngineResource.java#execute
 * @param params - Path parameter and JSON body.
 * @param params.functionId - The function engine.
 * @param params.map - The function inputs, by name.
 * @param params.inputs - Alias of `map`, used only when `map` is absent.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the function result.
 * @remarks Unverified response shape of `output`.
 * @throws {ApiError} 401 if the session is invalid; 400 if the pixel fails.
 */
export function execute(
	params: {
		functionId: string;
		map?: Record<string, unknown>;
		inputs?: Record<string, unknown>;
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
	const { functionId, ...body } = params;
	return post(path`/api/function-${functionId}/execute`, body, options, {
		bodyType: "json",
	});
}

/**
 * Returns the function engine's definition: its name, description and
 * parameters (`GetFunctionEngineDefintion`).
 *
 * @name definition
 * @endpoint GET /api/function-{functionId}/definition
 * @source Monolith/src/prerna/semoss/web/services/local/FunctionEngineResource.java#getDefinition
 * @param params - Path parameter.
 * @param params.functionId - The function engine.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the definition.
 * @remarks Unverified response shape of `output`.
 * @throws {ApiError} 401 if the session is invalid; 400 if the pixel fails.
 */
export function definition(
	params: { functionId: string },
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
	return get(
		path`/api/function-${params.functionId}/definition`,
		undefined,
		options,
	);
}
