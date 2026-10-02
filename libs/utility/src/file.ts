/** Extract a lowercase extension from a file name or path. */
export const getFileExtension = (value: string | undefined): string => {
	if (!value) return "";

	const fileName = value.split(/[?#]/, 1)[0].split(/[\\/]/).pop() ?? "";
	const dotIndex = fileName.lastIndexOf(".");
	if (dotIndex <= 0 || dotIndex === fileName.length - 1) return "";

	return fileName.slice(dotIndex + 1).toLowerCase();
};

/** Sanitize a filename stem while preserving case, dots, and underscores. */
export const slugifyFileName = (value: string): string =>
	value
		.trim()
		.replace(/[^A-Za-z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "");
