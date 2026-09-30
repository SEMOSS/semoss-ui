/*
 * How the connector viewers write a reactor call. Reactors read the first
 * value of each key and apply their own default when a key is left out, so
 * optional values that are empty are dropped rather than sent blank.
 */

/** Ids, which are plain strings: quoted with JSON escaping. */
type PixelId = { id: string };
/** Anything a person typed, or a file name: wrapped in an encode block. */
type PixelText = { text: string };
type PixelValue = string | number | boolean | PixelId | PixelText | undefined;

/** The markers pixel treats as the edges of an encoded block. */
const ENCODE_MARKERS = /<\/?(?:encode|sEncode|e)>/g;

/**
 * Quote a value for a reactor key.
 *
 * Text goes inside an encode block, which pixel decodes back verbatim, so
 * quotes, semicolons, and brackets in it are safe. The block's own markers are
 * removed from the text first so they cannot end it early.
 *
 * @param value - The value.
 * @return The pixel literal.
 */
const toPixelLiteral = (value: Exclude<PixelValue, undefined>): string => {
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (typeof value === "string") {
		return JSON.stringify(value);
	}
	if ("id" in value) {
		return JSON.stringify(value.id);
	}
	return `"<encode>${value.text.replace(ENCODE_MARKERS, "")}</encode>"`;
};

const isPresent = (
	value: PixelValue,
): value is Exclude<PixelValue, undefined> => {
	if (value === undefined) {
		return false;
	}
	if (typeof value === "string") {
		return value !== "";
	}
	if (typeof value === "object") {
		return "id" in value ? value.id !== "" : value.text.trim() !== "";
	}
	return true;
};

/**
 * One reactor call, as the connector viewers build them.
 *
 * @param reactor - The reactor's name.
 * @param args - Its keys; empty values are left out.
 * @return The pixel.
 */
export const call = (
	reactor: string,
	args: Record<string, PixelValue> = {},
): string => {
	const parts = Object.entries(args)
		.filter((entry): entry is [string, Exclude<PixelValue, undefined>] =>
			isPresent(entry[1]),
		)
		.map(([key, value]) => `${key}=[${toPixelLiteral(value)}]`);
	return `${reactor}(${parts.join(", ")});`;
};

/**
 * Mark a value as an id.
 *
 * @param value - The id, or nothing.
 * @return The argument, or undefined to leave the key out.
 */
export const id = (value: string | undefined): PixelId | undefined =>
	value ? { id: value } : undefined;

/**
 * Mark a value as text a person typed, or a name.
 *
 * @param value - The text, or nothing.
 * @return The argument, or undefined to leave the key out.
 */
export const text = (value: string | undefined): PixelText | undefined =>
	value ? { text: value } : undefined;
