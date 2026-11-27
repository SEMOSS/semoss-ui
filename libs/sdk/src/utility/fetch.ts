import { Env } from "../env";
import { HttpError, UnauthorizedError } from "./error";

export const CSRF = {
	isEnabled: false,
	token: "",
	cookie: "", // only tracked when Env.HEADLESS is set
};

// Node has no cookie jar, so a headless caller has to resend Set-Cookie itself.
const captureHeadlessCookie = (response: Response) => {
	if (!Env.HEADLESS) {
		return;
	}

	const getSetCookie = response.headers.getSetCookie;
	if (typeof getSetCookie !== "function") {
		return;
	}

	const setCookieHeaders = getSetCookie.call(response.headers);
	if (setCookieHeaders.length === 0) {
		return;
	}

	CSRF.cookie = setCookieHeaders.map((c) => c.split(";")[0]).join("; ");
};

/** The methods the server's CSRF filter accepts without a token. */
const CSRF_EXEMPT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * The header a request that changes something sends so the server's CSRF
 * filter accepts it. The session's token is read from the server the first
 * time and kept. When the server does not ask for a token there is nothing to
 * send.
 *
 * `post` sends it already; a call made with `fetch` directly spreads it into
 * its own headers.
 *
 * @returns `X-CSRF-Token` with the session's token, or no headers.
 */
export const getCsrfHeaders = async (): Promise<Record<string, string>> => {
	if (!CSRF.isEnabled && !Env.CSRF) {
		return {};
	}

	if (!CSRF.token) {
		const response = await fetch(`${Env.MODULE}/api/config/fetchCsrf`, {
			headers: {
				"X-CSRF-Token": "fetch",
				...(Env.HEADLESS && CSRF.cookie ? { cookie: CSRF.cookie } : {}),
			},
		});

		// not sure why the proxy server is sending it as lowercase, preserving headers doesn't fix it
		CSRF.token =
			response.headers.get("X-CSRF-Token") ||
			response.headers.get("x-csrf-token") ||
			"";

		captureHeadlessCookie(response);
	}

	return CSRF.token ? { "X-CSRF-Token": CSRF.token } : {};
};

const getAbsoluteUrl = (url: string): string | null => {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const parsed = new URL(url, window.location.origin);
		return parsed.toString();
	} catch {
		return null;
	}
};

const isHtmlResponse = (response: Response): boolean => {
	const contentType = response.headers.get("content-type") || "";
	return contentType.toLowerCase().includes("text/html");
};

const handleHeaderRedirect = (response: Response): boolean => {
	if (typeof window === "undefined") {
		return false;
	}

	// backend behavior (also used in legacy) can send redirect info on API error responses.
	const redirectHeader =
		response.headers.get("redirect") || response.headers.get("location");

	if (redirectHeader) {
		const redirectUrl = getAbsoluteUrl(redirectHeader);
		if (redirectUrl) {
			window.location.replace(Env.REDIRECT_URL || redirectUrl);
			return true;
		}
	}

	// fetch follows redirects for API calls; this catches a final redirected HTML page.
	if (response.redirected && response.url && isHtmlResponse(response)) {
		window.location.replace(response.url);
		return true;
	}

	return false;
};

/** Everyone told when the backend sends a request away to sign in. */
const unauthorizedListeners = new Set<(error: UnauthorizedError) => void>();

/**
 * Hear when the backend sends a request away to sign in, which means the
 * session has ended. The request still throws its error afterwards.
 *
 * @param listener - Called with the error, before it is thrown.
 * @returns Stops listening.
 */
export const onUnauthorized = (
	listener: (error: UnauthorizedError) => void,
): (() => void) => {
	unauthorizedListeners.add(listener);
	return () => {
		unauthorizedListeners.delete(listener);
	};
};

/**
 * Store the interceptors to modify any fetch command
 */
const interceptors: {
	request: ((options: RequestInit) => Promise<RequestInit>) | null;
	response: ((output: { response: Response }) => Promise<void>) | null;
} = {
	request: async (options) => {
		// create the headers if it doesn't exist
		if (!options.headers) {
			options.headers = {};
		}

		if (Env.ACCESS_KEY && Env.SECRET_KEY) {
			// add the authorization tokens
			options.headers = {
				...options.headers,
				authorization: `Basic ${btoa(
					`${Env.ACCESS_KEY}:${Env.SECRET_KEY}`,
				)}`,
			};
		}

		if (Env.BEARER_TOKEN) {
			options.headers = {
				...options.headers,
				authorization: `Bearer ${Env.BEARER_TOKEN}`,
			};
		}

		if (Env.BEARER_PROVIDER) {
			options.headers = {
				...options.headers,
				"Bearer-Provider": Env.BEARER_PROVIDER,
			};
		}

		if (!CSRF_EXEMPT_METHODS.has((options.method ?? "GET").toUpperCase())) {
			options.headers = {
				...options.headers,
				...(await getCsrfHeaders()),
			};
		}

		if (Env.HEADLESS && CSRF.cookie) {
			options.headers = {
				...options.headers,
				cookie: CSRF.cookie,
			};
		}

		return options;
	},
	response: async ({ response }) => {
		captureHeadlessCookie(response);

		if (handleHeaderRedirect(response)) {
			const error = new UnauthorizedError(
				"Redirecting from header direct value",
				302,
			);
			for (const listener of unauthorizedListeners) {
				listener(error);
			}
			throw error;
		}
	},
};

/**
 * Make a get call to the backend
 * @param path - path
 * @param options - options to pass into the fetch
 */
export const get = async <O>(path: string, options: RequestInit = {}) => {
	options = {
		method: "GET",

		...options,
	};

	// intercept
	if (interceptors.request) {
		options = await interceptors.request(options);
	}

	// get the data
	const response = await fetch(`${path}`, options);

	// handle the response
	if (interceptors.response) {
		await interceptors.response({
			response: response,
		});
	}

	if (!response.ok) {
		const errorData = await response.json();
		const errorMessage =
			errorData.message ||
			errorData.error ||
			errorData.errorMessage ||
			`Request failed with status ${response.status}`;
		throw new Error(errorMessage);
	}

	// get the data
	const data = await response.json();

	// return the json
	return {
		response: response,
		data: data as O,
	};
};

/**
 * Read a page the backend serves, such as a published portal, as text. The
 * request carries the same credentials as {@link get}, but a redirect is read
 * as the page it lands on: a page is not an API call, so being sent elsewhere
 * says nothing about the session and never navigates the window.
 *
 * @param path - The page's path.
 * @param options - Options to pass to fetch.
 * @returns The response and its text.
 * @throws When the request fails or the backend answers with an error status.
 */
export const getText = async (path: string, options: RequestInit = {}) => {
	options = {
		method: "GET",

		...options,
	};

	if (interceptors.request) {
		options = await interceptors.request(options);
	}

	const response = await fetch(`${path}`, options);
	captureHeadlessCookie(response);

	if (!response.ok) {
		throw new HttpError(
			`Request failed with status ${response.status}`,
			response.status,
			null,
		);
	}

	return {
		response: response,
		data: await response.text(),
	};
};

/**
 * Make a post call to the backend
 * @param path - path
 * @param body - body to pass in
 * @param options - options to pass into the fetch
 */
export const post = async <O>(
	path: string,
	body: FormData | Record<string, unknown>,
	options: RequestInit = {},
) => {
	const isFormData = body instanceof FormData;

	// Normalize names without mutating the caller's headers.
	const headers = new Headers(options.headers);
	if (!isFormData) {
		headers.set("Content-Type", "application/x-www-form-urlencoded");
	}

	options = {
		method: "POST",
		body: isFormData
			? body
			: Object.keys(body)
					.map((k) => {
						let val = body[k];
						if (typeof val !== "string") {
							val = JSON.stringify(body[k]);
						}

						return `${encodeURIComponent(k)}=${encodeURIComponent(
							val as string,
						)}`;
					})
					.join("&"),
		...options,
		headers: Object.fromEntries(headers),
	};

	// intercept
	if (interceptors.request) {
		options = await interceptors.request(options);
	}

	// get the data
	const response = await fetch(`${path}`, options);

	// handle the response
	if (interceptors.response) {
		await interceptors.response({
			response: response,
		});
	}

	if (!response.ok) {
		let errorData: unknown = null;
		try {
			errorData = await response.json();
		} catch {
			errorData = null;
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

	// get the data
	const data = await response.json();

	// return the json
	return {
		response: response,
		data: data as O,
	};
};
