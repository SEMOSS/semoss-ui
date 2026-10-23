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
	"buildPixel",
	"rawPixel",
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
	"BuiltPixel",
	"BuildPixelArguments",
	"ResolvePixelOutput",
	"UsePixelResult",
	"ReactorName",
	"ReactorCatalog",
	"VerifiedReactorCatalog",
	"CollaborationOutputTypes",
	"ImplementationOutputTypes",
	"QueryOutputTypes",
	"ResourceOutputTypes",
	"ReactorContract",
	"RawPixel",
	"PixelValue",
	"PixelArgument",
	"pixelReactor",
	"rawPixelMarker",
	"reactorNames",
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
	"lib/build-pixel",
	"lib/raw-pixel",
	"lib/pixel-types",
	"lib/reactors/catalog",
	"lib/reactors/inventory",
	"lib/reactors/value-types",
	"lib/reactors/collaboration-output-types",
	"lib/reactors/implementation-output-types",
	"lib/reactors/query-output-types",
	"lib/reactors/resource-output-types",
	"reactors",
	"reactors/catalog",
	"reactors/inventory",
	"reactors/value-types",
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
import { useCallback } from "react";
import { useAPI, type APIConfig, type APIState, type UseAPIResult } from "@semoss/sdk/react";
import { getProjects } from "@semoss/sdk/api/monolith/auth/admin/project";
function useAPIContract(filterWord: string, isEnabled: boolean): UseAPIResult<Awaited<ReturnType<typeof getProjects>>> {
    const projects = useAPI(isEnabled ? [getProjects, { filterWord, limit: 20 }] : null);
    const data: Awaited<ReturnType<typeof getProjects>> | undefined = projects.data;
    const refresh: () => void = projects.refresh;
    const update: (data: typeof projects.data) => void = projects.update;
    return projects;
}
function useTypedAPIContract(): UseAPIResult<{ id: number }> {
    const request = useCallback(async () => ({ id: 42 }), []);
    const config: APIConfig<{ id: number }> = {
        onSuccess(data) { const id: number = data.id; },
        onError(data, error) { const id: number | undefined = data?.id; const message: string = error.message; },
    };
    const result = useAPI(request, config);
    const state: APIState<{ id: number }> = result;
    const id: number | undefined = result.data?.id;
    // @ts-expect-error API result fields retain their inferred types.
    const invalidId: string = result.data?.id;
    // @ts-expect-error Local updates must match the API response.
    const invalidUpdate: Parameters<typeof result.update>[0] = { id: "invalid" };
    return result;
}
declare const readItem: (id: string, limit: number, include?: boolean) => Promise<{ id: string; limit: number }>;
declare const readMany: (prefix: string, ...ids: number[]) => Promise<number[]>;
function useAPIArgumentsContract(id: string): UseAPIResult<{ id: string; limit: number }> {
    const result = useAPI([readItem, id, 20], {
        onSuccess(data) {
            const id: string = data.id;
            // @ts-expect-error Callback data is inferred from the method's return type.
            const invalid: number = data.id;
        },
    });
    const readonlyCall = [readItem, id, 20, true] as const;
    const readonlyResult: UseAPIResult<{ id: string; limit: number }> = useAPI(readonlyCall);
    const restResult: UseAPIResult<number[]> = useAPI([readMany, "prefix", 1, 2]);
    // @ts-expect-error Required method arguments must be supplied.
    useAPI([readItem, id]);
    // @ts-expect-error Method argument types are checked positionally.
    useAPI([readItem, id, "invalid"]);
    // @ts-expect-error Optional arguments retain their declared types.
    useAPI([readItem, id, 20, "invalid"]);
    // @ts-expect-error Extra arguments are rejected for non-variadic methods.
    useAPI([readItem, id, 20, true, "extra"]);
    // @ts-expect-error Empty tuples have no callable method.
    useAPI([]);
    // @ts-expect-error A method requiring arguments cannot use the direct no-argument form.
    useAPI(readItem);
    // @ts-expect-error Initial data must match the method's response type.
    useAPI([readItem, id, 20], { data: { id, limit: "invalid" } });
    return result;
}
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

const pixelFixture = `
import { buildPixel, rawPixel } from "@semoss/sdk";
import { buildPixel as buildReactPixel, rawPixel as rawReactPixel, usePixel } from "@semoss/sdk/react";
const framePixel = buildPixel("FrameType");
const reactFramePixel = buildReactPixel("FrameType");
buildReactPixel("Select", [rawReactPixel("name")]);
const plainBuiltPixel: string = framePixel;
const projectPixel = buildPixel("GetProjectList");
const headerPixel = buildPixel("FrameHeaderExists", { column: "name" });
const sumPixel = buildPixel("SUM", [1, 2, 3]);
const selectPixel = buildPixel("Select", [rawPixel("name"), rawPixel("age")]);
const modelPixel = buildPixel("LLM", { engine: "model-id", command: "Hello" });
const workPixel = buildPixel("WorkListItems", {});
const gitPixel = buildPixel("EngineGitCheckout", { engine: "engine-id", branch: "main" });
buildPixel("UUID");
buildPixel("CreateProject", { project: "project-name" });
// @ts-expect-error Omission is not allowed until the source contract proves it safe.
buildPixel("CreateProject");
buildPixel("FrameHeaderExists", ["name", rawPixel("frame")]);
buildPixel("FrameHeaderExists", [rawPixel("frame"), "name"]);
const readonlyNumbers = [1, 2, 3] as const;
buildPixel("SUM", readonlyNumbers);
declare const reactorChoice: "FrameHeaderExists" | "LLM";
// @ts-expect-error A union reactor name must be narrowed to match its parameters.
buildPixel(reactorChoice, { column: "name" });
declare const correlatedCall:
    | readonly ["FrameHeaderExists", { column: string }]
    | readonly ["LLM", { engine: string; command: string }];
const correlatedPixel = buildPixel(...correlatedCall);
buildPixel("EngineGitCheckout", { engine: "engine-id", branch: "main" });
buildPixel("EngineGitCheckout", ["engine-id", "main"]);
// @ts-expect-error Inherited required engine and branch arguments are enforced.
buildPixel("EngineGitCheckout", { branch: "main" });
// @ts-expect-error Positional calls must supply all inherited required arguments.
buildPixel("EngineGitCheckout", ["engine-id"]);
// @ts-expect-error Reactor names must belong to the synchronized catalog.
buildPixel("NoSuchReactorInTheCatalog");
// @ts-expect-error Required LLM arguments cannot be omitted.
buildPixel("LLM");
// @ts-expect-error LLM requires both engine and command.
buildPixel("LLM", { engine: "model-id" });
// @ts-expect-error Verified parameter values retain their type.
buildPixel("FrameHeaderExists", { column: 42 });
// @ts-expect-error Unknown parameter keys are rejected.
buildPixel("FrameHeaderExists", { column: "name", typo: true });
// @ts-expect-error Positional parameters retain their verified types.
buildPixel("FrameHeaderExists", [42]);
// @ts-expect-error SUM reads positional values, not named numericValues.
buildPixel("SUM", { numericValues: [1, 2] });

async function pixelOutputContracts(): Promise<void> {
    const correlated: boolean | { response?: unknown } = (await runPixel(correlatedPixel)).pixelReturn[0].output;
    const reactFrame: string = (await runPixel(reactFramePixel)).pixelReturn[0].output;
    const frame: "GRID" | "GRAPH" | "R" | "PY" | "NATIVE" | "IGRAPH" = (await runPixel(framePixel)).pixelReturn[0].output;
    const exists: boolean = (await runPixel(headerPixel)).pixelReturn[0].output;
    const sum: number = (await runPixel(sumPixel)).pixelReturn[0].output;
    const projects: { project_id?: string; project_name?: string; project_favorite: number }[] = (await runPixel(projectPixel)).pixelReturn[0].output;
    const query: { qsType: string; isDistinct: boolean; limit: number } = (await runPixel(selectPixel)).pixelReturn[0].output;
    const selector = (await runPixel(selectPixel)).pixelReturn[0].output.selectors?.[0];
    if (selector?.type === "COLUMN") {
        const column: string | undefined = selector.content.column;
        // @ts-expect-error Selector discriminants retain the adapter's field types.
        const wrongColumn: number = selector.content.column;
    }
    const work = (await runPixel(workPixel)).pixelReturn[0].output;
    const workCount: number = work.total;
    const itemTitle: string | undefined = work.items[0]?.title;
    const fyiCount: number = work.fyiCount;
    // @ts-expect-error Concrete helper output fields retain their scalar types.
    const wrongCount: string = work.total;
    const git = (await runPixel(gitPixel)).pixelReturn[0].output;
    const changedPath: string | undefined = git.status.staged[0]?.path;
    const clean: boolean = git.status.clean;
    const settings = (await runPixel(buildPixel("BrainGetSettings", {}))).pixelReturn[0].output;
    const memoryEnabled: boolean = settings.memory.use;
    const profile = (await runPixel(buildPixel("BrainGetProfile", {}))).pixelReturn[0].output;
    const styleConfirmed: boolean | undefined = profile?.style.confirmed;
    // @ts-expect-error Nullable SQL reads must be narrowed before reading fields.
    const unguardedProfile: boolean = profile.style.confirmed;
    const model = (await runPixel(modelPixel)).pixelReturn[0].output;
    const modelResponse: unknown = model.response;
    const modelMessageType: string | undefined = model.messageType;
    // @ts-expect-error A model response can contain structured or media output.
    const modelText: string = model.response;
    // @ts-expect-error The inferred FrameType result is a string.
    const invalid: number = (await runPixel(framePixel)).pixelReturn[0].output;
    const override: { id: number } = (await runPixel<[{ id: number }]>(framePixel)).pixelReturn[0].output;
    const arrayOverride: string = (await runPixel<[string]>(buildPixel("LIST", [1, 2]))).pixelReturn[0].output;
    const legacy: string | number = (await runPixel<[string, number]>("Raw();")).pixelReturn[0].output;
    const unknownOutput: unknown = (await runPixel("Raw();")).pixelReturn[0].output;
    // @ts-expect-error Raw strings without an explicit type keep unknown output.
    const invalidRaw: string = (await runPixel("Raw();")).pixelReturn[0].output;
    const instantiated = runPixel<[string, number]>;
    const instantiatedOutput: string | number = (await instantiated(framePixel)).pixelReturn[0].output;
}

function useBuiltPixelContract(isEnabled: boolean): void {
    const reactFrame: string = usePixel(reactFramePixel).data;
    const frame = usePixel(isEnabled ? framePixel : "", {
        data: "GRID",
        onSuccess(data) { const value: string = data; },
        onError(data, error) { const initial: string = data; const message: string = error.message; },
    }, "insight-id");
    const data: string = frame.data;
    const update: (data: typeof frame.data) => void = frame.update;
    // @ts-expect-error Built results retain their inferred data type.
    const wrongData: number = frame.data;
    // @ts-expect-error Local updates must match the reactor output.
    frame.update(42);
    const header = usePixel(headerPixel, { data: false, onSuccess(data) { const value: boolean = data; } });
    const exists: boolean = header.data;
    const numeric = usePixel(sumPixel);
    const sum: number = numeric.data;
    const union = usePixel(isEnabled ? framePixel : headerPixel);
    const unionData: string | boolean = union.data;
    const mixed = usePixel(isEnabled ? framePixel : "Raw();");
    const mixedData: unknown = mixed.data;
    // @ts-expect-error A nonempty raw alternative cannot claim the branded output.
    const invalidMixed: string = mixed.data;
    const defaulted = usePixel(framePixel);
    const defaultedData: string = defaulted.data;
    // @ts-expect-error Initial data must match the inferred reactor output.
    usePixel(framePixel, { data: 42 });
    // @ts-expect-error Success callbacks must accept the inferred reactor output.
    usePixel(framePixel, { onSuccess: (data: number) => {} });
    // @ts-expect-error Error callbacks must accept the initial data type.
    usePixel(framePixel, { onError: (data: number, error: Error) => {} });
    const work = usePixel(isEnabled ? workPixel : "", {
        data: { items: [], total: 0, fyiCount: 0, automatedSkippedCount: 0 },
        onSuccess(data) { const title: string | undefined = data.items[0]?.title; },
        onError(data, error) { const count: number = data.total; },
    });
    const count: number = work.data.total;
    work.update({ items: [], total: 1, fyiCount: 0, automatedSkippedCount: 0 });
    // @ts-expect-error Updates need the implementation's full page envelope.
    work.update({ items: [] });
    // @ts-expect-error Initial values must use the helper's numeric count.
    usePixel(workPixel, { data: { items: [], total: "0", fyiCount: 0, automatedSkippedCount: 0 } });
    // @ts-expect-error Callbacks cannot substitute an incompatible wire shape.
    usePixel(workPixel, { onSuccess(data: { total: string }) {} });
}

function useLegacyPixelContracts(): void {
    const explicit = usePixel<{ id: number }>(framePixel, {
        data: { id: 1 },
        onSuccess(data) { const id: number = data.id; },
    });
    const explicitId: number = explicit.data.id;
    explicit.update({ id: 2 });
    const configInferred = usePixel("Raw();", {
        data: { id: 1 },
        onSuccess(data) { const id: number = data.id; },
    });
    const configId: number = configInferred.data.id;
    const callbackInferred = usePixel("Raw();", { onSuccess(data: { id: number }) {} });
    const callbackId: number = callbackInferred.data.id;
    const disabled = usePixel("", { data: "initial" });
    const initial: string = disabled.data;
    const raw = usePixel("Raw();");
    const rawData: unknown = raw.data;
    // @ts-expect-error Raw statements without config or generics cannot infer a result.
    const invalidRaw: string = raw.data;
}
declare const instantiatedHook: ReturnType<typeof usePixel<{ id: number }>>;
const instantiatedHookId: number = instantiatedHook.data.id;
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
		await writeFile(
			typeFixture,
			typeImports.join("\n") + helperFixture + pixelFixture,
		);
		program = ts.createProgram([typeFixture], compilerOptions);
	});

	afterAll(async () => {
		if (temporary) await rm(temporary, { recursive: true, force: true });
	});

	it("resolves public entries and helpers while keeping utility subpaths private", async () => {
		expect(Object.keys(exports).sort()).toEqual([
			".",
			"./api",
			"./api/adminconfig",
			"./api/github",
			"./api/github/*",
			"./api/health",
			"./api/monolith/*",
			"./api/msgraph",
			"./api/token",
			"./react",
		]);
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
assert.equal(sdk.buildPixel("FrameType"), "FrameType();");
assert.equal(typeof sdk.buildPixel("GetProjectList"), "string");
const react = await import("@semoss/sdk/react");
assert.equal(react.buildPixel, sdk.buildPixel, "both entries share the same builder");
assert.equal(react.rawPixel, sdk.rawPixel, "both entries share the same expression marker helper");
assert.equal(typeof react.useAPI, "function", "useAPI is exported from the React entry");
assert.equal(typeof react.usePixel, "function", "usePixel remains exported from the React entry");
assert.equal(Object.hasOwn(sdk, "useAPI"), false, "the core entry stays framework-independent");
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
