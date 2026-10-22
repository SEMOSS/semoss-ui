/**
 * INTERNAL request helpers for endpoint files:
 *
 *     return get("/auth/admin/project/getProjects", params, options);
 *
 * They read the connection from the internal `ApiSettings` store (which apps
 * set through `ApiClient`). Failures throw `ApiError`.
 */

import { ApiError, UnauthorizedError } from "../lib/api-error";
import { ApiSettings } from "../lib/api-settings";
import type { QueryParams, RequestOptions, RequestShape } from "../types";
import { encodeBody, readBody } from "./body";
import { url } from "./url";

export { repeat } from "./body";

/** The header Tomcat's CSRF filter reads on requests and sets on responses. */
const CSRF_HEADER = "X-CSRF-Token";

/**
 * Build the headers: configured, then per-call, then auth and cookie last so
 * they cannot be overridden.
 *
 * @name buildHeaders
 * @param options - Per-call options.
 * @returns The headers.
 */
const buildHeaders = (options?: RequestOptions): Headers => {
	const s = ApiSettings.current;
	const headers = new Headers({ ...s.headers, ...options?.headers });
	headers.delete(CSRF_HEADER);
	if (s.auth?.type === "basic") {
		headers.set(
			"Authorization",
			`Basic ${btoa(`${s.auth.accessKey}:${s.auth.secretKey}`)}`,
		);
	} else if (s.auth?.type === "bearer") {
		headers.set("Authorization", `Bearer ${s.auth.token}`);
		if (s.auth.provider) {
			headers.set("Bearer-Provider", s.auth.provider);
		}
	}
	if (s.cookies && ApiSettings.cookieJar.size) {
		headers.set(
			"Cookie",
			Array.from(ApiSettings.cookieJar, ([k, v]) => `${k}=${v}`).join(
				"; ",
			),
		);
	}
	return headers;
};

/**
 * Remember `Set-Cookie` values and any refreshed CSRF token from a response.
 *
 * @name remember
 * @param response - Any response.
 * @returns Nothing.
 */
const remember = (response: Response): void => {
	if (ApiSettings.current.cookies) {
		for (const cookie of response.headers.getSetCookie?.() ?? []) {
			const [pair] = cookie.split(";");
			const i = pair.indexOf("=");
			if (i > 0) {
				ApiSettings.cookieJar.set(
					pair.slice(0, i).trim(),
					pair.slice(i + 1).trim(),
				);
			}
		}
	}
	const token = response.headers.get(CSRF_HEADER);
	if (token && token.toLowerCase() !== "required") {
		ApiSettings.csrfToken = token;
	}
};

/**
 * The CSRF token, fetched once from `GET /api/config/fetchCsrf` with
 * `X-CSRF-Token: Fetch` and then cached.
 *
 * @name csrfToken
 * @returns The token, or `""` when the server issued none.
 */
const csrfToken = async (): Promise<string> => {
	if (ApiSettings.csrfToken !== null) {
		return ApiSettings.csrfToken;
	}
	const s = ApiSettings.current;
	const headers = buildHeaders();
	headers.set(CSRF_HEADER, "Fetch");
	const response = await fetch(url("/api/config/fetchCsrf"), {
		headers,
		credentials: s.credentials,
	});
	remember(response);
	ApiSettings.csrfToken = response.headers.get(CSRF_HEADER) || "";
	return ApiSettings.csrfToken;
};

/**
 * Where the server sent the client instead of answering, usually the login
 * page after the session expired: a `redirect` or `location` header, or a
 * redirect `fetch` already followed to an HTML page.
 *
 * @name redirectOf
 * @param response - Any response.
 * @returns The URL, or `null` when the response answers the request.
 */
const redirectOf = (response: Response): string | null => {
	const header =
		response.headers.get("redirect") || response.headers.get("location");
	if (header) {
		return header;
	}
	const isHtml = (response.headers.get("content-type") ?? "")
		.toLowerCase()
		.includes("text/html");
	return response.redirected && response.url && isHtml ? response.url : null;
};

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
 * @param body - Form fields, JSON fields or a `FormData`.
 * @param options - Per-call options (signal, headers).
 * @param shape - Body type and response type, when not the defaults.
 * @returns The response, read as `shape.responseType` (JSON by default).
 * @throws {ApiError} For a non-2xx response.
 * @throws {UnauthorizedError} When the server redirects the client and `onRedirect` is set.
 */
export const request = async <R>(
	method: "GET" | "POST" | "PUT" | "DELETE",
	endpointPath: string,
	query: QueryParams | undefined,
	body: FormData | Record<string, unknown> | undefined,
	options?: RequestOptions,
	shape: RequestShape = {},
): Promise<R> => {
	const s = ApiSettings.current;
	const endpoint = `${method} ${endpointPath}`;

	/**
	 * Send once; called again a single time if the CSRF token was rejected.
	 *
	 * @name send
	 * @returns The response.
	 */
	const send = async (): Promise<Response> => {
		const headers = buildHeaders(options);
		if (method !== "GET" && s.csrf) {
			const token = await csrfToken();
			if (token) {
				headers.set(CSRF_HEADER, token);
			}
		}
		const response = await fetch(url(endpointPath, query), {
			method,
			headers,
			body: encodeBody(body, shape.bodyType, headers),
			credentials: s.credentials,
			signal: options?.signal,
		});
		remember(response);
		return response;
	};

	let response = await send();
	// Tomcat rejects a stale token with 403 + "X-CSRF-Token: Required": refetch once.
	if (
		response.status === 403 &&
		response.headers.get(CSRF_HEADER)?.toLowerCase() === "required"
	) {
		ApiSettings.csrfToken = null;
		response = await send();
	}

	const redirect = redirectOf(response);
	if (redirect && s.onRedirect) {
		s.onRedirect(redirect);
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
 * @param body - The fields, or a `FormData`.
 * @param options - Per-call options.
 * @param shape - Body type, response type and query, when needed.
 * @returns The parsed response.
 */
export const post = <R>(
	endpointPath: string,
	body?: FormData | Record<string, unknown>,
	options?: RequestOptions,
	shape?: RequestShape,
): Promise<R> =>
	request<R>("POST", endpointPath, shape?.query, body, options, shape);

/**
 * Send a `PUT`.
 *
 * @name put
 * @param endpointPath - The full path below the context root, e.g. `/api/auth/whoami`.
 * @param body - The fields, or a `FormData`.
 * @param options - Per-call options.
 * @param shape - Body type, response type and query, when needed.
 * @returns The parsed response.
 */
export const put = <R>(
	endpointPath: string,
	body?: FormData | Record<string, unknown>,
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
