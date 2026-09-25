import { looksLikeHtmlDocument } from "@semoss/utility";

export function formatDurationMs(
	ms?: number | null,
	fractionDigits = 1,
): string {
	if (ms == null) return "—";
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(fractionDigits)}s`;
	return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

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
	if (inner && typeof inner === "object" && !Array.isArray(inner)) {
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
