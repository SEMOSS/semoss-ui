import { Env } from "../env";
import { UnauthorizedError } from "./error";

export const CSRF = {
	isEnabled: false,
	token: "",
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
			window.location.replace(redirectUrl);
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

		// only set if enabled
		if (CSRF.isEnabled || Env.CSRF) {
			if (options.method === "POST") {
				// use the token if it is there otherwise fetch it
				if (!CSRF.token) {
					const response = await fetch(
						`${Env.MODULE}/api/config/fetchCsrf`,
						{
							headers: {
								"X-CSRF-Token": "fetch",
							},
						},
					);

					// not sure why the proxy server is sending it as lowercase, preserving headers doesn't fix it
					CSRF.token =
						response.headers.get("X-CSRF-Token") ||
						response.headers.get("x-csrf-token") ||
						"";
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
		if (handleHeaderRedirect(response)) {
			throw new UnauthorizedError(
				"Redirecting from header direct value",
				302,
			);
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
		let errorData: Record<string, string> = {};
		try {
			errorData = await response.json();
		} catch {
			errorData = {};
		}
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
