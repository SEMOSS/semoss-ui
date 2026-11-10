/**
 * Turns the document's `paths` into one TypeScript module per URL namespace.
 */
import { posix } from "node:path";
import { byName, canonicalJson, sortedEntries } from "./order.ts";
import {
	HTTP_METHODS,
	type OpenApiDocument,
	type OperationObject,
	type SchemaObject,
	SpecError,
	validateInternal,
	validateSchema,
} from "./spec.ts";
import {
	createContext,
	derefSchema,
	docComment,
	propertyKey,
	type TypeContext,
	tsType,
} from "./types.ts";

const MODULE_SEGMENT = /^[a-z][A-Za-z0-9]*$/;
const FUNCTION_NAME = /^[a-z][A-Za-z0-9]*$/;
const RESERVED = new Set([
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"enum",
	"export",
	"extends",
	"false",
	"finally",
	"for",
	"function",
	"if",
	"import",
	"in",
	"instanceof",
	"new",
	"null",
	"return",
	"super",
	"switch",
	"this",
	"throw",
	"true",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",
	"yield",
	"let",
	"static",
	"implements",
	"interface",
	"package",
	"private",
	"protected",
	"public",
	"await",
	"arguments",
	"eval",
]);

const FORM_CONTENT = "application/x-www-form-urlencoded";
const JSON_CONTENT = "application/json";

/** One field of a generated call's input object. */
interface InputField {
	name: string;
	in: "query" | "body";
	required: boolean;
	description?: string;
	schema: SchemaObject;
}

/** One operation, placed in its module. */
export interface RestOperationPlan {
	/** Module path under `api/`, such as `monolith` or `monolith/auth`. */
	module: string;
	/** The exported function name (the operationId). */
	name: string;
	method: string;
	path: string;
	operation: OperationObject;
	inputs: InputField[];
	/** The 2xx JSON schema. */
	output: SchemaObject;
	/** Status codes and schemas of declared error responses with a JSON body. */
	errors: { status: string; schema: SchemaObject }[];
}

/** Reads every operation and places it in a module, rejecting what cannot be generated. */
export function planOperations(doc: OpenApiDocument): RestOperationPlan[] {
	const plans: RestOperationPlan[] = [];
	const seen = new Map<string, string>();

	for (const [path, item] of sortedEntries(doc.paths ?? {})) {
		for (const [method, operation] of sortedEntries(item)) {
			if (!(HTTP_METHODS as readonly string[]).includes(method)) {
				if (
					method === "parameters" ||
					method === "summary" ||
					method === "description"
				) {
					throw new SpecError(
						`paths.${path}.${method}: path-level fields are not supported; declare them on each operation`,
					);
				}
				continue;
			}
			const plan = planOperation(doc, path, method, operation);
			const key = `${plan.module}.${plan.name}`;
			const previous = seen.get(key);
			if (previous) {
				throw new SpecError(
					`${method.toUpperCase()} ${path} and ${previous} both generate "${plan.name}" in api/${plan.module}`,
				);
			}
			seen.set(key, `${method.toUpperCase()} ${path}`);
			plans.push(plan);
		}
	}

	return plans.sort((a, b) =>
		a.module === b.module
			? byName(a.name, b.name)
			: byName(a.module, b.module),
	);
}

function planOperation(
	doc: OpenApiDocument,
	path: string,
	method: string,
	operation: OperationObject,
): RestOperationPlan {
	const where = `${method.toUpperCase()} ${path}`;

	// The backend names each servlet's module, so every SDK generated from this
	// document groups its calls the same way.
	const servlets = doc["x-semoss-servlets"] ?? {};
	const prefix = Object.keys(servlets)
		.sort((a, b) => b.length - a.length || byName(a, b))
		.find((p) => path === p || path.startsWith(`${p}/`));
	if (!prefix) {
		throw new SpecError(
			`${where}: the path does not start with a servlet prefix in x-semoss-servlets (${Object.keys(servlets).join(", ") || "none"})`,
		);
	}
	const root = servlets[prefix];
	const segments = path.slice(prefix.length).split("/").filter(Boolean);
	for (const segment of segments) {
		if (segment.includes("{")) {
			throw new SpecError(
				`${where}: path parameters are not supported yet ("${segment}")`,
			);
		}
	}

	const name = segments.length === 0 ? root : segments[segments.length - 1];
	const middle = segments.slice(0, -1);
	for (const segment of middle) {
		if (!MODULE_SEGMENT.test(segment)) {
			throw new SpecError(
				`${where}: "${segment}" cannot be a module name; use lower camel case`,
			);
		}
	}

	if (!operation.operationId) {
		throw new SpecError(`${where}: an operationId is required`);
	}
	if (operation.operationId !== name) {
		throw new SpecError(
			`${where}: the operationId must be the last path segment "${name}", got "${operation.operationId}"`,
		);
	}
	if (!FUNCTION_NAME.test(name) || RESERVED.has(name)) {
		throw new SpecError(`${where}: "${name}" cannot be a function name`);
	}
	if (!operation.summary && !operation.description) {
		throw new SpecError(`${where}: a summary or description is required`);
	}
	if (method !== "get" && method !== "post") {
		throw new SpecError(
			`${where}: only GET and POST are supported, since the SDK sends requests with get and post`,
		);
	}
	if (method === "get" && operation.requestBody) {
		throw new SpecError(`${where}: a GET cannot have a request body`);
	}

	validateInternal(operation, where);
	const inputs = planInputs(doc, where, operation);
	const { output, errors } = planResponses(doc, where, operation);

	return {
		module: [root, ...middle].join("/"),
		name,
		method: method.toUpperCase(),
		path,
		operation,
		inputs,
		output,
		errors,
	};
}

function planInputs(
	doc: OpenApiDocument,
	where: string,
	operation: OperationObject,
): InputField[] {
	const inputs: InputField[] = [];
	const add = (field: InputField) => {
		if (inputs.some((f) => f.name === field.name)) {
			throw new SpecError(
				`${where}: two inputs are named "${field.name}"`,
			);
		}
		inputs.push(field);
	};

	for (const parameter of operation.parameters ?? []) {
		if (parameter.in !== "query") {
			throw new SpecError(
				`${where}: ${parameter.in} parameters are not supported yet ("${parameter.name}")`,
			);
		}
		if (!parameter.description) {
			throw new SpecError(
				`${where}: parameter "${parameter.name}" needs a description`,
			);
		}
		const schema = parameter.schema ?? { type: "string" };
		validateSchema(
			doc,
			schema,
			`${where} parameter ${parameter.name}`,
			true,
		);
		add({
			name: parameter.name,
			in: "query",
			required: parameter.required === true,
			description: parameter.description,
			schema,
		});
	}

	if (operation.requestBody) {
		const content = operation.requestBody.content ?? {};
		const types = Object.keys(content);
		if (types.length !== 1 || types[0] !== FORM_CONTENT) {
			throw new SpecError(
				`${where}: only "${FORM_CONTENT}" request bodies are supported, got ${types.join(", ") || "none"}`,
			);
		}
		const bodySchema = content[FORM_CONTENT].schema;
		if (!bodySchema) {
			throw new SpecError(`${where}: the request body needs a schema`);
		}
		validateSchema(doc, bodySchema, `${where} request body`, true);
		const resolved = derefSchema(doc, bodySchema);
		if (!resolved.properties) {
			throw new SpecError(
				`${where}: the request body must be an object with properties`,
			);
		}
		const required = new Set(resolved.required ?? []);
		for (const [name, schema] of sortedEntries(resolved.properties)) {
			add({
				name,
				in: "body",
				required: required.has(name),
				description: schema.description,
				schema,
			});
		}
	}

	return inputs.sort((a, b) => byName(a.name, b.name));
}

function planResponses(
	doc: OpenApiDocument,
	where: string,
	operation: OperationObject,
): Pick<RestOperationPlan, "output" | "errors"> {
	const responses = sortedEntries(operation.responses ?? {});
	const success = responses.filter(([status]) => /^2\d\d$/.test(status));
	if (success.length === 0) {
		throw new SpecError(`${where}: a 2xx response is required`);
	}

	const bodySchema = (
		status: string,
		response: (typeof responses)[number][1],
	): SchemaObject | undefined => {
		const content = response.content ?? {};
		const types = Object.keys(content);
		if (types.length === 0) {
			return undefined;
		}
		const json = types.find(
			(t) => t === JSON_CONTENT || t.startsWith(`${JSON_CONTENT};`),
		);
		if (!json || types.length > 1) {
			throw new SpecError(
				`${where}: response ${status} must be "${JSON_CONTENT}" only, got ${types.join(", ")}`,
			);
		}
		const schema = content[json].schema;
		if (!schema) {
			throw new SpecError(`${where}: response ${status} needs a schema`);
		}
		validateSchema(doc, schema, `${where} response ${status}`, true);
		return schema;
	};

	const [firstStatus, firstResponse] = success[0];
	if (!firstResponse.description) {
		throw new SpecError(
			`${where}: response ${firstStatus} needs a description`,
		);
	}
	const output = bodySchema(firstStatus, firstResponse);
	if (!output) {
		throw new SpecError(
			`${where}: response ${firstStatus} has no JSON body; responses without one are not supported yet, since get and post always read JSON`,
		);
	}
	for (const [status, response] of success.slice(1)) {
		const other = bodySchema(status, response);
		if (canonicalJson(other) !== canonicalJson(output)) {
			throw new SpecError(
				`${where}: every 2xx response must have the same body, ${status} differs from ${firstStatus}`,
			);
		}
	}

	const errors: RestOperationPlan["errors"] = [];
	for (const [status, response] of responses) {
		if (/^2\d\d$/.test(status)) {
			continue;
		}
		const schema = bodySchema(status, response);
		if (schema) {
			errors.push({ status, schema });
		}
	}

	return { output, errors };
}

/** The import path from one file under `src/` to another, without the extension. */
export function relativeImport(fromFile: string, toFile: string): string {
	const relative = posix
		.relative(posix.dirname(fromFile), toFile)
		.replace(/\.ts$/, "");
	return relative.startsWith(".") ? relative : `./${relative}`;
}

/**
 * Writes one source file per module, in the style of the hand-written calls in
 * `src/api/`: each call is an `async` function that builds its URL with
 * `Env.MODULE`, sends it with `get` or `post`, and returns the response data.
 * Every type is inline.
 *
 * @param header - the generated-file banner, written first in every file
 * @returns file paths relative to `src/generated/`, mapped to their source
 */
export function emitRestModules(
	doc: OpenApiDocument,
	plans: RestOperationPlan[],
	header: string,
): Map<string, string> {
	const modules = new Map<string, RestOperationPlan[]>();
	for (const plan of plans) {
		const list = modules.get(plan.module) ?? [];
		list.push(plan);
		modules.set(plan.module, list);
	}

	const files = new Map<string, string>();
	for (const [module, list] of [...modules].sort(([a], [b]) =>
		byName(a, b),
	)) {
		const file = `api/${module}.ts`;
		const ctx = createContext(doc);
		const code = list.map((plan) => emitOperation(plan, ctx)).join("\n");
		const transport = [
			...new Set(list.map((plan) => plan.method.toLowerCase())),
		].sort(byName);
		const imports = [
			`import { Env } from "${relativeImport(`generated/${file}`, "env.ts")}";`,
			`import { ${transport.join(", ")} } from "${relativeImport(`generated/${file}`, "utility/fetch.ts")}";`,
		];
		files.set(file, [header, imports.join("\n"), code].join("\n\n"));
	}
	return files;
}

/**
 * Reads a field of `input`: `input.name`, or `input["a-b"]` when it is not an
 * identifier, and `input?.name` when the whole input is optional.
 */
function inputField(name: string, optionalInput: boolean): string {
	const key = propertyKey(name);
	const dot = optionalInput ? "?." : ".";
	return key === name
		? `input${dot}${name}`
		: `input${optionalInput ? "?." : ""}[${key}]`;
}

/** Writes the query value of a field the way `post` encodes values: strings as they are, else JSON. */
function queryValue(
	doc: OpenApiDocument,
	field: InputField,
	optionalInput: boolean,
): string {
	const value = inputField(field.name, optionalInput);
	const type = derefSchema(doc, field.schema).type;
	if (type === "string") {
		return value;
	}
	if (type === "number" || type === "integer" || type === "boolean") {
		return `String(${value})`;
	}
	return `typeof ${value} === "string" ? ${value} : JSON.stringify(${value})`;
}

function emitOperation(plan: RestOperationPlan, ctx: TypeContext): string {
	const { operation } = plan;
	const method = plan.method.toLowerCase();
	const query = plan.inputs.filter((field) => field.in === "query");
	const body = plan.inputs.filter((field) => field.in === "body");

	// The signature: (options?) without inputs, else (input, options?). An input
	// whose fields are all optional is `input?` rather than `input = {}`, so
	// `fn.length` is 1 for every call that takes input and 0 for one that does
	// not: hooks such as useAPI read it to know where the options go.
	const optionalInput =
		plan.inputs.length > 0 && plan.inputs.every((field) => !field.required);
	const params: string[] = [];
	if (plan.inputs.length > 0) {
		const members = plan.inputs
			.map(
				(field) =>
					`${docComment(field.description)}${propertyKey(field.name)}${field.required ? "" : "?"}: ${tsType(field.schema, ctx, "output")};\n`,
			)
			.join("");
		params.push(`input${optionalInput ? "?" : ""}: {\n${members}}`);
	}
	params.push("options: RequestInit = {}");

	// The body of the function.
	const lines: string[] = [];
	let url = `\`\${Env.MODULE}${plan.path}\``;
	if (query.length > 0) {
		lines.push("const query = new URLSearchParams();");
		for (const field of query) {
			const set = `query.set(${JSON.stringify(field.name)}, ${queryValue(ctx.doc, field, optionalInput)});`;
			lines.push(
				field.required
					? set
					: `if (${inputField(field.name, optionalInput)} !== undefined) {\n${set}\n}`,
			);
		}
		url = `\`\${Env.MODULE}${plan.path}?\${query}\``;
	}

	let bodyArg = "";
	if (method === "post") {
		if (body.length === 0) {
			bodyArg = "{}";
		} else if (query.length === 0) {
			bodyArg = optionalInput ? "input ?? {}" : "input";
		} else {
			// The query fields are sent in the URL; the rest of the input is the form.
			const skipped = query
				.map(
					(field) =>
						`${propertyKey(field.name)}: _${field.name.replace(/[^A-Za-z0-9_$]/g, "_")}`,
				)
				.join(", ");
			lines.push(
				`const { ${skipped}, ...body } = ${optionalInput ? "input ?? {}" : "input"};`,
			);
			bodyArg = "body";
		}
	}

	const outputType = tsType(plan.output, ctx, "output");
	const call =
		method === "post"
			? `post<${outputType}>(${url}, ${bodyArg}, options)`
			: `get<${outputType}>(${url}, options)`;
	lines.push(`const response = await ${call};`, "return response.data;");

	// TSDoc.
	const docLines: string[] = [];
	if (operation.summary) {
		docLines.push(operation.summary);
	}
	if (operation.description && operation.description !== operation.summary) {
		if (docLines.length > 0) {
			docLines.push("");
		}
		docLines.push(operation.description);
	}
	docLines.push("", `\`${plan.method} ${plan.path}\``, "");
	if (plan.inputs.length > 0) {
		docLines.push("@param input - the request's inputs");
	}
	docLines.push(
		"@param options - passed to `fetch`, such as an `AbortSignal`",
	);
	docLines.push(
		plan.errors.length > 0
			? `@throws when the response is not 2xx; for ${plan.errors.map((e) => e.status).join(", ")} the backend sends the declared error body`
			: "@throws when the response is not 2xx",
	);
	if (operation.deprecated) {
		docLines.push("@deprecated");
	}
	if (operation["x-internal"]) {
		const reason = operation["x-internal-reason"];
		docLines.push(reason ? `@internal ${reason}` : "@internal");
	}

	return (
		docComment(docLines.join("\n")) +
		`export const ${plan.name} = async (${params.join(", ")}) => {\n${lines.join("\n")}\n};\n`
	);
}
