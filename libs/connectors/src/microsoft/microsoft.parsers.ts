import { isRecord } from "@semoss/utility/object";
import { readNonBlankString } from "@semoss/utility/text";
import { parseGraphDate } from "../core/connector.format";
import {
	parseEach,
	readBody,
	readNumber,
	requireList,
	requireRecord,
} from "../core/connector-parse";
import type {
	MicrosoftDownload,
	MicrosoftDriveItem,
	TeamsAttachment,
	TeamsChannel,
	TeamsChat,
	TeamsMessage,
	TeamsTeam,
} from "./microsoft.types";

/*
 * The Microsoft reactors return Graph data reshaped by the backend, read with
 * the shared connector parsers.
 */

const parseDriveItem = (entry: unknown): MicrosoftDriveItem | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readNonBlankString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		name: readNonBlankString(entry.name) ?? id,
		driveId: readNonBlankString(entry.driveId),
		isFolder: entry.isFolder === true,
		size: readNumber(entry.size),
		mimeType: readNonBlankString(entry.mimeType),
		childCount: readNumber(entry.childCount),
		webUrl: readNonBlankString(entry.webUrl),
		path: readNonBlankString(entry.path),
		lastModifiedDateTime: readNonBlankString(entry.lastModifiedDateTime),
		lastModifiedBy: readNonBlankString(entry.lastModifiedBy),
		sharedBy: readNonBlankString(entry.sharedBy),
	};
};

/**
 * Folders first, then by name, with numbers compared as numbers.
 *
 * @param items - Items to sort; not mutated.
 * @return A sorted copy.
 */
const sortDriveItems = (items: MicrosoftDriveItem[]): MicrosoftDriveItem[] =>
	[...items].sort((a, b) => {
		if (a.isFolder !== b.isFolder) {
			return a.isFolder ? -1 : 1;
		}
		return a.name.localeCompare(b.name, undefined, {
			numeric: true,
			sensitivity: "base",
		});
	});

/**
 * The items of a OneDrive listing: `MicrosoftOneDriveListFiles`,
 * `MicrosoftOneDriveListSharedFiles`, or `MicrosoftOneDriveSearchFiles`.
 *
 * @param raw - The reactor's output, `{ count, files }`.
 * @return The items, folders first when listing a folder.
 */
export const parseOneDriveFolder = (raw: unknown): MicrosoftDriveItem[] =>
	sortDriveItems(
		parseEach(requireList(raw, "files", "any files"), parseDriveItem),
	);

/**
 * The items of a search or of what is shared, in the order the backend ranked
 * them.
 *
 * @param raw - The reactor's output, `{ count, files }`.
 * @return The items.
 */
export const parseOneDriveResults = (raw: unknown): MicrosoftDriveItem[] =>
	parseEach(requireList(raw, "files", "any files"), parseDriveItem);

/**
 * The items of a Teams channel folder, from `MicrosoftTeamsListFiles`.
 *
 * @param raw - The reactor's output, a bare list.
 * @return The items, folders first.
 */
export const parseTeamsFolder = (raw: unknown): MicrosoftDriveItem[] =>
	sortDriveItems(
		parseEach(requireList(raw, "files", "any files"), parseDriveItem),
	);

/**
 * Where a download reactor saved a file.
 *
 * @param raw - The output of a `Microsoft*Download*` reactor.
 * @return The saved file.
 * @throws Error when the response names no file.
 */
export const parseMicrosoftDownload = (raw: unknown): MicrosoftDownload => {
	const record = requireRecord(raw, "the saved file");
	const filePath = readNonBlankString(record.filePath);
	if (!filePath) {
		throw new Error("The response did not include the saved file.");
	}
	return { filePath: filePath, name: readNonBlankString(record.name) };
};

/**
 * Where a Microsoft download reactor saved its file, for a download save.
 *
 * @param raw - The reactor's output.
 * @return The file's path, relative to the insight's folder.
 * @throws Error when the output does not say where the file is.
 */
export const readMicrosoftSavedPath = (raw: unknown): string =>
	parseMicrosoftDownload(raw).filePath;

const parseTeam = (entry: unknown): TeamsTeam | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readNonBlankString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		displayName: readNonBlankString(entry.displayName) ?? id,
		description: readNonBlankString(entry.description),
	};
};

/**
 * The teams the user belongs to, from `MicrosoftTeamsListTeams`, by name.
 *
 * @param raw - The reactor's output, a bare list.
 * @return The teams.
 */
export const parseTeams = (raw: unknown): TeamsTeam[] =>
	parseEach(requireList(raw, "teams", "any teams"), parseTeam).sort((a, b) =>
		a.displayName.localeCompare(b.displayName, undefined, {
			sensitivity: "base",
		}),
	);

const parseChannel = (entry: unknown): TeamsChannel | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readNonBlankString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		displayName: readNonBlankString(entry.displayName) ?? id,
		description: readNonBlankString(entry.description),
		membershipType: readNonBlankString(entry.membershipType),
		webUrl: readNonBlankString(entry.webUrl),
	};
};

/**
 * A team's channels, from `MicrosoftTeamsListChannels`, in the team's order.
 *
 * @param raw - The reactor's output, a bare list.
 * @return The channels.
 */
export const parseChannels = (raw: unknown): TeamsChannel[] =>
	parseEach(requireList(raw, "channels", "any channels"), parseChannel);

const parseTeamsAttachment = (entry: unknown): TeamsAttachment | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const attachment = {
		id: readNonBlankString(entry.id),
		name: readNonBlankString(entry.name),
		contentType: readNonBlankString(entry.contentType),
		isFile: entry.isFile === true,
	};
	return attachment.id || attachment.name ? attachment : null;
};

/**
 * Oldest first, by when each message was written.
 *
 * @param messages - Messages to sort; not mutated.
 * @return A sorted copy.
 */
const sortOldestFirst = (messages: TeamsMessage[]): TeamsMessage[] =>
	[...messages].sort((a, b) =>
		(a.createdDateTime ?? "").localeCompare(b.createdDateTime ?? ""),
	);

const parseTeamsMessage = (entry: unknown): TeamsMessage | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readNonBlankString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		replyToId: readNonBlankString(entry.replyToId),
		messageType: readNonBlankString(entry.messageType),
		subject: readNonBlankString(entry.subject),
		createdDateTime: readNonBlankString(entry.createdDateTime),
		isDeleted: entry.isDeleted === true,
		fromName: readNonBlankString(entry.fromName),
		webUrl: readNonBlankString(entry.webUrl),
		body: readBody(entry.body, entry.bodyTruncated === true) ?? "",
		isBodyTruncated: entry.bodyTruncated === true,
		attachments: parseEach(entry.attachments, parseTeamsAttachment),
		replyCount: readNumber(entry.replyCount),
		replies: sortOldestFirst(parseEach(entry.replies, parseTeamsMessage)),
	};
};

/**
 * Whether a message is something a person wrote, rather than a system event
 * such as a member joining.
 *
 * @param message - The message.
 * @return True for a person's message.
 */
const isPersonMessage = (message: TeamsMessage): boolean =>
	!message.messageType || message.messageType === "message";

/**
 * The messages a Teams read found, and how many it read. System events such
 * as a member joining are left out of the messages but counted, so a caller
 * can tell whether the read stopped at its limit.
 */
export interface TeamsMessagePage {
	messages: TeamsMessage[];
	/** How many messages the backend returned, system events included. */
	readCount: number;
}

/**
 * The messages of a Teams read, people's messages only.
 *
 * @param raw - The reactor's output, with its messages under `messages`.
 * @return The messages, oldest first, and how many were read.
 */
const parseMessagePage = (raw: unknown): TeamsMessagePage => {
	const read = parseEach(
		requireList(raw, "messages", "any messages"),
		parseTeamsMessage,
	);
	return {
		messages: sortOldestFirst(read.filter(isPersonMessage)),
		readCount: read.length,
	};
};

/**
 * The threads of a channel, from `MicrosoftTeamsListChannelMessages`.
 *
 * @param raw - The reactor's output, `{ teamId, channelId, count, messages }`.
 * @return The threads' first messages, newest first, each with its replies,
 * and how many were read.
 */
export const parseChannelMessages = (raw: unknown): TeamsMessagePage => {
	const page = parseMessagePage(raw);
	return { ...page, messages: [...page.messages].reverse() };
};

const parseChat = (entry: unknown): TeamsChat | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readNonBlankString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		chatType: readNonBlankString(entry.chatType),
		displayName:
			readNonBlankString(entry.displayName) ??
			readNonBlankString(entry.topic),
		// Graph can return year 0001 as an unset last-updated timestamp.
		lastUpdatedDateTime:
			(parseGraphDate(
				readNonBlankString(entry.lastUpdatedDateTime),
			)?.getUTCFullYear() ?? 0) > 1
				? readNonBlankString(entry.lastUpdatedDateTime)
				: undefined,
		webUrl: readNonBlankString(entry.webUrl),
		hasUnread: entry.hasUnread === true,
		lastMessage: parseTeamsMessage(entry.lastMessage) ?? undefined,
	};
};

/**
 * The user's chats, from `MicrosoftTeamsListChats`.
 *
 * @param raw - The reactor's output, `{ count, chats }`.
 * @return The chats, most recently active first.
 */
export const parseChats = (raw: unknown): TeamsChat[] =>
	parseEach(requireList(raw, "chats", "any chats"), parseChat).sort((a, b) =>
		(b.lastUpdatedDateTime ?? "").localeCompare(
			a.lastUpdatedDateTime ?? "",
		),
	);

/**
 * The messages of a chat, from `MicrosoftTeamsListChatMessages`.
 *
 * @param raw - The reactor's output, `{ chatId, count, messages }`.
 * @return The messages people wrote, oldest first, and how many were read.
 */
export const parseChatMessages = (raw: unknown): TeamsMessagePage =>
	parseMessagePage(raw);
