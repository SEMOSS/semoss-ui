import { safeStorage } from "electron";
import { randomUUID } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type {
	ConnectionRecord,
	ConnectionSecrets,
	NewKeysConnectionInput,
} from "./types";

interface ConnectionsFile {
	connections: ConnectionRecord[];
	currentId: string | null;
}

const EMPTY_FILE: ConnectionsFile = { connections: [], currentId: null };

/**
 * Persists named SEMOSS environments (mirrors the alias/instance model in
 * packages/vscode-extension/src/utils/secrets.js, re-implemented on top of
 * Electron's safeStorage instead of VS Code's SecretStorage).
 *
 * Non-secret fields live in a plain JSON file; Access/Secret Key are
 * encrypted at rest via the OS keychain (safeStorage) and only ever
 * decrypted here, in the main process — the renderer never sees them.
 */
export class ConnectionsStore {
	private readonly connectionsFilePath: string;
	private readonly secretsDirPath: string;

	constructor(userDataPath: string) {
		this.connectionsFilePath = join(userDataPath, "connections.json");
		this.secretsDirPath = join(userDataPath, "connection-secrets");
		mkdirSync(this.secretsDirPath, { recursive: true });
	}

	private readFile(): ConnectionsFile {
		if (!existsSync(this.connectionsFilePath)) {
			return { ...EMPTY_FILE };
		}
		try {
			return JSON.parse(readFileSync(this.connectionsFilePath, "utf-8"));
		} catch {
			return { ...EMPTY_FILE };
		}
	}

	private writeFile(data: ConnectionsFile): void {
		writeFileSync(this.connectionsFilePath, JSON.stringify(data, null, 2));
	}

	private secretsPath(id: string): string {
		return join(this.secretsDirPath, `${id}.enc`);
	}

	private assertEncryptionAvailable(): void {
		if (!safeStorage.isEncryptionAvailable()) {
			throw new Error(
				"OS-level credential encryption is unavailable on this machine " +
					"(no keychain/keyring backend found). Connection secrets cannot " +
					"be stored securely, so saving a connection has been blocked.",
			);
		}
	}

	list(): ConnectionRecord[] {
		return this.readFile().connections;
	}

	getCurrentId(): string | null {
		return this.readFile().currentId;
	}

	getCurrent(): ConnectionRecord | null {
		const file = this.readFile();
		return file.connections.find((c) => c.id === file.currentId) ?? null;
	}

	getSecrets(id: string): ConnectionSecrets {
		this.assertEncryptionAvailable();
		const path = this.secretsPath(id);
		if (!existsSync(path)) {
			throw new Error(`No stored secrets for connection "${id}"`);
		}
		const encrypted = readFileSync(path);
		const decrypted = safeStorage.decryptString(encrypted);
		return JSON.parse(decrypted);
	}

	addWithKeys(input: NewKeysConnectionInput): ConnectionRecord {
		return this.addRecord(
			{
				alias: input.alias,
				instanceUrl: input.instanceUrl,
				modulePath: input.modulePath,
				authMode: "keys",
			},
			{ accessKey: input.accessKey, secretKey: input.secretKey },
		);
	}

	/** Used after a successful browser-based sign-in — see browser-login.ts. */
	addWithCookie(input: {
		alias: string;
		instanceUrl: string;
		modulePath: string;
		cookie: string;
	}): ConnectionRecord {
		return this.addRecord(
			{
				alias: input.alias,
				instanceUrl: input.instanceUrl,
				modulePath: input.modulePath,
				authMode: "browser",
			},
			{ cookie: input.cookie },
		);
	}

	private addRecord(
		fields: Omit<ConnectionRecord, "id">,
		secrets: ConnectionSecrets,
	): ConnectionRecord {
		this.assertEncryptionAvailable();

		const record: ConnectionRecord = { id: randomUUID(), ...fields };

		const encrypted = safeStorage.encryptString(JSON.stringify(secrets));
		writeFileSync(this.secretsPath(record.id), encrypted);

		const file = this.readFile();
		file.connections.push(record);
		if (!file.currentId) {
			file.currentId = record.id;
		}
		this.writeFile(file);

		return record;
	}

	remove(id: string): void {
		const file = this.readFile();
		file.connections = file.connections.filter((c) => c.id !== id);
		if (file.currentId === id) {
			file.currentId = null;
		}
		this.writeFile(file);

		const path = this.secretsPath(id);
		if (existsSync(path)) {
			unlinkSync(path);
		}
	}

	select(id: string): void {
		const file = this.readFile();
		if (!file.connections.some((c) => c.id === id)) {
			throw new Error(`Unknown connection "${id}"`);
		}
		file.currentId = id;
		this.writeFile(file);
	}

	/**
	 * Clears the current selection without deleting anything — used when a
	 * connection turns out to be unreachable and the user needs a way back
	 * to the connections page rather than being stuck on a failed load.
	 */
	deselect(): void {
		const file = this.readFile();
		file.currentId = null;
		this.writeFile(file);
	}
}
