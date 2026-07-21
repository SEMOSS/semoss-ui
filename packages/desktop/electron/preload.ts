import { contextBridge, ipcRenderer } from "electron";
import type { EnvironmentConfig } from "./connections/types";

/**
 * Deliberately NOT imported from ./connections/ipc-channels.ts (main.ts's
 * copy) — with `sandbox: true` (see windows/create-main-window.ts), a
 * preload script runs through Electron's own restricted `require()` shim,
 * which only resolves a small built-in allowlist (electron, node builtins)
 * and 404s on any other local relative file, even one with zero further
 * imports of its own. `import type` elsewhere in this file is fine (tsc
 * erases it entirely, emitting no `require()` at all) — only a real value
 * import breaks like this. Keep these in sync with
 * ./connections/ipc-channels.ts and electron/main.ts's `ipcMain.handle`
 * registrations by hand.
 */
const CONNECTIONS_IPC_CHANNELS = {
	getEnvironment: "connections:getEnvironment",
	isSignedIn: "connections:isSignedIn",
	beginBrowserLogin: "connections:beginBrowserLogin",
	completeBrowserLogin: "connections:completeBrowserLogin",
	cancelBrowserLogin: "connections:cancelBrowserLogin",
	signOut: "connections:signOut",
} as const;

export interface DesktopBridge {
	connections: {
		/** The one build-configured SEMOSS environment (alias/instanceUrl/
		 * modulePath) — read-only, nothing here is user-editable. */
		getEnvironment(): Promise<EnvironmentConfig>;
		isSignedIn(): Promise<boolean>;
		beginBrowserLogin(): Promise<string>;
		completeBrowserLogin(loginId: string): Promise<void>;
		cancelBrowserLogin(loginId: string): Promise<void>;
		signOut(): Promise<void>;
	};
}

const api: DesktopBridge = {
	connections: {
		getEnvironment: () =>
			ipcRenderer.invoke(CONNECTIONS_IPC_CHANNELS.getEnvironment),
		isSignedIn: () =>
			ipcRenderer.invoke(CONNECTIONS_IPC_CHANNELS.isSignedIn),
		beginBrowserLogin: () =>
			ipcRenderer.invoke(CONNECTIONS_IPC_CHANNELS.beginBrowserLogin),
		completeBrowserLogin: (loginId) =>
			ipcRenderer.invoke(
				CONNECTIONS_IPC_CHANNELS.completeBrowserLogin,
				loginId,
			),
		cancelBrowserLogin: (loginId) =>
			ipcRenderer.invoke(
				CONNECTIONS_IPC_CHANNELS.cancelBrowserLogin,
				loginId,
			),
		signOut: () => ipcRenderer.invoke(CONNECTIONS_IPC_CHANNELS.signOut),
	},
};

/**
 * The only IPC surface exposed to the renderer. contextIsolation is on, so
 * this is the sole bridge between app-ui's React code and the main process.
 */
contextBridge.exposeInMainWorld("semossDesktop", api);
