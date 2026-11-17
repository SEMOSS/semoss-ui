import { type BrowserWindow, type Session, shell } from "electron";
import { parseServerConfig } from "../../../contract/server-connection";
import { isExternalLink } from "../app-window/window-security";
import { checkServer } from "../server-connection/check-server";
import type { SettingsFile } from "../server-connection/settings-file";
import { handleIpc } from "./handle-ipc";

/** What the IPC handlers act on. */
interface RegisterIpcOptions {
	/** The app's origin, the only one allowed to call. */
	readonly appOrigin: string;
	/** The saved settings, which hold the server. */
	readonly settings: SettingsFile;
	/** The browser session, cleared when the server changes. */
	readonly session: Session;
	/** The app's window, loaded afresh onto a newly saved server. */
	readonly getWindow: () => BrowserWindow | null;
}

/**
 * Wire every IpcContract channel to the main process's features. Each handler
 * validates its arguments, since they come from the page untyped.
 *
 * @param options - What the handlers act on.
 */
export const registerIpc = ({
	appOrigin,
	settings,
	session,
	getWindow,
}: RegisterIpcOptions): void => {
	handleIpc("server-connection:get", appOrigin, () => settings.server);

	handleIpc("server-connection:check", appOrigin, (config) =>
		checkServer(parseServerConfig(config)),
	);

	handleIpc("server-connection:set", appOrigin, async (config) => {
		const server = parseServerConfig(config);
		const previous = settings.server;
		settings.setServer(server);
		// the old server's session and storage must not follow the user over
		if (
			previous &&
			(previous.url !== server.url || previous.module !== server.module)
		) {
			await session.clearStorageData();
		}
		// load the root, not reload: a reload keeps the `#/server` route and
		// lands back on this form
		await getWindow()?.loadURL(`${appOrigin}/`);
	});

	handleIpc("shell:open-external", appOrigin, async (url) => {
		if (typeof url !== "string" || !isExternalLink(url)) {
			throw new Error("Refused to open that link");
		}
		await shell.openExternal(url);
	});
};
