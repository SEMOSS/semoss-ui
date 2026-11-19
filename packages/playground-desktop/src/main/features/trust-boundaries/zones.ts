/**
 * Helpers, not a boundary: the zones every boundary in this folder checks
 * against. See AGENTS.md, Trust boundaries, for the table of zones and what
 * each may reach.
 *
 * - The app page: `/` on the app origin (`http://127.0.0.1:<port>`), the only
 *   page the preload exposes the bridge to.
 * - Tool frames: the tool frame origin (`http://tools.localhost:<port>`), another
 *   site, so another renderer process.
 * - Everything else on this machine's loopback (a server page under the
 *   module on the app origin, another local port) is never framed by the app.
 */

/** The paths the app's own page loads at; every route is in its hash. */
const APP_PAGE_PATHS = new Set(["/", "/index.html"]);

/**
 * Whether a URL's host names this machine: `localhost` and any
 * `*.localhost`, which Chromium resolves here itself, `127.x.x.x`, `0.0.0.0`,
 * `[::1]`, `[::]` and IPv4-mapped loopback, with or without a trailing dot.
 * The URL parser has already turned other spellings of an address (decimal,
 * hex) into these.
 *
 * @param hostname - The URL's `hostname`.
 * @returns True for this machine.
 */
const isLoopbackHost = (hostname: string): boolean => {
	const host = hostname.toLowerCase().replace(/\.$/, "");
	return (
		host === "localhost" ||
		host.endsWith(".localhost") ||
		host === "[::1]" ||
		host === "[::]" ||
		host === "0.0.0.0" ||
		/^\[::ffff:(127\.|7f[0-9a-f]{2}:)/.test(host) ||
		/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
	);
};

/**
 * A URL's origin, or null when it is not a URL.
 *
 * @param url - The URL.
 * @returns Its origin.
 */
export const originOf = (url: string): string | null => {
	try {
		return new URL(url).origin;
	} catch {
		return null;
	}
};

/**
 * Whether a URL is the app's own page, the only page the bridge serves. A
 * server page forwarded on the app's origin, under the module, is not.
 *
 * @param url - The URL.
 * @param appOrigin - The app's origin.
 * @returns True for the app's page, at any route.
 */
export const isAppPage = (url: string, appOrigin: string): boolean => {
	try {
		const parsed = new URL(url);
		return (
			parsed.origin === appOrigin && APP_PAGE_PATHS.has(parsed.pathname)
		);
	} catch {
		return false;
	}
};

/**
 * Whether a frame on this URL would load from this machine's loopback, on
 * any port but the tool frame origin's: the app's origin, the dev server, or
 * another local program. On 127.x, at any port, it is the app page's own site
 * and would share its process; any other loopback host is a local program.
 * The app frames neither.
 *
 * @param url - The frame's URL.
 * @param toolFrameOrigin - The tool frame origin, which may be framed.
 * @returns True for a loopback http(s) URL off the tool frame origin.
 */
export const isLoopbackFrameUrl = (
	url: string,
	toolFrameOrigin: string,
): boolean => {
	try {
		const parsed = new URL(url);
		return (
			(parsed.protocol === "http:" || parsed.protocol === "https:") &&
			isLoopbackHost(parsed.hostname) &&
			parsed.origin !== toolFrameOrigin
		);
	} catch {
		return false;
	}
};
