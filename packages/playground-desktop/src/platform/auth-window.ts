import type { SignInWindow, SignInWindowOpener } from "@semoss/sdk";
import { invokeCommand, listenEvent } from "./tauri";

/** What the Rust side reports about a sign in window. */
interface AuthWindowEvent {
	label: string;
	/** The page it navigated to; absent once it closed. */
	url?: string;
}

let nextWindow = 0;

/**
 * Whether a sign in window's page is back on the instance, away from its
 * sign in pages, which is where the backend sends it once a sign in
 * finishes.
 *
 * @param url - The window's page.
 * @param moduleUrl - The instance's module address.
 * @returns True once it is back.
 */
export const isBackOnInstance = (url: string, moduleUrl: string): boolean => {
	try {
		const page = new URL(url);
		const instance = new URL(moduleUrl);
		return (
			page.origin === instance.origin &&
			!page.pathname.startsWith(`${instance.pathname}/api/auth`) &&
			!page.pathname.includes("/oauth")
		);
	} catch {
		return false;
	}
};

/**
 * Sign ins open in a window of the app's own (`open_auth_window`), which
 * shares the main window's cookie jar, so a sign in reaches the session. The
 * window is made by the Rust side, which reports its navigations and its
 * close; it opens straight from the click, blank when the SDK asks for that.
 *
 * @param moduleUrl - The instance's module address.
 * @returns The opener for `setSignInWindowOpener`.
 */
export const createTauriSignInWindowOpener =
	(moduleUrl: string): SignInWindowOpener =>
	(request) => {
		nextWindow += 1;
		const label = `semoss-auth-${nextWindow}`;
		let isClosed = false;
		let isBack = false;
		const stops: Promise<() => void>[] = [
			listenEvent<AuthWindowEvent>("auth-window://navigated", (event) => {
				if (event.label === label && event.url) {
					isBack = isBackOnInstance(event.url, moduleUrl);
				}
			}),
			listenEvent<AuthWindowEvent>("auth-window://closed", (event) => {
				if (event.label === label) {
					isClosed = true;
					for (const stop of stops) {
						void stop.then((unlisten) => unlisten());
					}
				}
			}),
		];
		void invokeCommand("open_auth_window", {
			label: label,
			url: request.url ?? "about:blank",
		}).catch(() => {
			isClosed = true;
		});

		const signInWindow: SignInWindow = {
			get closed() {
				return isClosed;
			},
			navigate: (url) => {
				isBack = false;
				void invokeCommand("navigate_auth_window", {
					label: label,
					url: url,
				});
			},
			isBack: () => isBack,
			close: () => {
				void invokeCommand("close_auth_window", { label: label });
			},
		};
		return signInWindow;
	};
