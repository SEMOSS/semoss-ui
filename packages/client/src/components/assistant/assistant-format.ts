/**
 * Parse a timestamp string into epoch milliseconds, tolerating missing or
 * malformed values so callers can sort without guarding.
 *
 * @name parseTime
 * @param value - The timestamp string to parse.
 * @return Epoch milliseconds, or 0 when the value is missing or invalid.
 */
export const parseTime = (value?: string): number => {
	if (!value) return 0;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Format a timestamp as a short wall-clock label ("3:04 PM").
 *
 * @name formatTime
 * @param value - The timestamp string to format.
 * @return The locale time label, or "" when the value cannot be parsed.
 */
export const formatTime = (value?: string): string => {
	const time = parseTime(value);
	if (!time) return "";
	return new Date(time).toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit",
	});
};

/**
 * Format a millisecond duration compactly ("340ms", "1.2s").
 *
 * @name formatMs
 * @param ms - The duration in milliseconds.
 * @return The compact duration label.
 */
export const formatMs = (ms: number): string => {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Format a longer millisecond duration in seconds/minutes ("45s", "2m 5s").
 *
 * @name formatLongMs
 * @param ms - The duration in milliseconds.
 * @return The seconds/minutes duration label.
 */
export const formatLongMs = (ms: number): string => {
	if (ms < 1000) return `${ms}ms`;
	const totalSeconds = Math.round(ms / 1000);
	if (totalSeconds < 60) return `${totalSeconds}s`;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
};

/**
 * Truncate a string in the middle so both the beginning and end stay visible
 * ("beginning…end"), biasing the split toward the head.
 *
 * @name truncateMiddle
 * @param value - The string to truncate.
 * @param maxLength - Maximum length of the result including the ellipsis.
 * @return The truncated string, or the original when within the limit.
 */
const truncateMiddle = (value: string, maxLength: number): string => {
	if (value.length <= maxLength) return value;
	const headLength = Math.ceil((maxLength - 1) * 0.62);
	const tailLength = Math.floor((maxLength - 1) * 0.38);
	return `${value.slice(0, headLength)}…${value.slice(-tailLength)}`;
};

// Argument keys whose long string values are summarized instead of shown.
const LARGE_TEXT_ARG_KEYS = new Set([
	"content",
	"new_string",
	"old_string",
	"script",
	"text",
]);

// Argument keys shown first in tool-argument summaries, in this order.
const IMPORTANT_ARG_KEYS = [
	"file_path",
	"filePath",
	"path",
	"command",
	"query",
	"pattern",
	"glob",
	"offset",
	"limit",
	"content",
	"old_string",
	"new_string",
	"script",
];

/**
 * Summarize a large text body by size and line count ("<12.4 KB, 340
 * lines>") instead of rendering its contents.
 *
 * @name formatLargeTextSummary
 * @param value - The text body to summarize.
 * @return The bracketed size/line-count summary.
 */
const formatLargeTextSummary = (value: string): string => {
	const lineCount = value.split(/\r\n|\r|\n/).length;
	const bytes = new Blob([value]).size;
	const size =
		bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
	return `<${size}${lineCount > 1 ? `, ${lineCount} lines` : ""}>`;
};

/**
 * Render one tool-argument value for the summary line: large text bodies
 * become size summaries, other strings are whitespace-collapsed and
 * middle-truncated, and non-strings are JSON-encoded then truncated.
 *
 * @name formatToolArgValue
 * @param key - The argument key, used to detect large text bodies.
 * @param value - The argument value to render.
 * @return The compact single-line rendering of the value.
 */
const formatToolArgValue = (key: string, value: unknown): string => {
	if (typeof value === "string") {
		if (LARGE_TEXT_ARG_KEYS.has(key) && value.length > 80) {
			return formatLargeTextSummary(value);
		}
		return truncateMiddle(value.replace(/\s+/g, " "), 90);
	}

	const rendered = JSON.stringify(value);
	return rendered ? truncateMiddle(rendered, 90) : String(value);
};

/**
 * Build a compact one-line tool-argument summary: important keys first, long
 * strings middle-truncated, large text bodies replaced with size summaries,
 * and everything past the first four entries collapsed into "+N more".
 *
 * @name formatToolArgs
 * @param args - The tool's argument record.
 * @return The one-line summary, or "" when there is nothing to show.
 */
export const formatToolArgs = (args?: Record<string, unknown>): string => {
	if (!args) return "";

	const presentEntries = Object.entries(args).filter(
		([, value]) => value !== undefined && value !== null && value !== "",
	);
	const orderedEntries = [
		...IMPORTANT_ARG_KEYS.flatMap((key) =>
			presentEntries.filter(([entryKey]) => entryKey === key),
		),
		...presentEntries.filter(([key]) => !IMPORTANT_ARG_KEYS.includes(key)),
	];
	const entries = orderedEntries.slice(0, 4);
	if (entries.length === 0) return "";

	const extraCount = orderedEntries.length - entries.length;
	const summary = entries
		.map(([key, value]) => `${key}=${formatToolArgValue(key, value)}`)
		.join(", ");

	return `${summary}${extraCount > 0 ? `, +${extraCount} more` : ""}`;
};

/**
 * Format a timestamp for the conversation list ("Jan 5, 3:04 PM").
 *
 * @name formatSessionDate
 * @param value - The timestamp string to format.
 * @return The locale date/time label, or "" when the value cannot be parsed.
 */
export const formatSessionDate = (value?: string): string => {
	const time = parseTime(value);
	if (!time) return "";
	return new Date(time).toLocaleString([], {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
};
