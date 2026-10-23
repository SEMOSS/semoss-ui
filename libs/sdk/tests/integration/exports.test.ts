import ts from "typescript";
import { build, type Rolldown } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import manifest from "../../package.json";

interface ExportTargets {
	types: string;
	default: string;
}

interface ConsumerBundle {
	chunks: Rolldown.OutputChunk[];
	code: string;
	entry: string;
}

const packageRoot = resolve(import.meta.dirname, "../..");
const exports: Record<string, ExportTargets> = manifest.exports;
const publicPaths = new Set(
	Object.keys(exports).filter((entry) => !entry.includes("*")),
);
const routeGroups = [
	"monolith",
	"github",
	"msgraph",
	"adminconfig",
	"health",
	"token",
];
const publicRootHelpers = [
	"runPixel",
	"get",
	"post",
	"HttpError",
	"UnauthorizedError",
	"waitForEmbedAuth",
];
const internalExports = [
	"sendRequest",
	"getResponseRedirect",
	"followResponseRedirect",
	"clearSession",
	"getSessionGeneration",
	"rememberSession",
	"csrfState",
	"request",
	"put",
	"del",
	"repeat",
	"encodeBody",
	"readBody",
	"path",
	"url",
	"QueryParams",
	"RequestShape",
	"CsrfState",
	"Repeated",
];
const privateSubpaths = [
	"utility",
	"utility/fetch",
	"utility/session",
	"utility/request",
	"utility/request-types",
	"utility/http",
	"utility/body",
	"utility/url",
	"utility/api-types",
	"utility/error",
	"utility/embed-auth",
];

for (const group of routeGroups) {
	for (const file of globSync(`${group}/**/*.ts`, {
		cwd: join(packageRoot, "src/api"),
	})) {
		if (file.endsWith(".test.ts")) continue;
		const route = file.replaceAll("\\", "/").replace(/\.ts$/, "");
		publicPaths.add(
			`./api/${route === `${group}/${group}` ? group : route}`,
		);
	}
}

/** Resolve nested resource exports through the package's public export map. */
function targetsFor(publicPath: string): ExportTargets {
	if (exports[publicPath]) return exports[publicPath];
	for (const [pattern, targets] of Object.entries(exports)) {
		if (!pattern.includes("*")) continue;
		const [prefix, suffix] = pattern.split("*");
		if (!publicPath.startsWith(prefix) || !publicPath.endsWith(suffix))
			continue;
		const replacement = publicPath.slice(
			prefix.length,
			publicPath.length - suffix.length || undefined,
		);
		return {
			types: targets.types.replace("*", replacement),
			default: targets.default.replace("*", replacement),
		};
	}
	throw new Error(`No public export for ${publicPath}`);
}

const compilerOptions: ts.CompilerOptions = {
	module: ts.ModuleKind.ESNext,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
	target: ts.ScriptTarget.ES2022,
	jsx: ts.JsxEmit.ReactJSX,
	noEmit: true,
	types: [],
	strict: true,
};

const helperFixture = `
import { runPixel, get, post, CSRF, HttpError, UnauthorizedError as RootUnauthorizedError, waitForEmbedAuth } from "@semoss/sdk";
import { ApiError, UnauthorizedError, type RequestOptions } from "@semoss/sdk/api";
declare const pixel: Awaited<ReturnType<typeof runPixel<[string, number]>>>;
const output: string | number = pixel.pixelReturn[0].output;
const insightId: string = pixel.insightId;
const errors: string[] = pixel.errors;
runPixel<[string, number]>("Example();", "insight-id");
declare const received: Awaited<ReturnType<typeof get<{ value: string }>>>;
const response: Response = received.response;
const data: string = received.data.value;
post<{ value: string }>("/example", { data: "a&b" }, { signal: AbortSignal.timeout(1000) });
CSRF.isEnabled = true;
CSRF.token = "token";
CSRF.cookie = "JSESSIONID=value";
const httpError = new HttpError("Failed", 503, { detail: "Unavailable" });
const status: number = httpError.status;
const errorData: unknown = httpError.data;
const unauthorizedCode: number = new RootUnauthorizedError("Redirect", 302).code;
const embeddedAuth: Promise<void> = waitForEmbedAuth();
const options: RequestOptions = { signal: AbortSignal.timeout(1000), headers: { Accept: "application/json" } };
export {};
`;

// Executed only in a child Node process. Browser globals cannot leak into Vitest
// or influence native ESM loading of the production consumer bundles.
const browserFixture = `
import assert from "node:assert/strict";
const calls = [];
const listeners = [];
globalThis.document = {
    getElementById: (id) => id === "semoss-env"
        ? { textContent: '{"APP":"portal","MODULE":"/FromDocument"}' }
        : null,
};
globalThis.window = { addEventListener: (...args) => listeners.push(args) };
globalThis.fetch = async (...args) => {
    calls.push(args);
    return Response.json({ checked: true });
};
`;
const execFileAsync = promisify(execFile);

/** Run actual emitted ESM without Vitest's module transforms, mocks, or cache. */
async function runConsumer(source: string): Promise<void> {
	await execFileAsync(
		process.execPath,
		["--input-type=module", "--eval", browserFixture + source],
		{ cwd: packageRoot, timeout: 15_000 },
	);
}

/** Rebundle public imports into temporary files, leaving the SDK build intact. */
async function buildConsumer(
	temporary: string,
	name: string,
	source: string,
): Promise<ConsumerBundle> {
	const entry = join(temporary, `${name}.js`);
	await writeFile(entry, source);
	const result = await build({
		configFile: false,
		root: packageRoot,
		logLevel: "silent",
		build: {
			write: false,
			minify: false,
			lib: { entry, formats: ["es"] },
			rolldownOptions: { external: ["react", /^react\//] },
		},
	});
	const chunks = (Array.isArray(result) ? result : [result])
		.flatMap((output) => {
			assert("output" in output, "consumer build returns emitted output");
			return output.output;
		})
		.filter((output) => output.type === "chunk");
	assert(chunks.length > 0, `${name} emits JavaScript`);
	for (const chunk of chunks) {
		const destination = join(temporary, name, chunk.fileName);
		await mkdir(dirname(destination), { recursive: true });
		await writeFile(destination, chunk.code);
	}
	const entryChunk = chunks.find((chunk) => chunk.isEntry);
	assert(entryChunk, `${name} emits an entry`);
	return {
		chunks,
		code: chunks.map((chunk) => chunk.code).join("\n"),
		entry: pathToFileURL(join(temporary, name, entryChunk.fileName)).href,
	};
}

describe("built SDK exports", () => {
	let temporary: string | undefined;
	let typeFixture: string;
	let program: ts.Program;

	beforeAll(async () => {
		assert(
			existsSync(resolve(packageRoot, exports["."].default)),
			"Build the SDK first with pnpm --filter @semoss/sdk test:integration",
		);
		temporary = await mkdtemp(join(packageRoot, ".exports-check-"));
		typeFixture = join(temporary, "types.ts");
		const typeImports = [...publicPaths].sort().map((publicPath, index) => {
			const specifier = `${manifest.name}${publicPath === "." ? "" : publicPath.slice(1)}`;
			return `import type * as Entry${index} from ${JSON.stringify(specifier)};`;
		});
		await writeFile(typeFixture, typeImports.join("\n") + helperFixture);
		program = ts.createProgram([typeFixture], compilerOptions);
	});

	afterAll(async () => {
		if (temporary) await rm(temporary, { recursive: true, force: true });
	});

	it("resolves public entries and helpers while keeping utility subpaths private", async () => {
		expect(
			Object.keys(exports).some((path) => path.startsWith("./monolith")),
		).toBe(false);
		expect(
			Object.keys(exports).some(
				(path) => path === "./utility" || path.startsWith("./utility/"),
			),
		).toBe(false);
		for (const publicPath of publicPaths) {
			const specifier = `${manifest.name}${publicPath === "." ? "" : publicPath.slice(1)}`;
			const targets = targetsFor(publicPath);
			for (const condition of ["default", "types"] as const) {
				expect(
					existsSync(resolve(packageRoot, targets[condition])),
					`${specifier}: missing ${targets[condition]}`,
				).toBe(true);
			}
			expect(fileURLToPath(import.meta.resolve(specifier))).toBe(
				resolve(packageRoot, targets.default),
			);
			expect(
				ts.resolveModuleName(
					specifier,
					typeFixture,
					compilerOptions,
					ts.sys,
				).resolvedModule?.resolvedFileName,
			).toBe(resolve(packageRoot, targets.types));
		}
		for (const path of privateSubpaths) {
			const specifier = `${manifest.name}/${path}`;
			expect(
				ts.resolveModuleName(
					specifier,
					typeFixture,
					compilerOptions,
					ts.sys,
				).resolvedModule,
				`${specifier} has no public declaration entry`,
			).toBeUndefined();
		}
		const specifiers = [...publicPaths].map(
			(path) => `${manifest.name}${path === "." ? "" : path.slice(1)}`,
		);
		await runConsumer(`
const sdk = await import("@semoss/sdk");
for (const name of ${JSON.stringify(publicRootHelpers)}) {
    assert.equal(typeof sdk[name], "function", name + " remains a public root helper");
}
assert.equal(typeof sdk.CSRF, "object");
assert.notEqual(sdk.CSRF, null);
for (const specifier of ${JSON.stringify(specifiers)}) {
    const entry = await import(specifier);
    for (const name of ${JSON.stringify(internalExports)}) {
        assert.equal(Object.hasOwn(entry, name), false, specifier + " must not export " + name);
    }
}
for (const path of ${JSON.stringify(privateSubpaths)}) {
    await assert.rejects(import("@semoss/sdk/" + path), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
}
`);
	});

	it("compiles public helper contracts without exposing internal declarations", () => {
		const diagnostics = ts.getPreEmitDiagnostics(program);
		expect(
			diagnostics,
			ts.formatDiagnosticsWithColorAndContext(diagnostics, {
				getCanonicalFileName: (name) => name,
				getCurrentDirectory: () => packageRoot,
				getNewLine: () => "\n",
			}),
		).toHaveLength(0);
		const checker = program.getTypeChecker();
		for (const publicPath of publicPaths) {
			const declaration = program.getSourceFile(
				resolve(packageRoot, targetsFor(publicPath).types),
			);
			assert(declaration, `${publicPath} declarations were loaded`);
			const symbol = checker.getSymbolAtLocation(declaration);
			assert(symbol, `${publicPath} declarations define a module`);
			const exportedNames = checker
				.getExportsOfModule(symbol)
				.map((entry) => entry.name);
			for (const name of internalExports) {
				expect(
					exportedNames,
					`${publicPath} must not export the internal declaration ${name}`,
				).not.toContain(name);
			}
		}
		for (const file of globSync("dist/types/**/*.d.ts", {
			cwd: packageRoot,
		})) {
			expect(
				readFileSync(join(packageRoot, file), "utf8"),
				file,
			).not.toContain("@semoss/monolith");
		}
	});

	it("retains all deprecated root wrappers and their replacement annotations", () => {
		const checker = program.getTypeChecker();
		const rootDeclaration = program.getSourceFile(
			resolve(packageRoot, exports["."].types),
		);
		assert(rootDeclaration, "root declarations were loaded");
		const rootSymbol = checker.getSymbolAtLocation(rootDeclaration);
		assert(rootSymbol, "root declarations define a module");
		const rootExports = checker.getExportsOfModule(rootSymbol);
		for (const name of [
			"runPixelAsync",
			"console",
			"getPixelJobStreaming",
			"partial",
			"pollAgentRun",
			"login",
			"loginLDAP",
			"confirmOTP",
			"logout",
			"logoutProvider",
			"getUserProjectPermission",
			"getUserEnginePermission",
			"propagateUserPermissions",
			"upload",
			"uploadInsight",
			"uploadApp",
			"uploadEngine",
			"uploadUser",
		]) {
			let symbol = rootExports.find((entry) => entry.name === name);
			assert(symbol, `${name} remains a public root export`);
			if (symbol.flags & ts.SymbolFlags.Alias)
				symbol = checker.getAliasedSymbol(symbol);
			const deprecation = symbol
				.getJsDocTags(checker)
				.find((tag) => tag.name === "deprecated");
			assert(deprecation, `${name} has a declaration-level deprecation`);
			expect(
				deprecation.text?.some((part) =>
					part.text.includes("@semoss/sdk/api/monolith/"),
				),
				`${name} names its replacement resource`,
			).toBe(true);
		}
	});

	it("tree shakes route consumers while retaining document Env initialization", async () => {
		assert(temporary, "temporary fixture directory exists");
		const route = await buildConsumer(
			temporary,
			"route",
			'export { getConfig } from "@semoss/sdk/api/monolith/config";',
		);
		expect(route.code).not.toContain("/api/config/endpoints");
		expect(route.code).not.toContain("SMSS_INIT_TOOL");
		for (const chunk of route.chunks) {
			expect(
				chunk.imports.some((entry) => /^react(?:\/|$)/.test(entry)),
			).toBe(false);
			for (const [id, module] of Object.entries(chunk.modules)) {
				if (
					!module.renderedLength ||
					!id.startsWith(join(packageRoot, "dist"))
				)
					continue;
				expect(id).not.toBe(join(packageRoot, "dist/index.mjs"));
				const mapPath = `${id}.map`;
				expect(
					existsSync(mapPath),
					`${id} needs a production source map`,
				).toBe(true);
				const map: { sources: string[] } = JSON.parse(
					readFileSync(mapPath, "utf8"),
				);
				expect(
					map.sources.some(
						(source) =>
							/(?:^|\/)src\/(?:stores|js-frameworks)\//.test(
								source,
							) || source.endsWith("/listener.ts"),
					),
					`${id} includes stores, React, or root initialization`,
				).toBe(false);
			}
		}
		await runConsumer(`
const route = await import(${JSON.stringify(route.entry)});
assert.deepEqual(await route.getConfig(), { checked: true });
assert.equal(calls[0][0], "/FromDocument/api/config");
assert.equal(listeners.length, 0, "route loading registers no root listeners");
`);
	});

	it("retains the functional root listener in consumer bundles", async () => {
		assert(temporary, "temporary fixture directory exists");
		const root = await buildConsumer(
			temporary,
			"root",
			'export { Env } from "@semoss/sdk";',
		);
		expect(root.code).toContain("SMSS_INIT_TOOL");
		await runConsumer(`
const { Env } = await import(${JSON.stringify(root.entry)});
assert.equal(Env.APP, "portal");
const listener = listeners.find(([event]) => event === "message")?.[1];
assert.equal(typeof listener, "function");
listener({ data: { type: "SMSS_INIT_TOOL", tool: { id: "from-host", type: "test" } } });
assert.equal(Env.TOOL.id, "from-host");
`);
	});
});
