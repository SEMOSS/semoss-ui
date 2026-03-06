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

/**
 * Extracts the first and last initials from a name string
 *
 * Splits the name by whitespace and takes the first letter of the first word
 * and the first letter of the last word. Apostrophes and hyphens are treated
 * as part of the word.
 *
 * @param str - The name string to extract initials from
 * @returns The initials in uppercase (1-2 characters), or undefined if input is undefined
 *
 * @example
 * toInitials("John Doe") // "JD"
 * toInitials("Jane Mary Smith") // "JS" (first and last only)
 * toInitials("Bob") // "B" (single name)
 */
export const toInitials = (str: string | undefined) => {
	if (!str) return undefined;
	const words = str.trim().split(/\s+/);
	if (words.length === 1) {
		return words[0].charAt(0).toUpperCase();
	}
	return (
		words[0].charAt(0) + words[words.length - 1].charAt(0)
	).toUpperCase();
};

/**
 * Formats a UTC datetime string (from the API) into a human-readable local time.
 * The API returns timestamps as "YYYY-MM-DD HH:MM:SS" with no timezone suffix,
 * so we append "Z" to treat them as UTC before converting to local time.
 *
 * @param dateStr - UTC datetime string from the API
 * @returns Formatted local datetime string, or the original string if parsing fails
 */
export const formatDateTime = (dateStr: string): string => {
	const d = new Date(`${dateStr.replace(" ", "T")}Z`);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
};
