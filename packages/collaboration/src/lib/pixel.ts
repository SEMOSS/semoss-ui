import type { Insight } from "@semoss/sdk";

/** The `actions` bag exposed by `useInsight()` / the `Insight` store. */
export type InsightActions = Insight["actions"];

/**
 * A failure that happened while talking to SEMOSS: a reactor error, an empty
 * result, or a payload that did not match its schema.
 *
 * Distinct from a thrown transport error so the UI can tell "the server said
 * no" apart from "the request never landed".
 */
export class PixelError extends Error {
	/** The pixel statement that produced the failure, for diagnostics. */
	readonly pixel: string;

	constructor(message: string, pixel: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "PixelError";
		this.pixel = pixel;
	}
}

/**
 * Encode a single value as a pixel argument.
 *
 * A scalar is JSON-encoded into a single-element list, which is how reactor keys
 * are read server-side and how the SDK encodes its own calls (see
 * `@semoss/sdk` `src/api/agent.ts`). An array is emitted as the list itself, for
 * the keys a reactor reads with `getList` / `getNounAsStringList` — wrapping it
 * again would nest the list one level too deep.
 *
 * Going through here is what keeps user text out of executable pixel — never
 * interpolate a value into a pixel string.
 */
function pixelArg(value: unknown): string {
	return JSON.stringify(Array.isArray(value) ? value : [value]);
}

/**
 * Build a single reactor statement. Keys whose value is `undefined` or `null`
 * are omitted, so optional reactor keys stay unset rather than being sent empty.
 */
export function pixel(reactor: string, args: Record<string, unknown> = {}) {
	const clauses = Object.entries(args)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(([key, value]) => `${key}=${pixelArg(value)}`);

	return `${reactor}(${clauses.join(", ")});`;
}

/** The shape `callPixel` needs from a zod schema, without pinning a zod version. */
export interface OutputSchema<T> {
	safeParse: (
		value: unknown,
	) =>
		| { success: true; data: T }
		| { success: false; error: { message: string } };
}

/**
 * Run a single-statement pixel through the active insight and validate its output.
 *
 * Uses `actions.run` rather than the SDK's bare `runPixel`: `runPixel` reports
 * reactor errors by *returning* them, so a caller that forgets to check
 * `errors.length` silently renders an error string as data. `actions.run`
 * throws instead, and flips the insight to unauthorized on a 401 so the
 * existing login redirect takes over.
 *
 * @param actions - `actions` from `useInsight()`.
 * @param statement - A single pixel statement, built with {@link pixel}.
 * @param schema - Validates the reactor output. TypeScript alone does not
 * validate data that crossed the wire.
 * @throws {PixelError} on a reactor error, an empty result, or a schema mismatch.
 */
export async function callPixel<T>(
	actions: InsightActions,
	statement: string,
	schema: OutputSchema<T>,
): Promise<T> {
	const response = await actions.run<[unknown]>(statement);

	const entry = response?.pixelReturn?.[0];
	if (!entry) {
		throw new PixelError("SEMOSS returned an empty result.", statement);
	}

	// actions.run already throws on an ERROR operation; this is defence in depth
	// for a result that reports an error without one.
	if (entry.operationType?.includes("ERROR")) {
		throw new PixelError(String(entry.output), statement);
	}

	const parsed = schema.safeParse(entry.output);
	if (parsed.success === false) {
		throw new PixelError(
			`SEMOSS returned an unexpected shape: ${parsed.error.message}`,
			statement,
		);
	}

	return parsed.data;
}

/** Normalize an unknown thrown value into an Error. */
export function toError(value: unknown): Error {
	return value instanceof Error ? value : new Error(String(value));
}
