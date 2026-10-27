import type {
	BuildPixelArguments,
	BuiltPixel,
	ReactorName,
} from "./pixel-types";
import { rawPixelMarker } from "./raw-pixel";
import { reactorNames } from "./reactors/inventory";

/** Pixel's identifier token excludes the earlier keyword and numeric tokens. */
function isIdentifier(value: string): boolean {
	return (
		/^[A-Za-z0-9_]+$/.test(value) &&
		!/^[0-9]+$/.test(value) &&
		![
			"null",
			"true",
			"false",
			"TRUE",
			"FALSE",
			"META",
			"AND",
			"OR",
		].includes(value)
	);
}

/** Preserve strings through both Pixel's lexer and its encoding-tag preprocessor. */
function quoteString(value: string): string {
	return `"${Array.from(value, (character) => {
		if (character === "\\") return "\\u005c";
		if (character === '"') return "\\u0022";
		if (character === "<") return "\\u003c";
		return JSON.stringify(character).slice(1, -1);
	}).join("")}"`;
}

/** Pixel has decimal literals, but no JavaScript-style exponent literals. */
function serializeNumber(value: number): string {
	if (!Number.isFinite(value)) {
		throw new TypeError("Pixel numbers must be finite");
	}
	if (Object.is(value, -0)) return "-0.0";
	let literal = String(value);
	if (/[eE]/.test(literal)) {
		const [coefficient, exponent] = literal.toLowerCase().split("e");
		const sign = coefficient.startsWith("-") ? "-" : "";
		const [whole, fraction = ""] = coefficient.replace(/^-/, "").split(".");
		const digits = whole + fraction;
		const point = whole.length + Number(exponent);
		literal =
			sign +
			(point <= 0
				? `0.${"0".repeat(-point)}${digits}`
				: point >= digits.length
					? digits + "0".repeat(point - digits.length)
					: `${digits.slice(0, point)}.${digits.slice(point)}`);
	}
	// Numeric reactors and negative map literals use intValue() for integer nouns.
	if (
		Number.isInteger(value) &&
		(value < -2147483648 || value > 2147483647)
	) {
		literal += ".0";
	}
	return literal;
}

function isPlainObject(value: object): value is Record<string, unknown> {
	const prototype: unknown = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

/** Reject holes instead of silently dropping positional arguments or list values. */
function serializeArray(
	values: readonly unknown[],
	ancestors: Set<object>,
	context: "vector" | "map" = "vector",
): string {
	const serialized: string[] = [];
	for (let index = 0; index < values.length; index++) {
		if (!Object.hasOwn(values, index)) {
			throw new TypeError("Pixel arrays cannot contain empty slots");
		}
		serialized.push(serializeValue(values[index], ancestors, context));
	}
	return serialized.join(",");
}

/** Serialize literal data recursively without executing user-defined toJSON methods. */
function serializeValue(
	value: unknown,
	ancestors: Set<object>,
	context: "vector" | "map" | "noun" = "vector",
): string {
	if (value === null) return "null";
	if (typeof value === "string") return quoteString(value);
	if (typeof value === "number") return serializeNumber(value);
	if (typeof value === "boolean") return String(value);
	if (typeof value !== "object") {
		throw new TypeError(`Unsupported Pixel value: ${typeof value}`);
	}
	if (rawPixelMarker in value && typeof value[rawPixelMarker] === "string") {
		return value[rawPixelMarker];
	}
	if (ancestors.has(value))
		throw new TypeError("Pixel values cannot contain cycles");
	ancestors.add(value);
	try {
		if (Array.isArray(value)) {
			const entries = serializeArray(
				value,
				ancestors,
				context === "map" ? "map" : "vector",
			);
			// Square brackets outside maps are noun rows, not nested vector values.
			return context === "vector" ? `Vector(${entries})` : `[${entries}]`;
		}
		if (!isPlainObject(value)) {
			throw new TypeError("Pixel maps must be plain objects");
		}
		if (Object.getOwnPropertySymbols(value).length) {
			throw new TypeError("Pixel maps cannot have symbol keys");
		}
		return `{${Object.entries(value)
			.filter(([, entry]) => entry !== undefined)
			.map(
				([key, entry]) =>
					`${quoteString(key)}:${serializeValue(entry, ancestors, "map")}`,
			)
			.join(",")}}`;
	} finally {
		ancestors.delete(value);
	}
}

/**
 * Build one typed reactor call from the generated backend contracts.
 *
 * Named scalar values become one-element noun arrays; named arrays are noun
 * lists. A top-level argument array supplies positional arguments. Ordinary
 * strings are always literal text; use rawPixel for trusted Pixel expressions.
 *
 * @param args - Reactor name and its optional or required parameter object/tuple.
 * @returns A semicolon-terminated primitive string carrying its output type.
 * @throws {TypeError} For unknown names, invalid identifiers or unrepresentable values.
 * @example buildPixel("StopPixelExecution", { id: "job-id" })
 * @example buildPixel("StopPixelExecution", ["job-id"])
 */
export function buildPixel<const N extends ReactorName>(
	...args: BuildPixelArguments<N>
): BuiltPixel<N> {
	// Widen only serialization inputs; preserve the reactor's output type on return.
	const [reactor, parameters]: [string, unknown?] = args;
	if (
		typeof reactor !== "string" ||
		!(reactorNames as readonly string[]).includes(reactor)
	) {
		throw new TypeError(
			`Unknown built-in Pixel reactor: ${String(reactor)}`,
		);
	}
	// These expression aliases collide with lexer tokens; dispatch is case-insensitive.
	const name = reactor === "AND" ? "And" : reactor === "OR" ? "Or" : reactor;
	if (!isIdentifier(name))
		throw new TypeError(`Invalid Pixel reactor identifier: ${name}`);
	let body = "";
	if (parameters !== undefined) {
		if (Array.isArray(parameters)) {
			body = serializeArray(parameters, new Set([parameters]));
		} else {
			if (
				parameters === null ||
				typeof parameters !== "object" ||
				!isPlainObject(parameters)
			) {
				throw new TypeError(
					"Pixel parameters must be a named object or positional array",
				);
			}
			if (Object.getOwnPropertySymbols(parameters).length) {
				throw new TypeError("Pixel parameters cannot have symbol keys");
			}
			const ancestors = new Set<object>([parameters]);
			body = Object.entries(parameters)
				.filter(([, value]) => value !== undefined)
				.map(([key, value]) => {
					if (!isIdentifier(key))
						throw new TypeError(
							`Invalid Pixel parameter identifier: ${key}`,
						);
					return `${key}=${Array.isArray(value) ? serializeValue(value, ancestors, "noun") : `[${serializeValue(value, ancestors)}]`}`;
				})
				.join(",");
		}
	}
	return `${name}(${body});` as BuiltPixel<N>;
}
