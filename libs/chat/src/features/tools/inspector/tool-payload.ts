/**
 * Format a payload without hiding empty strings, nulls, or false values.
 *
 * @param value - The payload to show.
 * @param parseResponse - Whether a string is a response to parse as JSON;
 * one that is not JSON is shown as plain text.
 * @returns The text to show and the language to highlight it as.
 */
export const formatToolPayload = (
	value: unknown,
	parseResponse = false,
): { text: string; language: "json" | "plaintext" } => {
	if (parseResponse && typeof value === "string") {
		try {
			return {
				text: JSON.stringify(JSON.parse(value), null, 2),
				language: "json",
			};
		} catch {
			return { text: value, language: "plaintext" };
		}
	}
	return { text: JSON.stringify(value, null, 2) ?? "", language: "json" };
};
