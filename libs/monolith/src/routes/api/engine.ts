/**
 * Pixel execution, async jobs and legacy catalog calls — `/api/engine`.
 *
 * Backend: `NameServer`
 * (Monolith/src/prerna/semoss/web/services/local/NameServer.java).
 * Pixel responses are streamed by `PixelStreamUtility.collectPixelData`
 * (Semoss/src/prerna/sablecc2/PixelStreamUtility.java); job state lives in
 * `PixelJobManager` / `PixelJobRunner` (Semoss/src/prerna/sablecc2/comm).
 *
 * Sub-resources located here have their own files:
 * `/api/engine/i-{insightId}` → `engine/insight.ts` (`DataframeResource`) and
 * `/api/engine/e-{engineId}` → `engine/legacy-engine.ts` (`OldEngineResource`).
 * `/api/engine/centralNameServer` locates `CentralNameServer`, which has no
 * HTTP methods, so nothing is wrapped for it.
 *
 * Errors are `{ errorMessage }` bodies (surfaced as `ApiError`): 401 when the
 * session has no user, 400 for bad input or an unknown insight id (the pixel
 * endpoints also add `errorType: "INSIGHT_NOT_FOUND" | "EXPRESSION_NOT_FOUND"`).
 * A pixel that fails inside the run still answers 200; check each
 * `pixelReturn[i].operationType` for `"ERROR"`.
 */

import type { RequestOptions } from "@/types";
import { get, post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Lists the legacy playsheet names and the Java class behind each one.
 *
 * @name playsheets
 * @endpoint GET /api/engine/playsheets
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#getPlaySheets
 * @param params - Takes no parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns A map of playsheet name to fully-qualified class name.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function playsheets(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<Record<string, string>> {
	return get(path`/api/engine/playsheets`, params, options);
}

/**
 * Downloads a file an insight exported earlier (for example by `ToCsv` or
 * `ExportToExcel`). Both the insight id and the file key are required, so only
 * the session that ran the export can fetch it.
 *
 * @name downloadFile
 * @endpoint GET /api/engine/downloadFile
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#downloadFile
 * @param params - Query parameters.
 * @param params.insightId - The insight that produced the export.
 * @param params.fileKey - The export's file key, from the pixel output.
 * @param options - Per-call overrides (signal, headers).
 * @returns The file contents (sent as an attachment).
 * @throws {ApiError} 400 if the insight or the file cannot be found.
 */
export function downloadFile(
	params: { insightId: string; fileKey: string },
	options?: RequestOptions,
): Promise<Blob> {
	return get(path`/api/engine/downloadFile`, params, options, {
		responseType: "blob",
	});
}

/**
 * Runs a pixel expression synchronously and returns every pixel's result.
 * Without an `insightId` (or with `"new"`) a new insight is created and
 * registered to the session; otherwise the expression runs in that insight.
 * Sets the caller's time zone for the run. A trailing `;` is added if missing.
 *
 * @name runPixel
 * @endpoint POST /api/engine/runPixel
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#runPixelSync
 * @param params - Form fields.
 * @param params.expression - The pixel to run.
 * @param params.insightId - The insight to run in; omit or `"new"` for a new one.
 * @param params.tz - IANA time zone. Defaults to the caller's time zone; invalid values fall back to the server default.
 * @param params.dropLogging - Clear the job's console logging after the run. Defaults to `true`; pass `false` when another `runPixel` on the same insight still needs it.
 * @param options - Per-call overrides (signal, headers).
 * @returns The insight id and one entry per pixel step, plus any delayed messages.
 * @throws {ApiError} 401 if the session is invalid; 400 if `expression` is empty or the insight is unknown; 500 if the response cannot be built.
 */
export function runPixel(
	params: {
		expression: string;
		insightId?: string;
		tz?: string;
		dropLogging?: boolean;
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
	return post(
		path`/api/engine/runPixel`,
		{
			...params,
			tz: params.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		options,
	);
}

/**
 * Runs Python source as the pixel `Py(code="…")`, so callers do not have to
 * escape the code into pixel syntax. Otherwise behaves like {@link runPixel}.
 *
 * @name runPython
 * @endpoint POST /api/engine/runPython
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#runPython
 * @param params - Form fields.
 * @param params.code - The Python source to run.
 * @param params.insightId - The insight to run in; omit or `"new"` for a new one.
 * @param params.tz - IANA time zone. Defaults to the caller's time zone.
 * @param params.dropLogging - Clear the job's console logging after the run. Defaults to `true`.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same pixel return as {@link runPixel}, with one step for the `Py` call.
 * @throws {ApiError} 401 if the session is invalid; 400 if `code` is empty or the insight is unknown.
 */
export function runPython(
	params: {
		code: string;
		insightId?: string;
		tz?: string;
		dropLogging?: boolean;
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
	return post(
		path`/api/engine/runPython`,
		{
			...params,
			tz: params.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		options,
	);
}

/**
 * Runs one pixel reactor as an MCP `tools/call` request: the reactor named in
 * `params.name` is executed with `params.arguments`, inside the insight from
 * `_meta.insightId` (or a new one).
 *
 * @name runReactorMCP
 * @endpoint POST /api/engine/runReactorMCP
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#runReactorMCP
 * @param params - JSON body (a JSON-RPC 2.0 request).
 * @param params.jsonrpc - Always `"2.0"`.
 * @param params.id - Request id (not echoed back by the server).
 * @param params.method - Always `"tools/call"` (not checked by the server).
 * @param params.params - The reactor name and its arguments.
 * @param params._meta - Optional insight id and time zone for the run.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ result }` with the reactor's output as one text content item.
 * @throws {ApiError} 401 if the session is invalid; 400 for invalid JSON, an unknown insight or a failed tool run (`data.error` holds the MCP `{ code, message }`).
 */
export function runReactorMCP(
	params: {
		jsonrpc: "2.0";
		id?: string | number;
		method: "tools/call";
		params: { name: string; arguments: Record<string, unknown> };
		_meta?: { insightId?: string; tz?: string };
	},
	options?: RequestOptions,
): Promise<{
	result: {
		content: Array<{ type: "text"; text: string }>;
		isError: false;
	};
}> {
	return post(path`/api/engine/runReactorMCP`, params, options, {
		bodyType: "json",
	});
}

/**
 * Parses an insight's recipe into the pipeline view model (one node per
 * routine).
 *
 * @name getPipeline
 * @endpoint POST /api/engine/getPipeline
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#getPixelPipelinePlan
 * @param params - Form fields.
 * @param params.insightId - The insight whose recipe to parse.
 * @param options - Per-call overrides (signal, headers).
 * @returns `idMapping` (the insight's pixel list) and `pixelParsing` (the parsed routines from `PipelineTranslation.getAllRoutines`).
 * @remarks Unverified response shape for `idMapping` and `pixelParsing`.
 * @throws {ApiError} 401 if the session is invalid; 400 if the insight is unknown or a step has invalid syntax.
 */
export function getPipeline(
	params: { insightId: string },
	options?: RequestOptions,
): Promise<{ idMapping: unknown; pixelParsing: unknown }> {
	return post(path`/api/engine/getPipeline`, params, options);
}

/**
 * Starts a pixel run in the background and returns its job id. Poll
 * {@link status} / {@link pixelJobStreaming} and fetch the outcome with
 * {@link result} from the same session.
 *
 * @name runPixelAsync
 * @endpoint POST /api/engine/runPixelAsync
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#runPixelAsync
 * @param params - Form fields.
 * @param params.expression - The pixel to run.
 * @param params.insightId - The insight to run in; omit or `"new"` for a new one.
 * @param params.tz - IANA time zone. Defaults to the caller's time zone.
 * @param params.dropLogging - Read but ignored by this endpoint.
 * @param options - Per-call overrides (signal, headers).
 * @returns The job id.
 * @throws {ApiError} 401 if the session is invalid; 400 if `expression` is empty or the insight is unknown.
 */
export function runPixelAsync(
	params: {
		expression: string;
		insightId?: string;
		tz?: string;
		dropLogging?: boolean;
	},
	options?: RequestOptions,
): Promise<{ jobId: string }> {
	return post(
		path`/api/engine/runPixelAsync`,
		{
			...params,
			tz: params.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		options,
	);
}

/**
 * Returns the outcome of a job started with {@link runPixelAsync}, then removes
 * the job. Only the session that started the job can read it, and only once.
 *
 * @name result
 * @endpoint POST /api/engine/result
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#result
 * @param params - Form fields.
 * @param params.jobId - The job id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same pixel return as {@link runPixel}, or the string `"NULL"` if the job is not in this session (or was already read).
 * @throws {ApiError} 401 if the session is invalid.
 */
export function result(
	params: { jobId: string },
	options?: RequestOptions,
): Promise<
	| {
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
	  }
	| "NULL"
> {
	return post(path`/api/engine/result`, params, options);
}

/**
 * Returns the status of a job started in this session.
 *
 * @name status
 * @endpoint POST /api/engine/status
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#status
 * @param params - Form fields.
 * @param params.jobId - The job id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The `PixelJobStatus` value, `"UnknownJob"` once the job is gone, or `"NULL"` if the job was not started in this session.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function status(
	params: { jobId: string },
	options?: RequestOptions,
): Promise<
	| "Created"
	| "Submitted"
	| "Canceled"
	| "InProgress"
	| "ProgressComplete"
	| "Streaming"
	| "Complete"
	| "Paused"
	| "Error"
	| "UnknownJob"
	| "NULL"
> {
	return post(path`/api/engine/status`, params, options);
}

/**
 * Drains the standard-output lines a job has logged since the last call. Does
 * not check that the job belongs to this session.
 *
 * @name console
 * @endpoint POST /api/engine/console
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#console
 * @param params - Form fields.
 * @param params.jobId - The job id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The job status and the new console lines.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function console(
	params: { jobId: string },
	options?: RequestOptions,
): Promise<{
	status:
		| "Created"
		| "Submitted"
		| "Canceled"
		| "InProgress"
		| "ProgressComplete"
		| "Streaming"
		| "Complete"
		| "Paused"
		| "Error"
		| "UnknownJob";
	message: string[];
}> {
	return post(path`/api/engine/console`, params, options);
}

/**
 * Drains the standard-error lines a job has logged since the last call. Does
 * not check that the job belongs to this session.
 *
 * @name error
 * @endpoint POST /api/engine/error
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#error
 * @param params - Form fields.
 * @param params.jobId - The job id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The job status and the new error lines.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function error(
	params: { jobId: string },
	options?: RequestOptions,
): Promise<{
	status:
		| "Created"
		| "Submitted"
		| "Canceled"
		| "InProgress"
		| "ProgressComplete"
		| "Streaming"
		| "Complete"
		| "Paused"
		| "Error"
		| "UnknownJob";
	message: string[];
}> {
	return post(path`/api/engine/error`, params, options);
}

/**
 * Returns the partial text a job has streamed so far (old text-buffer API).
 *
 * @name partial
 * @endpoint POST /api/engine/partial
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#partial
 * @param params - Form fields.
 * @param params.jobId - The job id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The job status and the partial-output map from `PixelJobManager.getPartial`.
 * @remarks Unverified keys of `message`.
 * @throws {ApiError} 401 if the session is invalid.
 * @deprecated Marked `@Deprecated` in the backend. Use {@link pixelJobStreaming} instead.
 */
export function partial(
	params: { jobId: string },
	options?: RequestOptions,
): Promise<{
	status:
		| "Created"
		| "Submitted"
		| "Canceled"
		| "InProgress"
		| "ProgressComplete"
		| "Streaming"
		| "Complete"
		| "Paused"
		| "Error"
		| "UnknownJob";
	message: Record<string, string>;
}> {
	return post(path`/api/engine/partial`, params, options);
}

/**
 * Polls the stream chunks a job (for example a streaming `LLM` call) has
 * produced since the last call. This is a JSON poll, not a long-lived stream.
 * Does not check that the job belongs to this session.
 *
 * @name pixelJobStreaming
 * @endpoint POST /api/engine/pixelJobStreaming
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#pixelJobStreaming
 * @param params - Form fields.
 * @param params.jobId - The job id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The job status and the new chunks (each chunk is whatever map the reactor pushed).
 * @remarks Unverified chunk shape.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function pixelJobStreaming(
	params: { jobId: string },
	options?: RequestOptions,
): Promise<{
	status:
		| "Created"
		| "Submitted"
		| "Canceled"
		| "InProgress"
		| "ProgressComplete"
		| "Streaming"
		| "Complete"
		| "Paused"
		| "Error"
		| "UnknownJob";
	message: Array<Record<string, unknown>>;
}> {
	return post(path`/api/engine/pixelJobStreaming`, params, options);
}

/**
 * Drains the buffered events of an agent run and returns the run snapshot.
 * Unlike {@link pixelJobStreaming}, only the run's owner can read it, and the
 * drained events are removed. This is a JSON poll, not a long-lived stream.
 *
 * @name agentRunStreaming
 * @endpoint POST /api/engine/agentRunStreaming
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#agentRunStreaming
 * @param params - Form fields.
 * @param params.runId - The agent run id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The run snapshot (`AgentRunService.getRunSnapshot`), the drained events and how many events were dropped because the buffer overflowed.
 * @remarks Unverified event shape and `progress` / `artifacts` / `reviewOutcome` / `warnings` / `pendingActions` item shapes.
 * @throws {ApiError} 400 if `runId` is missing; 401 for an anonymous or missing user; 404 if the run does not exist or belongs to someone else.
 */
export function agentRunStreaming(
	params: { runId: string },
	options?: RequestOptions,
): Promise<{
	run: {
		runId: string;
		roomId: string | null;
		status:
			| "SUBMITTED"
			| "RUNNING"
			| "INPUT_REQUIRED"
			| "COMPLETED"
			| "FAILED"
			| "CANCELLED";
		inputMessageId: string | null;
		finalOutputMessageId: string | null;
		finalText: string | null;
		errorMessage: string | null;
		progress?: unknown;
		artifacts?: unknown;
		reviewOutcome?: unknown;
		warnings?: unknown;
		pendingActions: Array<Record<string, unknown>>;
	};
	events: Array<Record<string, unknown>>;
	droppedEvents: number;
}> {
	return post(path`/api/engine/agentRunStreaming`, params, options);
}

/**
 * Requests cancellation of a running job and clears its buffered output. Does
 * not check that the job belongs to this session.
 *
 * @name terminate
 * @endpoint POST /api/engine/terminate
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#terminate
 * @param params - Form fields.
 * @param params.jobId - The job id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The string `"success"`, even when the job does not exist.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function terminate(
	params: { jobId: string },
	options?: RequestOptions,
): Promise<"success"> {
	return post(path`/api/engine/terminate`, params, options);
}

/**
 * Searches Wikipedia server-side and maps each hit to a productontology.org
 * URL with its plain-text snippet.
 *
 * @name tags
 * @endpoint GET /api/engine/mediawiki/tags
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#getMediaWikiTagsForSearchTerm
 * @param params - Query parameters.
 * @param params.searchTerm - The term to search for.
 * @param params.numResults - Maximum number of hits.
 * @param options - Per-call overrides (signal, headers).
 * @returns A map of productontology URL to snippet text; empty when the search fails.
 * @throws {ApiError} 401 if the session is invalid.
 * @deprecated The backend files it under "Legacy code that isn't really used anymore". No replacement.
 */
export function tags(
	params: { searchTerm: string; numResults: number },
	options?: RequestOptions,
): Promise<Record<string, string>> {
	return get(path`/api/engine/mediawiki/tags`, params, options);
}

/**
 * Lists the engines the caller can access, with default filters.
 *
 * @name all
 * @endpoint GET /api/engine/all
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#printEngines
 * @param params - Takes no parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per engine (`SecurityEngineUtils.getUserEngineList`), or the string `"Not properly authenticated"` without a session user.
 * @remarks Unverified response shape beyond the listed keys.
 * @throws {ApiError} 401 if the session is invalid.
 * @deprecated The backend files it under "Legacy code that isn't really used anymore". No replacement in this resource.
 */
export function all(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<
	| Array<{
			engine_id: string;
			engine_name: string;
			engine_display_name: string | null;
			engine_type: string;
			engine_subtype: string | null;
			[key: string]: unknown;
	  }>
	| "Not properly authenticated"
> {
	return get(path`/api/engine/all`, params, options);
}

/**
 * Does nothing: the remote-engine registration it once performed is commented out.
 *
 * @name add
 * @endpoint GET /api/engine/add
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#addEngine
 * @param params - Query parameters.
 * @param params.api - Remote server URL (ignored).
 * @param params.database - Remote database name (ignored).
 * @param options - Per-call overrides (signal, headers).
 * @returns Nothing (204).
 * @throws {ApiError} 401 if the session is invalid.
 * @deprecated The method body is commented out and the backend files it under "Legacy code that isn't really used anymore". No replacement.
 */
export function add(
	params: { api?: string; database?: string } = {},
	options?: RequestOptions,
): Promise<void> {
	return get(path`/api/engine/add`, params, options);
}

/**
 * Suggests insight names the caller can view that match a partial search term
 * (up to 15).
 *
 * @name getAutoCompleteResults
 * @endpoint GET /api/engine/central/context/getAutoCompleteResults
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#getAutoCompleteResults
 * @param params - Query parameters.
 * @param params.completeTerm - The partial search term.
 * @param options - Per-call overrides (signal, headers).
 * @returns Matching insight names.
 * @throws {ApiError} 401 if the session is invalid.
 * @deprecated The backend files it under "Legacy code that isn't really used anymore". No replacement in this resource.
 */
export function getAutoCompleteResults(
	params: { completeTerm: string },
	options?: RequestOptions,
): Promise<string[]> {
	return get(
		path`/api/engine/central/context/getAutoCompleteResults`,
		params,
		options,
	);
}

/**
 * Searches the insights the caller can view by name, optionally limited to
 * some projects.
 *
 * @name getSearchInsightsResults
 * @endpoint POST /api/engine/central/context/getSearchInsightsResults
 * @source Monolith/src/prerna/semoss/web/services/local/NameServer.java#getSearchInsightsResults
 * @param params - Form fields.
 * @param params.searchString - Text to search for.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.filterData - `{ app_id }` limits the search to those project ids; `tags` is parsed but ignored.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per insight, or `{ errorMessage: "Invalid filter map" }` (with status 200) if `filterData` cannot be parsed.
 * @throws {ApiError} 401 if the session is invalid.
 * @deprecated The backend files it under "Legacy code that isn't really used anymore". No replacement in this resource.
 */
export function getSearchInsightsResults(
	params: {
		searchString?: string;
		limit?: number;
		offset?: number;
		filterData?: { app_id?: string[]; tags?: string[] };
	} = {},
	options?: RequestOptions,
): Promise<
	| Array<{
			app_id: string;
			app_name: string;
			app_insight_id: string;
			project_id: string;
			project_name: string;
			project_insight_id: string;
			name: string;
			layout: string | null;
			created_on: string | null;
			last_modified_on: string | null;
			view_count: number | null;
			cacheable: boolean | null;
			insight_global: boolean | null;
			[key: string]: unknown;
	  }>
	| { errorMessage: string }
> {
	return post(
		path`/api/engine/central/context/getSearchInsightsResults`,
		params,
		options,
	);
}
