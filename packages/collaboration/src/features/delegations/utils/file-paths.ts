/**
 * Read the files a delegation tool call attached. Canonical is ["a.md"]; models
 * also send [{ path: "a.md" }] and { "a.md": "a.md" }. Paths are room-relative.
 */
export function filePaths(value: unknown): string[] {
	const items: unknown[] = Array.isArray(value)
		? value
		: value && typeof value === "object"
			? Object.values(value)
			: [value];
	return items.flatMap((item) => {
		const path =
			item && typeof item === "object" && "path" in item
				? (item as { path: unknown }).path
				: item;
		if (typeof path !== "string") return [];
		const trimmed = path.trim().replace(/^[/\\]+/, "");
		return trimmed ? [trimmed] : [];
	});
}
