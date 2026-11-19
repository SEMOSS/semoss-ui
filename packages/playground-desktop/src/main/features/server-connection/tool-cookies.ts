import type { CookiesSetDetails, Session } from "electron";

/**
 * Tool views sign in with the app's cookies. Tool views are framed from
 * `tools.localhost`, another site than the app's `127.0.0.1`, so the browser
 * does not send them the app's cookies. The tool frame origin's proxy, in this
 * process, adds them instead, and keeps the cookies the server sets for tools
 * in the app's jar, so a tool is signed in as the user, as on the web. A tool's
 * page never holds the app's cookies itself.
 */

/** One `Set-Cookie`, read into what Electron's cookie store takes. */
export interface ParsedCookie {
	readonly name: string;
	readonly value: string;
	/** Its `Path`, when it has one. */
	readonly path?: string;
	readonly httpOnly: boolean;
	readonly sameSite: NonNullable<CookiesSetDetails["sameSite"]>;
	/** When it ends, in seconds since 1970; none for a browser-session cookie. */
	readonly expirationDate?: number;
	/** True when the server deleted it (a past date, or `Max-Age=0`). */
	readonly isDeleted: boolean;
}

/** The `SameSite` values the store takes, by the attribute's lower case value. */
const SAME_SITE: Readonly<Record<string, ParsedCookie["sameSite"]>> = {
	lax: "lax",
	strict: "strict",
	none: "no_restriction",
};

/**
 * Read one `Set-Cookie` value. `Domain` and `Secure` are ignored: the cookie
 * belongs to the app's origin (as `localizeCookie` makes it).
 *
 * @param header - The value, as `localizeCookie` returned it.
 * @param nowSeconds - The time now, in seconds since 1970.
 * @returns The cookie, or null when it has no name.
 */
export const parseSetCookie = (
	header: string,
	nowSeconds: number,
): ParsedCookie | null => {
	const [pair = "", ...attributes] = header
		.split(";")
		.map((part) => part.trim());
	const equals = pair.indexOf("=");
	if (equals <= 0) return null;
	let path: string | undefined;
	let httpOnly = false;
	let sameSite: ParsedCookie["sameSite"] = "lax";
	let maxAge: number | undefined;
	let expires: number | undefined;
	for (const attribute of attributes) {
		const [rawName = "", ...rest] = attribute.split("=");
		const name = rawName.trim().toLowerCase();
		const value = rest.join("=").trim();
		if (name === "path" && value.startsWith("/")) path = value;
		else if (name === "httponly") httpOnly = true;
		else if (name === "samesite")
			sameSite = SAME_SITE[value.toLowerCase()] ?? "lax";
		else if (name === "max-age" && /^-?\d+$/.test(value))
			maxAge = Number(value);
		else if (name === "expires") {
			const time = Date.parse(value);
			if (!Number.isNaN(time)) expires = time / 1000;
		}
	}
	// Max-Age wins over Expires
	const expirationDate = maxAge !== undefined ? nowSeconds + maxAge : expires;
	return {
		name: pair.slice(0, equals).trim(),
		value: pair.slice(equals + 1).trim(),
		path,
		httpOnly,
		sameSite,
		expirationDate,
		isDeleted: expirationDate !== undefined && expirationDate <= nowSeconds,
	};
};

/**
 * One `Cookie` header from two: the app's cookies, then any the tool's page
 * set on its own origin that do not share a name with one of the app's, so a
 * tool can never replace the user's session cookie.
 *
 * @param appCookies - The app's cookies for the request's path.
 * @param pageHeader - The `Cookie` header the browser sent, if any.
 * @returns The header to forward, or empty for none.
 */
export const mergeCookieHeader = (
	appCookies: readonly { readonly name: string; readonly value: string }[],
	pageHeader: string | undefined,
): string => {
	const names = new Set(appCookies.map((cookie) => cookie.name));
	const pageCookies = (pageHeader ?? "")
		.split(";")
		.map((part) => part.trim())
		.filter((part) => {
			const name = part.split("=")[0]?.trim();
			return !!name && !names.has(name);
		});
	return [
		...appCookies.map(({ name, value }) => `${name}=${value}`),
		...pageCookies,
	].join("; ");
};

/** The app's cookie jar, as the tool frame origin's proxy uses it. */
export interface ToolCookieJar {
	/**
	 * The `Cookie` header for a tool's request.
	 *
	 * @param url - The request's path on the app's origin, such as
	 * `http://127.0.0.1:4321/Monolith/api/config`.
	 * @param pageHeader - The `Cookie` header the browser sent, if any.
	 */
	header: (url: string, pageHeader: string | undefined) => Promise<string>;
	/**
	 * Keep the cookies the server set in answer to a tool's request.
	 *
	 * @param url - The request's path on the app's origin.
	 * @param setCookies - The `Set-Cookie` values, as `localizeCookie` returned them.
	 */
	store: (url: string, setCookies: readonly string[]) => Promise<void>;
}

/**
 * The app's cookie jar, in the session of the server in use.
 *
 * @param getSession - The session of the server in use.
 * @returns The jar.
 */
export const createToolCookieJar = (
	getSession: () => Session,
): ToolCookieJar => ({
	header: async (url, pageHeader) => {
		const cookies = await getSession().cookies.get({ url });
		return mergeCookieHeader(cookies, pageHeader);
	},
	store: async (url, setCookies) => {
		const { cookies } = getSession();
		const now = Date.now() / 1000;
		await Promise.all(
			setCookies.map((header) => {
				const cookie = parseSetCookie(header, now);
				if (!cookie) return undefined;
				// only the cookie at the path the server named, as a browser would
				if (cookie.isDeleted) {
					return cookies.remove(
						cookie.path ? new URL(cookie.path, url).href : url,
						cookie.name,
					);
				}
				return cookies.set({
					url,
					name: cookie.name,
					value: cookie.value,
					path: cookie.path,
					httpOnly: cookie.httpOnly,
					sameSite: cookie.sameSite,
					expirationDate: cookie.expirationDate,
				});
			}),
		);
	},
});
