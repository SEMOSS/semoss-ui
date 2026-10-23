import { Env } from "../env";
import { HttpError, UnauthorizedError } from "./error";
import { CSRF, getSessionGeneration, rememberSession } from "./session";

export { CSRF } from "./session";

const CSRF_HEADER = "X-CSRF-Token";

/** Read an explicit redirect or an HTML login page that Fetch already followed. */
export const getResponseRedirect = (response: Response): string | null => {
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
 * Follow an authentication redirect in a browser, honoring the host override.
 * @returns The server's redirect when navigation starts, otherwise null.
 */
export const followResponseRedirect = (response: Response): string | null => {
	if (typeof window === "undefined") {
		return null;
	}
	const redirect = getResponseRedirect(response);
	if (!redirect) {
		return null;
	}
	let target: string;
	try {
		target = new URL(
			Env.REDIRECT_URL || redirect,
			window.location.origin,
		).toString();
	} catch {
		return null;
	}
	window.location.replace(target);
	return redirect;
};

/** Merge caller headers with the current environment and session credentials. */
const requestHeaders = (
	input: HeadersInit | undefined,
): Record<string, string> => {
	const headers = new Headers(input);
	if (Env.ACCESS_KEY && Env.SECRET_KEY) {
		headers.set(
			"authorization",
			`Basic ${btoa(`${Env.ACCESS_KEY}:${Env.SECRET_KEY}`)}`,
		);
	}
	if (Env.BEARER_TOKEN) {
		headers.set("authorization", `Bearer ${Env.BEARER_TOKEN}`);
	}
	if (Env.BEARER_PROVIDER) {
		headers.set("Bearer-Provider", Env.BEARER_PROVIDER);
	}
	if (Env.HEADLESS && CSRF.cookie) {
		headers.set("cookie", CSRF.cookie);
	}
	const result = Object.fromEntries(headers);
	// Preserve the public helpers' header representation for existing callers.
	if (Env.BEARER_PROVIDER) {
		delete result["bearer-provider"];
		result["Bearer-Provider"] = Env.BEARER_PROVIDER;
	}
	return result;
};

/** Stop a cancelled request or a request whose session was cleared while awaiting I/O. */
const checkRequest = (
	signal: AbortSignal | null | undefined,
	generation: number,
): void => {
	signal?.throwIfAborted();
	if (generation !== getSessionGeneration()) {
		throw new DOMException(
			"The SDK session changed during the request",
			"AbortError",
		);
	}
};

/**
 * Internal sender shared by legacy helpers and typed routes. It preserves the
 * response body for the caller and leaves HTTP error types to that adapter.
 * @param path - The complete request URL, including the backend context root.
 * @param options - Fetch options, including the already encoded body.
 * @returns The unparsed response, or a failed CSRF bootstrap response.
 */
export const sendRequest = async (
	path: string,
	options: RequestInit,
): Promise<Response> => {
	const generation = getSessionGeneration();
	const method = (options.method ?? "GET").toUpperCase();
	const needsCsrf =
		(CSRF.isEnabled || Env.CSRF) &&
		["POST", "PUT", "DELETE"].includes(method);
	const replayable =
		typeof ReadableStream === "undefined" ||
		!(options.body instanceof ReadableStream);

	for (let attempt = 0; ; attempt += 1) {
		checkRequest(options.signal, generation);
		if (needsCsrf && !CSRF.token) {
			const headers = requestHeaders(options.headers);
			delete headers["x-csrf-token"];
			headers[CSRF_HEADER] = "fetch";
			const bootstrap = await fetch(
				`${Env.MODULE.replace(/\/+$/, "")}/api/config/fetchCsrf`,
				{
					method: "GET",
					headers,
					credentials: options.credentials,
					signal: options.signal,
				},
			);
			checkRequest(options.signal, generation);
			rememberSession(bootstrap, generation, Env.HEADLESS);
			if (!bootstrap.ok || getResponseRedirect(bootstrap)) {
				return bootstrap;
			}
		}

		// The bootstrap may have issued the cookie needed by this very first write.
		const headers = requestHeaders(options.headers);
		if (needsCsrf && CSRF.token) {
			delete headers["x-csrf-token"];
			headers[CSRF_HEADER] = CSRF.token;
		}
		const response = await fetch(path, { ...options, headers });
		checkRequest(options.signal, generation);
		rememberSession(response, generation, Env.HEADLESS);
		if (
			attempt === 0 &&
			needsCsrf &&
			replayable &&
			response.status === 403 &&
			response.headers.get(CSRF_HEADER)?.toLowerCase() === "required"
		) {
			CSRF.token = "";
			continue;
		}
		return response;
	}
};

/** Preserve the legacy redirect error independently of typed route errors. */
const handleLegacyRedirect = (response: Response): void => {
	if (followResponseRedirect(response)) {
		throw new UnauthorizedError(
			"Redirecting from header direct value",
			302,
		);
	}
};

/**
 * Make a get call to the backend.
 * @param path - The complete request URL.
 * @param options - Options to pass into Fetch.
 * @returns The response and parsed JSON data.
 */
export const get = async <O>(path: string, options: RequestInit = {}) => {
	const response = await sendRequest(path, { method: "GET", ...options });
	handleLegacyRedirect(response);
	if (!response.ok) {
		const errorData: unknown = await response.json();
		const details =
			typeof errorData === "object" && errorData !== null
				? (errorData as Record<string, unknown>)
				: {};
		const errorMessage =
			details.message ||
			details.error ||
			details.errorMessage ||
			`Request failed with status ${response.status}`;
		throw new Error(String(errorMessage));
	}
	const data: unknown = await response.json();
	return { response, data: data as O };
};

/**
 * Make a post call to the backend.
 * @param path - The complete request URL.
 * @param body - Form fields or a multipart body.
 * @param options - Options to pass into Fetch.
 * @returns The response and parsed JSON data.
 */
export const post = async <O>(
	path: string,
	body: FormData | Record<string, unknown>,
	options: RequestInit = {},
) => {
	const isFormData = body instanceof FormData;
	const headers = new Headers(options.headers);
	if (!isFormData) {
		headers.set("Content-Type", "application/x-www-form-urlencoded");
	}
	const response = await sendRequest(path, {
		method: "POST",
		body: isFormData
			? body
			: Object.keys(body)
					.map((key) => {
						const value =
							typeof body[key] === "string"
								? body[key]
								: JSON.stringify(body[key]);
						return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
					})
					.join("&"),
		...options,
		headers: Object.fromEntries(headers),
	});
	handleLegacyRedirect(response);
	if (!response.ok) {
		let errorData: unknown = null;
		try {
			errorData = await response.json();
		} catch (error) {
			options.signal?.throwIfAborted();
			if (error instanceof DOMException && error.name === "AbortError") {
				throw error;
			}
		}
		const details =
			typeof errorData === "object" && errorData !== null
				? (errorData as Record<string, unknown>)
				: {};
		const errorMessage =
			details.message ||
			details.error ||
			details.errorMessage ||
			`Request failed with status ${response.status}`;
		throw new HttpError(String(errorMessage), response.status, errorData);
	}
	const data: unknown = await response.json();
	return { response, data: data as O };
};
