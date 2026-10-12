import {
	escapeInline,
	toDocument,
	toFieldLines,
	toMomentText,
	toTextSnippet,
	toTitle,
} from "../core/connector-markdown";
import { toMarkdownText } from "../core/connector-rich-text";
import type {
	TeamsChannel,
	TeamsChat,
	TeamsMessage,
	TeamsTeam,
} from "./microsoft.types";

/** Said under a text the Microsoft reactors cut short. */
const TRUNCATED_NOTE =
	"_The text above was cut short when it was read from Microsoft 365._";

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
