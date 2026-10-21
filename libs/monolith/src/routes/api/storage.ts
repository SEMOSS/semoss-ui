/**
 * One storage engine — `/api/storage-{storageId}`.
 *
 * Backend: `StorageEngineResource`
 * (Monolith/src/prerna/semoss/web/services/local/StorageEngineResource.java).
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
 * Lists the entries at a path in the storage (`ListStoragePath`).
 *
 * @name list
 * @endpoint POST /api/storage-{storageId}/list
 * @source Monolith/src/prerna/semoss/web/services/local/StorageEngineResource.java#list
 * @param params - Path parameter and JSON body.
 * @param params.storageId - The storage engine.
 * @param params.storagePath - The path to list.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the listing.
 * @remarks Unverified response shape of `output`.
 * @throws {ApiError} 401 if the session is invalid; 400 if `storagePath` is empty or the pixel fails.
 */
export function list(
	params: { storageId: string; storagePath: string },
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
	const { storageId, ...body } = params;
	return post(path`/api/storage-${storageId}/list`, body, options, {
		bodyType: "json",
	});
}

/**
 * Lists the entries at a path in the storage with their details
 * (`ListStoragePathDetails`).
 *
 * @name listDetails
 * @endpoint POST /api/storage-{storageId}/listDetails
 * @source Monolith/src/prerna/semoss/web/services/local/StorageEngineResource.java#listDetails
 * @param params - Path parameter and JSON body.
 * @param params.storageId - The storage engine.
 * @param params.storagePath - The path to list.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the detailed listing.
 * @remarks Unverified response shape of `output`.
 * @throws {ApiError} 401 if the session is invalid; 400 if `storagePath` is empty or the pixel fails.
 */
export function listDetails(
	params: { storageId: string; storagePath: string },
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
	const { storageId, ...body } = params;
	return post(path`/api/storage-${storageId}/listDetails`, body, options, {
		bodyType: "json",
	});
}

/**
 * Deletes a file or folder from the storage (`DeleteFromStorage`).
 *
 * @name deleteFromStorage
 * @endpoint POST /api/storage-{storageId}/delete
 * @source Monolith/src/prerna/semoss/web/services/local/StorageEngineResource.java#delete
 * @param params - Path parameter and JSON body.
 * @param params.storageId - The storage engine.
 * @param params.storagePath - The path to delete.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one `DeleteFromStorage` step.
 * @remarks Unverified response shape of `output`.
 * @throws {ApiError} 401 if the session is invalid; 400 if `storagePath` is empty or the pixel fails.
 */
export function deleteFromStorage(
	params: { storageId: string; storagePath: string },
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
	const { storageId, ...body } = params;
	return post(path`/api/storage-${storageId}/delete`, body, options, {
		bodyType: "json",
	});
}
