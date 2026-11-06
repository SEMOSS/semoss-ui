import { looksLikeHtmlDocument } from "@semoss/utility/markdown";

/** Removes markup from server-generated HTML error documents without changing plain-text errors. */
export function normalizeAutomationErrorMessage(value: string): string {
	if (!looksLikeHtmlDocument(value)) return value;
	return value
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
