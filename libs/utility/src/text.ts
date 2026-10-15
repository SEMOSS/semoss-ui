import { formatByteSize } from "./file-size";

/** Stable, non-cryptographic hash of UTF-16 code units for deterministic styling. */
export const hashString = (value: string): number => {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
};

/** Read a non-blank string without trimming its returned value. */
export const readNonBlankString = (value: unknown): string | undefined =>
	typeof value === "string" && value.trim() !== "" ? value : undefined;

/** Uppercase the first character and lowercase the remaining characters. */
export const capitalize = (value: string): string =>
	value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

/** Strip ANSI SGR color/style sequences from logs and tracebacks. */
export const stripAnsiStyleCodes = (value: string): string =>
	value.replace(ANSI_ESCAPE, "");

const NAMED_HTML_ENTITIES: Record<string, string> = {
	amp: "&",
	apos: "'",
	gt: ">",
	lt: "<",
	nbsp: "\u00a0",
	quot: '"',
};

const HTML_ENTITY = /&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi;

/**
 * Decode the HTML character references a server-side sanitizer writes into
 * stored text, such as `&amp;`, `&#39;` and `&#x27;`. It decodes in one pass, so
 * `&amp;lt;` becomes `&lt;` rather than `<`, and keeps unknown names and
 * references to invalid code points as they are.
 */
export const decodeHtmlEntities = (value: string): string =>
	value.replace(HTML_ENTITY, (reference, body: string) => {
		const name = body.toLowerCase();
		if (!name.startsWith("#")) {
			return NAMED_HTML_ENTITIES[name] ?? reference;
		}
		const codePoint = name.startsWith("#x")
			? Number.parseInt(name.slice(2), 16)
			: Number.parseInt(name.slice(1), 10);
		const isValid =
			codePoint > 0 &&
			codePoint <= 0x10ffff &&
			(codePoint < 0xd800 || codePoint > 0xdfff);
		return isValid ? String.fromCodePoint(codePoint) : reference;
	});

/** Split a string at its first period. */
export const splitAtPeriod = (
	value: string,
	side: "left" | "right" = "left",
): string => {
	const index = value.indexOf(".");
	if (index === -1) return value;
	return side === "left"
		? value.substring(0, index)
		: value.substring(index + 1);
};

/** Replace underscores with spaces and capitalize each resulting word. */
export const formatUnderscoreLabel = (value: string): string =>
	value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

/** Capitalize the first letter of every whitespace-separated word. */
export const toTitleCase = (value: string): string =>
	value.replace(/\w\S*/g, capitalize);

/** Turn snake_case and camelCase metadata keys into display labels. */
export const metadataKeyToLabel = (value: string): string => {
	const spaced = value
		.replace(/_/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
		.replace(/\s+/g, " ")
		.trim();

	return spaced.replace(
		/\S+/g,
		(word) => word.charAt(0).toUpperCase() + word.slice(1),
	);
};

/** Uppercase the first ASCII word character, preserving the remaining text. */
export const capitalizeFirstLetter = (value: string): string =>
	value.replace(/\w{1}/, (match) => match.toUpperCase());

/**
 * Build initials with optional count and first/last-word constraints.
 *
 * @example
 * buildInitials("John Doe") // "JD"
 * buildInitials("Jane Mary Smith", 2, true) // "JS"
 * buildInitials("One Two Three Four", 3) // "OTT"
 * buildInitials("Jane-Mary Smith", 2, false, false) // "JS"
 */
export const buildInitials = (
	value: string,
	maxInitials = Number.POSITIVE_INFINITY,
	firstAndLast = false,
	alphanumeric = true,
): string => {
	const words = value
		.trim()
		.split(alphanumeric ? /[^A-Za-z0-9]+/ : /\s+/)
		.filter(Boolean);
	const selectedWords =
		firstAndLast && words.length > 1
			? [words[0], words[words.length - 1]]
			: words;

	return selectedWords
		.slice(0, Math.max(0, maxInitials))
		.map((word) => word.charAt(0).toUpperCase())
		.join("");
};

/** Split log messages into lines, removing one trailing newline per message. */
export const splitMessageLines = (messages: string[]): string[] =>
	messages.flatMap((message) => message.replace(/\n$/, "").split("\n"));

/** Count logical lines, ignoring one trailing newline; empty text has no lines. */
export const countLines = (text: string): number => {
	if (!text) return 0;
	const trimmed = text.endsWith("\n") ? text.slice(0, -1) : text;
	return trimmed ? trimmed.split("\n").length : 0;
};

/** Format UTF-8 text size for compact output metadata. */
export const formatTextByteSize = (text: string): string => {
	const bytes = new Blob([text || ""]).size;
	return formatByteSize(bytes);
};
/** Convert a label to the client test-id spelling without changing its case. */
export const formatToDataTestId = (text: string): string => {
	return text.replaceAll(/\(\)/g, "").replaceAll(" ", "-");
};

/**
 * Count how many times `needle` appears in `text`, without overlaps.
 *
 * @param text - Where to look.
 * @param needle - What to count. An empty needle has zero occurrences.
 * @return The number of occurrences.
 */
export const countOccurrences = (text: string, needle: string): number => {
	if (!needle) return 0;
	let count = 0;
	let index = text.indexOf(needle);
	while (index !== -1) {
		count++;
		index = text.indexOf(needle, index + needle.length);
	}
	return count;
};
