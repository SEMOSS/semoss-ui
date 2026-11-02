/** Names whose words alone would not say what the tool does. */
const NAMED: Record<string, string> = {
	ShowItem: "Open beside chat",
};

/** Words kept as written rather than lowercased. */
const PROPER = new Set([
	"Python",
	"Teams",
	"Outlook",
	"OneDrive",
	"SharePoint",
	"PowerPoint",
	"Excel",
	"Word",
	"Microsoft",
]);

/**
 * A tool's title as words for the card: SearchMail -> "Search mail". A declared
 * title that already has spaces is kept, so tools that name themselves win.
 */
export function readableToolTitle(
	title: string | null | undefined,
	name: string,
): string {
	const raw = title?.trim() || name;
	if (NAMED[raw]) return NAMED[raw];
	if (/\s/.test(raw)) return raw;
	const words = raw
		.replaceAll("_", " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
		.split(/\s+/)
		.filter(Boolean);
	return words
		.map((word, index) =>
			index === 0
				? word[0].toUpperCase() + word.slice(1)
				: PROPER.has(word) || /^[A-Z0-9]+$/.test(word)
					? word
					: word.toLowerCase(),
		)
		.join(" ");
}
