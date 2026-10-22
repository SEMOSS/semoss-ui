/**
 * Any engine by id: type, SMSS and catalog image — `/api/e-{engineId}`.
 *
 * Backend: `EngineRouteResource`
 * (Monolith/src/prerna/semoss/web/services/local/EngineRouteResource.java).
 * Image uploads are handled by `CatalogImageUploader`
 * (Monolith/src/prerna/upload/CatalogImageUploader.java).
 *
 * Access failures answer 401; several of them carry an `{ error }` body (not
 * `{ errorMessage }`), so the reason is in `ApiError.data.error`.
 */

import type { RequestOptions } from "../../types";
import { get, post } from "../../utility/http";
import { path } from "../../utility/url";

/**
 * Returns the engine's catalog type. Requires view access, or the engine being
 * discoverable.
 *
 * @name type
 * @endpoint GET /api/e-{engineId}/type
 * @source Monolith/src/prerna/semoss/web/services/local/EngineRouteResource.java#getEngineType
 * @param params - Path parameter.
 * @param params.engineId - The engine id or alias.
 * @param options - Per-call overrides (signal, headers).
 * @returns The id as passed and its `IEngine.CATALOG_TYPE`.
 * @throws {ApiError} 401 if the session is invalid or the engine is neither viewable nor discoverable; 400 if the engine is unknown.
 */
export function type(
	params: { engineId: string },
	options?: RequestOptions,
): Promise<{
	engineId: string;
	engineType:
		| "DATABASE"
		| "STORAGE"
		| "MODEL"
		| "VECTOR"
		| "FUNCTION"
		| "GUARDRAIL"
		| "VENV"
		| "PROJECT";
}> {
	return get(path`/api/e-${params.engineId}/type`, undefined, options);
}

/**
 * Replaces the engine's SMSS. Only the owner (or an admin) may call it. The
 * engine id, name and type must be unchanged; concealed secrets that were not
 * edited are restored. With a secret store configured the values go there;
 * otherwise the file is rewritten, with a rollback if the engine fails to
 * reopen. Then pushes to cloud storage and notifies the user.
 *
 * @name updateSmssFile
 * @endpoint POST /api/e-{engineId}/updateSmssFile
 * @source Monolith/src/prerna/semoss/web/services/local/EngineRouteResource.java#updateSmssFile
 * @param params - Path parameter and form fields.
 * @param params.engineId - The engine.
 * @param params.smss - The full new SMSS file contents.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not the owner; 400 for an invalid id, a changed id/name/type or a failed reopen.
 */
export function updateSmssFile(
	params: { engineId: string; smss: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	const { engineId, ...body } = params;
	return post(path`/api/e-${engineId}/updateSmssFile`, body, options);
}

/**
 * Replaces the engine's catalog image. Requires edit access and a
 * non-anonymous login. Accepts one PNG, JPEG or GIF of up to 10 MiB and 25
 * million pixels.
 *
 * @name imageUpload
 * @endpoint POST /api/e-{engineId}/image/upload
 * @source Monolith/src/prerna/semoss/web/services/local/EngineRouteResource.java#uploadImage
 * @param params - Path parameter and multipart fields.
 * @param params.engineId - The engine.
 * @param params.file - The image, sent as the multipart field `file`.
 * @param options - Per-call overrides (signal, headers).
 * @returns A confirmation with the engine's alias and the URL to download the new image.
 * @throws {ApiError} 401 if the session is invalid or anonymous; 403 without edit access; 400 / 413 / 415 for an invalid, too large or unsupported image.
 */
export function imageUpload(
	params: { engineId: string; file: Blob },
	options?: RequestOptions,
): Promise<{
	message: "Successfully updated image";
	id: string;
	name: string;
	imageUrl: string;
	contentType: "image/png" | "image/jpeg" | "image/gif";
}> {
	const { engineId, ...body } = params;
	return post(path`/api/e-${engineId}/image/upload`, body, options, {
		bodyType: "multipart",
	});
}

/**
 * Downloads the engine's catalog image from CouchDB, cloud storage or the
 * engine folder, falling back to the stock artwork. Requires view access, or
 * the engine being discoverable. Honors `If-None-Match`.
 *
 * @name imageDownload
 * @endpoint GET /api/e-{engineId}/image/download
 * @source Monolith/src/prerna/semoss/web/services/local/EngineRouteResource.java#imageDownload
 * @param params - Path and query parameters.
 * @param params.engineId - The engine.
 * @param params.theme - Which stock artwork to use when there is no uploaded image.
 * @param options - Per-call overrides (signal, headers).
 * @returns The image.
 * @throws {ApiError} 401 if the session is invalid or the engine is neither viewable nor discoverable; 400 if the engine is unknown or no image can be found.
 */
export function imageDownload(
	params: { engineId: string; theme?: "light" | "dark" },
	options?: RequestOptions,
): Promise<Blob> {
	const { engineId, ...query } = params;
	return get(path`/api/e-${engineId}/image/download`, query, options, {
		responseType: "blob",
	});
}
