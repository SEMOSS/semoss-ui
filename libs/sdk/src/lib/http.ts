/**
 * INTERNAL request helpers for endpoint files:
 *
 *     return get("/api/auth/admin/project/getProjects", params, options);
 *
 * They share the SDK sender and its Env configuration. Failures throw `ApiError`.
 */

import { followResponseRedirect, sendRequest } from "../utility/fetch";
import { ApiError, UnauthorizedError } from "./api-error";
import type { QueryParams, RequestOptions, RequestShape } from "./api-types";
import { encodeBody, readBody } from "./body";
import { url } from "./url";

export { repeat } from "./body";

/**
 * The message of a failed response: the backend's `errorMessage`, or the
 * `message` or `error` some resources send instead, or a bare string body.
 * An HTML page (a proxy's or Tomcat's error page) is not a message.
 *
 * @name errorMessageOf
 * @param response - The failed response.
 * @param data - Its parsed body.
 * @returns The message.
 */
const errorMessageOf = (response: Response, data: unknown): string => {
	const fallback = `Request failed with status ${response.status}`;
	if (typeof data === "string") {
		const isHtml = (response.headers.get("content-type") ?? "")
			.toLowerCase()
			.includes("text/html");
		return data && !isHtml && !data.trimStart().startsWith("<")
			? data
			: fallback;
	}
	if (typeof data === "object" && data !== null) {
		const body = data as Record<string, unknown>;
		for (const key of ["errorMessage", "message", "error"]) {
			if (typeof body[key] === "string" && body[key]) {
				return body[key];
			}
		}
	}
	return fallback;
};

/**
 * Send a request with the current settings, CSRF token and cookies.
 *
 * @name request
 * @param method - The HTTP method.
 * @param endpointPath - The full path below the context root, e.g. `/api/auth/whoami`.
 * @param query - Query parameters.
 * @param body - Form fields, JSON fields, a `FormData`, or raw text.
 * @param options - Per-call options (signal, headers).
 * @param shape - Body type and response type, when not the defaults.
 * @returns The response, read as `shape.responseType` (JSON by default).
 * @throws {ApiError} For a non-2xx response.
 * @throws {UnauthorizedError} When the server redirects the browser instead of answering.
 */
export const request = async <R>(
	method: "GET" | "POST" | "PUT" | "DELETE",
	endpointPath: string,
	query: QueryParams | undefined,
	body: FormData | Record<string, unknown> | string | undefined,
	options?: RequestOptions,
	shape: RequestShape = {},
): Promise<R> => {
	const endpoint = `${method} ${endpointPath}`;
	const headers = new Headers(options?.headers);
	// The route API owns its CSRF token; callers cannot replace it.
	headers.delete("X-CSRF-Token");
	const response = await sendRequest(url(endpointPath, query), {
		method,
		body: encodeBody(body, shape.bodyType, headers),
		headers,
		signal: options?.signal,
	});
	const redirect = followResponseRedirect(response);
	if (redirect) {
		throw new UnauthorizedError(
			"Redirected",
			response.status,
			{ redirect },
			endpoint,
		);
	}

	if (!response.ok) {
		const data = await readBody(response);
		throw new ApiError(
			errorMessageOf(response, data),
			response.status,
			data,
			endpoint,
		);
	}

	switch (shape.responseType) {
		case "response":
			return response as R;
		case "stream":
			return response.body as R;
		case "blob":
			return (await response.blob()) as R;
		case "text":
			return (await response.text()) as R;
		default:
			return (await readBody(response)) as R;
	}
};

/**
 * Send a `GET`.
 *
 * @name get
 * @param endpointPath - The full path below the context root, e.g. `/api/auth/whoami`.
 * @param query - Query parameters.
 * @param options - Per-call options.
 * @param shape - Response type, when not the default.
 * @returns The parsed response.
 */
export const get = <R>(
	endpointPath: string,
	query?: QueryParams,
	options?: RequestOptions,
	shape?: RequestShape,
): Promise<R> =>
	request<R>("GET", endpointPath, query, undefined, options, shape);

/**
 * Send a `POST` (form-encoded unless `shape.bodyType` says otherwise).
 *
 * @name post
 * @param endpointPath - The full path below the context root, e.g. `/api/auth/whoami`.
 * @param body - The fields, a `FormData`, or raw text.
 * @param options - Per-call options.
 * @param shape - Body type, response type and query, when needed.
 * @returns The parsed response.
 */
export const post = <R>(
	endpointPath: string,
	body?: FormData | Record<string, unknown> | string,
	options?: RequestOptions,
	shape?: RequestShape,
): Promise<R> =>
	request<R>("POST", endpointPath, shape?.query, body, options, shape);

/**
 * Send a `PUT`.
 *
 * @name put
 * @param endpointPath - The full path below the context root, e.g. `/api/auth/whoami`.
 * @param body - The fields, a `FormData`, or raw text.
 * @param options - Per-call options.
 * @param shape - Body type, response type and query, when needed.
 * @returns The parsed response.
 */
export const put = <R>(
	endpointPath: string,
	body?: FormData | Record<string, unknown> | string,
	options?: RequestOptions,
	shape?: RequestShape,
): Promise<R> =>
	request<R>("PUT", endpointPath, shape?.query, body, options, shape);

/**
 * Send a `DELETE`.
 *
 * @name del
 * @param endpointPath - The full path below the context root, e.g. `/api/auth/whoami`.
 * @param query - Query parameters.
 * @param options - Per-call options.
 * @param shape - Response type, when not the default.
 * @returns The parsed response.
 */
export const del = <R>(
	endpointPath: string,
	query?: QueryParams,
	options?: RequestOptions,
	shape?: RequestShape,
): Promise<R> =>
	request<R>("DELETE", endpointPath, query, undefined, options, shape);
