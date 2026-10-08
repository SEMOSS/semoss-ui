import {
	escapeInline,
	toDocument,
	toFieldLines,
	toMomentText,
	toPerson,
	toTitle,
} from "../core/connector-markdown";
import { toMarkdownText } from "../core/connector-rich-text";
import { getOwnText, normalizeMailSubject } from "./mail.threads";
import type { MailMessage } from "./mail.types";
import type { MailApp } from "./mail-apps";

/**
 * Said under a text the backend cut short.
 *
 * @param app - The mailbox it was read from.
 * @return The note.
 */
const truncatedNote = (app: MailApp): string =>
	`_The text above was cut short when it was read from ${app.sourceName}._`;

/**
 * @param addresses - Recipients' addresses.
 * @return The addresses as one line, or undefined when there are none.
 */
const toAddressLine = (addresses: string[]): string | undefined =>
	addresses.length > 0 ? addresses.join(", ") : undefined;

/**
 * An email as Markdown.
 *
 * @param app - The mailbox it was read from.
 * @param message - The email, read with its body.
 * @return The document.
 */
export const mailMessageToMarkdown = (
	app: MailApp,
	message: MailMessage,
): string =>
	toDocument([
		`# ${escapeInline(toTitle(message.subject, "(no subject)"))}`,
		toFieldLines([
			["Source", `${app.sourceName} email`],
			["From", toPerson(message.fromName, message.from)],
			["To", toAddressLine(message.to)],
			["Cc", toAddressLine(message.cc)],
			[
				"Received",
				toMomentText(message.receivedDate ?? message.sentDate),
			],
			[
				"Attachments",
				message.attachments
					.map((attachment) => attachment.name)
					.join(", "),
			],
		]),
		toMarkdownText(message.body ?? "") || "_This email has no text._",
		message.isBodyTruncated ? truncatedNote(app) : undefined,
	]);

/**
 * One email of a thread as a Markdown section, headed by its sender.
 *
 * @param app - The mailbox it was read from.
 * @param message - The email, read with its body.
 * @return The section.
 */
const mailMessageToSection = (app: MailApp, message: MailMessage): string => {
	// each section holds only its own text; the earlier emails it quotes are
	// sections of their own
	const own = getOwnText(message);
	return toDocument([
		`## ${escapeInline(toTitle(message.fromName ?? message.from, "Unknown sender"))}`,
		toFieldLines([
			// the heading names the sender; their address is said once
			["From", message.fromName ? message.from : undefined],
			["Sent", toMomentText(message.sentDate ?? message.receivedDate)],
			["To", toAddressLine(message.to)],
			["Cc", toAddressLine(message.cc)],
		]),
		toMarkdownText(own.text) || "_This email has no text._",
		own.isTruncated ? truncatedNote(app) : undefined,
	]).trimEnd();
};

/**
 * An email thread as Markdown, each email a section in the order it was
 * sent.
 *
 * @param app - The mailbox it was read from.
 * @param messages - The thread's emails, oldest first, read with their bodies.
 * @return The document.
 */
export const mailThreadToMarkdown = (
	app: MailApp,
	messages: MailMessage[],
): string => {
	const latest = messages[messages.length - 1];
	return toDocument([
		`# ${escapeInline(toTitle(normalizeMailSubject(latest?.subject), "(no subject)"))}`,
		toFieldLines([
			["Source", `${app.sourceName} email thread`],
			["Emails", String(messages.length)],
		]),
		...messages.map((message) => mailMessageToSection(app, message)),
	]);
};

/**
 * The file name an email is saved under.
 *
 * @param message - The email.
 * @return A Markdown file name.
 */
export const mailMessageFileName = (message: MailMessage): string =>
	`Email - ${toTitle(message.subject, "No subject")}.md`;

/**
 * The file name a thread is saved under.
 *
 * @param subject - The subject of any of the thread's emails.
 * @return A Markdown file name.
 */
export const mailThreadFileName = (subject: string | undefined): string =>
	`Email thread - ${toTitle(normalizeMailSubject(subject), "No subject")}.md`;
