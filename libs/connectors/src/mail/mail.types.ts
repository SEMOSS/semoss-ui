/** A place mail is filed: an Outlook folder, or a Gmail label. */
export interface MailFolder {
	/** What the mail reactors take as `folder`. */
	id: string;
	name: string;
	/** `folder` in Outlook, and `label` or `system` in Gmail. */
	kind?: string;
	totalCount?: number;
	unreadCount?: number;
}

/** Something attached to an email. */
export interface MailAttachment {
	/** What the attachment download takes as `attachmentId`. */
	id: string;
	name: string;
	contentType?: string;
	/** Size in bytes. */
	size?: number;
	/** Whether it is shown in the body, such as a picture, rather than beside it. */
	isInline: boolean;
	/**
	 * `file`, which has bytes to save; `item`, an email or event Outlook
	 * embedded; or `link`, a link to a file in a drive.
	 */
	kind: string;
}

/** An email, the same whichever mailbox it was read from. */
export interface MailMessage {
	/** The provider's message id, which every other mail reactor takes as `id`. */
	id: string;
	/** Ties the emails of one thread together, across folders. */
	conversationId?: string;
	/** The sender's address. */
	from?: string;
	/** The sender's display name. */
	fromName?: string;
	/** The recipients' addresses. */
	to: string[];
	cc: string[];
	subject?: string;
	/** When it arrived, in UTC. */
	receivedDate?: string;
	/** When it was sent, in UTC. */
	sentDate?: string;
	isUnread: boolean;
	hasAttachments: boolean;
	/** Plain text: the backend reads html bodies as text. */
	body?: string;
	/**
	 * The part of the body that is this email's own, without the earlier
	 * emails it quotes. Only a thread read reports it.
	 */
	uniqueBody?: string;
	/** Whether the backend cut the body short. */
	isBodyTruncated: boolean;
	/** Whether the backend cut the unique body short. */
	isUniqueBodyTruncated?: boolean;
	/** Only read when the message is opened. */
	attachments: MailAttachment[];
	/** Opens the email in its own app. */
	webLink?: string;
}

/** What a send or a draft save reports: the email as it went out or was saved. */
export interface MailReceipt {
	/** Whether it was sent; otherwise it was saved as a draft. */
	isSent: boolean;
	/** The draft's or the sent email's id, when the mailbox reports one. */
	id?: string;
	/** Opens it in its own app. */
	webLink?: string;
	to: string[];
	cc: string[];
	bcc: string[];
	subject?: string;
	/** The body as it was written: HTML when `isHtml`. */
	body?: string;
	isHtml: boolean;
	/** The insight files attached. */
	attachments: string[];
}

/** One page of a mailbox listing. */
export interface MailPage {
	/** Server page count, falling back to raw entries before parsing. */
	count: number;
	/** The emails, newest first. */
	messages: MailMessage[];
	/** Whether the mailbox holds more after them. */
	hasMore: boolean;
}
