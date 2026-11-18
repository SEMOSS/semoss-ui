import { app } from "electron";
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
} from "./features/server-connection/server-sessions";

/**
 * The production page's Content-Security-Policy: scripts and workers from the
 * app itself (Monaco runs workers from blob URLs, Mermaid and the Office
 * viewers evaluate code, so Electron calls the policy insecure), the UI's
 * Google fonts, every call to the app's origin (the proxy), and images and
 * tool views from anywhere, as on the web.
 */
const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
	"worker-src 'self' blob:",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"img-src 'self' data: blob: https: http:",
	"font-src 'self' data: https://fonts.gstatic.com",
	"media-src 'self' data: blob:",
	// the PowerPoint viewer fetches its fallback fonts' stylesheet
	"connect-src 'self' ws: wss: data: blob: https://fonts.googleapis.com https://fonts.gstatic.com",
	"frame-src 'self' blob: data: https: http:",
	"object-src 'none'",
	"base-uri 'self'",
].join("; ");

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

		// one origin, in development and production: the page, its calls, and
		// its sockets all go through the local server; tool views are framed
		// from a second one, so they cannot reach the page
		const localServer = await startLocalServer({
			rootDir: join(__dirname, "../renderer"),
			devUrl,
			preferredPort: config.port,
			preferredToolFramePort: config.toolFramePort,
			getServer: () => config.server,
			contentSecurityPolicy: devUrl ? undefined : CONTENT_SECURITY_POLICY,
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
		const sessions = createServerSessions(
			appOrigin,
			toolFrameOrigin,
			() => config.server,
		);
		windows = createAppWindowHost({
			appOrigin,
			toolFrameOrigin,
			config,
			sessions,
		});
		// the folders the user attached to rooms, kept beside the config
		const grants = openFolderGrants(app.getPath("userData"));
		const watchers = createFolderWatchers();
		registerIpc({ appOrigin, config, sessions, windows, grants, watchers });
		await windows.open();

		app.on("before-quit", () => {
			// cookies are written lazily; keep every session for the next launch
			void sessions.flush();
			watchers.closeAll();
			void localServer.close();
		});
	});

	app.on("window-all-closed", () => {
		app.quit();
	});
}
