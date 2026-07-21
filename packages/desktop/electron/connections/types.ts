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
}

export interface ConnectionSecrets {
	accessKey: string;
	secretKey: string;
}

export interface NewConnectionInput
	extends Omit<ConnectionRecord, "id">,
		ConnectionSecrets {}
