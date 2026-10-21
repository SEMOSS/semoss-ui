/**
 * One vector database engine — `/api/vector-{vectorId}`.
 *
 * Backend: `VectorEngineResource`
 * (Monolith/src/prerna/semoss/web/services/local/VectorEngineResource.java).
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
import { post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Runs a similarity search against the vector database (`VectorDatabaseQuery`).
 *
 * @name query
 * @endpoint POST /api/vector-{vectorId}/query
 * @source Monolith/src/prerna/semoss/web/services/local/VectorEngineResource.java#query
 * @param params - Path parameter and JSON body.
 * @param params.vectorId - The vector database.
 * @param params.command - The search text.
 * @param params.limit - Maximum number of matches.
 * @param params.paramValues - Engine-specific options (for example filters).
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the list of matches.
 * @remarks Unverified response shape of `output`.
 * @throws {ApiError} 401 if the session is invalid; 400 if `command` is empty or the pixel fails.
 */
export function query(
	params: {
		vectorId: string;
		command: string;
		limit?: number;
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
	const { vectorId, ...body } = params;
	return post(path`/api/vector-${vectorId}/query`, body, options, {
		bodyType: "json",
	});
}

/**
 * Lists the documents indexed in the vector database
 * (`ListDocumentsInVectorDatabase`).
 *
 * @name listDocuments
 * @endpoint POST /api/vector-{vectorId}/listDocuments
 * @source Monolith/src/prerna/semoss/web/services/local/VectorEngineResource.java#listDocuments
 * @param params - Path parameter and JSON body.
 * @param params.vectorId - The vector database.
 * @param params.paramValues - Engine-specific options.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the document list.
 * @remarks Unverified response shape of `output`.
 * @throws {ApiError} 401 if the session is invalid; 400 if the pixel fails.
 */
export function listDocuments(
	params: { vectorId: string; paramValues?: Record<string, unknown> },
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
	const { vectorId, ...body } = params;
	return post(path`/api/vector-${vectorId}/listDocuments`, body, options, {
		bodyType: "json",
	});
}

/**
 * Removes documents from the vector database
 * (`RemoveDocumentFromVectorDatabase`).
 *
 * @name removeDocument
 * @endpoint POST /api/vector-{vectorId}/removeDocument
 * @source Monolith/src/prerna/semoss/web/services/local/VectorEngineResource.java#removeDocument
 * @param params - Path parameter and JSON body.
 * @param params.vectorId - The vector database.
 * @param params.fileNames - The document file name(s) to remove.
 * @param params.paramValues - Engine-specific options.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one `RemoveDocumentFromVectorDatabase` step.
 * @remarks Unverified response shape of `output`.
 * @throws {ApiError} 401 if the session is invalid; 400 if `fileNames` is missing or the pixel fails.
 */
export function removeDocument(
	params: {
		vectorId: string;
		fileNames: string | string[];
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
	const { vectorId, ...body } = params;
	return post(path`/api/vector-${vectorId}/removeDocument`, body, options, {
		bodyType: "json",
	});
}
