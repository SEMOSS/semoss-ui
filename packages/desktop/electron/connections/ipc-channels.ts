/**
 * The full set of IPC channel names for the connections bridge, used by
 * main.ts's `ipcMain.handle` registrations. preload.ts keeps its own
 * literal copy of this same object instead of importing it from here — a
 * sandboxed preload script's restricted `require()` shim can't resolve
 * local relative files (see the comment on preload.ts's copy) — so if you
 * change a channel name, update both.
 */
export const CONNECTIONS_IPC_CHANNELS = {
	list: "connections:list",
	getCurrentId: "connections:getCurrentId",
	add: "connections:add",
	remove: "connections:remove",
	select: "connections:select",
	beginBrowserLogin: "connections:beginBrowserLogin",
	completeBrowserLogin: "connections:completeBrowserLogin",
	cancelBrowserLogin: "connections:cancelBrowserLogin",
} as const;
