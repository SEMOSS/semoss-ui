import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { type Catalog, parseCatalog, stableJSON } from "./contracts.ts";
import { saveSyncRecord } from "./sync.ts";

test("records the successful sync time and snapshot hash without changing contract bytes", async () => {
	const temporary = await mkdtemp(join(tmpdir(), "sdk-sync-record-"));
	const catalog = parseCatalog(
		await readFile(
			new URL(
				"../../../libs/sdk/contracts/operations.json",
				import.meta.url,
			),
			"utf8",
		),
	);
	const snapshot = stableJSON(catalog);
	try {
		const before = Date.now();
		await saveSyncRecord(temporary, catalog);
		const after = Date.now();
		const record = JSON.parse(
			await readFile(join(temporary, "semoss-sync.json"), "utf8"),
		);
		assert.equal(record.schemaVersion, 1);
		assert.equal(record.target, "@semoss/sdk");
		assert.match(
			record.lastSyncedAt,
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
		);
		assert(
			Date.parse(record.lastSyncedAt) >= before &&
				Date.parse(record.lastSyncedAt) <= after,
		);
		assert.equal(
			record.contractsSha256,
			createHash("sha256").update(snapshot).digest("hex"),
		);
		assert.equal(stableJSON(catalog), snapshot);
		assert.deepEqual(await readdir(temporary), ["semoss-sync.json"]);
		// A later successful run replaces the record, including the new snapshot hash.
		const updated: Catalog = { schemaVersion: 1, operations: [] };
		await saveSyncRecord(temporary, updated);
		const replacement = JSON.parse(
			await readFile(join(temporary, "semoss-sync.json"), "utf8"),
		);
		assert.equal(
			replacement.contractsSha256,
			createHash("sha256").update(stableJSON(updated)).digest("hex"),
		);
		assert.notEqual(replacement.contractsSha256, record.contractsSha256);
		assert.deepEqual(await readdir(temporary), ["semoss-sync.json"]);
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
});
