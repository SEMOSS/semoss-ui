import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	createBiomeFormatter,
	findRepoRoot,
	GENERATED_HEADER,
	generate,
	MANIFEST_FILE,
	readManifest,
} from "./generate.ts";
import { byName } from "./order.ts";
import { SpecError } from "./spec.ts";

/** A document with the shapes the generator supports, beyond what the pilot uses. */
const SHAPES = {
	openapi: "3.1.0",
	info: {
		title: "Generator fixture",
		version: "1",
	},
	"x-semoss-servlets": {
		"/api": "monolith",
		"/health": "health",
	},
	paths: {
		"/api/auth/users": {
			get: {
				operationId: "users",
				summary: "List users",
				parameters: [
					{
						name: "limit",
						in: "query",
						required: true,
						description: "How many users to return",
						schema: {
							type: "integer",
						},
					},
					{
						name: "search",
						in: "query",
						description: "Text the user's name contains",
						schema: {
							type: "string",
						},
					},
				],
				responses: {
					"200": {
						description: "The users",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										$ref: "#/components/schemas/User",
									},
								},
							},
						},
					},
				},
			},
		},
		"/api/auth/rename": {
			post: {
				operationId: "rename",
				summary: "Rename a user",
				parameters: [
					{
						name: "notify",
						in: "query",
						description: "Whether to tell the user",
						schema: { type: "boolean" },
					},
				],
				requestBody: {
					content: {
						"application/x-www-form-urlencoded": {
							schema: {
								type: "object",
								required: ["id", "name"],
								properties: {
									id: {
										type: "string",
										description: "The user's id",
									},
									name: {
										type: "string",
										description: "The new name",
									},
								},
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Renamed",
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["renamed"],
									properties: {
										renamed: {
											type: "boolean",
											description:
												"Whether the name changed",
										},
									},
								},
							},
						},
					},
				},
			},
		},
		"/health/ready": {
			get: {
				operationId: "ready",
				summary: "Whether the server can take requests",
				responses: {
					"200": {
						description: "Ready",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/Readiness",
								},
							},
						},
					},
					"503": {
						description: "Not ready",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/Readiness",
								},
							},
						},
					},
				},
			},
		},
	},
	components: {
		schemas: {
			User: {
				type: "object",
				description: "A user",
				required: ["id", "roles", "status"],
				properties: {
					id: {
						type: "string",
						description: "Id",
					},
					email: {
						type: ["string", "null"],
						description: "Email, null when unknown",
					},
					roles: {
						type: "array",
						description: "Roles",
						items: {
							type: "string",
						},
					},
					status: {
						$ref: "#/components/schemas/UserStatus",
					},
					scores: {
						type: "array",
						description: "Scores",
						items: {
							type: "number",
						},
					},
				},
			},
			UserStatus: {
				type: "string",
				description: "Whether a user can sign in",
				enum: ["ACTIVE", "LOCKED"],
			},
			Readiness: {
				type: "object",
				description: "Readiness of the server",
				required: ["status"],
				properties: {
					status: {
						type: "string",
						description: "READY or NOT_READY",
						enum: ["READY", "NOT_READY"],
					},
				},
			},
			"Pixel.Count.Input": {
				type: "object",
				description: "Inputs for Count",
				required: ["frame"],
				properties: {
					frame: {
						type: "string",
						description: "The frame",
					},
					columns: {
						type: "array",
						description: "Columns to count",
						items: {
							type: "string",
						},
					},
				},
			},
			"Pixel.Count.Output": {
				type: "integer",
				description: "How many rows",
			},
			"Pixel.Rows.Input": {
				type: "object",
				description: "Rows takes no inputs",
			},
			"Pixel.Rows.Output": {
				type: "array",
				description: "Every row",
				items: {
					$ref: "#/components/schemas/User",
				},
			},
			"Pixel.Anything.Input": {
				type: "object",
				description: "Inputs for Anything",
				properties: {
					value: {
						description: "Any value",
					},
				},
			},
			"Pixel.Anything.Output": {
				description: "Whatever was passed in",
			},
		},
	},
	"x-semoss-pixels": {
		schemaVersion: 1,
		transport: {
			path: "/api/engine/runPixel",
		},
		reactors: {
			Count: {
				description: "Counts rows",
				inputSchema: {
					$ref: "#/components/schemas/Pixel.Count.Input",
				},
				outputSchema: {
					$ref: "#/components/schemas/Pixel.Count.Output",
				},
			},
			Rows: {
				description: "Reads rows",
				inputSchema: {
					$ref: "#/components/schemas/Pixel.Rows.Input",
				},
				outputSchema: {
					$ref: "#/components/schemas/Pixel.Rows.Output",
				},
			},
			Anything: {
				description: "Returns its input",
				inputSchema: {
					$ref: "#/components/schemas/Pixel.Anything.Input",
				},
				outputSchema: {
					$ref: "#/components/schemas/Pixel.Anything.Output",
				},
			},
		},
	},
};

const identity = (_path: string, content: string) => content;

let outDir: string;
let workDir: string;
let fixture: string;

beforeEach(() => {
	workDir = mkdtempSync(join(tmpdir(), "sdk-generator-"));
	outDir = join(workDir, "generated");
	fixture = join(workDir, "openapi.json");
	writeFileSync(fixture, JSON.stringify(SHAPES));
});

afterEach(() => {
	rmSync(workDir, { recursive: true, force: true });
});

/** Writes a copy of the fixture with a change applied, and returns its path. */
function variant(change: (doc: Record<string, unknown>) => void): string {
	const doc = structuredClone(SHAPES) as Record<string, unknown>;
	change(doc);
	const path = join(workDir, `variant-${Math.random()}.json`);
	writeFileSync(path, JSON.stringify(doc));
	return path;
}

const read = (path: string) => readFileSync(join(outDir, path), "utf8");

describe("generate", () => {
	it("writes one module per namespace, the catalog and the manifest, and never copies the document", () => {
		const result = generate({ outDir, openapi: fixture, format: identity });

		expect(result.changed.sort()).toEqual([
			"api/health.ts",
			"api/monolith/auth.ts",
			"manifest.json",
			"pixel/catalog.ts",
		]);
		expect(existsSync(join(outDir, "openapi.json"))).toBe(false);
		const manifest = readManifest(outDir);
		expect(Object.keys(manifest?.files ?? {}).sort()).toEqual([
			"api/health.ts",
			"api/monolith/auth.ts",
			"pixel/catalog.ts",
		]);
	});

	it("writes each call as an async function over get or post, with inline types", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const auth = read("api/monolith/auth.ts");

		expect(auth.startsWith(GENERATED_HEADER)).toBe(true);
		expect(auth).toContain('import { Env } from "../../../env";');
		expect(auth).toContain(
			'import { get, post } from "../../../utility/fetch";',
		);
		// the only exports are the calls; their types are read back from them
		expect(auth.match(/^export /gm)).toEqual(["export ", "export "]);
		expect(auth).not.toContain("interface");

		expect(auth).toContain("export const users = async (input: {");
		expect(auth).toContain("limit: number;");
		expect(auth).toContain("search?: string;");
		expect(auth).toContain("}, options: RequestInit = {}) => {");
		expect(auth).toContain("const query = new URLSearchParams();");
		expect(auth).toContain('query.set("limit", String(input.limit));');
		expect(auth).toContain(
			'if (input.search !== undefined) {\nquery.set("search", input.search);\n}',
		);
		expect(auth).toContain("const response = await get<{");
		expect(auth).toContain(
			// biome-ignore lint/suspicious/noTemplateCurlyInString: this is the generated source text
			"}[]>(`${Env.MODULE}/api/auth/users?${query}`, options);",
		);
		expect(auth).toContain("return response.data;");
	});

	it("sends form inputs with post, keeping query inputs in the URL", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const auth = read("api/monolith/auth.ts");

		expect(auth).toContain("export const rename = async (input: {");
		expect(auth).toContain('query.set("notify", String(input.notify));');
		expect(auth).toContain("const { notify: _notify, ...body } = input;");
		expect(auth).toContain(
			// biome-ignore lint/suspicious/noTemplateCurlyInString: this is the generated source text
			"}>(`${Env.MODULE}/api/auth/rename?${query}`, body, options);",
		);
	});

	it("writes a call without inputs as fn(options)", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const health = read("api/health.ts");

		expect(health).toContain('import { get } from "../../utility/fetch";');
		expect(health).toContain(
			"export const ready = async (options: RequestInit = {}) => {",
		);
		// biome-ignore lint/suspicious/noTemplateCurlyInString: this is the generated source text
		expect(health).toContain("}>(`${Env.MODULE}/health/ready`, options);");
	});

	it("tags internal calls and reactors with @internal and the reason", () => {
		const internal = variant((doc) => {
			const paths = doc.paths as Record<
				string,
				Record<string, Record<string, unknown>>
			>;
			paths["/api/auth/users"].get["x-internal"] = true;
			paths["/api/auth/users"].get["x-internal-reason"] =
				"Admin console only";
			paths["/health/ready"].get["x-internal"] = true;
			const reactors = (
				doc["x-semoss-pixels"] as {
					reactors: Record<string, Record<string, unknown>>;
				}
			).reactors;
			reactors.Count["x-internal"] = true;
		});
		generate({ outDir, openapi: internal, format: identity });

		expect(read("api/monolith/auth.ts")).toContain(
			" * @internal Admin console only\n",
		);
		expect(read("api/health.ts")).toContain(" * @internal\n");
		const catalog = read("pixel/catalog.ts");
		expect(catalog).toContain(
			" * Counts rows\n *\n * @internal\n */\nCount: {",
		);
		expect(catalog).not.toContain("Reads rows\n *\n * @internal");
	});

	it("writes an input whose fields are all optional as input?, so fn.length stays 1", async () => {
		const optional = variant((doc) => {
			const paths = doc.paths as Record<
				string,
				Record<string, { parameters: { required?: boolean }[] }>
			>;
			for (const parameter of paths["/api/auth/users"].get.parameters) {
				parameter.required = false;
			}
		});
		generate({ outDir, openapi: optional, format: identity });
		const auth = read("api/monolith/auth.ts");

		expect(auth).toContain("export const users = async (input?: {");
		expect(auth).toContain("if (input?.limit !== undefined) {");

		// The hooks tell inputs from options by length: 1 with an input, 0 without.
		const ts = await import("typescript");
		const lengthOf = (source: string, name: string): number => {
			const start = source.indexOf(`export const ${name} = `);
			const code = ts.transpileModule(source.slice(start), {
				compilerOptions: { target: ts.ScriptTarget.ES2020 },
			}).outputText;
			const declaration = code.replace(/^export /m, "");
			return new Function(
				"Env",
				"get",
				"post",
				`${declaration}\nreturn ${name}.length;`,
			)(
				{},
				() => undefined,
				() => undefined,
			);
		};
		expect(lengthOf(auth, "users")).toBe(1);
		expect(lengthOf(read("api/health.ts"), "ready")).toBe(0);
	});

	it("writes nullable fields, number lists, object lists and enums inline", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const auth = read("api/monolith/auth.ts");

		expect(auth).toContain("email?: string | null;");
		expect(auth).toContain("scores?: number[];");
		expect(auth).toContain('status: "ACTIVE" | "LOCKED";');
		expect(auth).not.toContain("_VALUES");
	});

	it("documents declared error responses", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const health = read("api/health.ts");

		expect(health).toContain(
			"@throws when the response is not 2xx; for 503 the backend sends the declared error body",
		);
	});

	it("types Pixel inputs and outputs inline: numbers, object lists and dynamic values", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const catalog = read("pixel/catalog.ts");

		expect(catalog).toContain(
			'import type { PixelValue } from "../../api/pixel";',
		);
		expect(catalog).not.toContain("interface User");
		expect(catalog).toContain("output: number;");
		expect(catalog).toMatch(/output: \{[\s\S]*?\}\[\];/);
		expect(catalog).toContain("value?: PixelValue;");
		expect(catalog).toContain("output: unknown;");
		expect(catalog).toContain("input: Record<string, never>;");
		// types only: nothing in the catalog ends up in a bundle
		expect(catalog).not.toMatch(/^export (const|function|class|let|var) /m);
		expect(catalog.match(/^export /gm)).toEqual(["export "]);
		expect(catalog).toContain("export interface PixelCatalog {");
	});

	it("rejects a schema that contains itself, which cannot be written inline", () => {
		const recursive = variant((doc) => {
			const schemas = (doc.components as Record<string, unknown>)
				.schemas as Record<
				string,
				{ properties: Record<string, Record<string, unknown>> }
			>;
			schemas.User.properties.manager = {
				$ref: "#/components/schemas/User",
				description: "Their manager",
			};
		});

		expect(() =>
			generate({ outDir, openapi: recursive, format: identity }),
		).toThrow(/contains itself/);
	});

	it("writes the same bytes every time and changes nothing on a second run", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const first = new Map(
			[MANIFEST_FILE, "api/health.ts", "pixel/catalog.ts"].map((path) => [
				path,
				read(path),
			]),
		);

		const again = generate({ outDir, openapi: fixture, format: identity });
		expect(again.changed).toEqual([]);
		expect(again.removed).toEqual([]);
		for (const [path, content] of first) {
			expect(read(path)).toBe(content);
		}
	});

	it("reports drift in check mode without writing anything", () => {
		generate({ outDir, openapi: fixture, format: identity });
		writeFileSync(join(outDir, "api/health.ts"), "// edited by hand\n");

		const result = generate({
			outDir,
			openapi: fixture,
			check: true,
			format: identity,
		});

		expect(result.changed).toEqual(["api/health.ts"]);
		expect(read("api/health.ts")).toBe("// edited by hand\n");
	});

	it("deletes obsolete generated files but keeps hand-written ones", () => {
		generate({ outDir, openapi: fixture, format: identity });
		writeFileSync(join(outDir, "api/health.ts"), "// mine now\n");

		const withoutHealthOrAuth = variant((doc) => {
			const paths = doc.paths as Record<string, unknown>;
			delete paths["/health/ready"];
			delete paths["/api/auth/rename"];
			delete paths["/api/auth/users"];
		});
		const result = generate({
			outDir,
			openapi: withoutHealthOrAuth,
			format: identity,
		});

		expect(result.removed).toEqual(["api/monolith/auth.ts"]);
		expect(result.kept).toEqual(["api/health.ts"]);
		expect(existsSync(join(outDir, "api/monolith/auth.ts"))).toBe(false);
		expect(existsSync(join(outDir, "api/health.ts"))).toBe(true);
	});

	it("leaves the output untouched when the document is rejected", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const before = read("api/health.ts");

		const broken = variant((doc) => {
			const schemas = (doc.components as Record<string, unknown>)
				.schemas as Record<string, Record<string, unknown>>;
			schemas.User.allOf = [];
		});

		expect(() =>
			generate({ outDir, openapi: broken, format: identity }),
		).toThrow(/"allOf" keyword is not supported/);
		expect(read("api/health.ts")).toBe(before);
	});

	it.each([
		[
			"an operationId that is not the last path segment",
			(doc: Record<string, unknown>) => {
				const paths = doc.paths as Record<
					string,
					Record<string, Record<string, unknown>>
				>;
				paths["/api/auth/users"].get.operationId = "listUsers";
			},
			/operationId must be the last path segment "users"/,
		],
		[
			"two operations with the same name",
			(doc: Record<string, unknown>) => {
				const paths = doc.paths as Record<
					string,
					Record<string, Record<string, unknown>>
				>;
				paths["/api/auth/users"].post = {
					...paths["/api/auth/users"].get,
				};
			},
			/both generate "users"/,
		],
		[
			"an unknown servlet prefix",
			(doc: Record<string, unknown>) => {
				const paths = doc.paths as Record<string, unknown>;
				paths["/other/thing"] = paths["/health/ready"];
			},
			/servlet prefix in x-semoss-servlets/,
		],
		[
			"a 2xx response without a JSON body",
			(doc: Record<string, unknown>) => {
				const paths = doc.paths as Record<
					string,
					Record<string, { responses: Record<string, unknown> }>
				>;
				paths["/api/auth/rename"].post.responses = {
					"204": { description: "Renamed" },
				};
			},
			/no JSON body; responses without one are not supported yet/,
		],
		[
			"a method other than GET or POST",
			(doc: Record<string, unknown>) => {
				const paths = doc.paths as Record<
					string,
					Record<string, unknown>
				>;
				paths["/api/auth/rename"].delete =
					paths["/api/auth/rename"].post;
				delete paths["/api/auth/rename"].post;
			},
			/only GET and POST are supported/,
		],
		[
			"an x-internal that is not a boolean",
			(doc: Record<string, unknown>) => {
				const paths = doc.paths as Record<
					string,
					Record<string, Record<string, unknown>>
				>;
				paths["/api/auth/users"].get["x-internal"] = "yes";
			},
			/x-internal must be true or false/,
		],
		[
			"a reason without x-internal",
			(doc: Record<string, unknown>) => {
				const reactors = (
					doc["x-semoss-pixels"] as {
						reactors: Record<string, Record<string, unknown>>;
					}
				).reactors;
				reactors.Count["x-internal-reason"] = "Why";
			},
			/x-internal-reason needs x-internal: true/,
		],
		[
			"a document that does not name its servlet modules",
			(doc: Record<string, unknown>) => {
				delete doc["x-semoss-servlets"];
			},
			/x-semoss-servlets is required/,
		],
		[
			"a property without a description",
			(doc: Record<string, unknown>) => {
				const schemas = (doc.components as Record<string, unknown>)
					.schemas as Record<
					string,
					{ properties: Record<string, Record<string, unknown>> }
				>;
				delete schemas.User.properties.id.description;
			},
			/User\.properties\.id: a description is required/,
		],
		[
			"an OpenAPI 3.0 nullable flag",
			(doc: Record<string, unknown>) => {
				const schemas = (doc.components as Record<string, unknown>)
					.schemas as Record<
					string,
					{ properties: Record<string, Record<string, unknown>> }
				>;
				schemas.User.properties.id.nullable = true;
			},
			/"nullable" keyword is not supported/,
		],
		[
			"a Pixel extension version it does not know",
			(doc: Record<string, unknown>) => {
				(
					doc["x-semoss-pixels"] as Record<string, unknown>
				).schemaVersion = 2;
			},
			/schemaVersion must be 1/,
		],
	])("rejects %s", (_name, change, message) => {
		expect(() =>
			generate({ outDir, openapi: variant(change), format: identity }),
		).toThrow(SpecError);
		expect(() =>
			generate({ outDir, openapi: variant(change), format: identity }),
		).toThrow(message);
	});
});

describe("formatting", () => {
	it("writes files the repository's Biome accepts as they are", () => {
		const sdkDir = join(import.meta.dirname, "..", "..");
		const format = createBiomeFormatter(findRepoRoot(sdkDir));
		generate({ outDir, openapi: fixture, format });

		for (const path of [
			"api/health.ts",
			"api/monolith/auth.ts",
			"pixel/catalog.ts",
		]) {
			const content = read(path);
			expect(
				format(join(sdkDir, "src", "generated", path), content),
			).toBe(content);
		}
	}, 30_000);

	it("reports drift when the document changes", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const changed = variant((doc) => {
			(doc.info as Record<string, unknown>).version = "2";
		});

		const result = generate({
			outDir,
			openapi: changed,
			check: true,
			format: identity,
		});
		expect(result.changed).toEqual(["manifest.json"]);
	});
});

describe("determinism", () => {
	/** A deep copy with every object's keys in reverse order. */
	const reversed = (value: unknown): unknown => {
		if (Array.isArray(value)) {
			return value.map(reversed);
		}
		if (value !== null && typeof value === "object") {
			return Object.fromEntries(
				Object.entries(value)
					.reverse()
					.map(([key, child]) => [key, reversed(child)]),
			);
		}
		return value;
	};

	it("writes the same files whatever order the document's keys are in", () => {
		generate({ outDir, openapi: fixture, format: identity });
		const files = [
			MANIFEST_FILE,
			"api/health.ts",
			"api/monolith/auth.ts",
			"pixel/catalog.ts",
		];
		const first = files.map(read);

		const shuffled = join(workDir, "reversed.json");
		writeFileSync(shuffled, JSON.stringify(reversed(SHAPES)));
		const check = generate({
			outDir,
			openapi: shuffled,
			check: true,
			format: identity,
		});

		expect(check.changed).toEqual([]);
		expect(files.map(read)).toEqual(first);
	});

	it("sorts names by code unit, not by locale", () => {
		// localeCompare would put "_users" and "Users" differently per locale
		expect(["users", "_users", "Users", "b", "B"].sort(byName)).toEqual([
			"B",
			"Users",
			"_users",
			"b",
			"users",
		]);
	});
});
