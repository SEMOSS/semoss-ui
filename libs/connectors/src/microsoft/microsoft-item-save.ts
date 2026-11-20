import type { ConnectorSavedFile } from "../core/connector.types";
import { saveToInsight } from "../core/connector-files";
import { runConnectorPixel } from "../core/connector-pixel";
import {
	mailThreadFileName,
	mailThreadToMarkdown,
} from "../mail/mail.markdown";
import {
	parseMailMessageDetail,
	readMailSavedPath,
} from "../mail/mail.parsers";
import { mailSaveKey } from "../mail/mail.threads";
import { MAIL_APPS } from "../mail/mail-apps";
import { readConversation } from "../mail/mail-thread-view";
import { teamsChatFileName, teamsChatToMarkdown } from "./microsoft.markdown";
import {
	parseChatDetail,
	parseChatMessages,
	readMicrosoftSavedPath,
} from "./microsoft.parsers";
import { MICROSOFT_PIXELS } from "./microsoft.pixels";
import { CHAT_MESSAGE_LIMIT } from "./teams/teams-chat-detail";

/**
 * One of the user's own Microsoft 365 items, named by the ids its reactors
 * read it with, for a host that found it some other way than in a viewer's
 * list, such as a search of its own.
 */
export type MicrosoftItemRef =
	| {
			kind: "email";
			/** The email's thread: a save takes the whole thread. */
			conversationId: string;
			/** The thread's subject, for the saved file's name. */
			subject?: string;
	  }
	| { kind: "chat"; chatId: string }
	| {
			kind: "file";
			itemId: string;
			/** The drive holding the file; the user's own when left out. */
			driveId?: string;
			/** The file's name, which its saved copy keeps. */
			name: string;
	  };

/**
 * What the item's viewer knows it by: the `itemKey` of its saved file, which
 * a host's `savedItems` answers for. An item saved here is so marked in its
 * viewer's list, and one saved there is known here.
 *
 * @param item - The item.
 * @return The key.
 */
export const microsoftItemKey = (item: MicrosoftItemRef): string => {
	if (item.kind === "email") {
		return mailSaveKey({ id: "", conversationId: item.conversationId });
	}
	return item.kind === "chat" ? item.chatId : item.itemId;
};

/**
 * Save an item into the insight's files the way its viewer does: an email as
 * its whole thread and a Teams chat as its newest messages, each written out
 * as Markdown, and a drive file as it is.
 *
 * @param insightId - The insight whose files receive the item.
 * @param item - The item.
 * @return The saved file, with the `itemKey` its viewer would give it.
 * @throws ConnectorSignInError when the account has to sign in, or Error when
 * the item could not be read or saved.
 */
export const saveMicrosoftItem = async (
	insightId: string,
	item: MicrosoftItemRef,
): Promise<ConnectorSavedFile> => {
	const read = (pixel: string): Promise<unknown> =>
		runConnectorPixel(pixel, insightId);
	let saved: ConnectorSavedFile;
	if (item.kind === "email") {
		const app = MAIL_APPS.microsoft;
		const thread = await readConversation(app, read, item.conversationId);
		// a thread deleted since it was found would be saved as an empty file
		if (thread.length === 0) {
			throw new Error("That email is no longer in the mailbox.");
		}
		saved = await saveToInsight(insightId, app.service, {
			kind: "text",
			fileName: mailThreadFileName(item.subject ?? thread[0].subject),
			getContent: () => mailThreadToMarkdown(app, thread),
		});
	} else if (item.kind === "chat") {
		const [chat, { messages }] = await Promise.all([
			read(MICROSOFT_PIXELS.teamsGetChat(item.chatId)).then(
				parseChatDetail,
			),
			read(
				MICROSOFT_PIXELS.teamsListChatMessages({
					chatId: item.chatId,
					limit: CHAT_MESSAGE_LIMIT,
				}),
			).then(parseChatMessages),
		]);
		saved = await saveToInsight(insightId, "teams-chats", {
			kind: "text",
			fileName: teamsChatFileName(chat),
			getContent: () => teamsChatToMarkdown(chat, messages),
		});
	} else {
		saved = await saveToInsight(insightId, "onedrive", {
			kind: "download",
			fileName: item.name,
			buildPixel: (fileName) =>
				MICROSOFT_PIXELS.oneDriveDownload({
					driveId: item.driveId,
					itemId: item.itemId,
					fileName: fileName,
				}),
			readSavedPath: readMicrosoftSavedPath,
		});
	}
	return {
		...saved,
		itemKey: microsoftItemKey(item),
		...(item.kind === "file" && item.driveId && { driveId: item.driveId }),
	};
};

/** The largest attachment {@link saveMailAttachments} takes: 25 MB. */
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** What {@link saveMailAttachments} did with a thread's attachments. */
export interface SavedMailAttachments {
	/**
	 * The attachments now in the insight's files, each with the `itemKey` the
	 * mail viewer's attachment list gives it: its email's id, a colon, its own.
	 */
	saved: ConnectorSavedFile[];
	/** The names of the ones left out for being over 25 MB. */
	skipped: string[];
}

/**
 * Save the file attachments of every email in an Outlook thread into the
 * insight's files, for a host that saved the thread and wants what was
 * attached to it too. It takes what the mail viewer's own attachment list
 * shows: files with bytes of their own, not pictures placed inside the text.
 *
 * @param insightId - The insight whose files receive them.
 * @param conversationId - The thread.
 * @return What was saved and what was left out; both empty for a thread with
 * no attachments.
 * @throws ConnectorSignInError when the account has to sign in, or Error when
 * the thread or one of its attachments could not be read or saved. What was
 * saved before that stays in the insight's files.
 */
export const saveMailAttachments = async (
	insightId: string,
	conversationId: string,
): Promise<SavedMailAttachments> => {
	const app = MAIL_APPS.microsoft;
	const read = (pixel: string): Promise<unknown> =>
		runConnectorPixel(pixel, insightId);
	const saved: ConnectorSavedFile[] = [];
	const skipped: string[] = [];
	for (const listed of await readConversation(app, read, conversationId)) {
		// a listed email only says whether it has any; opening it reads them
		if (!listed.hasAttachments) continue;
		const { attachments } = parseMailMessageDetail(
			await read(app.pixels.getMail(listed.id)),
		);
		for (const attachment of attachments) {
			if (attachment.kind !== "file" || attachment.isInline) continue;
			if ((attachment.size ?? 0) > MAX_ATTACHMENT_BYTES) {
				skipped.push(attachment.name);
				continue;
			}
			saved.push({
				...(await saveToInsight(insightId, app.service, {
					kind: "download",
					fileName: attachment.name,
					buildPixel: (fileName) =>
						app.pixels.downloadAttachment({
							messageId: listed.id,
							attachmentId: attachment.id,
							fileName: fileName,
						}),
					readSavedPath: readMailSavedPath,
				})),
				itemKey: `${listed.id}:${attachment.id}`,
			});
		}
	}
	return { saved, skipped };
};
