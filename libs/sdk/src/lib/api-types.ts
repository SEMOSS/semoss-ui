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
