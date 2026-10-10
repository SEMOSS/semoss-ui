import { call, id, text } from "../core/reactor-call";

/** An email to send or save as a draft, as `SendMail` and `SaveDraft` take it. */
export interface OutgoingMail {
	to: readonly string[];
	cc: readonly string[];
	bcc: readonly string[];
	subject?: string;
	body?: string;
	/** Whether the body is HTML. */
	html?: boolean;
	/** Files in the insight's folder to attach. */
	attachments: readonly string[];
}

/** A reply, as `ReplyMail` takes it. */
export interface MailReply {
	/** The email replied to. */
	id: string;
	body: string;
	/** Whether the body is HTML. */
	html?: boolean;
	/** Whether everyone on the email gets the reply, not only its sender. */
	replyAll: boolean;
	/** Whether `to` and `cc` replace the recipients the reply would have. */
	overrideRecipients?: boolean;
	to: readonly string[];
	cc: readonly string[];
	/** Whether the reply is saved as a draft rather than sent. */
	asDraft: boolean;
	/** Files in the insight's folder to attach. */
	attachments: readonly string[];
}

/** A forward, as `ForwardMail` takes it. */
export interface MailForward {
	/** The email forwarded. */
	id: string;
	to: readonly string[];
	/** A note above the forwarded email. */
	body?: string;
	/** Whether the body is HTML. */
	html?: boolean;
	/** Whether the forward is saved as a draft rather than sent. */
	asDraft: boolean;
	/** Files in the insight's folder to attach. */
	attachments: readonly string[];
}

/** The pixel for each mail operation a viewer runs, against one mailbox. */
export interface MailPixels {
	/** @return The pixel for the places the mailbox files mail. */
	listFolders: () => string;
	/**
	 * The newest emails in a folder, without their bodies.
	 *
	 * @param options - The folder, filters, and how many emails to read.
	 * @return The pixel.
	 */
	listMail: (options: {
		folder: string;
		limit: number;
		offset?: number;
		subject?: string;
		unreadOnly?: boolean;
	}) => string;
	/**
	 * Every email of one thread, from every folder, with their bodies, so the
	 * thread includes the replies the user sent.
	 *
	 * @param options - The thread and how many emails to read.
	 * @return The pixel.
	 */
	listConversation: (options: {
		conversationId: string;
		limit: number;
	}) => string;
	/**
	 * One email with its body and attachments. Reading it does not mark it read.
	 *
	 * @param messageId - The email.
	 * @return The pixel.
	 */
	getMail: (messageId: string) => string;
	/**
	 * Save an email's attachment into the insight's folder.
	 *
	 * @param options - The email, the attachment, and the name to save it as.
	 * @return The pixel.
	 */
	downloadAttachment: (options: {
		messageId: string;
		attachmentId: string;
		fileName: string;
	}) => string;
	/**
	 * Save an email as a draft.
	 *
	 * @param mail - The email.
	 * @return The pixel.
	 */
	saveDraft: (mail: OutgoingMail) => string;
	/**
	 * Send an email, keeping a copy in the sent mail.
	 *
	 * @param mail - The email.
	 * @return The pixel.
	 */
	sendMail: (mail: OutgoingMail) => string;
	/**
	 * Reply to an email, or save the reply as a draft.
	 *
	 * @param reply - The reply.
	 * @return The pixel.
	 */
	replyMail: (reply: MailReply) => string;
	/**
	 * Forward an email, or save the forward as a draft.
	 *
	 * @param forward - The forward.
	 * @return The pixel.
	 */
	forwardMail: (forward: MailForward) => string;
}

/**
 * The keys `SendMail` and `SaveDraft` share.
 *
 * @param mail - The email.
 * @return The reactor's keys.
 */
const outgoingKeys = (mail: OutgoingMail) => ({
	to: mail.to,
	cc: mail.cc,
	bcc: mail.bcc,
	subject: text(mail.subject),
	body: text(mail.body),
	html: mail.html || undefined,
	attachments: mail.attachments,
});

/**
 * The mail pixels for one mailbox. Every mailbox's reactors take the same keys
 * and are named after the mailbox, such as `MicrosoftOutlookListMail` and
 * `GoogleGmailListMail`.
 *
 * @param prefix - What the mailbox's reactor names start with.
 * @return The pixels.
 */
export const mailPixels = (prefix: string): MailPixels => ({
	listFolders: () => call(`${prefix}ListMailFolders`),
	listMail: (options) =>
		call(`${prefix}ListMail`, {
			folder: id(options.folder),
			limit: options.limit,
			offset: options.offset,
			subject: text(options.subject),
			unreadOnly: options.unreadOnly || undefined,
			includeBody: false,
		}),
	listConversation: (options) =>
		call(`${prefix}ListMail`, {
			conversationId: id(options.conversationId),
			limit: options.limit,
			includeBody: true,
		}),
	getMail: (messageId) =>
		call(`${prefix}GetMail`, {
			id: id(messageId),
			includeAttachments: true,
		}),
	downloadAttachment: (options) =>
		call(`${prefix}DownloadAttachment`, {
			id: id(options.messageId),
			attachmentId: id(options.attachmentId),
			fileName: text(options.fileName),
		}),
	saveDraft: (mail) => call(`${prefix}SaveDraft`, outgoingKeys(mail)),
	sendMail: (mail) => call(`${prefix}SendMail`, outgoingKeys(mail)),
	replyMail: (reply) =>
		call(`${prefix}ReplyMail`, {
			id: id(reply.id),
			body: text(reply.body),
			html: reply.html || undefined,
			replyAll: reply.replyAll,
			overrideRecipients: reply.overrideRecipients || undefined,
			to: reply.overrideRecipients ? reply.to : undefined,
			cc: reply.overrideRecipients ? reply.cc : undefined,
			asDraft: reply.asDraft,
			attachments: reply.attachments,
		}),
	forwardMail: (forward) =>
		call(`${prefix}ForwardMail`, {
			id: id(forward.id),
			to: forward.to,
			body: text(forward.body),
			html: forward.html || undefined,
			asDraft: forward.asDraft,
			attachments: forward.attachments,
		}),
});
