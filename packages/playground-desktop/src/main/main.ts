import { app, type BrowserWindow, session } from "electron";
import { join } from "node:path";
import { createMainWindow } from "./features/app-window/main-window";
import { secureWindow } from "./features/app-window/window-security";
import { routeSignInsThroughApp } from "./features/auth/sign-in-redirect";
import { handleDownloads } from "./features/downloads/downloads";
import { registerIpc } from "./features/ipc/register-ipc";
import { setAppMenu } from "./features/menu/app-menu";
import { startLocalServer } from "./features/server-connection/local-server";
import { openSettingsFile } from "./features/server-connection/settings-file";

/**
 * The production page's policy: scripts and workers from the app itself

 * (Monaco runs workers from blob URLs, Mermaid and the Office viewers evaluate
 * code, so Electron calls the policy insecure), the UI's Google fonts, every call to the app's origin (the proxy), and images and tool views
 * from anywhere, as on the web.
 */
const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
	"worker-src 'self' blob:",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"img-src 'self' data: blob: https: http:",
	"font-src 'self' data: https://fonts.gstatic.com",
	"media-src 'self' data: blob:",
	"connect-src 'self' ws: wss: data: blob:",
	"frame-src 'self' blob: data: https: http:",
	"object-src 'none'",
	"base-uri 'self'",
].join("; ");

let mainWindow: BrowserWindow | null = null;

if (!app.requestSingleInstanceLock()) {
	app.quit();
} else {
	app.on("second-instance", () => {
		if (!mainWindow) return;
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.focus();
	});

	void app.whenReady().then(async () => {
		const settings = openSettingsFile(app.getPath("userData"));
		const devUrl = process.env.ELECTRON_RENDERER_URL;

		// one origin, in development and production: the page, its calls, and
		// its sockets all go through the local server
		const localServer = await startLocalServer({
			rootDir: join(__dirname, "../renderer"),
			devUrl,
			preferredPort: settings.port,
			getServer: () => settings.server,
			contentSecurityPolicy: devUrl ? undefined : CONTENT_SECURITY_POLICY,
		});
		if (settings.port !== localServer.port) {
			settings.setPort(localServer.port);
		}
		const appOrigin = localServer.origin;

		routeSignInsThroughApp(
			session.defaultSession,
			() => settings.server,
			appOrigin,
		);
		handleDownloads(session.defaultSession);
		registerIpc({
			appOrigin,
			settings,
			session: session.defaultSession,
			getWindow: () => mainWindow,
		});

		mainWindow = createMainWindow(settings);
		secureWindow(mainWindow, appOrigin, () => settings.server?.module);
		setAppMenu(mainWindow);
		mainWindow.on("closed", () => {
			mainWindow = null;
		});
		await mainWindow.loadURL(`${appOrigin}/`);

		app.on("before-quit", () => {
			void localServer.close();
		});
	});

	app.on("window-all-closed", () => {
		app.quit();
	});
}
