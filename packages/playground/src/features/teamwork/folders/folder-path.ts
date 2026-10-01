/** The deepest path, in segments, a work folder tool may address. */
const MAX_PATH_SEGMENTS = 64;

/** Characters a glob treats as literal text but a RegExp would not. */
const REGEXP_SPECIAL_CHARACTERS = /[.+^${}()|[\]\\]/g;

/**
 * A path the work folder refuses: one that climbs out of the folder root,
 * carries control characters, or nests absurdly deep. Raised with a message
 * written for the model, which reads it back as the tool result.
 */
export class FolderPathError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FolderPathError";
	}
}

/**
 * Whether a string carries a control character, which no file name should.
 *
 * @param value - The string to check.
 * @return True when any character is below U+0020 or is U+007F.
 */
const hasControlCharacter = (value: string): boolean => {
	for (let index = 0; index < value.length; index++) {
		const code = value.charCodeAt(index);
		if (code < 0x20 || code === 0x7f) {
			return true;
		}
	}
	return false;
};

/**
 * Normalize a path handed to a work folder tool.
 *
 * Accepts `/` or `\` separators and ignores leading, trailing, and repeated
 * separators and `.` segments, so `/reports/./q3/` and `reports\q3` both
 * become `reports/q3`. The root is `""`. A `..` segment is refused rather than
 * resolved: the folder root is the boundary, and resolving `a/../b` quietly
 * would make a path that looks contained mean something else.
 *
 * @param input - The path as the model or the UI wrote it.
 * @return The path relative to the folder root, without leading or trailing slashes.
 * @throws FolderPathError when the path is not a string or is not allowed.
 */
export const normalizeFolderPath = (input: unknown): string => {
	if (input === undefined || input === null) {
		return "";
	}
	if (typeof input !== "string") {
		throw new FolderPathError("Paths must be strings.");
	}
	if (hasControlCharacter(input)) {
		throw new FolderPathError("Paths cannot contain control characters.");
	}

	const segments = input
		.trim()
		.split(/[/\\]+/)
		.filter((segment) => segment.length > 0 && segment !== ".");

	if (segments.some((segment) => segment === "..")) {
		throw new FolderPathError(
			`The path ${input} leaves the work folder. Use a path inside the folder, relative to its root.`,
		);
	}
	if (segments.length > MAX_PATH_SEGMENTS) {
		throw new FolderPathError("The path is nested too deeply.");
	}

	return segments.join("/");
};

/**
 * Split a normalized path into its segments. The root has none.
 *
 * @param path - A normalized path.
 * @return The path's segments, in order.
 */
export const splitFolderPath = (path: string): string[] =>
	path ? path.split("/") : [];

/**
 * Join normalized paths, skipping empty ones so the root disappears.
 *
 * @param parts - Normalized paths to join.
 * @return The joined path.
 */
export const joinFolderPath = (...parts: string[]): string =>
	parts.filter((part) => part.length > 0).join("/");

/**
 * The directory holding an entry. The root's parent is the root.
 *
 * @param path - A normalized path.
 * @return The parent's normalized path.
 */
export const getParentFolderPath = (path: string): string => {
	const segments = splitFolderPath(path);
	return segments.slice(0, -1).join("/");
};

/**
 * The last segment of a path, which is the entry's own name.
 *
 * @param path - A normalized path.
 * @return The entry's name, or `""` for the root.
 */
export const getFolderPathName = (path: string): string => {
	const segments = splitFolderPath(path);
	return segments[segments.length - 1] ?? "";
};

/**
 * Whether `path` is `ancestor` or sits somewhere beneath it.
 *
 * @param path - A normalized path.
 * @param ancestor - A normalized directory path.
 * @return True when `path` is inside `ancestor`.
 */
export const isWithinFolderPath = (path: string, ancestor: string): boolean =>
	ancestor === "" || path === ancestor || path.startsWith(`${ancestor}/`);

/**
 * Build a case-insensitive matcher for file and folder names.
 *
 * A query with `*` or `?` is a glob matched against the whole name, so `*.md`
 * finds Markdown files. Anything else matches as a substring, so `budget`
 * finds `2026 Budget.xlsx`.
 *
 * @param query - What the user or the model is looking for.
 * @return A predicate over entry names.
 */
export const createNameMatcher = (
	query: string,
): ((name: string) => boolean) => {
	const needle = query.trim().toLowerCase();
	if (!needle) {
		return () => true;
	}

	if (!/[*?]/.test(needle)) {
		return (name) => name.toLowerCase().includes(needle);
	}

	const pattern = needle
		.replace(REGEXP_SPECIAL_CHARACTERS, "\\$&")
		.replace(/\*/g, ".*")
		.replace(/\?/g, ".");
	const expression = new RegExp(`^${pattern}$`, "i");
	return (name) => expression.test(name);
};
