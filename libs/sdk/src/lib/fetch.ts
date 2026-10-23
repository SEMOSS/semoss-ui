import { followResponseRedirect, sendRequest } from "../utility/request";
import { csrfState } from "../utility/session";
import { HttpError, UnauthorizedError } from "./error";

/**
 * Mutable CSRF configuration and session credentials shared by HTTP helpers and
 * typed routes. Assigning `cookie` replaces the headless session's cookie jar.
 */
export const CSRF: { isEnabled: boolean; token: string; cookie: string } =
	csrfState;

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
