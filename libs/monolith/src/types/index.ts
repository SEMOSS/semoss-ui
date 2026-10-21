/**
 * Shared types. `RequestOptions` is public (re-exported from `src/index.ts`);
 * the rest are used internally by `ApiClient` and the endpoint files.
 */

/**
 * Per-call options, the optional last argument of every endpoint function.
 *
 * @name RequestOptions
 */
export interface RequestOptions {
	/** Abort the request, e.g. `AbortSignal.timeout(30_000)`. */
	signal?: AbortSignal;
	/** Extra headers for this call only. Cannot override auth or the CSRF token. */
	headers?: Record<string, string>;
}

/**
 * Query-string parameters. Arrays become repeated keys; `null` / `undefined` are dropped.
 *
 * @name QueryParams
 */
export type QueryParams = Record<
	string,
	| string
	| number
	| boolean
	| null
	| undefined
	| ReadonlyArray<string | number | boolean>
>;

/**
 * How a request is sent and read, when it differs from the defaults
 * (form body, JSON response).
 *
 * @name RequestShape
 */
export interface RequestShape {
	/** Body encoding. `form` JSON-stringifies non-string values, as Monolith expects. */
	bodyType?: "form" | "json" | "multipart";
	/** How to read the response. */
	responseType?: "json" | "text" | "blob" | "stream" | "response";
	/** Query parameters on a request that also has a body. */
	query?: QueryParams;
}
