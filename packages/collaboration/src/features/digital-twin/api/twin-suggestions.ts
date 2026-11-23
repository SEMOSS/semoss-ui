import type { MicrosoftItemRef } from "@semoss/connectors";
import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** The most the server takes of what the owner asks for. */
export const TWIN_SUGGESTION_PROMPT_MAX = 1000;

const suggestionSchema = z.object({
	kind: z.enum(["email", "chat", "file"]),
	// what its place reads it by: an email's thread, a chat, or a drive item
	id: z.string().min(1),
	// the drive a file is in; left out for the owner's own
	driveId: z.string().optional(),
	title: z.string(),
	from: z.string(),
	date: z.string(),
	preview: z.string(),
	reason: z.string(),
	// whose picture goes with it, where the server knows: an email's sender, or who a one on one chat is with
	person: z
		.object({ email: z.string().optional(), userId: z.string().optional() })
		.optional(),
});
const suggestionsSchema = z.object({
	suggestions: z.array(suggestionSchema),
	notes: z.array(z.string()),
});

/** An email, Teams chat or file suggested for a twin, with why it fits. */
export type TwinSuggestion = z.infer<typeof suggestionSchema>;

/** What narrows a search for a twin's knowledge; left out, everything is searched. */
export interface TwinSuggestionFilters {
	/** The kinds to look for: only their places are searched. All three when left out. */
	kinds?: TwinSuggestion["kind"][];
	/** How many days back to look; any time when left out. */
	sinceDays?: number;
}

/** What a search for a twin's knowledge found. */
export interface TwinSuggestions {
	/** The items that fit, the best first. */
	suggestions: TwinSuggestion[];
	/** One for each of Outlook, Teams chats and OneDrive that could not be searched, or was searched only in part. */
	notes: string[];
}

/**
 * Ask the server which of the owner's own emails, Teams chats and files fit
 * what they want their twin to know. It searches their Outlook mailbox, Teams
 * chats and OneDrive with their own sign-in, and a model keeps what fits.
 * Nothing is copied: the owner adds the ones they want.
 *
 * @param prompt - What the twin should know, in the owner's words.
 * @param filters - The kinds to look for and how far back, when the owner narrowed the search.
 * @throws when the owner is not signed in to Microsoft 365, when none of the
 * three could be searched, or when the model did not answer.
 */
// shortcut: one ordinary request, so a search slower than the load balancer allows fails; run it as a job the page polls if that shows up
export function suggestTwinKnowledge(
	actions: InsightActions,
	prompt: string,
	filters: TwinSuggestionFilters = {},
): Promise<TwinSuggestions> {
	return callPixel(
		actions,
		pixel("WorkSuggestTwinKnowledge", { prompt, ...filters }),
		suggestionsSchema,
	);
}

/** A suggestion as the item its own viewer would save. */
export function toMicrosoftItem(suggestion: TwinSuggestion): MicrosoftItemRef {
	switch (suggestion.kind) {
		case "email":
			return {
				kind: "email",
				conversationId: suggestion.id,
				subject: suggestion.title || undefined,
			};
		case "chat":
			return { kind: "chat", chatId: suggestion.id };
		default:
			return {
				kind: "file",
				itemId: suggestion.id,
				driveId: suggestion.driveId,
				name: suggestion.title || "File",
			};
	}
}
