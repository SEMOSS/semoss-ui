import { shell } from "electron";
import {
	isSameServer,
	parseServerConfig,
	type ServerConfig,
} from "../../../contract/server-connection";
import type { AppWindowHost } from "../app-window/app-window-host";
import { isExternalLink } from "../app-window/window-security";
import type { FolderGrants } from "../local-folders/folder-grants";
import type { FolderWatchers } from "../local-folders/folder-watchers";
import { registerLocalFolders } from "../local-folders/register-local-folders";
import { checkServer } from "../server-connection/check-server";
import type { DesktopConfigFile } from "../server-connection/desktop-config";
import type { ServerSessions } from "../server-connection/server-sessions";
import { handleIpc } from "./handle-ipc";

/** What the IPC handlers act on. */
interface RegisterIpcOptions {
	/** The app's origin, the only one allowed to call. */
	readonly appOrigin: string;
	/** The saved config, which holds the servers. */
	readonly config: DesktopConfigFile;
	/** The servers' browser sessions, one per saved server. */
	readonly sessions: ServerSessions;
	/** The app's window, opened afresh on the server in use. */
	readonly windows: AppWindowHost;
	/** The folders attached to rooms. */
	readonly grants: FolderGrants;
	/** The attached folders being watched. */
	readonly watchers: FolderWatchers;
}

/**
 * A saved server as the page sees it: no partition, which is main's own.
 *
 * @param server - The saved server.
 * @returns Its origin and module.
 */
const toConfig = ({ url, module }: ServerConfig): ServerConfig => ({
	url,
	module,
});

/**
 * Wire every IpcContract channel to the main process's features. Each handler
 * validates its arguments, since they come from the page untyped.
 *
 * @param options - What the handlers act on.
 */
export const registerIpc = ({
	appOrigin,
	config,
	sessions,
	windows,
	grants,
	watchers,
}: RegisterIpcOptions): void => {
	handleIpc("server-connection:get", appOrigin, () =>
		config.server ? toConfig(config.server) : null,
	);

	handleIpc("server-connection:list", appOrigin, () => ({
		servers: config.servers.map(toConfig),
		active: config.server ? toConfig(config.server) : null,
	}));

	handleIpc("server-connection:check", appOrigin, (server) =>
		checkServer(parseServerConfig(server)),
	);

	handleIpc("server-connection:set", appOrigin, async (server) => {
		config.useServer(parseServerConfig(server));
		// the new window's rooms watch their own folders
		watchers.closeAll();
		await windows.open();
	});

	handleIpc("server-connection:forget", appOrigin, async (server) => {
		const target = parseServerConfig(server);
		const wasActive =
			config.server !== null && isSameServer(config.server, target);
		const forgotten = config.forgetServer(target);
		if (!forgotten) {
			throw new Error("That server is not saved");
		}
		// its rooms' folders are detached; the folders themselves stay
		watchers.closeMatching(`${forgotten.partition}|`);
		grants.forgetServer(forgotten.partition);
		// leave its session before deleting what it holds
		if (wasActive) await windows.open();
		const forgottenSession = sessions.get(forgotten.partition);
		await forgottenSession.clearStorageData();
		await forgottenSession.clearCache();
	});

	handleIpc("shell:open-external", appOrigin, async (url) => {
		if (typeof url !== "string" || !isExternalLink(url)) {
			throw new Error("Refused to open that link");
		}
		await shell.openExternal(url);
	});

	registerLocalFolders({
		appOrigin,
		grants,
		watchers,
		getPartition: () => config.server?.partition ?? null,
		getWindow: () => windows.getWindow(),
	});
};
