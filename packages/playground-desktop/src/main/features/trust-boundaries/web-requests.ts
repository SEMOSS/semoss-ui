import type {
	OnBeforeRequestListenerDetails,
	OnBeforeSendHeadersListenerDetails,
	Session,
} from "electron";
import type { ServerConfig } from "../../../contract/server-connection";
import { pickLocalOrigin, toLocalModuleUrl } from "../auth/sign-in-redirect";
import { isLoopbackFrameUrl, originOf } from "./zones";

/**
 * Boundary: every request a server's session makes → this machine and the
 * server. Electron allows one listener per webRequest event and session, so
 * every rule lives here.
 * Enforces:
 * - No frame, `<object>` or `<embed>` ever loads from this machine's loopback
 *   except the tool frame origin: on 127.0.0.1 it would be the app page's own
 *   site and share its process, and anywhere else it is another program. A
 *   `system://` tool view, which the chat frames on the page's own origin, is
 *   refused here.
 * - The tool frame key, the one thing the tool frame origin answers to
 *   (`local-server.ts`), goes only to the app's window: the tool views' own
 *   requests, their workers', and the app page loading a tool frame. No other
 *   frame in the window (a model preview, say), no other window or popup, and
 *   no local program can use the tool frame origin as a signed in proxy; and
 *   the key is stripped from every other request, so a redirect never carries
 *   it off this machine.
 * - A request for the server's own address comes back through the app
 *   (`sign-in-redirect.ts`).
 * Exceptions: none.
 */

/** The header the tool frame origin requires, with this launch's key. */
export const TOOL_FRAME_KEY_HEADER = "x-semoss-desktop-key";

/** What {@link guardWebRequests} needs. */
export interface WebRequestGuards {
	/** The app's origin. */
	readonly appOrigin: string;
	/** The origin tool views are framed from. */
	readonly toolFrameOrigin: string;
	/** This launch's tool frame key. */
	readonly toolFrameKey: string;
	/** The server in use, which sign ins are routed to. */
	readonly getServer: () => ServerConfig | null;
	/** The app's window's contents id, while it is open. */
	readonly getAppWebContentsId: () => number | undefined;
}

/** The kinds of request that put a page in a frame. */
const FRAME_RESOURCE_TYPES: ReadonlySet<string> = new Set([
	"subFrame",
	"object",
]);

/**
 * What to do with a request before it is sent: bring a request for the
 * server's own module back through a local origin, or else refuse a frame on
 * this machine's loopback.
 *
 * @param details - The request.
 * @param guards - The origins and the server.
 * @returns Electron's answer: cancel, redirect, or nothing.
 */
export const answerRequest = (
	details: Pick<
		OnBeforeRequestListenerDetails,
		"url" | "resourceType" | "initiatorOrigin"
	>,
	{
		appOrigin,
		toolFrameOrigin,
		getServer,
	}: Pick<WebRequestGuards, "appOrigin" | "toolFrameOrigin" | "getServer">,
): { cancel?: boolean; redirectURL?: string } => {
	// first: a server on this machine is still brought to the tool frame origin
	const redirectURL = toLocalModuleUrl(
		details.url,
		getServer(),
		pickLocalOrigin(details, { appOrigin, toolFrameOrigin }),
	);
	if (redirectURL) return { redirectURL };
	if (
		FRAME_RESOURCE_TYPES.has(details.resourceType) &&
		isLoopbackFrameUrl(details.url, toolFrameOrigin)
	) {
		return { cancel: true };
	}
	return {};
};

/**
 * Whether a request to the tool frame origin comes from the app's window as
 * a tool view: made by a tool view (in the window, or by one of its workers,
 * which have no window of their own), or the app page loading a tool frame.
 *
 * @param details - The request.
 * @param origins - The app's origin and the tool frame origin.
 * @param appWebContentsId - The app's window, or undefined while it is closed.
 * @returns True when it gets the key.
 */
const isToolViewRequest = (
	{
		webContentsId,
		initiatorOrigin,
		resourceType,
	}: Pick<
		OnBeforeSendHeadersListenerDetails,
		"webContentsId" | "initiatorOrigin" | "resourceType"
	>,
	{
		appOrigin,
		toolFrameOrigin,
	}: Pick<WebRequestGuards, "appOrigin" | "toolFrameOrigin">,
	appWebContentsId: number | undefined,
): boolean => {
	if (appWebContentsId === undefined) return false;
	if (initiatorOrigin === toolFrameOrigin) {
		return (
			webContentsId === appWebContentsId || webContentsId === undefined
		);
	}
	return (
		initiatorOrigin === appOrigin &&
		resourceType === "subFrame" &&
		webContentsId === appWebContentsId
	);
};

/**
 * A request's headers as they are sent: the tool frame key added for a tool
 * view's request to the tool frame origin ({@link isToolViewRequest}), and
 * removed from every other request.
 *
 * @param details - The request.
 * @param guards - The origins, the key, and the app's window.
 * @returns The headers to send.
 */
export const headersFor = (
	details: Pick<
		OnBeforeSendHeadersListenerDetails,
		| "url"
		| "webContentsId"
		| "initiatorOrigin"
		| "resourceType"
		| "requestHeaders"
	>,
	guards: Pick<
		WebRequestGuards,
		"appOrigin" | "toolFrameOrigin" | "toolFrameKey" | "getAppWebContentsId"
	>,
): Record<string, string> => {
	const headers: Record<string, string> = {};
	for (const [name, value] of Object.entries(details.requestHeaders)) {
		if (name.toLowerCase() !== TOOL_FRAME_KEY_HEADER) headers[name] = value;
	}
	if (
		originOf(details.url) === guards.toolFrameOrigin &&
		isToolViewRequest(details, guards, guards.getAppWebContentsId())
	) {
		headers[TOOL_FRAME_KEY_HEADER] = guards.toolFrameKey;
	}
	return headers;
};

/**
 * Install every request rule on a session.
 *
 * @param session - A server's session, or the default one.
 * @param guards - The origins, the key, the server and the app's window.
 */
export const guardWebRequests = (
	session: Session,
	guards: WebRequestGuards,
): void => {
	session.webRequest.onBeforeRequest(
		{ urls: ["https://*/*", "http://*/*"] },
		(details, callback) => callback(answerRequest(details, guards)),
	);
	// every request, so the key is stripped wherever a redirect sends one
	session.webRequest.onBeforeSendHeaders(
		{ urls: ["https://*/*", "http://*/*"] },
		(details, callback) =>
			callback({ requestHeaders: headersFor(details, guards) }),
	);
};
