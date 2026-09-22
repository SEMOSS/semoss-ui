const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;

/** Convert an identifier into a human-readable title. */
export const humanizeIdentifier = (value: string): string =>
	value
		.replace(/[-.]/g, "_")
		.replace(/_/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/\s+/g, " ")
		.trim()
		.replace(
			/\S+/g,
			(word) => word.charAt(0).toUpperCase() + word.slice(1),
		);

/** Convert a label into a stable lowercase identifier. */
export const slugifyIdentifier = (value: string): string =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

/** Validate a provider/Python-compatible identifier against existing names. */
export const validateIdentifier = (
	value: string,
	taken: Set<string>,
	label: string,
): string | undefined => {
	const trimmed = value.trim();
	if (!trimmed) return `${label} is required`;
	if (!IDENTIFIER_PATTERN.test(trimmed)) {
		return `${label} must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens`;
	}
	if (taken.has(trimmed)) return `${label} "${trimmed}" is already in use`;
	return undefined;
};
