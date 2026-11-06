/** Format a payload without hiding empty strings, nulls, or false values. */
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
