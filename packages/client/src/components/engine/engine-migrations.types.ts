import type { MigrationState } from "./engine-migration-state-badge";

/** Mirrors the MAP output of {@code ListEngineMigrationsReactor} on the Java side. */
export interface MigrationRow {
	version: string;
	description: string | null;
	fileName: string | null;
	state: MigrationState;
	appliedBy: string | null;
	appliedOn: string | null;
	executionTimeMs: number | null;
	errorMessage: string | null;
}

/** Mirrors {@code MigrationFileUtils.compareVersions} -- numeric, segment-by-segment (e.g. {@code 2 < 2.1 < 10}). */
export function compareVersions(left: string, right: string): number {
	const leftParts = left.split(".").map(Number);
	const rightParts = right.split(".").map(Number);
	const maxLength = Math.max(leftParts.length, rightParts.length);
	for (let i = 0; i < maxLength; i++) {
		const l = leftParts[i] ?? 0;
		const r = rightParts[i] ?? 0;
		if (l !== r) {
			return l - r;
		}
	}
	return 0;
}
