import type { ConnectorSavedFile } from "../core/connector.types";
import { saveToInsight } from "../core/connector-files";
import { runConnectorPixel } from "../core/connector-pixel";
import {
	mailThreadFileName,
	mailThreadToMarkdown,
} from "../mail/mail.markdown";
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
	return { ...saved, itemKey: microsoftItemKey(item) };
};
