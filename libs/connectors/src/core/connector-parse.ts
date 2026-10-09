import { isRecord } from "@semoss/utility/object";

/*
 * How every connector reads a reactor's output. The reactors leave null fields
 * out, so everything is read defensively: an entry missing what the viewers
 * need is dropped, and a response of the wrong shape is an error.
 */

/** A reactor's output read as a record. */
export type RawRecord = Record<string, unknown>;

/**
 * @param value - A value from a reactor's output.
 * @return The value when it is a finite number.
 */
export const readNumber = (value: unknown): number | undefined =>
	typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** What the backend writes where it cut a text short. */
const TRUNCATION_MARK = " ... [truncated]";

/**
 * A text the backend may have cut short, without the mark it leaves where it
 * cut: the viewers and saved files say so in their own words.
 *
 * @param value - The text as the backend returned it.
 * @param isTruncated - Whether the backend says it cut the text.
 * @return The text, or undefined when there is none.
 */
export const readBody = (
	value: unknown,
	isTruncated: boolean,
): string | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}
	return isTruncated && value.endsWith(TRUNCATION_MARK)
		? value.slice(0, -TRUNCATION_MARK.length)
		: value;
};

/**
 * @param value - A value from a reactor's output.
 * @return The value when it is a list, or an empty list.
 */
export const readList = (value: unknown): unknown[] =>
	Array.isArray(value) ? value : [];

/**
 * @param value - A value from a reactor's output.
 * @return The strings of a list, without blank ones.
 */
export const readStringList = (value: unknown): string[] =>
	readList(value).filter(
		(entry): entry is string =>
			typeof entry === "string" && entry.trim() !== "",
	);

/**
 * Parse each entry of a list, keeping those that parse.
 *
 * @param value - The raw list.
 * @param parse - Reads one entry, or returns null to drop it.
 * @return The parsed entries.
 */
export const parseEach = <T>(
	value: unknown,
	parse: (entry: unknown) => T | null,
): T[] => {
	const parsed: T[] = [];
	for (const entry of readList(value)) {
		const item = parse(entry);
		if (item) {
			parsed.push(item);
		}
	}
	return parsed;
};

/**
 * The record a reactor returned, or an error naming what was expected.
 *
 * @param raw - The reactor's output.
 * @param what - What the response should hold, for the error.
 * @return The record.
 * @throws Error when the output is not an object.
 */
export const requireRecord = (raw: unknown, what: string): RawRecord => {
	if (!isRecord(raw)) {
		throw new Error(`The response did not include ${what}.`);
	}
	return raw;
};

/**
 * A list a reactor returned, bare or under a key, or an error.
 *
 * @param raw - The reactor's output.
 * @param key - The key the list sits under, when it is wrapped.
 * @param what - What the response should hold, for the error.
 * @return The raw list.
 * @throws Error when there is no list.
 */
export const requireList = (
	raw: unknown,
	key: string,
	what: string,
): unknown[] => {
	const list = Array.isArray(raw) ? raw : isRecord(raw) ? raw[key] : null;
	if (!Array.isArray(list)) {
		throw new Error(`The response did not include ${what}.`);
	}
	return list;
};
