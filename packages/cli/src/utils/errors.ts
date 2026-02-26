/**
 * @module utils/errors
 *
 * User-facing error classification for SEMOSS server connections.
 *
 * Network errors from Node's `fetch` are wrapped in generic `TypeError`
 * messages ("fetch failed") with the real cause buried in `.cause`.
 * Additionally, the SEMOSS server returns HTML redirects (HTTP 200)
 * instead of a proper 401 for bad credentials, which surfaces as a
 * JSON-parse failure rather than an auth error.
 *
 * This module provides {@link formatConnectionError} which:
 * 1. Walks the full `.cause` chain via {@link deepErrorMessage}.
 * 2. Pattern-matches known error signatures.
 * 3. Returns a human-readable message + actionable suggestions.
 *
 * Used by: `whoami`, `connect`, `setup`.
 */

/**
 * Unwrap an error's full message chain.
 *
 * Node's built-in `fetch` wraps the real network error in
 * `TypeError: fetch failed` with the cause buried in `error.cause`.
 * The cause is often an `AggregateError` whose `message` is empty but
 * carries a `.code` like `"ECONNREFUSED"`.  This helper walks the
 * `.cause` chain and concatenates every useful piece it finds so
 * downstream matchers can see the real reason.
 *
 * @example
 * ```
 * // TypeError: fetch failed
 * //   [cause]: AggregateError [ECONNREFUSED]
 * deepErrorMessage(err) // → "fetch failed — ECONNREFUSED"
 * ```
 */
function deepErrorMessage(error: unknown): string {
	if (!(error instanceof Error)) return String(error);

	const parts: string[] = [];

	let current: unknown = error;
	while (current instanceof Error) {
		// Prefer the message, but fall back to the error code
		// (AggregateError from Node fetch often has an empty message
		// but a useful `.code` like "ECONNREFUSED").
		const msg =
			current.message || (current as NodeJS.ErrnoException).code || "";
		if (msg) parts.push(msg);

		current = current.cause;
	}

	return parts.join(" — ");
}

/**
 * Classify a connection/auth error into a user-friendly message and
 * a list of suggestions the user can try.
 *
 * The checks are ordered from most specific to least specific so the
 * first match wins.  If no pattern matches, the raw (unwrapped) error
 * message is returned with generic advice.
 *
 * @param error - Any thrown value (typically an `Error` from the SDK).
 * @returns An object with `message` (one-liner) and `suggestions` (array).
 */
export function formatConnectionError(error: unknown): {
	message: string;
	suggestions: string[];
} {
	const errorMessage = deepErrorMessage(error);

	// HTML response instead of JSON
	if (
		errorMessage.includes("is not valid JSON") ||
		errorMessage.includes("<!doctype") ||
		errorMessage.includes("Unexpected token '<'")
	) {
		return {
			message:
				"Server returned an unexpected HTML response (authentication may have failed)",
			suggestions: [
				"Verify your Access Key and Secret Key are correct",
				"Check that the server URL is correct",
				"Ensure the URL includes the correct path (e.g. https://your-server.com/Monolith)",
			],
		};
	}

	// Network/DNS errors
	if (
		errorMessage.includes("ENOTFOUND") ||
		errorMessage.includes("getaddrinfo")
	) {
		return {
			message: "Cannot reach the server (DNS lookup failed)",
			suggestions: [
				"Check that the server URL is correct",
				"Verify you have internet connectivity",
				"Check if the server is accessible from your network",
			],
		};
	}

	// Connection refused
	if (
		errorMessage.includes("ECONNREFUSED") ||
		errorMessage.includes("connect ECONNREFUSED")
	) {
		return {
			message: "Connection refused by server",
			suggestions: [
				"Verify the server is running",
				"Check that the port number is correct",
				"Ensure firewall allows the connection",
			],
		};
	}

	// Timeout
	if (
		errorMessage.includes("timeout") ||
		errorMessage.includes("ETIMEDOUT")
	) {
		return {
			message: "Connection timed out",
			suggestions: [
				"Check that the server is responding",
				"Verify network connectivity",
				"Try again in a moment",
			],
		};
	}

	// SSL/TLS errors
	if (
		errorMessage.includes("certificate") ||
		errorMessage.includes("SSL") ||
		errorMessage.includes("TLS")
	) {
		return {
			message: "SSL/TLS certificate error",
			suggestions: [
				"Check that the server has a valid SSL certificate",
				"Verify you're using https:// for secure servers",
				"Contact your server administrator",
			],
		};
	}

	// Authentication errors
	if (
		errorMessage.includes("Authentication failed") ||
		errorMessage.includes("Unauthorized") ||
		errorMessage.includes("401")
	) {
		return {
			message: "Authentication failed",
			suggestions: [
				"Verify your Access Key is correct",
				"Verify your Secret Key is correct",
				"Check that your credentials haven't expired",
			],
		};
	}

	// Forbidden
	if (errorMessage.includes("Forbidden") || errorMessage.includes("403")) {
		return {
			message: "Access forbidden",
			suggestions: [
				"Your credentials may not have permission",
				"Contact your administrator for access",
			],
		};
	}

	// Generic error
	return {
		message: errorMessage,
		suggestions: [
			"Check the server URL and credentials",
			"Verify the server is accessible",
			"Try again in a moment",
		],
	};
}
