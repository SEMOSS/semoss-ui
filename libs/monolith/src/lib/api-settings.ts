/**
 * INTERNAL: the connection store. Not exported from the package.
 *
 * - `ApiClient` (public) writes it: `configure`, `clear`, `reset`.
 * - `@/utility/http` and `@/utility/url` read it to send requests.
 */

/**
 * Connection settings plus the session state shared by every request.
 *
 * Instance fields are the settings; each initializer is its default, so the
 * class is also the type of `ApiClient.configure()`'s argument. Static members
 * hold the active settings (`current`) and the session (CSRF token, cookies).
 *
 * @name ApiSettings
 */
export class ApiSettings {
	/** Context root of the server. Must be absolute in Node, e.g. `http://localhost:8080/Monolith`. */
	basePath = "/Monolith";

	/** Fetch and send the CSRF token on writes (POST / PUT / DELETE). Harmless when the server has CSRF off. */
	csrf = true;

	/** `fetch` credentials mode. */
	credentials: RequestCredentials = "same-origin";

	/** Credentials sent with every request; `null` uses the session cookie only. */
	auth:
		| null
		| { type: "basic"; accessKey: string; secretKey: string }
		| { type: "bearer"; token: string; provider?: string } = null;

	/** Extra headers sent with every request. */
	headers: Record<string, string> = {};

	/** Keep and resend cookies manually. On outside the browser, since Node has no cookie store. */
	cookies = typeof document === "undefined";

	/** Called when the server asks the client to navigate (usually an expired session). `window.location.replace` in the browser, `null` in Node. */
	onRedirect: ((url: string) => void) | null =
		typeof window === "undefined"
			? null
			: (url) => window.location.replace(url);

	/** The active settings. `ApiClient.configure()` replaces it with a merged copy. */
	static current = new ApiSettings();

	/** Cached CSRF token: `null` until fetched, `""` when the server issued none. */
	static csrfToken: string | null = null;

	/** Cookie jar (`name` → `value`), used when `cookies` is on. */
	static readonly cookieJar = new Map<string, string>();

	/**
	 * Forget the CSRF token and cookies, keeping the settings.
	 *
	 * @name clear
	 * @returns Nothing.
	 */
	static clear(): void {
		ApiSettings.csrfToken = null;
		ApiSettings.cookieJar.clear();
	}

	/**
	 * Restore the default settings and clear the session.
	 *
	 * @name reset
	 * @returns Nothing.
	 */
	static reset(): void {
		ApiSettings.current = new ApiSettings();
		ApiSettings.clear();
	}
}
