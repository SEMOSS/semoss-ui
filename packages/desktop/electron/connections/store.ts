import { safeStorage } from "electron";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ENVIRONMENT } from "../config/environment";
import type { ConnectionSecrets, EnvironmentConfig } from "./types";

const SESSION_FILE_NAME = "session.enc";

const ENCRYPTION_UNAVAILABLE_MESSAGE =
	"OS-level credential encryption is unavailable on this machine " +
	"(no keychain/keyring backend found). Your session cannot be stored " +
	"securely, so signing in has been blocked.";

/**
 * Tracks whether the user is signed in to ENVIRONMENT (the one build-time
 * environment, see electron/config/environment.json) and holds the
 * resulting session cookie, encrypted at rest via the OS keychain
 * (safeStorage) and only ever decrypted here, in the main process — the
 * renderer never sees it.
 */
export class ConnectionsStore {
	private readonly sessionFilePath: string;

	constructor(userDataPath: string) {
		this.sessionFilePath = join(userDataPath, SESSION_FILE_NAME);
	}

	getEnvironment(): EnvironmentConfig {
		return ENVIRONMENT;
	}

	isSignedIn(): boolean {
		return existsSync(this.sessionFilePath);
	}

	getSecrets(): ConnectionSecrets | null {
		if (!existsSync(this.sessionFilePath)) {
			return null;
		}
		this.assertEncryptionAvailable();
		const encrypted = readFileSync(this.sessionFilePath);
		return JSON.parse(safeStorage.decryptString(encrypted));
	}

	saveCookie(cookie: string): void {
		this.assertEncryptionAvailable();
		const secrets: ConnectionSecrets = { cookie };
		const encrypted = safeStorage.encryptString(JSON.stringify(secrets));
		writeFileSync(this.sessionFilePath, encrypted);
	}

	/** Clears the stored session — used for both an explicit "Sign Out" and
	 * the load-failure recovery dialog's way back to the sign-in screen. */
	signOut(): void {
		if (existsSync(this.sessionFilePath)) {
			unlinkSync(this.sessionFilePath);
		}
	}

	private assertEncryptionAvailable(): void {
		if (!safeStorage.isEncryptionAvailable()) {
			throw new Error(ENCRYPTION_UNAVAILABLE_MESSAGE);
		}
	}
}
