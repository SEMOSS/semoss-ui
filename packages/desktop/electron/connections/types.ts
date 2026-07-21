/**
 * The one SEMOSS environment this build talks to — see
 * electron/config/environment.json, the single source of truth. Never
 * carries credentials; those live separately (encrypted, see
 * ConnectionSecrets) and are only ever decrypted inside the main process.
 * Safe to serialize over IPC.
 */
export interface EnvironmentConfig {
	alias: string;
	/** e.g. "https://your-semoss-instance.com" */
	instanceUrl: string;
	/** e.g. "/Monolith" */
	modulePath: string;
	/**
	 * SMSS_PROJECT_ID of the "Local Filesystem" MCP toolbox provisioned on
	 * this instance (a one-time, non-app setup step — see
	 * app-ui/src/local-fs/tool-executor.ts's doc comment). Absent until
	 * that provisioning has happened for this environment; the local-fs
	 * tool executor treats an absent id as "feature not active here" and
	 * always falls through to the normal server-executed path.
	 */
	localFilesystemToolboxProjectId?: string;
}

/**
 * The session cookie captured after a real browser sign-in (see
 * electron/connections/browser-login.ts) — the only credential this app
 * stores. `undefined` when not signed in.
 */
export interface ConnectionSecrets {
	cookie?: string;
}
