/** Names whose words alone would not say what the tool does. */
const NAMED: Record<string, string> = {
	ShowItem: "Open Beside Chat",
};

/** Short joining words stay lowercase inside a title. */
const SMALL = new Set([
	"a",
	"an",
	"and",
	"as",
	"at",
	"by",
	"for",
	"in",
	"of",
	"on",
	"or",
	"the",
	"to",
]);

/**
 * A tool's title in Title Case for the card: SearchMail -> "Search Mail",
 * ListM365Mail -> "List M365 Mail". Words with a digit read as codes (M365).
 */
export function readableToolTitle(
	title: string | null | undefined,
	name: string,
): string {
	const raw = title?.trim() || name;
	if (NAMED[raw]) return NAMED[raw];
	const words = raw
		.replaceAll("_", " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
		// product names stay one word
		.replace(
			/\b(One) (Drive)\b|\b(Share) (Point)\b|\b(Power) (Point)\b/g,
			(match) => match.replace(" ", ""),
		)
		.split(/\s+/)
		.filter(Boolean);
	return words
		.map((word, index) => {
			if (/\d/.test(word)) return word.toUpperCase();
			if (index > 0 && SMALL.has(word.toLowerCase()))
				return word.toLowerCase();
			return word[0].toUpperCase() + word.slice(1);
		})
		.join(" ");
}
