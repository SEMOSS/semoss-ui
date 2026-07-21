/**
 * The full set of IPC channel names for the local-filesystem bridge, used
 * by main.ts's `ipcMain.handle` registrations. preload.ts keeps its own
 * literal copy of this same object instead of importing it from here —
 * same reason as CONNECTIONS_IPC_CHANNELS (see that file's comment): a
 * sandboxed preload script's restricted `require()` shim can't resolve
 * local relative files. If you change a channel name, update both.
 */
export const LOCAL_FS_IPC_CHANNELS = {
	listAllowedDirectories: "localFs:listAllowedDirectories",
	addAllowedDirectory: "localFs:addAllowedDirectory",
	removeAllowedDirectory: "localFs:removeAllowedDirectory",
	executeTool: "localFs:executeTool",
	/** Non-throwing pre-check — is this path already inside an allowed
	 * directory? Used by the renderer to decide whether a just-in-time
	 * "grant access" prompt is needed before running a tool call. */
	isPathAllowed: "localFs:isPathAllowed",
	/** Grants access directly (adds the path's containing directory to the
	 * allowlist) — no native folder picker, unlike addAllowedDirectory.
	 * This is what a user approving an in-chat "grant access" prompt
	 * actually calls. */
	allowPath: "localFs:allowPath",
} as const;
