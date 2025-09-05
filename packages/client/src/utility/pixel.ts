/**
 * Utility functions for safe pixel command construction
 *
 * These utilities help prevent command injection vulnerabilities when constructing
 * pixel commands with user-supplied data. Always use these functions instead of
 * direct string interpolation when building pixel commands.
 */

/**
 * Escapes special characters in a string to prevent command injection in pixel strings
 * @param value - The string value to escape
 * @returns The escaped string safe for use in pixel commands
 */
export const escapePixelString = (value: string): string => {
	if (typeof value !== "string") {
		return String(value);
	}

	// Escape single quotes by replacing them with escaped single quotes
	// This prevents breaking out of the pixel string parameter
	return value.replace(/'/g, "\\'");
};

/**
 * Safely constructs a pixel command with escaped parameters
 * @param command - The pixel command template with {paramName} placeholders
 * @param params - Object containing parameter values to escape and substitute
 * @returns The constructed pixel command with escaped parameters
 */
export const buildSafePixelCommand = (
	command: string,
	params: Record<string, string | number>,
): string => {
	let safeCommand = command;

	Object.entries(params).forEach(([key, value]) => {
		const escapedValue =
			typeof value === "string"
				? escapePixelString(value)
				: String(value);
		// Replace placeholder with escaped value
		safeCommand = safeCommand.replace(
			new RegExp(`\\{${key}\\}`, "g"),
			escapedValue,
		);
	});

	return safeCommand;
};
