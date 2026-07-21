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
import { APP_NAME, LOCAL_SERVER_HOST } from "./app-info";
import {
	beginBrowserLogin,
	cancelBrowserLogin,
	completeBrowserLogin,
} from "./connections/browser-login";
import { CONNECTIONS_IPC_CHANNELS } from "./connections/ipc-channels";
import { ConnectionsStore } from "./connections/store";
import type { NewKeysConnectionInput } from "./connections/types";
import { getIconPath } from "./icon-path";
import {
	type LocalServerHandle,
	startLocalServer,
} from "./server/static-server";
import { createMainWindow } from "./windows/create-main-window";

/** Chromium's own code for "navigation superseded by another `loadURL`
 * call" — not a genuine load failure (see attachLoadFailureRecovery). */
const CHROME_ERR_ABORTED = -3;

/** Index into handleLoadFailure's `buttons` array below — kept as named
 * constants so the `response === 0`/`1` branches can't silently drift out
 * of sync with a reordered buttons list. */
const LOAD_FAILURE_DIALOG_BUTTONS = {
	retry: 0,
	manageConnections: 1,
	quit: 2,
} as const;

let connectionsStore: ConnectionsStore;
let mainWindow: BrowserWindow | null = null;
let localServer: LocalServerHandle | null = null;

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
		? `http://${LOCAL_SERVER_HOST}:${localServer.port}/index.html?module=${encodeURIComponent(connection.modulePath)}`
		: `http://${LOCAL_SERVER_HOST}:${localServer.port}/index.html`;

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
			// CHROME_ERR_ABORTED fires for perfectly ordinary navigation
			// cancellations (e.g. our own loadURL superseding a previous,
			// still-in-flight one when switching connections quickly) — not
			// a real failure.
			if (!isMainFrame || errorCode === CHROME_ERR_ABORTED) {
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
		defaultId: LOAD_FAILURE_DIALOG_BUTTONS.retry,
		cancelId: LOAD_FAILURE_DIALOG_BUTTONS.manageConnections,
	});

	if (response === LOAD_FAILURE_DIALOG_BUTTONS.retry) {
		try {
			await launchCurrentConnection();
		} catch (error) {
			await handleLoadFailure(
				error instanceof Error ? error.message : String(error),
			);
		}
	} else if (response === LOAD_FAILURE_DIALOG_BUTTONS.manageConnections) {
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
	ipcMain.handle(CONNECTIONS_IPC_CHANNELS.list, () =>
		connectionsStore.list(),
	);
	ipcMain.handle(CONNECTIONS_IPC_CHANNELS.getCurrentId, () =>
		connectionsStore.getCurrentId(),
	);
	ipcMain.handle(
		CONNECTIONS_IPC_CHANNELS.add,
		(_event, input: NewKeysConnectionInput) =>
			connectionsStore.addWithKeys(input),
	);
	ipcMain.handle(CONNECTIONS_IPC_CHANNELS.remove, (_event, id: string) =>
		connectionsStore.remove(id),
	);
	ipcMain.handle(CONNECTIONS_IPC_CHANNELS.select, (_event, id: string) =>
		launchCurrentConnectionFor(id),
	);
	ipcMain.handle(
		CONNECTIONS_IPC_CHANNELS.beginBrowserLogin,
		(
			_event,
			input: { alias: string; instanceUrl: string; modulePath: string },
		) =>
			beginBrowserLogin(
				input.alias,
				input.instanceUrl,
				input.modulePath,
				(result) => {
					// Fires as soon as sign-in is auto-detected (see
					// browser-login.ts) — connects immediately, same as the
					// manual "Continue" path below, without waiting for the
					// user to click anything.
					const record = connectionsStore.addWithCookie(result);
					void launchCurrentConnectionFor(record.id);
				},
			),
	);
	ipcMain.handle(
		CONNECTIONS_IPC_CHANNELS.completeBrowserLogin,
		async (_event, loginId: string) => {
			const result = await completeBrowserLogin(loginId);
			const record = connectionsStore.addWithCookie(result);
			await launchCurrentConnectionFor(record.id);
			return record;
		},
	);
	ipcMain.handle(
		CONNECTIONS_IPC_CHANNELS.cancelBrowserLogin,
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

	const iconPath = getIconPath();
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
