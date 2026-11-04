/**
 * The part of an OpenAPI 3.1 document, plus the `x-semoss-pixels` extension,
 * that the SDK generator reads, and the checks that reject everything else.
 */

import { sortedEntries } from "./order.ts";

/** A JSON Schema object, as OpenAPI 3.1 uses it. */
export interface SchemaObject {
	$ref?: string;
	type?: string | string[];
	properties?: Record<string, SchemaObject>;
	required?: string[];
	items?: SchemaObject;
	additionalProperties?: boolean | SchemaObject;
	enum?: unknown[];
	const?: unknown;
	description?: string;
	oneOf?: SchemaObject[];
	anyOf?: SchemaObject[];
	[keyword: string]: unknown;
}

/** One operation parameter. Only query and path parameters are supported. */
export interface ParameterObject {
	name: string;
	in: string;
	required?: boolean;
	description?: string;
	schema?: SchemaObject;
}

/** One response of an operation. */
export interface ResponseObject {
	description?: string;
	content?: Record<string, { schema?: SchemaObject }>;
}

/** One operation under `paths`. */
export interface OperationObject {
	operationId?: string;
	summary?: string;
	description?: string;
	parameters?: ParameterObject[];
	requestBody?: {
		required?: boolean;
		content?: Record<string, { schema?: SchemaObject }>;
	};
	responses?: Record<string, ResponseObject>;
	deprecated?: boolean;
	/** Set by the backend's @Internal: published, but not for general use. */
	"x-internal"?: boolean;
	/** Why it is internal. */
	"x-internal-reason"?: string;
}

/** One reactor in the Pixel catalog. */
export interface PixelReactorObject {
	description?: string;
	inputSchema?: SchemaObject;
	outputSchema?: SchemaObject;
	/** Set by the backend's @Internal: published, but not for general use. */
	"x-internal"?: boolean;
	/** Why it is internal. */
	"x-internal-reason"?: string;
}

/** The versioned `x-semoss-pixels` extension. */
export interface PixelExtension {
	schemaVersion?: number;
	transport?: { path?: string };
	reactors?: Record<string, PixelReactorObject>;
}

/** The OpenAPI document. */
export interface OpenApiDocument {
	openapi?: string;
	info?: { title?: string; version?: string };
	paths?: Record<string, Record<string, OperationObject>>;
	components?: { schemas?: Record<string, SchemaObject> };
	"x-semoss-pixels"?: PixelExtension;
	/**
	 * Each servlet prefix (such as `/api`) mapped to the module name its
	 * operations are published under in every SDK (such as `monolith`).
	 */
	"x-semoss-servlets"?: Record<string, string>;
	[key: string]: unknown;
}

/** The HTTP methods the generator turns into calls. */
export const HTTP_METHODS = ["get", "post", "put", "delete", "patch"] as const;

/** The schema keywords that shape a generated type. */
const STRUCTURAL_KEYWORDS = new Set([
	"$ref",
	"type",
	"properties",
	"required",
	"items",
	"additionalProperties",
	"enum",
	"const",
	"oneOf",
	"anyOf",
]);

/** Keywords that are allowed but do not change the generated type. */
const ANNOTATION_KEYWORDS = new Set([
	"description",
	"title",
	"format",
	"default",
	"examples",
	"deprecated",
	"readOnly",
	"writeOnly",
	"minimum",
	"maximum",
	"exclusiveMinimum",
	"exclusiveMaximum",
	"multipleOf",
	"minLength",
	"maxLength",
	"pattern",
	"minItems",
	"maxItems",
	"uniqueItems",
	"minProperties",
	"maxProperties",
]);

const SCHEMA_TYPES = new Set([
	"string",
	"number",
	"integer",
	"boolean",
	"object",
	"array",
	"null",
]);

/** Thrown for anything in the document the generator cannot represent. */
export class SpecError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SpecError";
	}
}

/** Prefix of a local schema reference. */
export const SCHEMA_REF_PREFIX = "#/components/schemas/";

/** Returns the schema name a `$ref` points to, failing for any other kind of reference. */
export function refName(ref: string, where: string): string {
	if (!ref.startsWith(SCHEMA_REF_PREFIX)) {
		throw new SpecError(
			`${where}: only "${SCHEMA_REF_PREFIX}..." references are supported, got "${ref}"`,
		);
	}
	return decodeURIComponent(ref.slice(SCHEMA_REF_PREFIX.length));
}

/**
 * Checks one schema and everything under it against the supported subset.
 *
 * @param requireDescriptions - when true, every object property must have a description
 */
export function validateSchema(
	doc: OpenApiDocument,
	schema: unknown,
	where: string,
	requireDescriptions: boolean,
): void {
	if (
		typeof schema !== "object" ||
		schema === null ||
		Array.isArray(schema)
	) {
		throw new SpecError(`${where}: a schema must be an object`);
	}
	const s = schema as SchemaObject;

	for (const keyword of Object.keys(s)) {
		if (keyword.startsWith("x-")) {
			continue;
		}
		if (
			!STRUCTURAL_KEYWORDS.has(keyword) &&
			!ANNOTATION_KEYWORDS.has(keyword)
		) {
			throw new SpecError(
				`${where}: the "${keyword}" keyword is not supported by the SDK generator`,
			);
		}
	}

	if (s.$ref !== undefined) {
		if (typeof s.$ref !== "string") {
			throw new SpecError(`${where}: $ref must be a string`);
		}
		const name = refName(s.$ref, where);
		if (!doc.components?.schemas?.[name]) {
			throw new SpecError(`${where}: $ref "${s.$ref}" does not resolve`);
		}
	}

	if (s.type !== undefined) {
		const types = Array.isArray(s.type) ? s.type : [s.type];
		if (types.length === 0) {
			throw new SpecError(`${where}: type must not be empty`);
		}
		for (const t of types) {
			if (typeof t !== "string" || !SCHEMA_TYPES.has(t)) {
				throw new SpecError(`${where}: unknown type "${String(t)}"`);
			}
		}
	}

	if (s.enum !== undefined) {
		if (!Array.isArray(s.enum) || s.enum.length === 0) {
			throw new SpecError(`${where}: enum must be a non-empty array`);
		}
		for (const value of s.enum) {
			if (
				value !== null &&
				typeof value !== "string" &&
				typeof value !== "number" &&
				typeof value !== "boolean"
			) {
				throw new SpecError(`${where}: enum values must be scalars`);
			}
		}
	}

	if (s.properties !== undefined) {
		if (typeof s.properties !== "object" || s.properties === null) {
			throw new SpecError(`${where}: properties must be an object`);
		}
		for (const [name, child] of sortedEntries(s.properties)) {
			const childWhere = `${where}.properties.${name}`;
			validateSchema(doc, child, childWhere, requireDescriptions);
			if (requireDescriptions && !hasDescription(doc, child)) {
				throw new SpecError(`${childWhere}: a description is required`);
			}
		}
	}

	if (s.required !== undefined) {
		if (!Array.isArray(s.required)) {
			throw new SpecError(`${where}: required must be an array`);
		}
		for (const name of s.required) {
			if (!s.properties || !(name in s.properties)) {
				throw new SpecError(
					`${where}: required property "${String(name)}" is not in properties`,
				);
			}
		}
	}

	if (s.items !== undefined) {
		validateSchema(doc, s.items, `${where}.items`, requireDescriptions);
	}

	if (
		s.additionalProperties !== undefined &&
		typeof s.additionalProperties !== "boolean"
	) {
		validateSchema(
			doc,
			s.additionalProperties,
			`${where}.additionalProperties`,
			requireDescriptions,
		);
	}

	for (const keyword of ["oneOf", "anyOf"] as const) {
		const members = s[keyword];
		if (members === undefined) {
			continue;
		}
		if (!Array.isArray(members) || members.length === 0) {
			throw new SpecError(
				`${where}: ${keyword} must be a non-empty array`,
			);
		}
		members.forEach((member, i) => {
			validateSchema(
				doc,
				member,
				`${where}.${keyword}[${i}]`,
				requireDescriptions,
			);
		});
	}
}

/** A property is described when it, or the schema it references, has a description. */
function hasDescription(doc: OpenApiDocument, schema: SchemaObject): boolean {
	if (schema.description) {
		return true;
	}
	if (schema.$ref) {
		const target =
			doc.components?.schemas?.[refName(schema.$ref, "description")];
		return Boolean(target?.description);
	}
	return false;
}

/** Checks the document's top level, every component schema and the Pixel extension. */
export function validateDocument(doc: unknown): OpenApiDocument {
	if (typeof doc !== "object" || doc === null || Array.isArray(doc)) {
		throw new SpecError("The OpenAPI document must be a JSON object");
	}
	const d = doc as OpenApiDocument;
	if (typeof d.openapi !== "string" || !d.openapi.startsWith("3.1.")) {
		throw new SpecError(
			`The document must be OpenAPI 3.1.x, got "${String(d.openapi)}"`,
		);
	}

	for (const [name, schema] of sortedEntries(d.components?.schemas ?? {})) {
		validateSchema(d, schema, `components.schemas.${name}`, true);
	}

	const pixels = d["x-semoss-pixels"];
	if (pixels !== undefined) {
		validatePixelExtension(d, pixels);
	}

	validateServlets(d);

	return d;
}

/** Checks `x-semoss-servlets`, which is required as soon as there are paths. */
function validateServlets(doc: OpenApiDocument): void {
	const where = "x-semoss-servlets";
	const servlets = doc[where];
	if (servlets === undefined) {
		if (Object.keys(doc.paths ?? {}).length > 0) {
			throw new SpecError(
				`${where} is required: it names the module each servlet's operations are published under`,
			);
		}
		return;
	}
	if (
		typeof servlets !== "object" ||
		servlets === null ||
		Array.isArray(servlets)
	) {
		throw new SpecError(
			`${where} must map servlet prefixes to module names`,
		);
	}
	const modules = new Set<string>();
	for (const [prefix, module] of sortedEntries(servlets)) {
		if (!/^\/[A-Za-z0-9-]+$/.test(prefix)) {
			throw new SpecError(
				`${where}: "${prefix}" must be one path segment, such as "/api"`,
			);
		}
		if (typeof module !== "string" || !/^[a-z][A-Za-z0-9]*$/.test(module)) {
			throw new SpecError(
				`${where}: the module for "${prefix}" must be lower camel case`,
			);
		}
		if (modules.has(module)) {
			throw new SpecError(
				`${where}: two prefixes use the module "${module}"`,
			);
		}
		modules.add(module);
	}
}

/** Checks `x-semoss-pixels` against its version 1 shape. */
function validatePixelExtension(
	doc: OpenApiDocument,
	ext: PixelExtension,
): void {
	const where = "x-semoss-pixels";
	if (typeof ext !== "object" || ext === null) {
		throw new SpecError(`${where} must be an object`);
	}
	for (const key of Object.keys(ext)) {
		if (!["schemaVersion", "transport", "reactors"].includes(key)) {
			throw new SpecError(`${where}: unknown field "${key}"`);
		}
	}
	if (ext.schemaVersion !== 1) {
		throw new SpecError(
			`${where}.schemaVersion must be 1, got ${String(ext.schemaVersion)}`,
		);
	}
	if (ext.transport?.path !== "/api/engine/runPixel") {
		throw new SpecError(
			`${where}.transport.path must be "/api/engine/runPixel"`,
		);
	}
	for (const [name, reactor] of sortedEntries(ext.reactors ?? {})) {
		const reactorWhere = `${where}.reactors.${name}`;
		if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
			throw new SpecError(`${reactorWhere}: not a valid reactor name`);
		}
		for (const key of Object.keys(reactor)) {
			if (
				![
					"description",
					"inputSchema",
					"outputSchema",
					"x-internal",
					"x-internal-reason",
				].includes(key)
			) {
				throw new SpecError(`${reactorWhere}: unknown field "${key}"`);
			}
		}
		validateInternal(reactor, reactorWhere);
		if (!reactor.description) {
			throw new SpecError(`${reactorWhere}: a description is required`);
		}
		if (!reactor.inputSchema || !reactor.outputSchema) {
			throw new SpecError(
				`${reactorWhere}: inputSchema and outputSchema are required`,
			);
		}
		validateSchema(
			doc,
			reactor.inputSchema,
			`${reactorWhere}.inputSchema`,
			true,
		);
		validateSchema(
			doc,
			reactor.outputSchema,
			`${reactorWhere}.outputSchema`,
			true,
		);
	}
}

/** Checks `x-internal` and `x-internal-reason` on an operation or a reactor. */
export function validateInternal(
	node: { "x-internal"?: unknown; "x-internal-reason"?: unknown },
	where: string,
): void {
	const internal = node["x-internal"];
	if (internal !== undefined && typeof internal !== "boolean") {
		throw new SpecError(`${where}: x-internal must be true or false`);
	}
	const reason = node["x-internal-reason"];
	if (reason !== undefined && typeof reason !== "string") {
		throw new SpecError(`${where}: x-internal-reason must be a string`);
	}
	if (reason !== undefined && internal !== true) {
		throw new SpecError(
			`${where}: x-internal-reason needs x-internal: true`,
		);
	}
}
