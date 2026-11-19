import { type BrowserWindow, shell } from "electron";
import {
	isModulePath,
	isPlainPath,
	isPlatformPath,
	type ServerConfig,
} from "../../../contract/server-connection";
import { isAppPage } from "../trust-boundaries/zones";

/** The link protocols the system browser (or mail app) may open. */
const EXTERNAL_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

/**
 * Whether a link may open in the system browser.
 *
 * @param url - The link.
 * @returns True for web and mail links.
 */
export const isExternalLink = (url: string): boolean => {
	try {
		return EXTERNAL_PROTOCOLS.has(new URL(url).protocol);
	} catch {
		return false;
	}
};

/**
 * Whether a new window is the SDK's sign in popup, which starts on the app's
 * own origin at the module's `/api/auth/login/...`.
 *
 * @param url - The window's first URL.
 * @param appOrigin - The app's origin.
 * @param module - The server's module path.
 * @returns True for a sign in popup.
 */
export const isSignInPopup = (
	url: string,
	appOrigin: string,
	module: string | undefined,
): boolean => {
	if (!module) return false;
	try {
		const parsed = new URL(url);
		return (
			parsed.origin === appOrigin &&
			parsed.pathname.startsWith(`${module}/api/auth/login/`)
		);
	} catch {
		return false;
	}
};

/** The window name the SDK's `connectLogin` gives its popup. */
const CONNECT_POPUP_NAME = "semoss-connect";

/**
 * Whether a new window is the SDK's connector sign in popup. `connectLogin`
 * opens it blank, signs out any stale login, and only then sends it to the
 * sign in, so it starts on `about:blank` under its own name.
 *
 * @param url - The window's first URL.
 * @param frameName - The name `window.open` gave it.
 * @returns True for a connector sign in popup.
 */
export const isConnectPopup = (url: string, frameName: string): boolean =>
	frameName === CONNECT_POPUP_NAME && (url === "" || url === "about:blank");

/** The local origins, and the server they forward to. */
export interface WindowOrigins {
	/** The app's origin. */
	readonly appOrigin: string;
	/** The origin tool views are framed from. */
	readonly toolFrameOrigin: string;
	/** The server in use. */
	readonly getServer: () => ServerConfig | null;
}

/**
 * Where a link opens in the system browser. A link to the server's module or
 * platform on a local origin (a tool's "open in new tab", say) opens at the
 * server's own address, since the system browser has none of the app's
 * cookies and the tool frame origin answers only the app's window; any other
 * local link opens nowhere.
 *
 * @param url - The link.
 * @param origins - The local origins and the server.
 * @returns The URL to open, or null to open nothing.
 */
export const externalUrlFor = (
	url: string,
	{ appOrigin, toolFrameOrigin, getServer }: WindowOrigins,
): string | null => {
	if (!isExternalLink(url)) return null;
	const parsed = new URL(url);
	if (parsed.origin !== appOrigin && parsed.origin !== toolFrameOrigin) {
		return url;
	}
	const server = getServer();
	const path = `${parsed.pathname}${parsed.search}`;
	if (
		!server ||
		!isPlainPath(path) ||
		!(
			isModulePath(path, server.module) ||
			isPlatformPath(path, server.module)
		)
	) {
		return null;
	}
	return `${server.url}${path}${parsed.hash}`;
};

/**
 * Keep the app's window on its own page, the one the preload exposes the
 * bridge to; a server page, even on the app's origin, is refused. A link
 * elsewhere opens in the system browser ({@link externalUrlFor}); a sign in
 * popup, whether it starts on the sign in or blank for a connector, opens as a
 * sandboxed child window, the handle the SDK watches to know when the sign in
 * is done.
 *
 * @param window - The app's window.
 * @param origins - The local origins and the server in use.
 */
export const secureWindow = (
	window: BrowserWindow,
	origins: WindowOrigins,
): void => {
	const { webContents } = window;
	const { appOrigin, getServer } = origins;
	const openOutside = (url: string): void => {
		const target = externalUrlFor(url, origins);
		if (target) void shell.openExternal(target);
	};

	webContents.on("will-navigate", (event, url) => {
		if (isAppPage(url, appOrigin)) return;
		event.preventDefault();
		openOutside(url);
	});

	webContents.setWindowOpenHandler(({ url, frameName }) => {
		if (
			isSignInPopup(url, appOrigin, getServer()?.module) ||
			isConnectPopup(url, frameName)
		) {
			return {
				action: "allow",
				overrideBrowserWindowOptions: {
					width: 520,
					height: 680,
					parent: window,
					autoHideMenuBar: true,
					webPreferences: {
						// the server's own session, so the sign in lands in it
						session: webContents.session,
						contextIsolation: true,
						sandbox: true,
						nodeIntegration: false,
					},
				},
			};
		}
		openOutside(url);
		return { action: "deny" };
	});

	// a sign in window may go anywhere a provider sends it, but opens nothing
	webContents.on("did-create-window", (child) => {
		child.webContents.setWindowOpenHandler(({ url }) => {
			openOutside(url);
			return { action: "deny" };
		});
	});
};
