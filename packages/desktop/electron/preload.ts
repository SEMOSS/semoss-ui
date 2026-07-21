import { contextBridge, ipcRenderer } from "electron";
import type { ConnectionRecord, NewConnectionInput } from "./connections/types";

/**
 * The only IPC surface exposed to any renderer — and only the connections
 * window loads this preload at all (the main playground window gets none).
 * contextIsolation is on, so this is the sole bridge between that window's
 * React UI and the main process.
 */
contextBridge.exposeInMainWorld("semossDesktop", {
	connections: {
		list: (): Promise<ConnectionRecord[]> =>
			ipcRenderer.invoke("connections:list"),
		getCurrentId: (): Promise<string | null> =>
			ipcRenderer.invoke("connections:getCurrentId"),
		add: (input: NewConnectionInput): Promise<ConnectionRecord> =>
			ipcRenderer.invoke("connections:add", input),
		remove: (id: string): Promise<void> =>
			ipcRenderer.invoke("connections:remove", id),
		select: (id: string): Promise<void> =>
			ipcRenderer.invoke("connections:select", id),
	},
});
