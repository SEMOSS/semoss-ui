import type { OnBeforeRequestListenerDetails } from "electron";
import type { ServerConfig } from "../../../contract/server-connection";

/**
 * Sign ins come back through the app. A provider sends its callback to the
 * server's registered address, but the sign in started through the app's
 * origin, whose cookies hold the session it belongs to. Every request for the
 * server's module is sent to the same path on a local origin, where the proxy
 * forwards it with those cookies. `trust-boundaries/web-requests.ts` installs
 * this on each session.
 */

/**
 * Where a request for the server's own module goes instead: the same path on
 * a local origin, so it carries the app's session cookies through the proxy.
 *
 * @param url - The request.
 * @param server - The current server.
 * @param localOrigin - The local origin to send it to.
 * @returns The local URL, or null for any other request.
 */
export const toLocalModuleUrl = (
	url: string,
	server: ServerConfig | null,
	localOrigin: string,
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
	return `${localOrigin}${parsed.pathname}${parsed.search}`;
};

/** The local origins a server's requests are brought back to. */
export interface LocalOrigins {
	/** The app's origin, which holds its page. */
	readonly appOrigin: string;
	/** The origin tool views are framed from. */
	readonly toolFrameOrigin: string;
}

/**
 * Which local origin a request for the server's module goes to: a frame, or a
 * call a tool view makes, stays on the tool frame origin, so a server page is
 * never framed on the app's origin; anything else goes to the app's origin.
 *
 * @param details - The request's type and the origin that made it.
 * @param origins - The local origins.
 * @returns The origin to send it to.
 */
export const pickLocalOrigin = (
	details: Pick<
		OnBeforeRequestListenerDetails,
		"resourceType" | "initiatorOrigin"
	>,
	{ appOrigin, toolFrameOrigin }: LocalOrigins,
): string =>
	details.resourceType === "subFrame" ||
	details.initiatorOrigin === toolFrameOrigin
		? toolFrameOrigin
		: appOrigin;
