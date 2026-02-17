/**
 * Converts a snake_case or space-separated string to Title Case
 *
 * @param str - The string to capitalize
 * @returns The capitalized string, or undefined if input is undefined
 */
export const capitalizeWords = (str: string | undefined) => {
	if (!str) return undefined;
	return str
		.toLowerCase() // Normalize to lowercase first
		.split(/[_\s]+/) // Split by underscores or spaces
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" "); // Join with spaces for better readability
};

/**
 * Converts a snake_case or space-separated string to Sentence case
 *
 * @param str - The string to convert
 * @returns The sentence case string, or undefined if input is undefined
 */
export const toSentenceCase = (str: string | undefined) => {
	if (!str) return undefined;
	const normalized = str.replace(/[_\s]+/g, " ").toLowerCase();
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};
