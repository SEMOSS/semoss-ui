import { contextBridge, ipcRenderer } from "electron";
import type {
	ConnectionRecord,
	NewKeysConnectionInput,
} from "./connections/types";

/**
 * The only IPC surface exposed to the renderer. contextIsolation is on, so
 * this is the sole bridge between app-ui's React code and the main process.
 */
contextBridge.exposeInMainWorld("semossDesktop", {
	connections: {
		list: (): Promise<ConnectionRecord[]> =>
			ipcRenderer.invoke("connections:list"),
		getCurrentId: (): Promise<string | null> =>
			ipcRenderer.invoke("connections:getCurrentId"),
		add: (input: NewKeysConnectionInput): Promise<ConnectionRecord> =>
			ipcRenderer.invoke("connections:add", input),
		remove: (id: string): Promise<void> =>
			ipcRenderer.invoke("connections:remove", id),
		select: (id: string): Promise<void> =>
			ipcRenderer.invoke("connections:select", id),
		beginBrowserLogin: (input: {
			alias: string;
			instanceUrl: string;
			modulePath: string;
		}): Promise<string> =>
			ipcRenderer.invoke("connections:beginBrowserLogin", input),
		completeBrowserLogin: (loginId: string): Promise<ConnectionRecord> =>
			ipcRenderer.invoke("connections:completeBrowserLogin", loginId),
		cancelBrowserLogin: (loginId: string): Promise<void> =>
			ipcRenderer.invoke("connections:cancelBrowserLogin", loginId),
	},
});
