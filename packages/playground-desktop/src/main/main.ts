import { app } from "electron";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import {
	type AppWindowHost,
	createAppWindowHost,
} from "./features/app-window/app-window-host";
import { registerIpc } from "./features/ipc/register-ipc";
import { openFolderGrants } from "./features/local-folders/folder-grants";
import { createFolderWatchers } from "./features/local-folders/folder-watchers";
import { openDesktopConfig } from "./features/server-connection/desktop-config";
import { startLocalServer } from "./features/server-connection/local-server";
import {
	createServerSessions,
	removeUnusedPartitions,
	type ServerSessions,
} from "./features/server-connection/server-sessions";
import { createToolCookieJar } from "./features/server-connection/tool-cookies";
import { appPagePolicy } from "./features/trust-boundaries/content-security-policy";
import { guardAllWebContents } from "./features/trust-boundaries/web-contents";

// every renderer sandboxed, no <webview>, no unexpected windows (AGENTS.md, Trust boundaries)
guardAllWebContents();

/** The app's window, once the app is ready. */
let windows: AppWindowHost | null = null;

// one app at a time: a second launch quits and focuses the first one's window
if (!app.requestSingleInstanceLock()) {
	app.quit();
} else {
	app.on("second-instance", () => {
		const mainWindow = windows?.getWindow();
		if (!mainWindow) return;
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.focus();
	});

	void app.whenReady().then(async () => {
		const config = openDesktopConfig(app.getPath("userData"));
		removeUnusedPartitions(
			app.getPath("userData"),
			config.servers.map((server) => server.partition),
		);
		const devUrl = process.env.ELECTRON_RENDERER_URL;
		// only the app's window carries it; the tool frame origin answers nothing else
		const toolFrameKey = randomBytes(32).toString("hex");
		// made below, once the local server's origins are known
		let sessions: ServerSessions | null = null;

		// two local origins, in development and production: the app origin
		// carries the page, its calls and its sockets; the tool frame origin,
		// another site, carries tool views, so they run in another process and
		// cannot reach the page
		const localServer = await startLocalServer({
			rootDir: join(__dirname, "../renderer"),
			devUrl,
			preferredPort: config.port,
			preferredToolFramePort: config.toolFramePort,
			getServer: () => config.server,
			contentSecurityPolicy: devUrl ? undefined : appPagePolicy,
			toolFrameKey,
			toolCookies: createToolCookieJar(() => {
				if (!sessions)
					throw new Error("The sessions are not ready yet");
				return sessions.get(config.server?.partition ?? null);
			}),
		});
		if (config.port !== localServer.port) {
			config.setPort(localServer.port);
		}
		if (config.toolFramePort !== localServer.toolFramePort) {
			config.setToolFramePort(localServer.toolFramePort);
		}
		const appOrigin = localServer.origin;
		const { toolFrameOrigin } = localServer;

		// each saved server signs in with its own browser session
		const serverSessions = createServerSessions({
			appOrigin,
			toolFrameOrigin,
			toolFrameKey,
			getServer: () => config.server,
			getAppWebContents: () => windows?.getWindow()?.webContents,
		});
		sessions = serverSessions;
		windows = createAppWindowHost({
			appOrigin,
			toolFrameOrigin,
			config,
			sessions: serverSessions,
			// fail closed: a tool view in the app page's process turns tool views off
			onToolFrameBreach: () => localServer.disableToolFrames(),
		});
		// the folders the user attached to rooms, kept beside the config
		const grants = openFolderGrants(app.getPath("userData"));
		const watchers = createFolderWatchers();
		registerIpc({
			appOrigin,
			config,
			sessions: serverSessions,
			windows,
			grants,
			watchers,
		});
		await windows.open();

		app.on("before-quit", () => {
			// cookies are written lazily; keep every session for the next launch
			void serverSessions.flush();
			watchers.closeAll();
			void localServer.close();
		});
	});

	app.on("window-all-closed", () => {
		app.quit();
	});
}
