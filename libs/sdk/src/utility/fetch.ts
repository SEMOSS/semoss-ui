import { Env } from "../env";
import { UnauthorizedError } from "./error";

export const CSRF = {
	isEnabled: false,
	token: "",
};
export function resetCsrfToken(): void {
	CSRF.token = "";
	csrfToken = null;
	csrfPromise = null;
	// CSRF token has been reset
}

/**
 * Centralized CSRF token fetcher.
 * Ensures token is fetched once and cached.
 * this will only fetch it once and use it for all requests
 */
let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

/**
 * Fetch CSRF token if not already cached.
 */
export async function fetchCsrfTokenIfNeeded(): Promise<string> {
	if (csrfToken) return csrfToken;

	if (!csrfPromise) {
		csrfPromise = fetch(`${Env.MODULE}/api/config/fetchCsrf`, {
			headers: {
				"X-CSRF-Token": "fetch",
			},
		})
			.then(async (res) => {
				// not sure why the proxy server is sending it as lowercase, preserving headers doesn't fix it
				const token =
					res.headers.get("X-CSRF-Token") ||
					res.headers.get("x-csrf-token") ||
					"";

				csrfToken = token;
				return token;
			})
			.catch((_err) => {
				csrfToken = null;
				throw Error("Failed to fetch CSRF token:");
			})
			.finally(() => {
				csrfPromise = null;
			});
	}

	return csrfPromise;
}

/**
 * Getter for the already fetched token.
 * Returns `null` if not yet fetched.
 */
export function getCsrfToken(): string | null {
	return csrfToken;
}

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

		// only set if enabled
		if (CSRF.isEnabled || Env.CSRF) {
			if (options.method === "POST" || options.method === "GET") {
				// use the token if it is there otherwise fetch it
				if (!CSRF.token) {
					try {
						const token =
							getCsrfToken() || (await fetchCsrfTokenIfNeeded());
						CSRF.token = token || "";
					} catch (error) {
						if (error instanceof Error) {
							CSRF.token = "";
							throw Error("Failed to fetch CSRF token:");
						}
					}
				}

				// add the token
				if (CSRF.token) {
					options.headers = {
						...options.headers,
						"X-CSRF-Token": CSRF.token,
					};
				}
			}
		}

		return options;
	},
	response: async ({ response }) => {
		// TODO: maybe we shouldn't just throw unauthorized error for 302 and actually honor the redirect?
		if (response.status === 302) {
			throw new UnauthorizedError("Unauthorized");
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

	// create a new headers object or use the option
	let headers: HeadersInit = {};
	if (options.headers) {
		headers = options.headers;
	}

	// add headers if not a form
	if (!isFormData) {
		(headers as Record<string, string>)["Content-Type"] =
			"application/x-www-form-urlencoded";
	}

	options = {
		method: "POST",
		headers: headers,
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
