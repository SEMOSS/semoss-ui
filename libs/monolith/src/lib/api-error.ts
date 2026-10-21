/**
 * PUBLIC: the error type thrown by every endpoint function, re-exported from
 * `@semoss/monolith`.
 */

/**
 * Thrown for any non-2xx response, or when the server redirects the client.
 * Network failures and aborts surface as the native `fetch` errors instead.
 *
 * @name ApiError
 * @example
 * try {
 *     await getProjects();
 * } catch (error) {
 *     if (error instanceof ApiError && error.status === 403) {
 *         // not an admin
 *     }
 * }
 */
export class ApiError extends Error {
	/** HTTP status code. */
	readonly status: number;
	/** Parsed error body, usually `{ errorMessage }` or a string. */
	readonly data: unknown;
	/** The failed request, e.g. `"POST /api/auth/login"`. */
	readonly endpoint: string;

	/**
	 * @name constructor
	 * @param message - Human-readable message.
	 * @param status - HTTP status code.
	 * @param data - Parsed error body.
	 * @param endpoint - The failed request, as `"<METHOD> <path>"`.
	 */
	constructor(
		message: string,
		status: number,
		data: unknown,
		endpoint: string,
	) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
		this.endpoint = endpoint;
	}
}
