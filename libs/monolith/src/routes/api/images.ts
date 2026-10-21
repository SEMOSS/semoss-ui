/**
 * Engine, project and insight images — `/api/images`.
 *
 * Backend: `ImageUploader`
 * (Monolith/src/prerna/upload/ImageUploader.java), extending `AbstractUploader`
 * (Monolith/src/prerna/upload/AbstractUploader.java).
 *
 * Uploads are `multipart/form-data` with the image in a `file` part and the ids
 * as form fields; the image type comes from the part's content type. Deletes
 * are form-encoded. The caller must be a signed-in, non-anonymous user with
 * edit access to the target. The image is written to the version folder (and
 * to CouchDB or cloud storage when configured).
 *
 * Every failure, including an invalid session or a missing permission, is a
 * 400 (500 when CouchDB or cloud storage fails) with an `{ errorMessage }` body
 * (surfaced as `ApiError`).
 */

import type { RequestOptions } from "@/types";
import { post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Replaces an engine's image (any catalog type: database, model, storage, …).
 *
 * @name uploadEngineImage
 * @endpoint POST /api/images/engine/upload
 * @source Monolith/src/prerna/upload/ImageUploader.java#uploadEngineImage
 * @param params - Multipart form fields.
 * @param params.file - The image.
 * @param params.engineId - The engine.
 * @param options - Per-call overrides (signal, headers).
 * @returns A success message with the engine id and name.
 * @throws {ApiError} 400 for an invalid session, an anonymous user, a missing file or id, or missing edit access; 500 if CouchDB or cloud storage fails.
 */
export function uploadEngineImage(
	params: { file: Blob; engineId: string },
	options?: RequestOptions,
): Promise<{ message: string; engine_id: string; engine_name: string }> {
	return post(path`/api/images/engine/upload`, params, options, {
		bodyType: "multipart",
	});
}

/**
 * Removes an engine's custom image.
 *
 * @name deleteEngineImage
 * @endpoint POST /api/images/engine/delete
 * @source Monolith/src/prerna/upload/ImageUploader.java#deleteEngineImage
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param options - Per-call overrides (signal, headers).
 * @returns A success message with the engine id and name.
 * @throws {ApiError} 400 for a bad id, an invalid session, an anonymous user or missing edit access; 500 if CouchDB fails.
 */
export function deleteEngineImage(
	params: { engineId: string },
	options?: RequestOptions,
): Promise<{ message: string; engine_id: string; engine_name: string }> {
	return post(path`/api/images/engine/delete`, params, options);
}

/**
 * Replaces a project's image. `projectId` may also be a project alias the
 * caller can resolve.
 *
 * @name uploadProjectImage
 * @endpoint POST /api/images/projectImage/upload
 * @source Monolith/src/prerna/upload/ImageUploader.java#uploadProjectImage
 * @param params - Multipart form fields.
 * @param params.file - The image.
 * @param params.projectId - The project id or alias.
 * @param options - Per-call overrides (signal, headers).
 * @returns A success message with the project id and name, under the legacy `app_*` keys.
 * @throws {ApiError} 400 for an invalid session, an anonymous user, a missing file or id, or missing edit access; 500 if CouchDB fails.
 */
export function uploadProjectImage(
	params: { file: Blob; projectId: string },
	options?: RequestOptions,
): Promise<{ message: string; app_id: string; app_name: string }> {
	return post(path`/api/images/projectImage/upload`, params, options, {
		bodyType: "multipart",
	});
}

/**
 * Removes a project's custom image.
 *
 * @name deleteProjectImage
 * @endpoint POST /api/images/projectImage/delete
 * @source Monolith/src/prerna/upload/ImageUploader.java#deleteProjectImage
 * @param params - Form fields.
 * @param params.projectId - The project id or alias.
 * @param options - Per-call overrides (signal, headers).
 * @returns A success message with the project id and name.
 * @throws {ApiError} 400 for a bad id, an invalid session, an anonymous user or missing edit access; 500 if CouchDB fails.
 */
export function deleteProjectImage(
	params: { projectId: string },
	options?: RequestOptions,
): Promise<{ message: string; project_id: string; project_name: string }> {
	return post(path`/api/images/projectImage/delete`, params, options);
}

/**
 * Replaces a saved insight's image.
 *
 * @name uploadInsightImage
 * @endpoint POST /api/images/insightImage/upload
 * @source Monolith/src/prerna/upload/ImageUploader.java#uploadInsightImage
 * @param params - Multipart form fields.
 * @param params.file - The image.
 * @param params.projectId - The insight's project id or alias.
 * @param params.insightId - The saved insight id.
 * @param options - Per-call overrides (signal, headers).
 * @returns A success message with the project and insight ids.
 * @throws {ApiError} 400 for an invalid session, an anonymous user, a missing file or ids, or missing edit access on the insight; 500 if CouchDB fails.
 */
export function uploadInsightImage(
	params: { file: Blob; projectId: string; insightId: string },
	options?: RequestOptions,
): Promise<{
	message: string;
	project_id: string;
	project_name: string;
	insight_id: string;
}> {
	return post(path`/api/images/insightImage/upload`, params, options, {
		bodyType: "multipart",
	});
}

/**
 * Removes a saved insight's custom image.
 *
 * @name deleteInsightImage
 * @endpoint POST /api/images/insightImage/delete
 * @source Monolith/src/prerna/upload/ImageUploader.java#deleteInsightImage
 * @param params - Form fields.
 * @param params.projectId - The insight's project id or alias.
 * @param params.insightId - The saved insight id.
 * @param options - Per-call overrides (signal, headers).
 * @returns A success message with the project and insight ids.
 * @throws {ApiError} 400 for bad ids, an invalid session, an anonymous user, missing edit access, or when the insight has no custom image; 500 if CouchDB fails.
 */
export function deleteInsightImage(
	params: { projectId: string; insightId: string },
	options?: RequestOptions,
): Promise<{
	message: string;
	project_id: string;
	project_name: string;
	insight_id: string;
}> {
	return post(path`/api/images/insightImage/delete`, params, options);
}

/**
 * Legacy copy of {@link uploadEngineImage} that also answers with the old
 * `database_*` keys (and the old success message).
 *
 * @name uploadDatabaseImage
 * @endpoint POST /api/images/databaseImage/upload
 * @source Monolith/src/prerna/upload/ImageUploader.java#uploadDatabaseImage
 * @param params - Multipart form fields; send `engineId` or `databaseId`.
 * @param params.file - The image.
 * @param params.engineId - The engine.
 * @param params.databaseId - Legacy name for `engineId`; whichever field comes last in the form wins.
 * @param options - Per-call overrides (signal, headers).
 * @returns The engine id and name under both the new `engine_*` and old `database_*` keys.
 * @throws {ApiError} 400 for an invalid session, an anonymous user, a missing file or id, or missing edit access; 500 if CouchDB or cloud storage fails.
 * @deprecated The Java method is `@Deprecated` ("Deprecated Methods To Delete"). Use {@link uploadEngineImage} instead.
 */
export function uploadDatabaseImage(
	params: { file: Blob; engineId?: string; databaseId?: string },
	options?: RequestOptions,
): Promise<{
	message: string;
	engine_id: string;
	engine_name: string;
	database_id: string;
	database_name: string;
}> {
	return post(path`/api/images/databaseImage/upload`, params, options, {
		bodyType: "multipart",
	});
}

/**
 * Legacy copy of {@link deleteEngineImage} that also accepts `databaseId` and
 * answers with the old `database_*` keys.
 *
 * @name deleteDatabaseImage
 * @endpoint POST /api/images/databaseImage/delete
 * @source Monolith/src/prerna/upload/ImageUploader.java#deleteDatabaseImage
 * @param params - Form fields; send `engineId` or `databaseId`.
 * @param params.engineId - The engine.
 * @param params.databaseId - Legacy name for `engineId`, read when `engineId` is absent.
 * @param options - Per-call overrides (signal, headers).
 * @returns The engine id and name under both the new `engine_*` and old `database_*` keys.
 * @throws {ApiError} 400 for a bad id, an invalid session, an anonymous user or missing edit access; 500 if CouchDB fails.
 * @deprecated The Java method is `@Deprecated` ("Deprecated Methods To Delete"). Use {@link deleteEngineImage} instead.
 */
export function deleteDatabaseImage(
	params: { engineId?: string; databaseId?: string },
	options?: RequestOptions,
): Promise<{
	message: string;
	engine_id: string;
	engine_name: string;
	database_id: string;
	database_name: string;
}> {
	return post(path`/api/images/databaseImage/delete`, params, options);
}
