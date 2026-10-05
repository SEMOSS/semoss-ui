import { looksLikeHtmlDocument } from "@semoss/utility/markdown";
import { isRecord } from "@semoss/utility/object";

/** Removes markup from server-generated HTML error documents without changing plain-text errors. */
export function normalizeAutomationErrorMessage(value: string): string {
	if (!looksLikeHtmlDocument(value)) return value;
	return value
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

// Normalizes common SEMOSS data-set output into a table-friendly shape.
export function extractDataset(
	parsed: unknown,
): { headers: string[]; rows: unknown[][] } | null {
	if (
		Array.isArray(parsed) &&
		parsed.length > 0 &&
		typeof parsed[0] === "object" &&
		!Array.isArray(parsed[0])
	) {
		const keys = Object.keys(parsed[0] as Record<string, unknown>);
		return {
			headers: keys,
			rows: (parsed as Record<string, unknown>[]).map((row) =>
				keys.map((key) => row[key]),
			),
		};
	}
	const inner = (parsed as Record<string, unknown>)?.data ?? parsed;
	if (isRecord(inner)) {
		const headers = (inner as Record<string, unknown>).headers;
		const values = (inner as Record<string, unknown>).values;
		if (Array.isArray(headers) && Array.isArray(values)) {
			return {
				headers: headers as string[],
				rows: values as unknown[][],
			};
		}
	}
	return null;
}

export { formatDurationMs } from "@semoss/utility/date";
