import { type BrowserWindow, shell } from "electron";

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

/**
 * Keep the app's window on its own origin. A link elsewhere opens in the
 * system browser; a sign in popup, whether it starts on the sign in or blank
 * for a connector, opens as a sandboxed child window, the handle the SDK
 * watches to know when the sign in is done.
 *
 * @param window - The app's window.
 * @param appOrigin - The app's origin.
 * @param getModule - The current server's module path.
 */
export const secureWindow = (
	window: BrowserWindow,
	appOrigin: string,
	getModule: () => string | undefined,
): void => {
	const { webContents } = window;

	webContents.on("will-navigate", (event, url) => {
		if (new URL(url).origin === appOrigin) return;
		event.preventDefault();
		if (isExternalLink(url)) void shell.openExternal(url);
	});

	webContents.setWindowOpenHandler(({ url, frameName }) => {
		if (
			isSignInPopup(url, appOrigin, getModule()) ||
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
		if (isExternalLink(url) && new URL(url).origin !== appOrigin) {
			void shell.openExternal(url);
		}
		return { action: "deny" };
	});

	// a sign in window may go anywhere a provider sends it, but opens nothing
	webContents.on("did-create-window", (child) => {
		child.webContents.setWindowOpenHandler(({ url }) => {
			if (isExternalLink(url)) void shell.openExternal(url);
			return { action: "deny" };
		});
	});
};
