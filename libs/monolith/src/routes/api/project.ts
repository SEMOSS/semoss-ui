/**
 * One project's settings, custom reactors, assets and images —
 * `/api/project-{projectId}`.
 *
 * Backend: `ProjectResource`
 * (Monolith/src/prerna/semoss/web/services/local/ProjectResource.java).
 * Image uploads are handled by `CatalogImageUploader`
 * (Monolith/src/prerna/upload/CatalogImageUploader.java); pixel returns are
 * streamed by `PixelStreamUtility.collectPixelData`
 * (Semoss/src/prerna/sablecc2/PixelStreamUtility.java).
 *
 * Most access failures here answer 401 with an `{ error }` body (not
 * `{ errorMessage }`), so `ApiError.message` falls back to the status text and
 * the reason is in `ApiError.data.error`.
 */

import type { RequestOptions } from "../../types";
import { get, post } from "../../utility/http";
import { path, url } from "../../utility/url";

/**
 * Replaces the project's SMSS file. Only the project owner (or an admin) may
 * call it. The project id, name and type must be unchanged; concealed secrets
 * that were not edited are restored. Rolls back to the old file if the project
 * fails to reopen, then pushes to cloud storage and notifies the user.
 *
 * @name updateSmssFile
 * @endpoint POST /api/project-{projectId}/updateSmssFile
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#updateSmssFile
 * @param params - Path parameter and form fields.
 * @param params.projectId - The project.
 * @param params.smss - The full new SMSS file contents.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not the owner; 400 for an invalid id, a changed id/name/type or a failed reopen.
 */
export function updateSmssFile(
	params: { projectId: string; smss: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	const { projectId, ...body } = params;
	return post(path`/api/project-${projectId}/updateSmssFile`, body, options);
}

/**
 * Runs one of the project's custom (compiled) reactors in a temporary insight.
 * Requires view access to the project. Each top-level key of `inputs` becomes a
 * reactor input (arrays become multiple values).
 *
 * @name runReactor
 * @endpoint POST /api/project-{projectId}/runReactor/{reactorName}
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#runReactor
 * @param params - Path parameters and JSON body.
 * @param params.projectId - The project.
 * @param params.reactorName - The custom reactor's name.
 * @param params.inputs - The reactor inputs, sent as the JSON body.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step holding the reactor's output.
 * @throws {ApiError} 401 if the session is invalid or the caller cannot view the project; 400 if the reactor is not found or fails.
 */
export function runReactor(
	params: {
		projectId: string;
		reactorName: string;
		inputs: Record<string, unknown>;
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
	const { projectId, reactorName, inputs } = params;
	return post(
		path`/api/project-${projectId}/runReactor/${reactorName}`,
		inputs,
		options,
		{ bodyType: "json" },
	);
}

/**
 * Builds the URL of the project's custom landing page
 * (`app_root/version/assets/landing.html`), for the browser to open. The
 * server answers HTML, or 404 when the project has no landing page.
 *
 * @name landingUrl
 * @endpoint GET /api/project-{projectId}/landing
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#getProjectLandingPage
 * @param params - Path parameter.
 * @param params.projectId - The project.
 * @returns The URL.
 */
export function landingUrl(params: { projectId: string }): string {
	return url(path`/api/project-${params.projectId}/landing`);
}

/**
 * Downloads a file from the project's `app_root/version/assets` folder.
 * Requires view access to the project. The server reads the file as UTF-8
 * text, so only text assets survive intact.
 *
 * @name downloadProjectAsset
 * @endpoint GET /api/project-{projectId}/downloadProjectAsset/{relPath}
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#downloadProjectAsset
 * @param params - Path parameters.
 * @param params.projectId - The project.
 * @param params.relPath - Path below the assets folder; each `/`-separated segment is encoded separately.
 * @param options - Per-call overrides (signal, headers).
 * @returns The file contents as text.
 * @throws {ApiError} 401 if the session is invalid or the caller cannot view the project; 400 for a path outside the assets folder; 404 if the file does not exist.
 */
export function downloadProjectAsset(
	params: { projectId: string; relPath: string },
	options?: RequestOptions,
): Promise<string> {
	const relPath = params.relPath
		.split("/")
		.map((segment) => encodeURIComponent(segment))
		.join("/");
	return get(
		`${path`/api/project-${params.projectId}/downloadProjectAsset`}/${relPath}`,
		undefined,
		options,
		{ responseType: "text" },
	);
}

/**
 * Downloads the server's default embed logo (the `EMBED_URL_LOGO` image under
 * `images/embed`). Requires view access to the project; the project and
 * insight do not change which logo is returned.
 *
 * @name embedLogo
 * @endpoint GET /api/project-{projectId}/embedLogo
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#getEmbedUrl
 * @param params - Path and query parameters.
 * @param params.projectId - The project.
 * @param params.insightId - The insight (checked for format only; not used yet).
 * @param options - Per-call overrides (signal, headers).
 * @returns The logo image.
 * @throws {ApiError} 401 if the session is invalid or the caller cannot view the project; 404 if no logo is configured or the file is missing.
 */
export function embedLogo(
	params: { projectId: string; insightId?: string },
	options?: RequestOptions,
): Promise<Blob> {
	const { projectId, ...query } = params;
	return get(path`/api/project-${projectId}/embedLogo`, query, options, {
		responseType: "blob",
	});
}

/**
 * Replaces the project's catalog image. Requires edit access and a
 * non-anonymous login. Accepts one PNG, JPEG or GIF of up to 10 MiB and 25
 * million pixels.
 *
 * @name imageUpload
 * @endpoint POST /api/project-{projectId}/image/upload
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#uploadImage
 * @param params - Path parameter and multipart fields.
 * @param params.projectId - The project.
 * @param params.file - The image, sent as the multipart field `file`.
 * @param options - Per-call overrides (signal, headers).
 * @returns A confirmation with the project's alias and the URL to download the new image.
 * @throws {ApiError} 401 if the session is invalid or anonymous; 403 without edit access; 400 / 413 / 415 for an invalid, too large or unsupported image.
 */
export function imageUpload(
	params: { projectId: string; file: Blob },
	options?: RequestOptions,
): Promise<{
	message: "Successfully updated image";
	id: string;
	name: string;
	imageUrl: string;
	contentType: "image/png" | "image/jpeg" | "image/gif";
}> {
	const { projectId, ...body } = params;
	return post(path`/api/project-${projectId}/image/upload`, body, options, {
		bodyType: "multipart",
	});
}

/**
 * Same as {@link imageUpload}; an alias that matches the project image download route.
 *
 * @name projectImageUpload
 * @endpoint POST /api/project-{projectId}/projectImage/upload
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#uploadProjectImage
 * @param params - Path parameter and multipart fields.
 * @param params.projectId - The project.
 * @param params.file - The image, sent as the multipart field `file`.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same confirmation as {@link imageUpload}.
 * @throws {ApiError} 401 if the session is invalid or anonymous; 403 without edit access; 400 / 413 / 415 for an invalid, too large or unsupported image.
 */
export function projectImageUpload(
	params: { projectId: string; file: Blob },
	options?: RequestOptions,
): Promise<{
	message: "Successfully updated image";
	id: string;
	name: string;
	imageUrl: string;
	contentType: "image/png" | "image/jpeg" | "image/gif";
}> {
	const { projectId, ...body } = params;
	return post(
		path`/api/project-${projectId}/projectImage/upload`,
		body,
		options,
		{
			bodyType: "multipart",
		},
	);
}

/**
 * Downloads the project's catalog image: the system badge for
 * instance-managed projects, else the uploaded image (CouchDB, cloud or local
 * folder), else the stock artwork. Requires view access, or the project being
 * discoverable. Honors `If-None-Match`.
 *
 * @name projectImageDownload
 * @endpoint GET /api/project-{projectId}/projectImage/download
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#downloadProjectImage
 * @param params - Path and query parameters.
 * @param params.projectId - The project.
 * @param params.theme - Which stock artwork to use when there is no uploaded image.
 * @param options - Per-call overrides (signal, headers).
 * @returns The image.
 * @throws {ApiError} 401 if the session is invalid or the project is neither viewable nor discoverable; 400 if no image can be found.
 */
export function projectImageDownload(
	params: { projectId: string; theme?: "light" | "dark" },
	options?: RequestOptions,
): Promise<Blob> {
	const { projectId, ...query } = params;
	return get(
		path`/api/project-${projectId}/projectImage/download`,
		query,
		options,
		{
			responseType: "blob",
		},
	);
}

/**
 * Downloads a saved insight's thumbnail (CouchDB or the project version
 * folder), falling back to a stock image. Requires view access to the insight.
 *
 * @name insightImageDownload
 * @endpoint GET /api/project-{projectId}/insightImage/download
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#downloadInsightImage
 * @param params - Path and query parameters.
 * @param params.projectId - The project.
 * @param params.rdbmsId - The saved insight id.
 * @param params.params - Parameter values the thumbnail was captured with, if any.
 * @param options - Per-call overrides (signal, headers).
 * @returns The image.
 * @throws {ApiError} 401 if the session is invalid or the caller cannot view the insight; 400 for invalid ids; 404 if no image can be found.
 */
export function insightImageDownload(
	params: { projectId: string; rdbmsId: string; params?: string },
	options?: RequestOptions,
): Promise<Blob> {
	const { projectId, ...query } = params;
	return get(
		path`/api/project-${projectId}/insightImage/download`,
		query,
		options,
		{
			responseType: "blob",
		},
	);
}

/**
 * Runs SQL against an insight's frame for the JDBC driver. With `open=true`
 * (and a real project id) it first opens the saved insight `insightId` in a new
 * insight. The result is FST-serialized Java, not JSON.
 *
 * @name jdbc
 * @endpoint GET /api/project-{projectId}/jdbc
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#getJDBCOutput
 * @param params - Path and query parameters.
 * @param params.projectId - The project (`"session"` to use an insight already in the session).
 * @param params.insightId - The open insight id, or the saved insight id when `open` is `true`.
 * @param params.sql - The SQL to run; project and insight prefixes are stripped.
 * @param params.open - `"true"` to open the saved insight first.
 * @param options - Per-call overrides (signal, headers).
 * @returns The FST-serialized query output (or an error string, also serialized).
 * @remarks Unverified response shape (binary FST payload).
 * @throws {ApiError} 401 if the session is invalid.
 */
export function jdbc(
	params: {
		projectId: string;
		insightId: string;
		sql: string;
		open?: "true" | "false";
	},
	options?: RequestOptions,
): Promise<Blob> {
	const { projectId, ...query } = params;
	return get(path`/api/project-${projectId}/jdbc`, query, options, {
		responseType: "blob",
	});
}

/**
 * Runs SQL against a frame of an insight and returns JSON. Unless `projectId`
 * is `"session"`, it first opens the saved insight `insightId` in a new
 * insight. With several frames, the frame is picked from the `FROM` clause.
 *
 * @name jdbcJson
 * @endpoint GET /api/project-{projectId}/jdbc_json
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#getJDBCJsonOutput
 * @param params - Path and query parameters.
 * @param params.projectId - The project (`"session"` to use an insight already in the session).
 * @param params.insightId - The saved insight id, or the open insight id with `"session"`.
 * @param params.sql - The SQL to run.
 * @param options - Per-call overrides (signal, headers).
 * @returns The query output plus `INSIGHT_INSTANCE` (the insight id to reuse), or an error string / stack-frame list with status 200.
 * @remarks Unverified response shape.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function jdbcJson(
	params: { projectId: string; insightId: string; sql: string },
	options?: RequestOptions,
): Promise<
	{ INSIGHT_INSTANCE: string; [key: string]: unknown } | string | string[]
> {
	const { projectId, ...query } = params;
	return get(path`/api/project-${projectId}/jdbc_json`, query, options);
}

/**
 * Same as {@link jdbcJson} over POST. The parameters still travel in the query
 * string; the server would also read a raw SQL body, which this client does not send.
 *
 * @name jdbcJsonPost
 * @endpoint POST /api/project-{projectId}/jdbc_json
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#getJDBCJsonOutput
 * @param params - Path and query parameters.
 * @param params.projectId - The project (`"session"` to use an insight already in the session).
 * @param params.insightId - The saved insight id, or the open insight id with `"session"`.
 * @param params.sql - The SQL to run.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same output as {@link jdbcJson}.
 * @remarks Unverified response shape.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function jdbcJsonPost(
	params: { projectId: string; insightId: string; sql: string },
	options?: RequestOptions,
): Promise<
	{ INSIGHT_INSTANCE: string; [key: string]: unknown } | string | string[]
> {
	const { projectId, ...query } = params;
	return post(path`/api/project-${projectId}/jdbc_json`, undefined, options, {
		query,
	});
}

/**
 * Runs SQL against a frame of an insight and returns the result as CSV text.
 * Unless `projectId` is `"session"`, it first opens the saved insight
 * `insightId` in a new insight.
 *
 * @name jdbcCsv
 * @endpoint GET /api/project-{projectId}/jdbc_csv
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#getJDBCCSVOutput
 * @param params - Path and query parameters.
 * @param params.projectId - The project (`"session"` to use an insight already in the session).
 * @param params.insightId - The saved insight id, or the open insight id with `"session"`.
 * @param params.sql - The SQL to run.
 * @param options - Per-call overrides (signal, headers).
 * @returns The CSV, or a JSON-encoded error message / stack-frame list with status 200.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function jdbcCsv(
	params: { projectId: string; insightId: string; sql: string },
	options?: RequestOptions,
): Promise<string> {
	const { projectId, ...query } = params;
	return get(path`/api/project-${projectId}/jdbc_csv`, query, options, {
		responseType: "text",
	});
}

/**
 * Same as {@link jdbcCsv} over POST. The parameters still travel in the query
 * string; the server would also read a raw SQL body, which this client does not send.
 *
 * @name jdbcCsvPost
 * @endpoint POST /api/project-{projectId}/jdbc_csv
 * @source Monolith/src/prerna/semoss/web/services/local/ProjectResource.java#getJDBCCSVOutput
 * @param params - Path and query parameters.
 * @param params.projectId - The project (`"session"` to use an insight already in the session).
 * @param params.insightId - The saved insight id, or the open insight id with `"session"`.
 * @param params.sql - The SQL to run.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same output as {@link jdbcCsv}.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function jdbcCsvPost(
	params: { projectId: string; insightId: string; sql: string },
	options?: RequestOptions,
): Promise<string> {
	const { projectId, ...query } = params;
	return post(path`/api/project-${projectId}/jdbc_csv`, undefined, options, {
		query,
		responseType: "text",
	});
}
