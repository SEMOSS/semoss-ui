import type { Session } from "electron";
import type { ServerConfig } from "../../../contract/server-connection";

/**
 * Where a request for the server's own module goes instead: the same path on
 * the app's origin, so it carries the app's session cookies through the proxy.
 *
 * @param url - The request.
 * @param server - The current server.
 * @param appOrigin - The app's origin.
 * @returns The local URL, or null for any other request.
 */
export const toLocalModuleUrl = (
	url: string,
	server: ServerConfig | null,
	appOrigin: string,
): string | null => {
	if (!server) return null;
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}
	if (parsed.origin !== server.url) return null;
	if (
		parsed.pathname !== server.module &&
		!parsed.pathname.startsWith(`${server.module}/`)
	) {
		return null;
	}
	return `${appOrigin}${parsed.pathname}${parsed.search}`;
};

/**
 * Bring sign ins back to the app's session. A provider sends its callback to
 * the server's registered address, but the sign in started through the app's
 * origin, whose cookies hold the session it belongs to. Every request for the
 * server's module is sent to the same path on the app's origin, where the proxy
 * forwards it with those cookies.
 *
 * @param session - The app's browser session.
 * @param getServer - The current server.
 * @param appOrigin - The app's origin.
 */
export const routeSignInsThroughApp = (
	session: Session,
	getServer: () => ServerConfig | null,
	appOrigin: string,
): void => {
	session.webRequest.onBeforeRequest(
		{ urls: ["https://*/*", "http://*/*"] },
		(details, callback) => {
			const redirectURL = toLocalModuleUrl(
				details.url,
				getServer(),
				appOrigin,
			);
			callback(redirectURL ? { redirectURL } : {});
		},
	);
};
