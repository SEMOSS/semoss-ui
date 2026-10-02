import { isSameLocalDay } from "@semoss/utility/date";
import { getLinkText } from "./connector-rich-text";

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** An ISO date and time that already says which offset it is in. */
const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/** Graph writes seven fractional digits; `Date` only reads up to three. */
const LONG_FRACTION = /(\.\d{3})\d+/;

/**
 * A byte count for display, such as `12.4 KB`.
 *
 * @param bytes - The size in bytes.
 * @param locale - Locale for the number, such as the UI's language.
 * @return The formatted size.
 */
export const formatConnectorSize = (bytes: number, locale?: string): string => {
	let value = Math.max(0, bytes);
	let unit = 0;
	while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
		value /= 1024;
		unit++;
	}
	const formatted = value.toLocaleString(locale, {
		maximumFractionDigits: unit === 0 ? 0 : 1,
	});
	return `${formatted} ${SIZE_UNITS[unit]}`;
};

/**
 * Read a Graph timestamp.
 *
 * Most Graph timestamps are ISO instants. Calendar times come without an
 * offset, next to the zone they are in; the viewers ask for UTC, so a time
 * without an offset is read as UTC unless another zone is named, which is not
 * converted.
 *
 * @param value - The timestamp.
 * @param timeZone - The zone a timestamp without an offset is in.
 * @return The instant, or null when the value is not a date, or is in a zone
 * other than UTC.
 */
export const parseGraphDate = (
	value: string | undefined,
	timeZone?: string,
): Date | null => {
	if (!value) {
		return null;
	}
	let normalized = value.trim().replace(LONG_FRACTION, "$1");
	if (!HAS_OFFSET.test(normalized)) {
		if (timeZone && timeZone.toUpperCase() !== "UTC") {
			return null;
		}
		normalized = `${normalized}Z`;
	}
	const date = new Date(normalized);
	return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * The calendar day a Graph date names, read as a day rather than an instant,
 * for all day events: `2026-09-27T00:00:00` is the 27th wherever the user is.
 *
 * @param value - The event's start or end.
 * @return Local midnight of that day, or null when the value is not a date.
 */
export const parseGraphDay = (value: string | undefined): Date | null => {
	const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
	if (!match) {
		return null;
	}
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

/**
 * A short date for a list: the time for today, the day and month for this
 * year, and the full date for anything older.
 *
 * @param value - A Graph timestamp.
 * @param locale - Locale for the date.
 * @param now - The current time, for tests.
 * @return The formatted date, or an empty string when the value is not a date.
 */
export const formatListDate = (
	value: string | undefined,
	locale?: string,
	now: Date = new Date(),
): string => {
	const date = parseGraphDate(value);
	if (!date) {
		return "";
	}
	if (isSameLocalDay(date, now)) {
		return date.toLocaleTimeString(locale, { timeStyle: "short" });
	}
	if (date.getFullYear() === now.getFullYear()) {
		return date.toLocaleDateString(locale, {
			month: "short",
			day: "numeric",
		});
	}
	return date.toLocaleDateString(locale, { dateStyle: "medium" });
};

/**
 * A full date and time, such as `Sep 27, 2026, 3:45 PM`.
 *
 * @param value - A Graph timestamp.
 * @param locale - Locale for the date.
 * @return The formatted date and time, or the value itself when it is not a
 * date.
 */
export const formatFullDate = (
	value: string | undefined,
	locale?: string,
): string => {
	const date = parseGraphDate(value);
	if (!date) {
		return value ?? "";
	}
	return date.toLocaleString(locale, {
		dateStyle: "medium",
		timeStyle: "short",
	});
};

/**
 * A time of day, such as `9:30 AM`.
 *
 * @param date - The instant.
 * @param locale - Locale for the time.
 * @return The formatted time.
 */
export const formatTimeOfDay = (date: Date, locale?: string): string =>
	date.toLocaleTimeString(locale, { timeStyle: "short" });

/**
 * A day heading, such as `Sunday, September 27`.
 *
 * @param date - Any time on the day.
 * @param locale - Locale for the date.
 * @return The formatted day.
 */
export const formatDayHeading = (date: Date, locale?: string): string =>
	date.toLocaleDateString(locale, {
		weekday: "long",
		month: "long",
		day: "numeric",
	});

/**
 * A short day, such as `Sep 27`.
 *
 * @param date - Any time on the day.
 * @param locale - Locale for the date.
 * @return The formatted day.
 */
export const formatShortDay = (date: Date, locale?: string): string =>
	date.toLocaleDateString(locale, { month: "short", day: "numeric" });

/** Tags that end a line of text, so the lines survive reading the text out. */
const LINE_ENDING_TAGS = /<(?:br|\/p|\/div|\/li|\/tr|\/h[1-6])\b[^>]*>/gi;

/** Anything that looks like an HTML tag. */
const HTML_TAG = /<[a-z!/][^>]*>/i;

/** The links a body can offer: web pages and emails. */
const LINK_SCHEME = /^(?:https?|mailto):/i;

/**
 * An email's text as plain text. Text that is already plain is kept as it
 * is; HTML is read out the way a browser would show it, with scripts and
 * styles dropped and nothing run. A link keeps its address after its text,
 * in angle brackets the way Outlook writes one, unless the text is the
 * address.
 *
 * @param content - The text, plain or HTML.
 * @return The plain text.
 */
export const toPlainText = (content: string): string => {
	if (!HTML_TAG.test(content)) {
		return content;
	}
	const withLines = content.replace(LINE_ENDING_TAGS, (tag) => `${tag}\n`);
	if (typeof DOMParser === "undefined") {
		return withLines.replace(/<[^>]+>/g, "").trim();
	}
	// a parsed document is inert: its scripts do not run and nothing loads
	const parsed = new DOMParser().parseFromString(withLines, "text/html");
	for (const element of Array.from(
		parsed.querySelectorAll("script, style, head"),
	)) {
		element.remove();
	}
	for (const link of Array.from(parsed.querySelectorAll("a[href]"))) {
		const href = link.getAttribute("href")?.trim() ?? "";
		const text = (link.textContent ?? "").trim().toLowerCase();
		// a link around an image alone has no text to follow
		if (
			LINK_SCHEME.test(href) &&
			text !== "" &&
			text !== href.toLowerCase() &&
			text !== getLinkText(href).toLowerCase()
		) {
			// the address is written whole, so it is read back as one link
			const address = href
				.replace(/[\t\n\r]/g, "")
				.replace(/[\s<>]/g, encodeURIComponent);
			link.append(`<${address}>`);
		}
	}
	return (parsed.body?.textContent ?? "")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
};

export {
	addLocalDays,
	isSameLocalDay,
	startOfLocalDay,
} from "@semoss/utility/date";
