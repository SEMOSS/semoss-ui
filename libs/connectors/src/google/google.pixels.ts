import { call, id } from "../core/reactor-call";

/*
 * The pixels the Google Workspace viewers run. Each reads the signed in
 * user's own account; the reactors take no search or page keys, so a list is
 * as long as its limit.
 */

/** The pixel for each operation a viewer runs. */
export const GOOGLE_PIXELS = {
	/**
	 * Files in the user's Drive, from every folder.
	 *
	 * @param limit - How many files to read.
	 * @return The pixel.
	 */
	driveList: (limit: number): string =>
		call("GoogleDriveList", { limit: limit }),

	/**
	 * The newest emails, with a preview of each.
	 *
	 * @param limit - How many emails to read.
	 * @return The pixel.
	 */
	gmailRecent: (limit: number): string =>
		call("GoogleGmailSummarizeTopKEmails", { limit: limit }),

	/**
	 * The newest unread emails, with a preview of each.
	 *
	 * @param limit - How many emails to read.
	 * @return The pixel.
	 */
	gmailUnread: (limit: number): string =>
		call("GoogleGmailGetUnreadEmails", { limit: limit }),

	/**
	 * One email with its text. Gmail marks it read.
	 *
	 * @param messageId - The email.
	 * @return The pixel.
	 */
	gmailRead: (messageId: string): string =>
		call("GoogleGmailReadEmail", { id: id(messageId) }),

	/**
	 * The events of the primary calendar between two wall clock times, which
	 * the backend reads in the user's zone.
	 *
	 * @param options - The window, as `YYYY-MM-DDTHH:mm:ss` without a zone.
	 * @return The pixel.
	 */
	calendarList: (options: { startDate: string; endDate: string }): string =>
		call("GoogleCalendarList", {
			startDate: options.startDate,
			endDate: options.endDate,
		}),

	/**
	 * One event with its times, place, and guests.
	 *
	 * @param eventId - The event.
	 * @return The pixel.
	 */
	calendarRead: (eventId: string): string =>
		call("GoogleCalendarReadEvent", { id: id(eventId) }),

	/**
	 * The user's Google Docs.
	 *
	 * @param limit - How many documents to read.
	 * @return The pixel.
	 */
	docsList: (limit: number): string =>
		call("GoogleDocsList", { limit: limit }),

	/**
	 * One document's text.
	 *
	 * @param documentId - The document.
	 * @return The pixel.
	 */
	docsRead: (documentId: string): string =>
		call("GoogleDocsRead", { id: id(documentId) }),
} as const;

/** Google's type for a Google Doc. */
export const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";

/** Google's type for a folder. */
export const GOOGLE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

/**
 * Where a Drive file opens: Google's own editor for its documents, sheets,
 * and slides, and the Drive preview for anything else.
 *
 * @param fileId - The file.
 * @param mimeType - Its Google type.
 * @return The link.
 */
export const getDriveFileUrl = (fileId: string, mimeType?: string): string => {
	const encoded = encodeURIComponent(fileId);
	if (mimeType === GOOGLE_DOC_MIME_TYPE) {
		return `https://docs.google.com/document/d/${encoded}/edit`;
	}
	if (mimeType === "application/vnd.google-apps.spreadsheet") {
		return `https://docs.google.com/spreadsheets/d/${encoded}/edit`;
	}
	if (mimeType === "application/vnd.google-apps.presentation") {
		return `https://docs.google.com/presentation/d/${encoded}/edit`;
	}
	if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
		return `https://drive.google.com/drive/folders/${encoded}`;
	}
	return `https://drive.google.com/file/d/${encoded}/view`;
};
