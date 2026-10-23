/** Internal runtime identity; never exported from an SDK entry point. */
export const rawPixelMarker: unique symbol = Symbol("rawPixel");

/** An explicitly unescaped Pixel expression, distinct from ordinary text. */
export interface RawPixel {
	readonly [rawPixelMarker]: string;
}

/**
 * Mark a trusted Pixel expression for use as a buildPixel argument.
 *
 * Supply one expression fragment without a statement terminator. The backend
 * validates its syntax. This helper does not escape or sanitize the expression;
 * use ordinary strings for user-provided text.
 *
 * @param expression - A column, nested operation, comparison, or other expression.
 * @returns An opaque value that buildPixel inserts without quoting.
 * @throws {TypeError} If the expression is not a nonempty string.
 * @example rawPixel("Sum(revenue)")
 */
export function rawPixel(expression: string): RawPixel {
	if (typeof expression !== "string" || !expression.trim()) {
		throw new TypeError("rawPixel requires a nonempty expression");
	}
	return Object.freeze({ [rawPixelMarker]: expression });
}
