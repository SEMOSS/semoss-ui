import { app } from "electron";
import { join } from "node:path";
import {
	type AppWindowHost,
	createAppWindowHost,
} from "./features/app-window/app-window-host";
import { registerIpc } from "./features/ipc/register-ipc";
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
		// its sockets all go through the local server
		const localServer = await startLocalServer({
			rootDir: join(__dirname, "../renderer"),
			devUrl,
			preferredPort: config.port,
			getServer: () => config.server,
			contentSecurityPolicy: devUrl ? undefined : CONTENT_SECURITY_POLICY,
		});
		if (config.port !== localServer.port) {
			config.setPort(localServer.port);
		}
		const appOrigin = localServer.origin;

		// each saved server signs in with its own browser session
		const sessions = createServerSessions(appOrigin, () => config.server);
		windows = createAppWindowHost({ appOrigin, config, sessions });
		registerIpc({ appOrigin, config, sessions, windows });
		await windows.open();

		app.on("before-quit", () => {
			// cookies are written lazily; keep every session for the next launch
			void sessions.flush();
			void localServer.close();
		});
	});

	app.on("window-all-closed", () => {
		app.quit();
	});
}
