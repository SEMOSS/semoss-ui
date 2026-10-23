import ts from "typescript";
import { build } from "vite";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
	readFileSync(join(packageRoot, "package.json"), "utf8"),
);
const publicPaths = new Set(
	Object.keys(manifest.exports).filter((entry) => !entry.includes("*")),
);
assert(
	!Object.keys(manifest.exports).some((entry) =>
		entry.startsWith("./monolith"),
	),
	"the removed Monolith export paths are not published",
);
const routeGroups = [
	"monolith",
	"github",
	"msgraph",
	"adminconfig",
	"health",
	"token",
];

// Check every source route, including nested resources, against the published map.
for (const group of routeGroups) {
	for (const file of globSync(`${group}/**/*.ts`, {
		cwd: join(packageRoot, "src/api"),
	})) {
		if (/\.(?:test|spec)\.ts$/.test(file)) continue;
		const route = file.replaceAll("\\", "/").replace(/\.ts$/, "");
		publicPaths.add(
			`./api/${route === `${group}/${group}` ? group : route}`,
		);
	}
}

/** Resolve an exact or nested wildcard public export without bypassing its map. */
function targetsFor(publicPath) {
	if (manifest.exports[publicPath]) return manifest.exports[publicPath];
	for (const [pattern, targets] of Object.entries(manifest.exports)) {
		if (!pattern.includes("*")) continue;
		const [prefix, suffix] = pattern.split("*");
		if (!publicPath.startsWith(prefix) || !publicPath.endsWith(suffix))
			continue;
		const replacement = publicPath.slice(
			prefix.length,
			publicPath.length - suffix.length || undefined,
		);
		return Object.fromEntries(
			Object.entries(targets).map(([condition, target]) => [
				condition,
				target.replace("*", replacement),
			]),
		);
	}
	throw new Error(`No public export for ${publicPath}`);
}

const temporary = await mkdtemp(join(packageRoot, ".exports-check-"));
const globals = new Map(
	["document", "window", "fetch"].map((name) => [
		name,
		Object.getOwnPropertyDescriptor(globalThis, name),
	]),
);

try {
	const compilerOptions = {
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		target: ts.ScriptTarget.ES2022,
		jsx: ts.JsxEmit.ReactJSX,
		noEmit: true,
		types: [],
		strict: true,
	};
	const typeFixture = join(temporary, "types.ts");
	const typeImports = [];
	for (const [index, publicPath] of [...publicPaths].sort().entries()) {
		const specifier = `${manifest.name}${publicPath === "." ? "" : publicPath.slice(1)}`;
		const targets = targetsFor(publicPath);
		for (const condition of ["default", "types"]) {
			assert.equal(
				typeof targets[condition],
				"string",
				`${specifier} has a ${condition} target`,
			);
			assert(
				existsSync(resolve(packageRoot, targets[condition])),
				`${specifier}: missing ${targets[condition]}; run the SDK build first`,
			);
		}
		assert.equal(
			fileURLToPath(import.meta.resolve(specifier)),
			resolve(packageRoot, targets.default),
			`${specifier} resolves to its public JavaScript target`,
		);
		assert.equal(
			ts.resolveModuleName(
				specifier,
				typeFixture,
				compilerOptions,
				ts.sys,
			).resolvedModule?.resolvedFileName,
			resolve(packageRoot, targets.types),
			`${specifier} resolves to its public declaration target`,
		);
		typeImports.push(
			`import type * as Entry${index} from ${JSON.stringify(specifier)};`,
		);
	}
	await writeFile(
		typeFixture,
		`${typeImports.join("\n")}
import { runPixel, get, post, CSRF } from "@semoss/sdk";
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
const options: RequestOptions = { signal: AbortSignal.timeout(1000), headers: { Accept: "application/json" } };
export {};
`,
	);
	const program = ts.createProgram([typeFixture], compilerOptions);
	const diagnostics = ts.getPreEmitDiagnostics(program);
	assert.equal(
		diagnostics.length,
		0,
		ts.formatDiagnosticsWithColorAndContext(diagnostics, {
			getCanonicalFileName: (name) => name,
			getCurrentDirectory: () => packageRoot,
			getNewLine: () => "\n",
		}),
	);
	const checker = program.getTypeChecker();
	const rootDeclaration = program.getSourceFile(
		resolve(packageRoot, manifest.exports["."].types),
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
		assert(
			deprecation.text?.some((part) =>
				part.text.includes("@semoss/sdk/api/monolith/"),
			),
			`${name} names its replacement resource in the declaration`,
		);
	}
	for (const file of globSync("dist/types/**/*.d.ts", { cwd: packageRoot })) {
		assert(
			!readFileSync(join(packageRoot, file), "utf8").includes(
				"@semoss/monolith",
			),
			`${file} references the removed package`,
		);
	}

	/** Rebundle real public imports as a consumer, keeping the SDK build untouched. */
	async function consumer(name, source) {
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
			.flatMap((output) => output.output)
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
			entry: pathToFileURL(join(temporary, name, entryChunk.fileName))
				.href,
		};
	}

	const route = await consumer(
		"route",
		'export { getConfig } from "@semoss/sdk/api/monolith/config";',
	);
	assert(
		!route.code.includes("/api/config/endpoints"),
		"unused exports in the same route module are removed",
	);
	assert(
		!route.code.includes("SMSS_INIT_TOOL"),
		"a route import does not install the root listener",
	);
	for (const chunk of route.chunks) {
		assert(
			!chunk.imports.some((entry) => /^react(?:\/|$)/.test(entry)),
			"route imports do not depend on React",
		);
		for (const [id, module] of Object.entries(chunk.modules)) {
			if (
				!module.renderedLength ||
				!id.startsWith(join(packageRoot, "dist"))
			)
				continue;
			assert.notEqual(
				id,
				join(packageRoot, "dist/index.mjs"),
				"route imports bypass the SDK root",
			);
			const mapPath = `${id}.map`;
			assert(
				existsSync(mapPath),
				`${id} has a production source map; build in production mode first`,
			);
			const map = JSON.parse(readFileSync(mapPath, "utf8"));
			assert(
				!map.sources.some(
					(source) =>
						/(?:^|\/)src\/(?:stores|js-frameworks)\//.test(
							source,
						) || source.endsWith("/listener.ts"),
				),
				`${id} couples the route to stores, React, or root initialization`,
			);
		}
	}

	const calls = [];
	const listeners = [];
	Object.defineProperty(globalThis, "document", {
		configurable: true,
		value: {
			getElementById: (id) =>
				id === "semoss-env"
					? {
							textContent:
								'{"APP":"portal","MODULE":"/FromDocument"}',
						}
					: null,
		},
	});
	Object.defineProperty(globalThis, "window", {
		configurable: true,
		value: { addEventListener: (...args) => listeners.push(args) },
	});
	Object.defineProperty(globalThis, "fetch", {
		configurable: true,
		value: async (...args) => {
			calls.push(args);
			return Response.json({ checked: true });
		},
	});
	const routeModule = await import(route.entry);
	assert.deepEqual(await routeModule.getConfig(), { checked: true });
	assert.equal(
		calls[0][0],
		"/FromDocument/api/config",
		"document-driven Env initialization survives route tree shaking",
	);
	assert.equal(
		listeners.length,
		0,
		"route loading registers no root listeners",
	);

	const root = await consumer("root", 'export { Env } from "@semoss/sdk";');
	assert(
		root.code.includes("SMSS_INIT_TOOL"),
		"the root consumer retains its listener side effect",
	);
	const rootModule = await import(root.entry);
	assert.equal(rootModule.Env.APP, "portal");
	const messageListener = listeners.find(
		([event]) => event === "message",
	)?.[1];
	assert.equal(
		typeof messageListener,
		"function",
		"the root import installs its message listener",
	);
	messageListener({
		data: {
			type: "SMSS_INIT_TOOL",
			tool: { id: "from-host", type: "test" },
		},
	});
	assert.equal(
		rootModule.Env.TOOL.id,
		"from-host",
		"the retained root listener remains functional",
	);

	console.log(
		`Validated ${publicPaths.size} public JavaScript/type entry points and consumer tree shaking (${Buffer.byteLength(route.code)} route bytes).`,
	);
} finally {
	for (const [name, descriptor] of globals) {
		if (descriptor) Object.defineProperty(globalThis, name, descriptor);
		else Reflect.deleteProperty(globalThis, name);
	}
	await rm(temporary, { recursive: true, force: true });
}
