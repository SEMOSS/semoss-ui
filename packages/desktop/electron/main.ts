import {
	app,
	BrowserWindow,
	dialog,
	ipcMain,
	Menu,
	type MenuItemConstructorOptions,
	nativeImage,
} from "electron";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { APP_NAME } from "./app-info";
import {
	beginBrowserLogin,
	cancelBrowserLogin,
	completeBrowserLogin,
} from "./connections/browser-login";
import { ConnectionsStore } from "./connections/store";
import type { NewKeysConnectionInput } from "./connections/types";
import {
	type LocalServerHandle,
	startLocalServer,
} from "./server/static-server";
import { createMainWindow } from "./windows/create-main-window";

let connectionsStore: ConnectionsStore;
let mainWindow: BrowserWindow | null = null;
let localServer: LocalServerHandle | null = null;

const iconPath = join(__dirname, "..", "build", "icon.png");

function getAppUiDistPath(): string {
	// app-ui is built by this package's own "build" script (dist-app-ui/),
	// bundled into the packaged app like any ordinary renderer — no
	// cross-package resource copying needed (unlike the earlier
	// playground-wrapping approach this replaced).
	return join(__dirname, "..", "dist-app-ui");
}

/**
 * (Re)starts the local server for whichever connection is current (or none,
 * on first run) and points the single main window at it — reloading it in
 * place if it already exists, so switching connections from the in-app
 * connections page never opens a second window.
 */
async function launchCurrentConnection(): Promise<void> {
	const distPath = getAppUiDistPath();
	if (!existsSync(distPath)) {
		throw new Error(
			`app-ui build not found at ${distPath}. Run "pnpm --filter @semoss/desktop build:app-ui" first.`,
		);
	}

	const currentId = connectionsStore.getCurrentId();
	const connection = currentId
		? (connectionsStore.list().find((c) => c.id === currentId) ?? null)
		: null;
	const secrets = connection
		? connectionsStore.getSecrets(connection.id)
		: null;

	if (localServer) {
		await localServer.close();
		localServer = null;
	}
	localServer = await startLocalServer(distPath, connection, secrets);

	const url = connection
		? `http://127.0.0.1:${localServer.port}/index.html?module=${encodeURIComponent(connection.modulePath)}`
		: `http://127.0.0.1:${localServer.port}/index.html`;

	if (mainWindow && !mainWindow.isDestroyed()) {
		await mainWindow.loadURL(url);
		mainWindow.focus();
	} else {
		mainWindow = createMainWindow();
		mainWindow.on("closed", () => {
			mainWindow = null;
		});
		attachLoadFailureRecovery(mainWindow);
		await mainWindow.loadURL(url);
	}
}

/**
 * Surfaces a genuine load failure (the window navigated to our local
 * server's URL and the request itself failed — e.g. the local server
 * crashed, or a transient startup race) as a real recovery choice instead
 * of leaving the user staring at a browser-style error page with no way
 * forward.
 */
function attachLoadFailureRecovery(win: BrowserWindow): void {
	win.webContents.on(
		"did-fail-load",
		(_event, errorCode, errorDescription, _validatedUrl, isMainFrame) => {
			// ERR_ABORTED (-3) fires for perfectly ordinary navigation
			// cancellations (e.g. our own loadURL superseding a previous,
			// still-in-flight one when switching connections quickly) — not
			// a real failure.
			if (!isMainFrame || errorCode === -3) {
				return;
			}
			void handleLoadFailure(errorDescription || `Error ${errorCode}`);
		},
	);
}

async function handleLoadFailure(reason: string): Promise<void> {
	const { response } = await dialog.showMessageBox({
		type: "error",
		title: "Couldn't connect",
		message: "This SEMOSS environment couldn't be reached.",
		detail: `${reason}\n\nYou can retry, or manage your saved connections.`,
		buttons: ["Retry", "Manage Connections", "Quit"],
		defaultId: 0,
		cancelId: 1,
	});

	if (response === 0) {
		try {
			await launchCurrentConnection();
		} catch (error) {
			await handleLoadFailure(
				error instanceof Error ? error.message : String(error),
			);
		}
	} else if (response === 1) {
		connectionsStore.deselect();
		try {
			await launchCurrentConnection();
		} catch (error) {
			await handleLoadFailure(
				error instanceof Error ? error.message : String(error),
			);
		}
	} else {
		app.quit();
	}
}

function registerIpcHandlers(): void {
	ipcMain.handle("connections:list", () => connectionsStore.list());
	ipcMain.handle("connections:getCurrentId", () =>
		connectionsStore.getCurrentId(),
	);
	ipcMain.handle("connections:add", (_event, input: NewKeysConnectionInput) =>
		connectionsStore.addWithKeys(input),
	);
	ipcMain.handle("connections:remove", (_event, id: string) =>
		connectionsStore.remove(id),
	);
	ipcMain.handle("connections:select", (_event, id: string) =>
		launchCurrentConnectionFor(id),
	);
	ipcMain.handle(
		"connections:beginBrowserLogin",
		(
			_event,
			input: { alias: string; instanceUrl: string; modulePath: string },
		) =>
			beginBrowserLogin(input.alias, input.instanceUrl, input.modulePath),
	);
	ipcMain.handle(
		"connections:completeBrowserLogin",
		async (_event, loginId: string) => {
			const result = await completeBrowserLogin(loginId);
			const record = connectionsStore.addWithCookie(result);
			await launchCurrentConnectionFor(record.id);
			return record;
		},
	);
	ipcMain.handle(
		"connections:cancelBrowserLogin",
		(_event, loginId: string) => cancelBrowserLogin(loginId),
	);
}

async function launchCurrentConnectionFor(id: string): Promise<void> {
	connectionsStore.select(id);
	try {
		await launchCurrentConnection();
	} catch (error) {
		await handleLoadFailure(
			error instanceof Error ? error.message : String(error),
		);
	}
}

function buildAppMenu(): void {
	const template: MenuItemConstructorOptions[] = [
		{
			label: APP_NAME,
			submenu: [{ role: "quit" }],
		},
		{ role: "editMenu" },
		{ role: "viewMenu" },
		{ role: "windowMenu" },
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.setName(APP_NAME);

app.whenReady().then(async () => {
	connectionsStore = new ConnectionsStore(app.getPath("userData"));
	registerIpcHandlers();
	buildAppMenu();

	if (process.platform === "darwin" && app.dock && existsSync(iconPath)) {
		app.dock.setIcon(nativeImage.createFromPath(iconPath));
	}

	try {
		await launchCurrentConnection();
	} catch (error) {
		await handleLoadFailure(
			error instanceof Error ? error.message : String(error),
		);
	}

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			void launchCurrentConnection();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("before-quit", () => {
	void localServer?.close();
});
