import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AllowedDirectory } from "./types";

const ALLOWLIST_FILE_NAME = "local-fs-allowlist.json";

/**
 * Persists the directories the user has explicitly allowed local
 * filesystem tools to read/write within — plain JSON (these are just
 * paths, not secrets, unlike connections/store.ts's session cookie), read
 * and written only from the main process. path-guard.ts is what actually
 * enforces this list against a real request; this class just owns storage.
 */
export class AllowlistStore {
	private readonly filePath: string;

	constructor(userDataPath: string) {
		this.filePath = join(userDataPath, ALLOWLIST_FILE_NAME);
	}

	list(): AllowedDirectory[] {
		if (!existsSync(this.filePath)) {
			return [];
		}
		try {
			const parsed = JSON.parse(readFileSync(this.filePath, "utf-8"));
			return Array.isArray(parsed) ? (parsed as AllowedDirectory[]) : [];
		} catch {
			// Corrupt/unreadable file — treat as empty rather than crash the
			// app; the user can just re-add directories in Settings.
			return [];
		}
	}

	add(directoryPath: string): AllowedDirectory[] {
		const current = this.list();
		if (current.some((entry) => entry.path === directoryPath)) {
			return current;
		}
		const next: AllowedDirectory[] = [
			...current,
			{ path: directoryPath, dateAdded: new Date().toISOString() },
		];
		this.save(next);
		return next;
	}

	remove(directoryPath: string): AllowedDirectory[] {
		const next = this.list().filter(
			(entry) => entry.path !== directoryPath,
		);
		this.save(next);
		return next;
	}

	private save(entries: AllowedDirectory[]): void {
		writeFileSync(this.filePath, JSON.stringify(entries, null, 2));
	}
}
