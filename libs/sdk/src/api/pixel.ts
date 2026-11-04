import { PIXEL_PARAMS, type PixelCatalog } from "../generated/pixel/catalog";

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

/**
 * Builds a call to one reactor from typed input. Every value is escaped, so
 * user text can never change the call.
 *
 * @example
 * ```ts
 * const pixel = buildPixel("StopPixelExecution", { id: jobId });
 * const result = await runPixel(pixel); // output: string
 * ```
 *
 * @param name - the reactor
 * @param input - its inputs; leave out the ones you do not set
 * @throws PixelInputError for an unknown input, a missing required input, or a
 * value that has no Pixel form (NaN, Infinity, bigint, a function, a class instance...)
 */
export function buildPixel<N extends PixelName>(
	name: N,
	...[input]: PixelArgs<N>
): Pixel<N> {
	const values = (input ?? {}) as Record<string, unknown>;
	const params: readonly { name: string; required: boolean }[] =
		PIXEL_PARAMS[name];

	if (!params) {
		throw new PixelInputError(`Unknown reactor "${String(name)}"`);
	}

	for (const key of Object.keys(values)) {
		if (!params.some((param) => param.name === key)) {
			throw new PixelInputError(`${name} has no input "${key}"`);
		}
	}

	const args: string[] = [];
	for (const param of params) {
		const value = values[param.name];
		if (value === undefined) {
			if (param.required) {
				throw new PixelInputError(`${name} needs "${param.name}"`);
			}
			continue;
		}
		args.push(
			`${param.name}=${toPixelLiteral(value, `${name}.${param.name}`)}`,
		);
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
