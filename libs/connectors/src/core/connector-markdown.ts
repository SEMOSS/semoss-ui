import { isSameLocalDay } from "@semoss/utility/date";
import { parseGraphDate, parseGraphDay } from "./connector.format";
import { toSiteLink } from "./connector-rich-text";

/*
 * Emails, messages, and events are saved as Markdown so they can be attached
 * to a message like any file. The files are written for the model to read as
 * much as for people, so their labels stay in English whatever language the
 * UI is in, and their times are written out with the zone they are in: the
 * zone of the browser that saved the file.
 */

/** The files are read in English, whatever language the UI is in. */
const LOCALE = "en-US";

/** How the files write a day, such as `Mon, Sep 7, 2026`. */
const DAY_FORMAT: Intl.DateTimeFormatOptions = {
	weekday: "short",
	year: "numeric",
	month: "short",
	day: "numeric",
};

/** How the files write a time of day, such as `6:49 AM`. */
const TIME_FORMAT: Intl.DateTimeFormatOptions = {
	hour: "numeric",
	minute: "2-digit",
};

/**
 * A formatted date with plain spaces: some browsers put a narrow space
 * before the time's `AM` or `PM`.
 *
 * @param text - The formatted date.
 * @return The same date, spaced with plain spaces.
 */
const withPlainSpaces = (text: string): string => text.replace(/\s+/g, " ");

/**
 * A moment as the files write it, such as `Mon, Sep 7, 2026, 6:49 AM EDT`.
 *
 * @param date - The moment.
 * @return The moment, with its zone.
 */
const formatMoment = (date: Date): string =>
	withPlainSpaces(
		date.toLocaleString(LOCALE, {
			...DAY_FORMAT,
			...TIME_FORMAT,
			timeZoneName: "short",
		}),
	);

/**
 * A timestamp as the files write it.
 *
 * @param value - A timestamp that says its own offset.
 * @return The moment, or the value as it came when it is not a date.
 */
export const toMomentText = (value: string | undefined): string | undefined => {
	const date = parseGraphDate(value);
	return date ? formatMoment(date) : value;
};

/**
 * When an event happens: its day and times, with only the end's time when it
 * ends the day it starts, or its day for an all day event.
 *
 * @param start - The start, as the event has it.
 * @param end - The end, as the event has it.
 * @param options - How to read the times, whether the event lasts all day,
 * and the zone to name when a time cannot be read.
 * @return The text, or undefined when the event has no start.
 */
export const toWhenText = (
	start: string | undefined,
	end: string | undefined,
	options: {
		read: (value: string | undefined) => Date | null;
		isAllDay?: boolean;
		zone?: string;
	},
): string | undefined => {
	if (!start) {
		return undefined;
	}
	// an all day event names a day, wherever the reader is
	if (options.isAllDay || /^\d{4}-\d{2}-\d{2}$/.test(start)) {
		const day = parseGraphDay(start);
		return `${day ? withPlainSpaces(day.toLocaleDateString(LOCALE, DAY_FORMAT)) : start}, all day`;
	}
	const from = options.read(start);
	if (!from) {
		const zone = options.zone ? ` (${options.zone})` : "";
		return `${start}${end ? ` to ${end}` : ""}${zone}`;
	}
	const to = options.read(end);
	if (!to) {
		return formatMoment(from);
	}
	const startText = withPlainSpaces(
		from.toLocaleString(LOCALE, { ...DAY_FORMAT, ...TIME_FORMAT }),
	);
	const endText = isSameLocalDay(from, to)
		? withPlainSpaces(
				to.toLocaleTimeString(LOCALE, {
					...TIME_FORMAT,
					timeZoneName: "short",
				}),
			)
		: formatMoment(to);
	return `${startText} to ${endText}`;
};

/**
 * Text on one line, for a heading, a header, or a file name.
 *
 * @param value - The raw text.
 * @param fallback - Used when the text is empty.
 * @return The text.
 */
export const toTitle = (
	value: string | undefined,
	fallback: string,
): string => {
	const title = (value ?? "").replace(/\s+/g, " ").trim();
	return title || fallback;
};

/**
 * Text for a heading or a header, with any `<` kept a character rather than
 * read as markup.
 *
 * @param text - The text.
 * @return The Markdown.
 */
export const escapeInline = (text: string): string => text.replace(/</g, "\\<");

/**
 * Someone as the files write them: `Name (address)`, the name, or the
 * address, with a note such as how they answered an invitation.
 *
 * @param name - Their name.
 * @param address - Their address.
 * @param note - Said beside the address.
 * @return The text, or undefined when there is neither name nor address.
 */
export const toPerson = (
	name: string | undefined,
	address: string | undefined,
	note?: string,
): string | undefined => {
	const details = [address, note].filter(Boolean).join(", ");
	if (name) {
		return details ? `${name} (${details})` : name;
	}
	return address ? (note ? `${address} (${note})` : address) : undefined;
};

/** A header's value: text, or a link that shows only its site. */
export type FieldValue = string | { link: string | undefined } | undefined;

/**
 * Header lines such as `**From:** Ada`, one to a line, leaving out values
 * that are missing.
 *
 * @param fields - Labels and values in order.
 * @return The lines, or an empty string when every value is missing.
 */
export const toFieldLines = (
	fields: [label: string, value: FieldValue][],
): string =>
	fields
		.map(([label, value]) => {
			const markdown =
				typeof value === "object"
					? value.link
						? toSiteLink(value.link)
						: ""
					: escapeInline(toTitle(value, ""));
			return markdown ? `**${label}:** ${markdown}` : "";
		})
		.filter(Boolean)
		// two spaces end each line without starting a new paragraph
		.join("  \n");

/**
 * Join Markdown blocks with blank lines, skipping empty ones.
 *
 * @param blocks - The blocks.
 * @return The document, ending in a newline.
 */
export const toDocument = (blocks: (string | undefined)[]): string =>
	`${blocks.filter((block) => !!block?.trim()).join("\n\n")}\n`;

/**
 * The start of a message's text, on one line, for a title or a preview.
 *
 * @param body - The message's text.
 * @param length - How many characters to keep.
 * @return The first words, cut at a word where possible.
 */
export const toTextSnippet = (body: string, length: number): string => {
	const flat = body.replace(/\s+/g, " ").trim();
	if (flat.length <= length) {
		return flat;
	}
	const cut = flat.slice(0, length);
	const space = cut.lastIndexOf(" ");
	return `${(space > length / 2 ? cut.slice(0, space) : cut).trim()}...`;
};
