/**
 * PUBLIC: the error types thrown by every endpoint function, exported from
 * `@semoss/sdk/monolith` (the `@semoss/sdk` root has its own, unrelated `UnauthorizedError`).
 */

/**
 * Thrown for any non-2xx response. A redirect throws its subclass
 * {@link UnauthorizedError}. Network failures and aborts surface as the native
 * `fetch` errors instead.
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

/**
 * Thrown when the server redirects the client instead of answering, usually
 * because the session expired. The redirect is handed to `onRedirect` first.
 * Network failures and aborts are not this error.
 *
 * @name UnauthorizedError
 * @example
 * try {
 *     await getProjects();
 * } catch (error) {
 *     if (error instanceof UnauthorizedError) {
 *         // the session is gone; the page is already navigating away
 *     }
 * }
 */
export class UnauthorizedError extends ApiError {
	/**
	 * @name constructor
	 * @param message - Human-readable message.
	 * @param status - HTTP status code of the redirecting response.
	 * @param data - `{ redirect }`, the URL the server sent the client to.
	 * @param endpoint - The failed request, as `"<METHOD> <path>"`.
	 */
	constructor(
		message: string,
		status: number,
		data: { redirect: string },
		endpoint: string,
	) {
		super(message, status, data, endpoint);
		this.name = "UnauthorizedError";
	}
}
