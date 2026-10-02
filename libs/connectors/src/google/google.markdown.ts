import { parseWallClock } from "@semoss/utility/date";
import { toPlainText } from "../core/connector.format";
import {
	escapeInline,
	toDocument,
	toFieldLines,
	toMomentText,
	toPerson,
	toTitle,
	toWhenText,
} from "../core/connector-markdown";
import { toMarkdownText } from "../core/connector-rich-text";
import type {
	GmailMessage,
	GoogleCalendarEvent,
	GoogleDocContent,
} from "./google.types";

/**
 * Addresses as an email header writes them, `"Name" <address>`, the way the
 * files write people: `Name (address)`.
 *
 * @param header - The header's value.
 * @return The people, or undefined when the header is empty.
 */
const toPeopleText = (header: string | undefined): string | undefined =>
	header
		?.replace(/\s*<([^<>\s]+@[^<>\s]+)>/g, " ($1)")
		.replace(/"([^"]*)"/g, "$1");

/**
 * A Gmail email as Markdown.
 *
 * @param message - The email, read with its text.
 * @return The document.
 */
export const gmailMessageToMarkdown = (message: GmailMessage): string =>
	toDocument([
		`# ${escapeInline(toTitle(message.subject, "(no subject)"))}`,
		toFieldLines([
			["Source", "Gmail email"],
			["From", toPeopleText(message.from)],
			["To", toPeopleText(message.to)],
			["Sent", toMomentText(message.sentDate)],
		]),
		toMarkdownText(message.content ? toPlainText(message.content) : "") ||
			"_This email has no text._",
	]);

/**
 * The file name a Gmail email is saved under.
 *
 * @param subject - The email's subject.
 * @return A Markdown file name.
 */
export const gmailMessageFileName = (subject: string | undefined): string =>
	`Email - ${toTitle(subject, "No subject")}.md`;

/**
 * A Google Calendar event as Markdown.
 *
 * @param event - The event, read with its details.
 * @return The document.
 */
export const googleEventToMarkdown = (event: GoogleCalendarEvent): string => {
	const guests = event.attendees
		.map((attendee) =>
			toPerson(
				undefined,
				attendee.email,
				attendee.responseStatus &&
					attendee.responseStatus !== "needsAction"
					? attendee.responseStatus
					: undefined,
			),
		)
		.filter(Boolean)
		.join("; ");
	return toDocument([
		`# ${escapeInline(toTitle(event.summary, "(no title)"))}`,
		toFieldLines([
			["Source", "Google Calendar event"],
			[
				"When",
				// the reactors read times in the user's zone, without an offset
				toWhenText(event.startTime, event.endTime, {
					read: parseWallClock,
				}),
			],
			["Repeats", event.frequency?.toLowerCase()],
			["Location", event.location],
			["Organizer", event.organizer],
			["Guests", guests],
			["Google Meet", { link: event.hangoutLink }],
			["Link", { link: event.htmlLink }],
		]),
		event.description
			? toMarkdownText(toPlainText(event.description))
			: undefined,
	]);
};

/**
 * The file name a Google Calendar event is saved under.
 *
 * @param summary - The event's title.
 * @return A Markdown file name.
 */
export const googleEventFileName = (summary: string | undefined): string =>
	`Event - ${toTitle(summary, "No title")}.md`;

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
