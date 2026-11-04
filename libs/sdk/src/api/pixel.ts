import type { PixelCatalog } from "../generated/pixel/catalog";

export type { PixelCatalog } from "../generated/pixel/catalog";

/** Any JSON value that can be written into a Pixel call. */
export type PixelValue =
	| string
	| number
	| boolean
	| null
	| PixelValue[]
	| { [key: string]: PixelValue };

/** The name of a reactor the SDK has a typed contract for. */
export type PixelName = keyof PixelCatalog;

/** The input object of a reactor. */
export type PixelInput<N extends PixelName> = PixelCatalog[N]["input"];

/** The output of a reactor. */
export type PixelOutput<N extends PixelName> = PixelCatalog[N]["output"];

declare const pixelContract: unique symbol;

/**
 * A Pixel string built by {@link buildPixel}. It is still a plain string at
 * runtime; the type remembers the reactor so `runPixel` and `usePixel` can
 * type its output.
 */
export type Pixel<N extends PixelName = PixelName> = string & {
	readonly [pixelContract]: N;
};

/** The output type of a {@link Pixel}. */
export type OutputOf<P> = P extends Pixel<infer N> ? PixelOutput<N> : never;

/** The input argument: optional when every input is optional. */
type PixelArgs<N extends PixelName> = Partial<
	PixelInput<N>
> extends PixelInput<N>
	? [input?: PixelInput<N>]
	: [input: PixelInput<N>];

/** Thrown when a Pixel call cannot be built from the given input. */
export class PixelInputError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PixelInputError";
	}
}

/** Thrown by {@link readPixelOutput} when the backend reported an error. */
export class PixelError extends Error {
	/** Each error message the backend returned. */
	readonly errors: string[];

	constructor(errors: string[]) {
		super(errors.join("\n"));
		this.name = "PixelError";
		this.errors = errors;
	}
}

/** A reactor name or input key: the only text written into a call unescaped. */
const PIXEL_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Compares by UTF-16 code unit, so the argument order never depends on locale. */
const byName = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Builds a call to one reactor from typed input. Every value is escaped, so
 * user text can never change the call.
 *
 * The contract is checked at compile time: TypeScript rejects an unknown
 * reactor, an unknown input or a missing required one. At runtime nothing is
 * looked up, so the catalog adds no code to a bundle; the backend still rejects
 * a missing required input.
 *
 * @example
 * ```ts
 * const pixel = buildPixel("StopPixelExecution", { id: jobId });
 * const result = await runPixel(pixel); // output: string
 * ```
 *
 * @param name - the reactor
 * @param input - its inputs; leave out the ones you do not set
 * @throws PixelInputError for a name or key that is not an identifier, or a value
 * that has no Pixel form (NaN, Infinity, bigint, a function, a class instance...)
 */
export function buildPixel<N extends PixelName>(
	name: N,
	...[input]: PixelArgs<N>
): Pixel<N> {
	// The name and keys are written as they are, so they must be identifiers:
	// otherwise a caller without type checking could inject Pixel through them.
	if (typeof name !== "string" || !PIXEL_IDENTIFIER.test(name)) {
		throw new PixelInputError(`"${String(name)}" is not a reactor name`);
	}
	if (input !== undefined && (typeof input !== "object" || input === null)) {
		throw new PixelInputError(`${name} takes an object of inputs`);
	}

	const values = (input ?? {}) as Record<string, unknown>;
	const args: string[] = [];
	for (const key of Object.keys(values).sort(byName)) {
		if (!PIXEL_IDENTIFIER.test(key)) {
			throw new PixelInputError(`${name}: "${key}" is not an input name`);
		}
		const value = values[key];
		if (value === undefined) {
			continue;
		}
		args.push(`${key}=${toPixelLiteral(value, `${name}.${key}`)}`);
	}

	return `${name}(${args.join(", ")});` as Pixel<N>;
}

/**
 * Writes a value as a Pixel literal. JSON is valid Pixel literal syntax, since
 * the backend decodes JSON escapes; `<` is escaped too, because the backend
 * expands `<encode>` blocks before it parses, even inside strings.
 */
function toPixelLiteral(value: unknown, where: string): string {
	assertPixelValue(value, where, new Set());
	return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function assertPixelValue(
	value: unknown,
	where: string,
	seen: Set<object>,
): asserts value is PixelValue {
	if (
		value === null ||
		typeof value === "string" ||
		typeof value === "boolean"
	) {
		return;
	}

	if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			throw new PixelInputError(`${where} must be a finite number`);
		}
		// Pixel has no exponent notation, which JSON uses for very large and small numbers.
		if (/e/i.test(JSON.stringify(value))) {
			throw new PixelInputError(
				`${where} is too large or too small to write in Pixel (${value})`,
			);
		}
		return;
	}

	if (typeof value !== "object") {
		throw new PixelInputError(
			`${where} is a ${typeof value}, which has no Pixel form`,
		);
	}

	if (seen.has(value)) {
		throw new PixelInputError(`${where} refers to itself`);
	}
	seen.add(value);

	if (Array.isArray(value)) {
		value.forEach((item, i) => {
			if (item === undefined) {
				throw new PixelInputError(`${where}[${i}] is undefined`);
			}
			assertPixelValue(item, `${where}[${i}]`, seen);
		});
	} else {
		const prototype = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== null) {
			throw new PixelInputError(
				`${where} must be a plain object, array or scalar`,
			);
		}
		for (const [key, item] of Object.entries(value)) {
			if (item !== undefined) {
				assertPixelValue(item, `${where}.${key}`, seen);
			}
		}
	}

	seen.delete(value);
}

/**
 * Returns the outputs of a Pixel result, one per statement, or throws when the
 * backend reported an error. A typed output is only meaningful without errors:
 * a failed statement's output is its error message. Takes the result of
 * `runPixel` or of `getPixelAsyncResult`.
 *
 * @throws PixelError with every error message
 */
export function readPixelOutput<O>(
	result:
		| { errors: string[]; pixelReturn: readonly { output: O }[] }
		| { errors: string[]; results: readonly { output: O }[] },
): O[] {
	if (result.errors.length > 0) {
		throw new PixelError(result.errors);
	}
	const statements =
		"pixelReturn" in result ? result.pixelReturn : result.results;
	return statements.map((p) => p.output);
}
