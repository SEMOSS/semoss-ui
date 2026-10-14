import type { MailMessage } from "./mail.types";

/**
 * The prefixes mail clients put in front of a subject when replying or
 * forwarding, in the languages mail apps commonly use: `Re:`, `Fwd:`, `AW:`,
 * `WG:`, `SV:`, `TR:`, `RV:`, and `Antw:`, optionally numbered as `Re[2]:`.
 */
const REPLY_PREFIX =
	/^\s*(?:re|fw|fwd|aw|wg|sv|tr|rv|antw)\s*(?:\[\d+\])?\s*:\s*/i;

/**
 * A subject without the reply and forward prefixes, so every email of a
 * thread shows the same title.
 *
 * @param subject - The email's subject.
 * @return The subject as the thread started it, or an empty string.
 */
export const normalizeMailSubject = (subject: string | undefined): string => {
	let current = (subject ?? "").trim();
	// a prefix can repeat, as in `RE: FW: RE: Budget`
	for (let pass = 0; pass < 10; pass++) {
		const next = current.replace(REPLY_PREFIX, "");
		if (next === current) {
			break;
		}
		current = next;
	}
	return current;
};

/**
 * When an email arrived, or was sent when there is no arrival time, for
 * ordering. The reactors' timestamps are all UTC and so compare as text.
 *
 * @param message - The email.
 * @return The timestamp, or an empty string.
 */
const getMailDate = (message: MailMessage): string =>
	message.receivedDate ?? message.sentDate ?? "";

/** The emails of one thread, as a folder's list shows them. */
export interface MailConversation {
	/** Identifies the thread in the list. */
	key: string;
	/** Ties the thread together across folders, when the backend reports it. */
	conversationId?: string;
	/** The thread's emails in this folder, newest first. */
	messages: MailMessage[];
	/** The newest of them. */
	latest: MailMessage;
	/** Whether any of them is unread. */
	isUnread: boolean;
	/** Whether any of them has attachments. */
	hasAttachments: boolean;
}

/**
 * Group a folder's emails into threads by conversation. The emails come
 * newest first, so each thread is listed where its newest email is. An email
 * without a conversation stays on its own, as every email does when the
 * grouping is turned off.
 *
 * @param messages - The folder's emails, newest first.
 * @param isGrouped - Whether a thread's emails share a row.
 * @return The threads, newest first.
 */
export const groupMailByConversation = (
	messages: MailMessage[],
	isGrouped = true,
): MailConversation[] => {
	const groups = new Map<string, MailMessage[]>();
	for (const message of messages) {
		const key =
			isGrouped && message.conversationId
				? `conversation:${message.conversationId}`
				: `message:${message.id}`;
		const group = groups.get(key);
		if (group) {
			group.push(message);
		} else {
			groups.set(key, [message]);
		}
	}

	const conversations: MailConversation[] = [];
	for (const [key, grouped] of groups) {
		// a search comes back in relevance order, so the newest is found by date
		const newestFirst = sortMailOldestFirst(grouped).reverse();
		const latest = newestFirst[0];
		conversations.push({
			key: key,
			conversationId: isGrouped ? latest.conversationId : undefined,
			messages: newestFirst,
			latest: latest,
			isUnread: grouped.some((message) => message.isUnread),
			hasAttachments: grouped.some((message) => message.hasAttachments),
		});
	}
	return conversations.sort((a, b) =>
		getMailDate(b.latest).localeCompare(getMailDate(a.latest)),
	);
};

/**
 * A thread's emails oldest first, the order it is read in.
 *
 * @param messages - The emails; not mutated.
 * @return A sorted copy.
 */
export const sortMailOldestFirst = (messages: MailMessage[]): MailMessage[] =>
	[...messages].sort((a, b) => getMailDate(a).localeCompare(getMailDate(b)));

/**
 * The emails of one thread from a conversation read, oldest first. Anything
 * that does not belong to the thread is dropped, in case the backend answered
 * with a folder listing instead.
 *
 * @param messages - The emails the backend returned.
 * @param conversationId - The thread.
 * @return The thread's emails, oldest first.
 */
export const selectThread = (
	messages: MailMessage[],
	conversationId: string,
): MailMessage[] =>
	sortMailOldestFirst(
		messages.filter((message) => message.conversationId === conversationId),
	);

/**
 * Where the history an email quotes begins, in the forms mail clients write
 * it: Outlook's separator and reply header, `-----Original Message-----`, and
 * `On ... wrote:`. The backend may join an email's lines, so Outlook's header
 * is also found in the middle of a line.
 */
const QUOTED_HISTORY_MARKERS = [
	/^_{10,}\s*$/m,
	/^-{2,}\s*Original Message\s*-{2,}/im,
	/^From:[^\n]*\n(?:[^\n]*\n)?(?:Sent|Date):/im,
	/^On [^\n]{4,200} wrote:\s*$/im,
	/\sFrom: [^\n]{1,200}? Sent: [^\n]{1,100}? To: /,
];

/**
 * An email's text without the earlier emails it quotes, found by the markers
 * mail clients put above quoted history.
 *
 * @param text - The whole text.
 * @return The text before the history, or the whole text when it has none.
 */
export const stripQuotedHistory = (text: string): string => {
	let cut = text.length;
	for (const marker of QUOTED_HISTORY_MARKERS) {
		const found = marker.exec(text);
		if (found && found.index < cut) {
			cut = found.index;
		}
	}
	const own = text.slice(0, cut).trim();
	return own || text.trim();
};

/** An email's own text, and whether the backend cut it short. */
export interface OwnText {
	text: string;
	isTruncated: boolean;
}

/**
 * What an email adds to its thread: the unique body the backend reports for a
 * thread read, or else the text with any quoted history cut off.
 *
 * @param message - The email.
 * @return Its own text.
 */
export const getOwnText = (message: MailMessage): OwnText => {
	const unique = message.uniqueBody?.trim();
	if (unique) {
		return { text: unique, isTruncated: !!message.isUniqueBodyTruncated };
	}
	const body = (message.body ?? "").trim();
	const own = stripQuotedHistory(body);
	// a body is cut at its end, which is the quoted history when it has one
	return { text: own, isTruncated: message.isBodyTruncated && own === body };
};
