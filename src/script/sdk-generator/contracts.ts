/** Versioned, language-neutral projection of prerna.contract.OperationContract. */
export interface Catalog {
	schemaVersion: 1;
	operations: SelectedOperation[];
}

export interface SelectedOperation {
	name: string;
	applicationPath: string | null;
	contract: OperationContract;
}

export interface OperationContract {
	source: string;
	kind: "REST" | "PIXEL";
	description: string;
	policy: { ignoreReasons: string[]; internalReasons: string[] };
	deprecation: {
		deprecated: boolean;
		since: string;
		forRemoval: boolean;
		reason: string;
		replacement: string;
	};
	inputs: Input[];
	outputs: Output[];
	invocation: {
		mode: "NAMED" | "POSITIONAL" | "BOTH";
		order: string[];
		variadic: string;
		canOmitParameters: boolean;
	} | null;
	rest: {
		method: string;
		path: string;
		consumes: string[];
		produces: string[];
	} | null;
	definitions: Record<string, { id: string; properties: Property[] }>;
	diagnostics: {
		severity: "WARNING" | "ERROR";
		source: string;
		message: string;
	}[];
}

export interface TypeUse {
	shape:
		| {
				type: "scalar";
				kind: "STRING" | "BOOLEAN" | "INTEGER" | "DECIMAL";
				values: string[];
		  }
		| { type: "sequence"; element: TypeUse }
		| { type: "dictionary"; value: TypeUse }
		| { type: "union"; alternatives: TypeUse[] }
		| { type: "reference"; id: string }
		| { type: "unknown" | "empty" };
	nullable: boolean;
	description: string;
	format: string;
	knowledge: "VERIFIED" | "DYNAMIC" | "UNVERIFIED";
	reason: string;
}

export interface Property {
	name: string;
	type: TypeUse;
	required: boolean;
}

export interface Input {
	name: string;
	type: TypeUse;
	description: string;
	requirement: "REQUIRED" | "OPTIONAL" | "UNKNOWN";
	aliases: string[];
	binding:
		| "AUTO"
		| "PATH"
		| "QUERY"
		| "HEADER"
		| "COOKIE"
		| "FORM"
		| "MATRIX"
		| "BODY"
		| "NOUN";
	encoding: "DEFAULT" | "REPEATED" | "JSON" | "RAW" | "MULTIPART";
	defaultValue: string | null;
}

export interface Output {
	type: TypeUse;
	status: number;
	mediaType: string;
	description: string;
}

/** Canonical JSON preserves semantic array order and sorts every object's keys. */
export function stableJSON(value: unknown): string {
	return `${JSON.stringify(
		value,
		(_key, item: unknown) => {
			if (
				item !== null &&
				typeof item === "object" &&
				!Array.isArray(item)
			) {
				return Object.fromEntries(
					Object.entries(item).sort(([a], [b]) =>
						a < b ? -1 : a > b ? 1 : 0,
					),
				);
			}
			return item;
		},
		"\t",
	)}\n`;
}

/** Validate the exporter boundary before walking the graph or emitting source. */
export function parseCatalog(text: string): Catalog {
	const value: unknown = JSON.parse(text);
	if (
		!isRecord(value) ||
		value.schemaVersion !== 1 ||
		!Array.isArray(value.operations)
	) {
		throw new Error(
			"Unsupported contract catalog; expected schemaVersion 1 and operations.",
		);
	}
	// Validate the complete wire structure, including fields unused by TypeScript
	// that the future Python consumer will depend on. Never silently drop a field.
	for (const selected of value.operations) {
		if (!isRecord(selected)) throw new Error("Invalid operation selection");
		string(selected.name);
		nullableString(selected.applicationPath);
		const op = record(selected.contract);
		string(op.source);
		string(op.description);
		oneOf(op.kind, ["REST", "PIXEL"]);
		const policy = record(op.policy);
		strings(policy.ignoreReasons);
		strings(policy.internalReasons);
		const deprecation = record(op.deprecation);
		boolean(deprecation.deprecated);
		boolean(deprecation.forRemoval);
		for (const key of ["since", "reason", "replacement"])
			string(deprecation[key]);
		for (const input of array(op.inputs)) {
			const item = record(input);
			string(item.name);
			string(item.description);
			typeUse(item.type);
			oneOf(item.requirement, ["REQUIRED", "OPTIONAL", "UNKNOWN"]);
			strings(item.aliases);
			nullableString(item.defaultValue);
			oneOf(item.binding, [
				"AUTO",
				"PATH",
				"QUERY",
				"HEADER",
				"COOKIE",
				"FORM",
				"MATRIX",
				"BODY",
				"NOUN",
			]);
			oneOf(item.encoding, [
				"DEFAULT",
				"REPEATED",
				"JSON",
				"RAW",
				"MULTIPART",
			]);
		}
		for (const output of array(op.outputs)) {
			const item = record(output);
			typeUse(item.type);
			string(item.description);
			string(item.mediaType);
			if (!Number.isInteger(item.status))
				throw new Error("Invalid response status");
		}
		for (const definition of Object.values(record(op.definitions))) {
			const item = record(definition);
			string(item.id);
			for (const property of array(item.properties)) {
				const field = record(property);
				string(field.name);
				boolean(field.required);
				typeUse(field.type);
			}
		}
		for (const diagnostic of array(op.diagnostics)) {
			const item = record(diagnostic);
			oneOf(item.severity, ["WARNING", "ERROR"]);
			string(item.source);
			string(item.message);
		}
		if (op.kind === "PIXEL") {
			const invocation = record(op.invocation);
			oneOf(invocation.mode, ["NAMED", "POSITIONAL", "BOTH"]);
			strings(invocation.order);
			string(invocation.variadic);
			boolean(invocation.canOmitParameters);
			if (op.rest !== null)
				throw new Error("Pixel operation has REST metadata");
		} else {
			const rest = record(op.rest);
			string(rest.method);
			string(rest.path);
			strings(rest.consumes);
			strings(rest.produces);
			if (op.invocation !== null)
				throw new Error("REST operation has Pixel invocation metadata");
		}
	}
	return value as unknown as Catalog;
}

function typeUse(value: unknown): void {
	const item = record(value);
	boolean(item.nullable);
	string(item.description);
	string(item.format);
	string(item.reason);
	oneOf(item.knowledge, ["VERIFIED", "DYNAMIC", "UNVERIFIED"]);
	const shape = record(item.shape);
	oneOf(shape.type, [
		"scalar",
		"sequence",
		"dictionary",
		"union",
		"reference",
		"unknown",
		"empty",
	]);
	switch (shape.type) {
		case "scalar":
			oneOf(shape.kind, ["STRING", "BOOLEAN", "INTEGER", "DECIMAL"]);
			strings(shape.values);
			break;
		case "sequence":
			typeUse(shape.element);
			break;
		case "dictionary":
			typeUse(shape.value);
			break;
		case "union":
			for (const alternative of array(shape.alternatives))
				typeUse(alternative);
			break;
		case "reference":
			string(shape.id);
			break;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function record(value: unknown): Record<string, unknown> {
	if (!isRecord(value)) throw new Error("Expected contract object");
	return value;
}
function array(value: unknown): unknown[] {
	if (!Array.isArray(value)) throw new Error("Expected contract array");
	return value;
}
function string(value: unknown): void {
	if (typeof value !== "string") throw new Error("Expected contract string");
}
function nullableString(value: unknown): void {
	if (value !== null) string(value);
}
function boolean(value: unknown): void {
	if (typeof value !== "boolean")
		throw new Error("Expected contract boolean");
}
function strings(value: unknown): void {
	for (const item of array(value)) string(item);
}
function oneOf(value: unknown, choices: string[]): void {
	if (typeof value !== "string" || !choices.includes(value))
		throw new Error(`Invalid contract value: ${String(value)}`);
}
