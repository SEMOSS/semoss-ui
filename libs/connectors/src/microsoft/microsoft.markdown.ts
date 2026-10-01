import { parseGraphDate } from "../core/connector.format";
import {
	escapeInline,
	toDocument,
	toFieldLines,
	toMomentText,
	toPerson,
	toTextSnippet,
	toTitle,
	toWhenText,
} from "../core/connector-markdown";
import { toMarkdownText } from "../core/connector-rich-text";
import type {
	CalendarEvent,
	OutlookMessage,
	TeamsChannel,
	TeamsChat,
	TeamsMessage,
	TeamsTeam,
} from "./microsoft.types";
import {
	getOwnText,
	normalizeMailSubject,
} from "./outlook/outlook-mail.threads";

/** Said under a text the Microsoft reactors cut short. */
const TRUNCATED_NOTE =
	"_The text above was cut short when it was read from Microsoft 365._";

/**
 * An email as Markdown.
 *
 * @param message - The email, read with its body.
 * @return The document.
 */
export const outlookMessageToMarkdown = (message: OutlookMessage): string =>
	toDocument([
		`# ${escapeInline(toTitle(message.subject, "(no subject)"))}`,
		toFieldLines([
			["Source", "Outlook email"],
			["From", toPerson(message.fromName, message.from)],
			["To", message.to],
			["Cc", message.cc],
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
		message.isBodyTruncated ? TRUNCATED_NOTE : undefined,
	]);

/**
 * One email of a thread as a Markdown section, headed by its sender.
 *
 * @param message - The email, read with its body.
 * @return The section.
 */
const outlookMessageToSection = (message: OutlookMessage): string => {
	// each section holds only its own text; the earlier emails it quotes are
	// sections of their own
	const own = getOwnText(message);
	return toDocument([
		`## ${escapeInline(toTitle(message.fromName ?? message.from, "Unknown sender"))}`,
		toFieldLines([
			// the heading names the sender; their address is said once
			["From", message.fromName ? message.from : undefined],
			["Sent", toMomentText(message.sentDate ?? message.receivedDate)],
			["To", message.to],
			["Cc", message.cc],
		]),
		toMarkdownText(own.text) || "_This email has no text._",
		own.isTruncated ? TRUNCATED_NOTE : undefined,
	]).trimEnd();
};

/**
 * An email thread as Markdown, each email a section in the order it was
 * sent.
 *
 * @param messages - The thread's emails, oldest first, read with their bodies.
 * @return The document.
 */
export const outlookThreadToMarkdown = (messages: OutlookMessage[]): string => {
	const latest = messages[messages.length - 1];
	return toDocument([
		`# ${escapeInline(toTitle(normalizeMailSubject(latest?.subject), "(no subject)"))}`,
		toFieldLines([
			["Source", "Outlook email thread"],
			["Emails", String(messages.length)],
		]),
		...messages.map(outlookMessageToSection),
	]);
};

/**
 * A calendar event as Markdown.
 *
 * @param event - The event, read with its body.
 * @return The document.
 */
export const calendarEventToMarkdown = (event: CalendarEvent): string => {
	const attendees = event.attendees
		.map((attendee) =>
			toPerson(
				attendee.name,
				attendee.address,
				attendee.response && attendee.response !== "none"
					? attendee.response
					: undefined,
			),
		)
		.filter(Boolean)
		// names can hold commas, such as `Lovelace, Ada`
		.join("; ");

	return toDocument([
		`# ${escapeInline(toTitle(event.subject, "(no title)"))}`,
		toFieldLines([
			["Source", "Outlook calendar event"],
			["Status", event.isCancelled ? "Cancelled" : undefined],
			[
				"When",
				toWhenText(event.start, event.end, {
					read: (value) => parseGraphDate(value, event.startTimeZone),
					isAllDay: event.isAllDay,
					zone: event.startTimeZone,
				}),
			],
			["Location", event.location],
			["Organizer", toPerson(event.organizerName, event.organizer)],
			["Attendees", attendees],
			["Online meeting", { link: event.joinUrl }],
			["Link", { link: event.webLink }],
		]),
		event.body ? toMarkdownText(event.body) : undefined,
		event.isBodyTruncated ? TRUNCATED_NOTE : undefined,
	]);
};

/**
 * One Teams message as a Markdown section, headed by its author.
 *
 * @param message - The message.
 * @return The section.
 */
const teamsMessageToSection = (message: TeamsMessage): string => {
	const attachments = message.attachments
		.map((attachment) => attachment.name ?? attachment.id)
		.filter(Boolean)
		.join(", ");
	return toDocument([
		`## ${escapeInline(toTitle(message.fromName, "Someone"))}`,
		toFieldLines([["Sent", toMomentText(message.createdDateTime)]]),
		message.isDeleted
			? "_This message was deleted._"
			: toMarkdownText(message.body) || "_No text._",
		toFieldLines([["Attachments", attachments]]),
		message.isBodyTruncated ? TRUNCATED_NOTE : undefined,
	]).trimEnd();
};

/**
 * A channel thread, its first message and its replies, as Markdown.
 *
 * @param thread - The thread's first message, with its replies.
 * @param team - The team, when known.
 * @param channel - The channel, when known.
 * @return The document.
 */
export const teamsThreadToMarkdown = (
	thread: TeamsMessage,
	team?: TeamsTeam,
	channel?: TeamsChannel,
): string =>
	toDocument([
		`# ${escapeInline(toTitle(thread.subject, `Thread in ${channel?.displayName ?? "a Teams channel"}`))}`,
		toFieldLines([
			["Source", "Microsoft Teams channel thread"],
			["Team", team?.displayName],
			["Channel", channel?.displayName],
			["Replies", String(thread.replies.length)],
			["Link", { link: thread.webUrl }],
		]),
		teamsMessageToSection(thread),
		...thread.replies.map(teamsMessageToSection),
	]);

/**
 * A chat's messages, oldest first, as Markdown.
 *
 * @param chat - The chat.
 * @param messages - Its messages, oldest first.
 * @return The document.
 */
export const teamsChatToMarkdown = (
	chat: TeamsChat,
	messages: TeamsMessage[],
): string =>
	toDocument([
		`# ${escapeInline(toTitle(chat.displayName, "Teams chat"))}`,
		toFieldLines([
			["Source", "Microsoft Teams chat"],
			["Messages", String(messages.length)],
			["Link", { link: chat.webUrl }],
		]),
		...messages.map(teamsMessageToSection),
	]);

/**
 * The file name an email is saved under.
 *
 * @param message - The email.
 * @return A Markdown file name.
 */
export const outlookMessageFileName = (message: OutlookMessage): string =>
	`Email - ${toTitle(message.subject, "No subject")}.md`;

/**
 * The file name a thread is saved under.
 *
 * @param subject - The subject of any of the thread's emails.
 * @return A Markdown file name.
 */
export const outlookThreadFileName = (subject: string | undefined): string =>
	`Email thread - ${toTitle(normalizeMailSubject(subject), "No subject")}.md`;

/**
 * The file name an event is saved under.
 *
 * @param event - The event.
 * @return A Markdown file name.
 */
export const calendarEventFileName = (event: CalendarEvent): string =>
	`Event - ${toTitle(event.subject, "No title")}.md`;

/**
 * The file name a channel thread is saved under.
 *
 * @param thread - The thread's first message.
 * @param channel - The channel, when known.
 * @return A Markdown file name.
 */
export const teamsThreadFileName = (
	thread: TeamsMessage,
	channel?: TeamsChannel,
): string =>
	`Teams - ${toTitle(channel?.displayName, "Channel")} - ${toTitle(thread.subject ?? toTextSnippet(thread.body, 40), "Thread")}.md`;

/**
 * The file name a chat is saved under.
 *
 * @param chat - The chat.
 * @return A Markdown file name.
 */
export const teamsChatFileName = (chat: TeamsChat): string =>
	`Chat - ${toTitle(chat.displayName, "Teams chat")}.md`;

/**
 * How a Teams message reads in a list: its subject, or the start of its text.
 *
 * @param message - The message.
 * @param length - How many characters of text to keep.
 * @return The title, or an empty string when there is nothing to show.
 */
export const teamsMessageTitle = (
	message: TeamsMessage,
	length = 120,
): string => message.subject?.trim() || toTextSnippet(message.body, length);
