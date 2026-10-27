import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { parseCatalog, stableJSON } from "./contracts.ts";

const root = resolve(import.meta.dirname, "../../..");

test("CLI replays snapshots, checks drift without writes, and cleans only owned output", () => {
	const temporary = mkdtempSync(join(tmpdir(), "sdk-generator-cli-"));
	try {
		for (const file of [
			"src/script/generate-sdk.ts",
			"src/script/package.json",
			"src/script/sdk-generator/contracts.ts",
			"src/script/sdk-generator/render-sdk.ts",
			"src/script/sdk-generator/sync.ts",
			"libs/sdk/package.json",
			"libs/sdk/contracts/operations.json",
			"biome.json",
			".gitignore",
		]) {
			mkdirSync(dirname(join(temporary, file)), { recursive: true });
			cpSync(join(root, file), join(temporary, file));
		}
		// Reuse the pinned formatter; all generated/test files stay in the fixture.
		symlinkSync(
			join(root, "node_modules"),
			join(temporary, "node_modules"),
			"dir",
		);
		const run = (...args: string[]) =>
			spawnSync(
				process.execPath,
				["src/script/generate-sdk.ts", "--from-contracts", ...args],
				{ cwd: temporary, encoding: "utf8" },
			);
		const first = run();
		assert.equal(first.status, 0, first.stderr);
		const syncFile = join(temporary, "semoss-sync.json");
		assert.equal(
			existsSync(syncFile),
			false,
			"Snapshot replay must not claim a backend sync",
		);
		const previousSync = '{"lastSyncedAt":"2026-10-26T12:00:00.000Z"}\n';
		writeFileSync(syncFile, previousSync);
		const failedSync = spawnSync(
			process.execPath,
			[
				"src/script/generate-sdk.ts",
				"--semoss",
				join(temporary, "missing-semoss"),
				"--monolith",
				join(temporary, "missing-monolith"),
			],
			{ cwd: temporary, encoding: "utf8" },
		);
		assert.equal(failedSync.status, 1);
		assert.match(failedSync.stderr, /target\/classes is missing/);
		assert.equal(readFileSync(syncFile, "utf8"), previousSync);
		assert.equal(run("--check").status, 0);
		assert.match(run().stdout, /0 files changed/);
		assert.equal(readFileSync(syncFile, "utf8"), previousSync);
		const health = join(temporary, "libs/sdk/src/api/health/health.ts");
		const generated = readFileSync(health, "utf8");
		writeFileSync(health, `${generated}// drift\n`);
		const drift = run("--check");
		assert.equal(drift.status, 1);
		assert.match(drift.stderr, /out of date/);
		assert.equal(readFileSync(health, "utf8"), `${generated}// drift\n`);
		assert.equal(run().status, 0);
		assert.equal(readFileSync(health, "utf8"), generated);

		writeFileSync(health, "// Handwritten file\nexport {};\n");
		const authored = run();
		assert.equal(authored.status, 1);
		assert.match(authored.stderr, /Refusing to overwrite an authored file/);
		assert.equal(readFileSync(syncFile, "utf8"), previousSync);
		assert.equal(
			readFileSync(health, "utf8"),
			"// Handwritten file\nexport {};\n",
		);
		writeFileSync(health, generated);

		const contractFile = join(
			temporary,
			"libs/sdk/contracts/operations.json",
		);
		const catalog = parseCatalog(readFileSync(contractFile, "utf8"));
		for (const selected of catalog.operations)
			selected.contract.policy.ignoreReasons = ["Not a client operation"];
		writeFileSync(contractFile, stableJSON(catalog));
		assert.equal(run().status, 0);
		assert.doesNotMatch(readFileSync(health, "utf8"), /function ready/);
		assert.doesNotMatch(
			readFileSync(
				join(temporary, "libs/sdk/src/lib/reactors/catalog.ts"),
				"utf8",
			),
			/StopPixelExecution/,
		);

		catalog.operations = catalog.operations.filter(
			(selected) => selected.contract.kind !== "REST",
		);
		writeFileSync(contractFile, stableJSON(catalog));
		assert.match(run().stderr, /Remove the curated package export/);
		// Deleting a public resource requires deleting its curated export first.
		writeFileSync(
			join(temporary, "libs/sdk/package.json"),
			'{"exports":{}}',
		);
		assert.equal(run().status, 0);
		assert.equal(existsSync(health), false);
		assert.equal(run("--check").status, 0);
		assert.equal(readFileSync(syncFile, "utf8"), previousSync);
	} finally {
		rmSync(temporary, { recursive: true, force: true });
	}
});
