import { contextBridge, ipcRenderer } from "electron";
import type {
	ConnectionRecord,
	NewKeysConnectionInput,
} from "./connections/types";

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
	list: "connections:list",
	getCurrentId: "connections:getCurrentId",
	add: "connections:add",
	remove: "connections:remove",
	select: "connections:select",
	beginBrowserLogin: "connections:beginBrowserLogin",
	completeBrowserLogin: "connections:completeBrowserLogin",
	cancelBrowserLogin: "connections:cancelBrowserLogin",
} as const;

export interface DesktopBridge {
	connections: {
		list(): Promise<ConnectionRecord[]>;
		getCurrentId(): Promise<string | null>;
		add(input: NewKeysConnectionInput): Promise<ConnectionRecord>;
		remove(id: string): Promise<void>;
		select(id: string): Promise<void>;
		beginBrowserLogin(input: {
			alias: string;
			instanceUrl: string;
			modulePath: string;
		}): Promise<string>;
		completeBrowserLogin(loginId: string): Promise<ConnectionRecord>;
		cancelBrowserLogin(loginId: string): Promise<void>;
	};
}

const api: DesktopBridge = {
	connections: {
		list: () => ipcRenderer.invoke(CONNECTIONS_IPC_CHANNELS.list),
		getCurrentId: () =>
			ipcRenderer.invoke(CONNECTIONS_IPC_CHANNELS.getCurrentId),
		add: (input) => ipcRenderer.invoke(CONNECTIONS_IPC_CHANNELS.add, input),
		remove: (id) => ipcRenderer.invoke(CONNECTIONS_IPC_CHANNELS.remove, id),
		select: (id) => ipcRenderer.invoke(CONNECTIONS_IPC_CHANNELS.select, id),
		beginBrowserLogin: (input) =>
			ipcRenderer.invoke(
				CONNECTIONS_IPC_CHANNELS.beginBrowserLogin,
				input,
			),
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
	},
};

/**
 * The only IPC surface exposed to the renderer. contextIsolation is on, so
 * this is the sole bridge between app-ui's React code and the main process.
 */
contextBridge.exposeInMainWorld("semossDesktop", api);
