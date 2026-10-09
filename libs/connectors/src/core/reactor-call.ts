/*
 * How the connector viewers write a reactor call. Reactors read the first
 * value of each key and apply their own default when a key is left out, so
 * optional values that are empty are dropped rather than sent blank.
 */

/** Ids, which are plain strings: quoted with JSON escaping. */
type PixelId = { id: string };
/** Anything a person typed, or a file name: wrapped in an encode block. */
type PixelText = { text: string };
/** One value of a key that takes several, such as an email's recipients. */
type PixelListItem = string | PixelText;
type PixelValue =
	| string
	| number
	| boolean
	| PixelId
	| PixelText
	| readonly PixelListItem[]
	| undefined;

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
const toPixelLiteral = (
	value: Exclude<PixelValue, undefined | readonly PixelListItem[]>,
): string => {
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

/**
 * Whether a value is a list. `Array.isArray` does not narrow a readonly list
 * out of the other branch, so this does.
 *
 * @param value - The value.
 * @return Whether it is a list of values.
 */
const isPixelList = (value: PixelValue): value is readonly PixelListItem[] =>
	Array.isArray(value);

const isPresent = (
	value: PixelValue,
): value is Exclude<PixelValue, undefined> => {
	if (value === undefined) {
		return false;
	}
	if (typeof value === "string") {
		return value !== "";
	}
	if (isPixelList(value)) {
		return value.length > 0;
	}
	if (typeof value === "object") {
		return "id" in value ? value.id !== "" : value.text.trim() !== "";
	}
	return true;
};

/**
 * A key's values: one, or each of a list, as the reactor reads all of them.
 *
 * @param value - The key's value.
 * @return The pixel literals, comma separated.
 */
const toPixelValues = (value: Exclude<PixelValue, undefined>): string =>
	isPixelList(value)
		? value.map((item) => toPixelLiteral(item)).join(", ")
		: toPixelLiteral(value);

/**
 * One reactor call, as the connector viewers build them.
 *
 * @param reactor - The reactor's name.
 * @param args - Its keys; empty values and empty lists are left out.
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
		.map(([key, value]) => `${key}=[${toPixelValues(value)}]`);
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
