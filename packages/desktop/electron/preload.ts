import { contextBridge, ipcRenderer } from "electron";
import type { EnvironmentConfig } from "./connections/types";
import type { AllowedDirectory, LocalFsToolName } from "./local-fs/types";

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

/** Literal copy of ./local-fs/ipc-channels.ts — same reason as CONNECTIONS_IPC_CHANNELS above. */
const LOCAL_FS_IPC_CHANNELS = {
	listAllowedDirectories: "localFs:listAllowedDirectories",
	addAllowedDirectory: "localFs:addAllowedDirectory",
	removeAllowedDirectory: "localFs:removeAllowedDirectory",
	executeTool: "localFs:executeTool",
	isPathAllowed: "localFs:isPathAllowed",
	allowPath: "localFs:allowPath",
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
	localFs: {
		listAllowedDirectories(): Promise<AllowedDirectory[]>;
		/** Opens a native folder picker; resolves with the (possibly
		 * unchanged) allowlist — unchanged if the user cancels. */
		addAllowedDirectory(): Promise<AllowedDirectory[]>;
		removeAllowedDirectory(
			directoryPath: string,
		): Promise<AllowedDirectory[]>;
		/** Runs one local filesystem tool in the main process, validated
		 * against the allowlist there — throws (rejects) on denied/invalid
		 * paths or an unknown tool name. */
		executeTool(
			tool: LocalFsToolName,
			args: Record<string, unknown>,
		): Promise<unknown>;
		/** Non-throwing pre-check for whether `path` is already inside an
		 * allowed directory — used to decide if a "grant access" prompt is
		 * needed before running a tool call. */
		isPathAllowed(path: string): Promise<boolean>;
		/** Grants access directly (adds `path`'s containing directory to
		 * the allowlist) — no native picker, unlike addAllowedDirectory.
		 * What an in-chat "grant access" prompt's Allow button calls. */
		allowPath(path: string): Promise<AllowedDirectory[]>;
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
	localFs: {
		listAllowedDirectories: () =>
			ipcRenderer.invoke(LOCAL_FS_IPC_CHANNELS.listAllowedDirectories),
		addAllowedDirectory: () =>
			ipcRenderer.invoke(LOCAL_FS_IPC_CHANNELS.addAllowedDirectory),
		removeAllowedDirectory: (directoryPath) =>
			ipcRenderer.invoke(
				LOCAL_FS_IPC_CHANNELS.removeAllowedDirectory,
				directoryPath,
			),
		executeTool: (tool, args) =>
			ipcRenderer.invoke(LOCAL_FS_IPC_CHANNELS.executeTool, tool, args),
		isPathAllowed: (path) =>
			ipcRenderer.invoke(LOCAL_FS_IPC_CHANNELS.isPathAllowed, path),
		allowPath: (path) =>
			ipcRenderer.invoke(LOCAL_FS_IPC_CHANNELS.allowPath, path),
	},
};

/**
 * The only IPC surface exposed to the renderer. contextIsolation is on, so
 * this is the sole bridge between app-ui's React code and the main process.
 */
contextBridge.exposeInMainWorld("semossDesktop", api);
