import { createHash } from "node:crypto";
import { rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type Catalog, stableJSON } from "./contracts.ts";

/** Record a completed backend sync separately from deterministic generated output. */
export async function saveSyncRecord(
	workspace: string,
	catalog: Catalog,
): Promise<void> {
	const record = {
		schemaVersion: 1,
		target: "@semoss/sdk",
		lastSyncedAt: new Date().toISOString(),
		contractsSha256: createHash("sha256")
			.update(stableJSON(catalog))
			.digest("hex"),
	};
	const temporary = join(workspace, `.semoss-sync.${process.pid}.tmp`);
	try {
		await writeFile(temporary, `${JSON.stringify(record, null, "\t")}\n`);
		await rename(temporary, join(workspace, "semoss-sync.json"));
	} finally {
		await rm(temporary, { force: true });
	}
}
