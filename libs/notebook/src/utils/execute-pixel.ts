/**
 * Builds a runnable pixel expression for a code block, or null when the
 * language is not something we can execute server-side.
 */
export const buildExecutePixel = (
	lang: string | undefined,
	code: string,
): string | null => {
	if (!code.trim()) return null;

	// Only languages with a server-side Pixel reactor can be executed;
	// Python/R route through their reactor, raw "pixel" is sent as-is, and
	// anything else returns null so callers can surface an unsupported-language error.
	switch ((lang ?? "").toLowerCase()) {
		case "py":
		case "python":
			return `Py("<encode>${code}</encode>");`;
		case "r":
			return `R("<encode>${code}</encode>");`;
		case "pixel":
			return code;
		default:
			return null;
	}
};
