/** Split a string at its first period. */
export const splitAtPeriod = (
	value: string,
	side: "left" | "right" = "left",
): string => {
	const index = value.indexOf(".");
	if (index === -1) return value;
	return side === "left"
		? value.substring(0, index)
		: value.substring(index + 1);
};

/** Replace underscores with spaces and capitalize each resulting word. */
export const removeUnderscores = (value: string): string =>
	value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

/** Capitalize the first letter of every whitespace-separated word. */
export const toTitleCase = (value: string): string =>
	value.replace(
		/\w\S*/g,
		(word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
	);

/** Turn snake_case and camelCase metadata keys into display labels. */
export const metakeyToLabel = (value: string): string => {
	const spaced = value
		.replace(/_/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
		.replace(/\s+/g, " ")
		.trim();

	return spaced.replace(
		/\S+/g,
		(word) => word.charAt(0).toUpperCase() + word.slice(1),
	);
};

/** Capitalize the first character of a string. */
export const capitalizeFirstLetter = (value: string): string =>
	value.replace(/\w{1}/, (match) => match.toUpperCase());

/** Build initials from the first character of each word. */
export const buildInitials = (value: string): string =>
	value
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase())
		.join("");
