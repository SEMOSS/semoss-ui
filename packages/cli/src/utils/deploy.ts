/**
 * Shared utilities for deployment-related commands (deploy, status, log, cleanup).
 *
 * Centralises `DeployRecord`, history loading, `formatBytes`, and
 * `getDirSize` so that each command does not need its own copy.
 */
import * as fs from "node:fs";
import * as path from "node:path";

// ── Constants ───────────────────────────────────────────────────

export const HISTORY_FILE = ".semoss-deployments";
export const BACKUP_DIR_NAME = ".semoss-backups";
export const VALID_DEPLOY_STATUSES = new Set(["success", "failure", "dry-run"]);

// ── Types ───────────────────────────────────────────────────────

/** A single deployment history record written by the deploy command. */
export interface DeployRecord {
	timestamp: string;
	targets: string[] | "all";
	status: "success" | "failure" | "dry-run";
	zipSize?: number;
	duration?: number;
	backupDir?: string;
	rollback?: boolean;
	app?: string;
	module?: string;
}

// ── Functions ───────────────────────────────────────────────────

/** Parse and validate deployment history, discarding malformed records. */
export function loadDeployHistory(): DeployRecord[] {
	try {
		const content = fs.readFileSync(HISTORY_FILE, "utf-8");
		const parsed: unknown = JSON.parse(content);
		if (!Array.isArray(parsed)) return [];

		return parsed.filter(
			(r): r is DeployRecord =>
				r != null &&
				typeof r === "object" &&
				typeof (r as DeployRecord).timestamp === "string" &&
				VALID_DEPLOY_STATUSES.has((r as DeployRecord).status),
		);
	} catch {
		return [];
	}
}

/** Format a byte count into a human-readable string (e.g. "1.5 MB"). */
export function formatBytes(bytes: number): string {
	if (bytes <= 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.min(
		Math.floor(Math.log(bytes) / Math.log(k)),
		sizes.length - 1,
	);
	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/** Recursively compute total byte size of a directory. */
export function getDirSize(dirPath: string): number {
	let size = 0;
	try {
		for (const file of fs.readdirSync(dirPath)) {
			const filePath = path.join(dirPath, file);
			const stat = fs.statSync(filePath);
			size += stat.isDirectory() ? getDirSize(filePath) : stat.size;
		}
	} catch {
		// Ignore unreadable entries
	}
	return size;
}
