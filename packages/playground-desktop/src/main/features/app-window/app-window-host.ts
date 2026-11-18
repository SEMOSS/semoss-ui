import type { BrowserWindow } from "electron";
import { setAppMenu } from "../menu/app-menu";
import type { DesktopConfigFile } from "../server-connection/desktop-config";
import type { ServerSessions } from "../server-connection/server-sessions";
import { createMainWindow } from "./main-window";
import { secureWindow } from "./window-security";

/** The app's one window, on the browser session of the server in use. */
export interface AppWindowHost {
	/** The window, or null before it opens and after it closes. */
	getWindow: () => BrowserWindow | null;
	/**
	 * Show the server in use. A window's session is fixed when it is made, so
	 * a different server gets a new window where the old one was, and the old
	 * one closes; the same server reloads in place.
	 */
	open: () => Promise<void>;
}

/** What {@link createAppWindowHost} needs. */
interface AppWindowHostOptions {
	/** The app's origin, which the window loads. */
	readonly appOrigin: string;
	/** The origin tool views are framed from. */
	readonly toolFrameOrigin: string;
	/** The saved config: the server in use, and the window's state. */
	readonly config: DesktopConfigFile;
	/** The servers' browser sessions. */
	readonly sessions: ServerSessions;
}

/**
 * Keep the app's window on the server in use.
 *
 * @param options - The origins, the config, and the sessions.
 * @returns The window host.
 */
export const createAppWindowHost = ({
	appOrigin,
	toolFrameOrigin,
	config,
	sessions,
}: AppWindowHostOptions): AppWindowHost => {
	let current: BrowserWindow | null = null;

	const open = async (): Promise<void> => {
		const serverSession = sessions.get(config.server?.partition ?? null);
		const previous = current;
		if (previous && previous.webContents.session === serverSession) {
			// load the root, not reload: a reload keeps the `#/server` route
			await previous.loadURL(`${appOrigin}/`);
			return;
		}
		if (previous) {
			// the new window opens where this one is
			config.setWindow({
				...previous.getNormalBounds(),
				isMaximized: previous.isMaximized(),
			});
		}

		const window = createMainWindow(config, serverSession, toolFrameOrigin);
		secureWindow(window, appOrigin, () => config.server?.module);
		setAppMenu(window);
		current = window;
		window.on("closed", () => {
			if (current === window) current = null;
		});
		await window.loadURL(`${appOrigin}/`);
		// closed only once the new one is up, so the app never has no window
		previous?.close();
	};

	return { getWindow: () => current, open };
};
