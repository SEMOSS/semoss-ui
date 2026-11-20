import { app } from "electron";

/**
 * Boundary: any page → new windows, `<webview>`s and the renderer's own
 * privileges.
 * Enforces: every renderer is sandboxed; no page can attach a `<webview>`
 * (which could carry its own preload); and a new window is refused unless its
 * window's own rules allow it (`secureWindow` for the app's window).
 * Exceptions: the sign in popups `secureWindow` allows.
 */

/**
 * Make sandboxing and these defaults apply to every web contents the app
 * ever makes, including ones added later. Call before the app is ready.
 */
export const guardAllWebContents = (): void => {
	app.enableSandbox();
	app.on("web-contents-created", (_event, contents) => {
		contents.on("will-attach-webview", (event) => event.preventDefault());
		// a window's own rules replace this; one without any opens nothing
		contents.setWindowOpenHandler(() => ({ action: "deny" }));
	});
};
