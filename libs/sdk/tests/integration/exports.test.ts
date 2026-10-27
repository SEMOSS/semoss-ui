import ts from "typescript";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import manifest from "../../package.json";

const packageRoot = resolve(import.meta.dirname, "../..");
const execFileAsync = promisify(execFile);
const fixture = `
import { buildPixel, rawPixel, runPixel, get, post, CSRF } from "@semoss/sdk";
import { ApiError, type RequestOptions } from "@semoss/sdk/api";
import { ready, type ReadyResponses } from "@semoss/sdk/api/health";
import { useAPI, usePixel, type UseAPIResult } from "@semoss/sdk/react";
const named = buildPixel("StopPixelExecution", { id: "job" });
const positional = buildPixel("StopPixelExecution", ["job"]);
const expression = buildPixel("StopPixelExecution", { id: rawPixel('"job"') });
// @ts-expect-error Required id cannot be omitted.
buildPixel("StopPixelExecution");
// @ts-expect-error An optional argument object would erase backend requiredness.
buildPixel("StopPixelExecution", {});
// @ts-expect-error Backend id is a string.
buildPixel("StopPixelExecution", { id: 42 });
// @ts-expect-error Catalog contains only the selected annotated operations.
buildPixel("GetProjectList");
async function cancel(): Promise<string | undefined> {
    const response = await runPixel(named);
    if (response.errors.length) throw new Error(response.errors.join(", "));
    const output: string | undefined = response.pixelReturn[0]?.output;
    // @ts-expect-error String output is inferred from the backend annotation.
    const wrong: number = response.pixelReturn[0].output;
    return output;
}
function useReadiness(enabled: boolean): UseAPIResult<ReadyResponses[200]> {
    const result = useAPI(enabled ? [ready, {}] : null);
    const state: "READY" | "NOT_READY" | undefined = result.data?.status;
    const complete: boolean | undefined = result.data?.startupComplete;
    // @ts-expect-error Missing readiness fields cannot be supplied to update.
    result.update({ status: "READY" });
    return result;
}
// Compile-only hook inference check. Cancellation is a mutation; applications
// call runPixel from an event handler instead of auto-running it on mount.
function usePixelContract() {
    const result = usePixel(named, { onSuccess(message) { const text: string = message; } });
    const text: string = result.data;
    // @ts-expect-error Backend output is not numeric.
    const wrong: number = result.data;
    return result;
}
const errorBody: ReadyResponses[503] = { status: "NOT_READY", startupComplete: false };
const response: Promise<ReadyResponses[200]> = ready({}, { signal: new AbortController().signal });
const legacy = runPixel<[number]>("1+1;");
`;

describe("published generated SDK", () => {
	let temporary: string;
	beforeAll(async () => {
		assert(
			existsSync(join(packageRoot, "dist/index.mjs")),
			"Build SDK before integration tests",
		);
		temporary = await mkdtemp(join(packageRoot, ".exports-check-"));
	});
	afterAll(async () => {
		if (temporary) await rm(temporary, { recursive: true, force: true });
	});

	it("ships declarations that infer API, builder, runPixel and hook types", async () => {
		const file = join(temporary, "consumer.ts");
		await writeFile(file, fixture);
		const program = ts.createProgram([file], {
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			target: ts.ScriptTarget.ES2022,
			noEmit: true,
			strict: true,
			types: [],
		});
		const diagnostics = ts.getPreEmitDiagnostics(program);
		expect(
			diagnostics,
			ts.formatDiagnosticsWithColorAndContext(diagnostics, {
				getCanonicalFileName: (name) => name,
				getCurrentDirectory: () => packageRoot,
				getNewLine: () => "\n",
			}),
		).toEqual([]);
	});

	it("loads the real ESM exports and uses existing transport and initialization", async () => {
		expect(Object.keys(manifest.exports).sort()).toEqual([
			".",
			"./api",
			"./api/health",
			"./react",
		]);
		for (const targets of Object.values(manifest.exports)) {
			expect(existsSync(join(packageRoot, targets.types))).toBe(true);
			expect(existsSync(join(packageRoot, targets.default))).toBe(true);
		}
		await execFileAsync(
			process.execPath,
			[
				"--input-type=module",
				"--eval",
				`
import assert from "node:assert/strict";
const listeners = [];
const calls = [];
globalThis.document = { getElementById: () => ({ textContent: '{"APP":"app","MODULE":"/FromDocument"}' }) };
globalThis.window = { addEventListener: (...args) => listeners.push(args) };
globalThis.fetch = async (...args) => { calls.push(args); return Response.json({ status: "READY", startupComplete: true }); };
const health = await import("@semoss/sdk/api/health");
await health.ready();
assert.equal(calls[0][0], "/FromDocument/health/ready");
assert.equal(listeners.length, 0, "route-only import does not initialize root listeners");
const sdk = await import("@semoss/sdk");
assert(listeners.some(([name]) => name === "message"), "root initialization survives publishing");
const hooks = await import("@semoss/sdk/react");
assert.equal(typeof hooks.useAPI, "function");
assert.equal(typeof hooks.usePixel, "function");
assert.equal(hooks.buildPixel, sdk.buildPixel);
assert.equal(hooks.rawPixel, sdk.rawPixel);
assert.equal(sdk.buildPixel("StopPixelExecution", { id: "job" }), 'StopPixelExecution(id=["job"]);');
for (const helper of ["runPixel", "get", "post", "login", "pollAgentRun", "getRoomMessages"]) assert.equal(typeof sdk[helper], "function");
for (const path of ["lib/reactors/catalog", "utility/http", "api/monolith/engine"]) {
    await assert.rejects(import("@semoss/sdk/" + path), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
}
globalThis.fetch = async () => Response.json({ status: "NOT_READY", startupComplete: false }, { status: 503 });
const { ApiError } = await import("@semoss/sdk/api");
await assert.rejects(health.ready(), error => error instanceof ApiError && error.status === 503 && error.data.status === "NOT_READY");
`,
			],
			{ cwd: packageRoot, timeout: 15_000 },
		);
	});

	it("bundles a generated route without bringing in React, stores, or the reactor catalog", async () => {
		const entry = join(temporary, "route.js");
		await writeFile(
			entry,
			'export { ready } from "@semoss/sdk/api/health";',
		);
		const result = await build({
			configFile: false,
			root: packageRoot,
			logLevel: "silent",
			build: {
				write: false,
				minify: false,
				lib: { entry, formats: ["es"] },
			},
		});
		const outputs = Array.isArray(result) ? result : [result];
		const code = outputs
			.flatMap((output) => ("output" in output ? output.output : []))
			.flatMap((chunk) => (chunk.type === "chunk" ? [chunk.code] : []))
			.join("\n");
		expect(code).toContain("/health/ready");
		expect(code).not.toMatch(
			/StopPixelExecution|InsightStore|useEffect|SMSS_INIT_TOOL/,
		);
	});
});
