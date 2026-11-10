/**
 * Turns JSON Schemas into TypeScript type source. Every type is written inline
 * where it is used; consumers read them back from the generated functions, as in
 * `Awaited<ReturnType<typeof config>>`.
 */

import { sortedEntries } from "./order.ts";
import {
	type OpenApiDocument,
	refName,
	type SchemaObject,
	SpecError,
} from "./spec.ts";

/** Where a schema is used: an input accepts any JSON value, an output may be anything. */
export type Position = "input" | "output";

/** What the emitted types depend on while they are written. */
export interface TypeContext {
	doc: OpenApiDocument;
	/** Set when an unconstrained input schema was written as `PixelValue`. */
	usesPixelValue: boolean;
	/** The `$ref`s being written, to reject a schema that contains itself. */
	refs: string[];
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Creates an empty context for one emitted file. */
export function createContext(doc: OpenApiDocument): TypeContext {
	return { doc, usesPixelValue: false, refs: [] };
}

/** Returns the component schema a `$ref` names. */
export function resolveRef(doc: OpenApiDocument, ref: string): SchemaObject {
	const name = refName(ref, "$ref");
	const schema = doc.components?.schemas?.[name];
	if (!schema) {
		throw new SpecError(`$ref "${ref}" does not resolve`);
	}
	return schema;
}

/** Follows `$ref`s until a schema with content is reached. */
export function derefSchema(
	doc: OpenApiDocument,
	schema: SchemaObject,
): SchemaObject {
	let current = schema;
	const seen = new Set<string>();
	while (current.$ref) {
		if (seen.has(current.$ref)) {
			throw new SpecError(`$ref "${current.$ref}" is circular`);
		}
		seen.add(current.$ref);
		current = resolveRef(doc, current.$ref);
	}
	return current;
}

/** Writes a TSDoc block, or nothing when there is no text. */
export function docComment(text: string | undefined): string {
	if (!text) {
		return "";
	}
	const lines = text.replaceAll("*/", "*\\/").split(/\r?\n/);
	if (lines.length === 1) {
		return `/** ${lines[0]} */\n`;
	}
	return `/**\n${lines.map((line) => ` * ${line}`.trimEnd()).join("\n")}\n */\n`;
}

/** Writes an object key, quoting it when it is not an identifier. */
export function propertyKey(name: string): string {
	return IDENTIFIER.test(name) ? name : JSON.stringify(name);
}

/** Writes the TypeScript type for a schema, inline. */
export function tsType(
	schema: SchemaObject,
	ctx: TypeContext,
	position: Position,
): string {
	if (schema.$ref) {
		if (ctx.refs.includes(schema.$ref)) {
			throw new SpecError(
				`"${schema.$ref}" contains itself; recursive schemas cannot be written inline`,
			);
		}
		ctx.refs.push(schema.$ref);
		try {
			return tsType(resolveRef(ctx.doc, schema.$ref), ctx, position);
		} finally {
			ctx.refs.pop();
		}
	}

	if (schema.const !== undefined) {
		return literal(schema.const);
	}

	if (schema.enum) {
		return union(schema.enum.map(literal));
	}

	if (schema.oneOf || schema.anyOf) {
		const members = (schema.oneOf ?? schema.anyOf ?? []).map((member) =>
			tsType(member, ctx, position),
		);
		return union(members);
	}

	if (schema.type === undefined) {
		if (schema.properties || schema.additionalProperties !== undefined) {
			return objectType(schema, ctx, position);
		}
		if (schema.items) {
			return arrayType(schema, ctx, position);
		}
		if (position === "input") {
			ctx.usesPixelValue = true;
			return "PixelValue";
		}
		return "unknown";
	}

	const types = Array.isArray(schema.type) ? schema.type : [schema.type];
	return union(
		types.map((type) => {
			switch (type) {
				case "string":
					return "string";
				case "number":
				case "integer":
					return "number";
				case "boolean":
					return "boolean";
				case "null":
					return "null";
				case "array":
					return arrayType(schema, ctx, position);
				case "object":
					return objectType(schema, ctx, position);
				default:
					throw new SpecError(`Unknown type "${type}"`);
			}
		}),
	);
}

function arrayType(
	schema: SchemaObject,
	ctx: TypeContext,
	position: Position,
): string {
	if (!schema.items) {
		return position === "input" ? "PixelValue[]" : "unknown[]";
	}
	const item = tsType(schema.items, ctx, position);
	return /[|&\s]/.test(item) && !item.startsWith("{")
		? `(${item})[]`
		: `${item}[]`;
}

function objectType(
	schema: SchemaObject,
	ctx: TypeContext,
	position: Position,
): string {
	const properties = sortedEntries(schema.properties ?? {});
	const extra = schema.additionalProperties;

	if (properties.length === 0) {
		if (extra === false) {
			return "Record<string, never>";
		}
		if (extra === undefined || extra === true) {
			return "Record<string, unknown>";
		}
		return `Record<string, ${tsType(extra, ctx, position)}>`;
	}

	if (extra !== undefined && typeof extra !== "boolean") {
		throw new SpecError(
			"An object with both properties and an additionalProperties schema is not supported",
		);
	}

	return `{\n${objectMembers(schema, ctx, position)}}`;
}

/** Writes the members of an object schema, one per line, each with its TSDoc. */
export function objectMembers(
	schema: SchemaObject,
	ctx: TypeContext,
	position: Position,
): string {
	const required = new Set(schema.required ?? []);
	return sortedEntries(schema.properties ?? {})
		.map(([name, child]) => {
			const optional = required.has(name) ? "" : "?";
			const description =
				child.description ??
				(child.$ref
					? resolveRef(ctx.doc, child.$ref).description
					: undefined);
			return `${docComment(description)}${propertyKey(name)}${optional}: ${tsType(child, ctx, position)};\n`;
		})
		.join("");
}

function literal(value: unknown): string {
	return JSON.stringify(value);
}

function union(members: string[]): string {
	const unique = [...new Set(members)];
	return unique.join(" | ");
}
