import { z } from "@semoss/ui/next";

/** One clue per line, with the same case-insensitive limits as the saved profile. */
export function topicClues(text: string): string[] {
	const unique = new Map<string, string>();
	for (const line of text.split(/\r\n|[\n\v\f\r\u0085\u2028\u2029]/)) {
		const term = line.trim();
		if (term)
			unique.set(
				term.toLowerCase(),
				unique.get(term.toLowerCase()) ?? term,
			);
	}
	return [...unique.values()];
}

export const topicCluesSchema = z
	.string()
	.max(4000, "Use at most 4,000 characters of topic clues")
	.superRefine((text, context) => {
		const clues = topicClues(text);
		if (clues.some((clue) => clue.length > 200))
			context.addIssue({
				code: "custom",
				message: "Each topic clue must fit in 200 characters",
			});
		if (clues.length > 50)
			context.addIssue({
				code: "custom",
				message: "Use at most 50 topic clues",
			});
	});
