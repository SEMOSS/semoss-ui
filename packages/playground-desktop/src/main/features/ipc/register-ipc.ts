import { type BrowserWindow, type Session, shell } from "electron";
import { parseServerConfig } from "../../../contract/server-connection";
import { isExternalLink } from "../app-window/window-security";
import { checkServer } from "../server-connection/check-server";
import type { SettingsFile } from "../server-connection/settings-file";
import { handleIpc } from "./handle-ipc";

interface RegisterIpcOptions {
	readonly appOrigin: string;
	readonly settings: SettingsFile;
	readonly session: Session;
	readonly getWindow: () => BrowserWindow | null;
}

/** Wire every IpcContract channel to the main process's features. */
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
		getWindow()?.webContents.reload();
	});

	handleIpc("shell:open-external", appOrigin, async (url) => {
		if (typeof url !== "string" || !isExternalLink(url)) {
			throw new Error("Refused to open that link");
		}
		await shell.openExternal(url);
	});
};
