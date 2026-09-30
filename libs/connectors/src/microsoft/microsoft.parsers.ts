import type {
	CalendarAttendee,
	CalendarEvent,
	MicrosoftDownload,
	MicrosoftDriveItem,
	OutlookAttachment,
	OutlookMailFolder,
	OutlookMessage,
	TeamsAttachment,
	TeamsChannel,
	TeamsChat,
	TeamsMessage,
	TeamsTeam,
} from "./microsoft.types";

/*
 * The Microsoft reactors return Graph data reshaped by the backend, with null
 * fields left out. Everything here is read defensively: an entry missing what
 * the viewers need is dropped, and a response of the wrong shape is an error.
 */

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
	typeof value === "string" && value.trim() !== "" ? value : undefined;

const readNumber = (value: unknown): number | undefined =>
	typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** What the backend writes where it cut a text short. */
const TRUNCATION_MARK = " ... [truncated]";

/**
 * A text the backend may have cut short, without the mark it leaves where it
 * cut: the viewers and saved files say so in their own words.
 *
 * @param value - The text as the backend returned it.
 * @param isTruncated - Whether the backend says it cut the text.
 * @return The text, or undefined when there is none.
 */
const readBody = (value: unknown, isTruncated: boolean): string | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}
	return isTruncated && value.endsWith(TRUNCATION_MARK)
		? value.slice(0, -TRUNCATION_MARK.length)
		: value;
};

const readList = (value: unknown): unknown[] =>
	Array.isArray(value) ? value : [];

/**
 * Parse each entry of a list, keeping those that parse.
 *
 * @param value - The raw list.
 * @param parse - Reads one entry, or returns null to drop it.
 * @return The parsed entries.
 */
const parseEach = <T>(
	value: unknown,
	parse: (entry: unknown) => T | null,
): T[] => {
	const parsed: T[] = [];
	for (const entry of readList(value)) {
		const item = parse(entry);
		if (item) {
			parsed.push(item);
		}
	}
	return parsed;
};

/**
 * The record a reactor returned, or an error naming what was expected.
 *
 * @param raw - The reactor's output.
 * @param what - What the response should hold, for the error.
 * @return The record.
 * @throws Error when the output is not an object.
 */
const requireRecord = (raw: unknown, what: string): RawRecord => {
	if (!isRecord(raw)) {
		throw new Error(`The response did not include ${what}.`);
	}
	return raw;
};

/**
 * A list a reactor returned, bare or under a key, or an error.
 *
 * @param raw - The reactor's output.
 * @param key - The key the list sits under, when it is wrapped.
 * @param what - What the response should hold, for the error.
 * @return The raw list.
 * @throws Error when there is no list.
 */
const requireList = (raw: unknown, key: string, what: string): unknown[] => {
	const list = Array.isArray(raw) ? raw : isRecord(raw) ? raw[key] : null;
	if (!Array.isArray(list)) {
		throw new Error(`The response did not include ${what}.`);
	}
	return list;
};

const parseDriveItem = (entry: unknown): MicrosoftDriveItem | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		name: readString(entry.name) ?? id,
		driveId: readString(entry.driveId),
		isFolder: entry.isFolder === true,
		size: readNumber(entry.size),
		mimeType: readString(entry.mimeType),
		childCount: readNumber(entry.childCount),
		webUrl: readString(entry.webUrl),
		path: readString(entry.path),
		lastModifiedDateTime: readString(entry.lastModifiedDateTime),
		lastModifiedBy: readString(entry.lastModifiedBy),
		sharedBy: readString(entry.sharedBy),
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
	const filePath = readString(record.filePath);
	if (!filePath) {
		throw new Error("The response did not include the saved file.");
	}
	return { filePath: filePath, name: readString(record.name) };
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

const parseMailFolder = (entry: unknown): OutlookMailFolder | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		name: readString(entry.name) ?? id,
		totalItemCount: readNumber(entry.totalItemCount),
	};
};

/**
 * The mail folders, from `MicrosoftOutlookListMailFolders`.
 *
 * @param raw - The reactor's output, `{ count, folders }`.
 * @return The folders.
 */
export const parseMailFolders = (raw: unknown): OutlookMailFolder[] =>
	parseEach(requireList(raw, "folders", "any folders"), parseMailFolder);

const parseMailAttachment = (entry: unknown): OutlookAttachment | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		name: readString(entry.name) ?? id,
		contentType: readString(entry.contentType),
		size: readNumber(entry.size),
		isInline: entry.isInline === true,
		isFile: entry.isFile === true,
	};
};

const parseMailMessage = (entry: unknown): OutlookMessage | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const uid = readString(entry.uid);
	if (!uid) {
		return null;
	}
	return {
		uid: uid,
		conversationId: readString(entry.conversationId),
		from: readString(entry.from),
		fromName: readString(entry.fromName),
		to: readString(entry.to),
		cc: readString(entry.cc),
		subject: readString(entry.subject),
		receivedDate: readString(entry.receivedDate),
		sentDate: readString(entry.sentDate),
		isUnread: entry.unread === true,
		hasAttachments: entry.hasAttachments === true,
		body: readBody(entry.body, entry.bodyTruncated === true),
		uniqueBody: readBody(
			entry.uniqueBody,
			entry.uniqueBodyTruncated === true,
		),
		isBodyTruncated: entry.bodyTruncated === true,
		isUniqueBodyTruncated: entry.uniqueBodyTruncated === true,
		attachments: parseEach(entry.attachments, parseMailAttachment),
	};
};

/**
 * The emails in a folder, from `MicrosoftOutlookListMail`.
 *
 * @param raw - The reactor's output, `{ folder, count, messages }`.
 * @return The emails, newest first.
 */
export const parseMailList = (raw: unknown): OutlookMessage[] =>
	parseEach(requireList(raw, "messages", "any messages"), parseMailMessage);

/**
 * One email, from `MicrosoftOutlookGetMail`.
 *
 * @param raw - The reactor's output.
 * @return The email with its body and attachments.
 * @throws Error when the response is not an email.
 */
export const parseMailMessageDetail = (raw: unknown): OutlookMessage => {
	const message = parseMailMessage(raw);
	if (!message) {
		throw new Error("The response did not include the message.");
	}
	return message;
};

const parseAttendee = (entry: unknown): CalendarAttendee | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const attendee = {
		address: readString(entry.address),
		name: readString(entry.name),
		type: readString(entry.type),
		response: readString(entry.response),
	};
	return attendee.address || attendee.name ? attendee : null;
};

const parseCalendarEvent = (entry: unknown): CalendarEvent | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		subject: readString(entry.subject),
		start: readString(entry.start),
		startTimeZone: readString(entry.startTimeZone),
		end: readString(entry.end),
		endTimeZone: readString(entry.endTimeZone),
		isAllDay: entry.isAllDay === true,
		location: readString(entry.location),
		organizer: readString(entry.organizer),
		organizerName: readString(entry.organizerName),
		attendees: parseEach(entry.attendees, parseAttendee),
		webLink: readString(entry.webLink),
		joinUrl: readString(entry.joinUrl),
		isOnlineMeeting: entry.isOnlineMeeting === true,
		isCancelled: entry.isCancelled === true,
		responseStatus: readString(entry.responseStatus),
		body: readBody(entry.body, entry.bodyTruncated === true),
		isBodyTruncated: entry.bodyTruncated === true,
	};
};

/**
 * The events in a window, from `MicrosoftCalendarListEvents`.
 *
 * @param raw - The reactor's output, `{ start, end, count, events }`.
 * @return The events, earliest first.
 */
export const parseCalendarEvents = (raw: unknown): CalendarEvent[] =>
	parseEach(requireList(raw, "events", "any events"), parseCalendarEvent);

/**
 * One event, from `MicrosoftCalendarGetEvent`.
 *
 * @param raw - The reactor's output.
 * @return The event with its body.
 * @throws Error when the response is not an event.
 */
export const parseCalendarEventDetail = (raw: unknown): CalendarEvent => {
	const event = parseCalendarEvent(raw);
	if (!event) {
		throw new Error("The response did not include the event.");
	}
	return event;
};

const parseTeam = (entry: unknown): TeamsTeam | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		displayName: readString(entry.displayName) ?? id,
		description: readString(entry.description),
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
	const id = readString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		displayName: readString(entry.displayName) ?? id,
		description: readString(entry.description),
		membershipType: readString(entry.membershipType),
		webUrl: readString(entry.webUrl),
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
		id: readString(entry.id),
		name: readString(entry.name),
		contentType: readString(entry.contentType),
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
	const id = readString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		replyToId: readString(entry.replyToId),
		messageType: readString(entry.messageType),
		subject: readString(entry.subject),
		createdDateTime: readString(entry.createdDateTime),
		isDeleted: entry.isDeleted === true,
		fromName: readString(entry.fromName),
		webUrl: readString(entry.webUrl),
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
	const id = readString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		chatType: readString(entry.chatType),
		displayName: readString(entry.displayName) ?? readString(entry.topic),
		lastUpdatedDateTime: readString(entry.lastUpdatedDateTime),
		webUrl: readString(entry.webUrl),
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
