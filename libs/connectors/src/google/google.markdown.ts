import {
	escapeInline,
	toDocument,
	toFieldLines,
	toTitle,
} from "../core/connector-markdown";
import { toMarkdownText } from "../core/connector-rich-text";
import type { GoogleDocContent } from "./google.types";

/**
 * A Google Doc's text with its paragraphs a blank line apart. `GoogleDocsRead`
 * ends each paragraph with a line break and writes a line break inside one
 * as a vertical tab.
 *
 * @param content - The text as the reactor read it.
 * @return The text, one paragraph after another.
 */
export const toGoogleDocText = (content: string): string =>
	content.replace(/\n/g, "\n\n").replace(/\v/g, "\n");

/**
 * A Google Doc's text as Markdown.
 *
 * @param doc - The document's title and text.
 * @param link - Where it opens, for the reader.
 * @return The document.
 */
export const googleDocToMarkdown = (
	doc: GoogleDocContent,
	link?: string,
): string =>
	toDocument([
		`# ${escapeInline(toTitle(doc.title, "Untitled document"))}`,
		toFieldLines([
			["Source", "Google Docs"],
			["Link", { link: link }],
		]),
		toMarkdownText(toGoogleDocText(doc.content)) ||
			"_This document has no text._",
	]);

/**
 * The file name a Google Doc is saved under.
 *
 * @param title - The document's title.
 * @return A Markdown file name.
 */
export const googleDocFileName = (title: string | undefined): string =>
	`Doc - ${toTitle(title, "Untitled")}.md`;
