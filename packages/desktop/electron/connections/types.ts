/** How this connection authenticates against its SEMOSS instance. */
export type ConnectionAuthMode = "keys" | "browser";

/**
 * A saved SEMOSS environment. Never carries credentials — those are stored
 * separately (encrypted) and only ever decrypted inside the main process.
 * Safe to serialize over IPC and to persist as plain JSON.
 */
export interface ConnectionRecord {
	id: string;
	alias: string;
	/** e.g. "https://your-semoss-instance.com" */
	instanceUrl: string;
	/** e.g. "/Monolith" */
	modulePath: string;
	authMode: ConnectionAuthMode;
}

/**
 * `accessKey`/`secretKey` are used for `authMode: "keys"`; `cookie` (the raw
 * `name=value; name2=value2` session cookie captured after a real browser
 * sign-in) is used for `authMode: "browser"` — see
 * `electron/connections/browser-login.ts`. A given record only ever
 * populates the fields its own `authMode` needs.
 */
export interface ConnectionSecrets {
	accessKey?: string;
	secretKey?: string;
	cookie?: string;
}

export interface NewKeysConnectionInput {
	alias: string;
	instanceUrl: string;
	modulePath: string;
	accessKey: string;
	secretKey: string;
}
