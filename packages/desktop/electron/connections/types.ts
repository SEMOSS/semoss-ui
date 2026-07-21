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
}

/**
 * The session cookie captured after a real browser sign-in (see
 * electron/connections/browser-login.ts) — the only credential this app
 * stores. `undefined` when not signed in.
 */
export interface ConnectionSecrets {
	cookie?: string;
}
