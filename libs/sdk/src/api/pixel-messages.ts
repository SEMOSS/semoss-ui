/** The messages a pixel statement reports beside its output. */
export interface PixelMessages {
	/** Success messages, such as what the statement did. */
	success: string[];
	/** Warnings: the statement ran, with something the user should know. */
	warnings: string[];
}

/**
 * Read the success and warning messages a pixel statement reports in its
 * `additionalOutput`, the messages a reactor adds beside its output.
 *
 * @param statement - One entry of a pixel response's `pixelReturn`.
 * @returns Its success and warning messages, in the order reported; entries
 * that are not text messages are skipped.
 */
export const readPixelMessages = (
	statement: { additionalOutput?: unknown } | undefined,
): PixelMessages => {
	const messages: PixelMessages = { success: [], warnings: [] };
	const additional = statement?.additionalOutput;
	if (!Array.isArray(additional)) {
		return messages;
	}
	for (const entry of additional) {
		if (typeof entry !== "object" || entry === null) {
			continue;
		}
		const { output, operationType } = entry as {
			output?: unknown;
			operationType?: unknown;
		};
		if (typeof output !== "string" || !Array.isArray(operationType)) {
			continue;
		}
		if (operationType.includes("WARNING")) {
			messages.warnings.push(output);
		} else if (operationType.includes("SUCCESS")) {
			messages.success.push(output);
		}
	}
	return messages;
};
