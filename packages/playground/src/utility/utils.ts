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
export const toSentenceCase = <T extends string | undefined>(
	str: T,
): T extends undefined ? undefined : string => {
	if (!str) return undefined as T extends undefined ? undefined : string;
	const normalized = str.replace(/[_\s]+/g, " ").toLowerCase();
	return (normalized.charAt(0).toUpperCase() +
		normalized.slice(1)) as T extends undefined ? undefined : string;
};

/**
 * Extracts the first and last initials from a name string`
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

export const formatTokens = (tokens: number | undefined): string => {
	if (tokens === undefined) return "0";
	if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
	if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
	return tokens.toString();
};

export const setFavicon = (href: string) => {
	// Remove existing icon links
	document
		.querySelectorAll(
			'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
		)
		.forEach((n) => {
			n.parentNode?.removeChild(n);
		});

	const link = document.createElement("link");
	link.rel = "icon";

	// Set MIME type when using SVG data URLs (helps some browsers)
	if (href.startsWith("data:image/svg+xml")) link.type = "image/svg+xml";
	if (href.startsWith("data:image/png")) link.type = "image/png";

	// Only cache-bust normal URLs, not data: URLs
	const finalHref = href.startsWith("data:")
		? href
		: `${href}${href.includes("?") ? "&" : "?"}v=${Date.now()}`;

	link.href = finalHref;
	document.head.appendChild(link);
};
