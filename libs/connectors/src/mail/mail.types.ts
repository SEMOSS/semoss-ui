/**
 * A place mail is filed: an Outlook folder, or a Gmail label. A listing puts
 * each folder right after the one it sits in, so its `depth` is enough to show
 * the mailbox's tree.
 */
export interface MailFolder {
	/** What the mail reactors take as `folder`. */
	id: string;
	/** Its own name, without the folders it sits in. */
	name: string;
	/** `folder` in Outlook, and `label` or `system` in Gmail. */
	kind?: string;
	/** The folder it sits in, absent at the top of the mailbox. */
	parentId?: string;
	/** Its name after those of the folders it sits in, separated by `/`. */
	path?: string;
	/** How many folders it sits in, 0 at the top of the mailbox. */
	depth: number;
	/**
	 * The name the mailbox itself knows the folder by, such as `inbox`, in
	 * lower case, whatever the folder is called in the user's language.
	 */
	wellKnownName?: string;
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

/**
 * An email's body as its mailbox sent it, for showing the way its mail app
 * does. Only a read that asks for it reports it, and it is never saved.
 */
export interface MailDisplayBody {
	/**
	 * `html`, or `text` when the email has no HTML or its HTML was too large,
	 * in which case the text is the email's plain text.
	 */
	contentType: "html" | "text";
	content: string;
	/** Whether the HTML was too large and the text stands in for it. */
	isTruncated: boolean;
	/**
	 * The pictures the HTML shows by content id, when the read asked for
	 * them, and absent otherwise.
	 */
	inlineImages?: MailInlineImage[];
	/** How many pictures the HTML shows that were too large or could not be read. */
	inlineImagesOmitted: number;
}

/** A picture an email's HTML shows by content id, as in `cid:logo@example`. */
export interface MailInlineImage {
	/** The content id, without angle brackets, in lower case. */
	contentId: string;
	/** Its media type, such as `image/png`. */
	contentType: string;
	/** Its bytes, as base64. */
	data: string;
}

/** The pictures embedded in an email, as a read for them found them. */
export interface MailEmbeddedImages {
	images: MailInlineImage[];
	/** How many the email shows that were too large or could not be read. */
	omitted: number;
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
	/** The formatted body, when the read asked for it. */
	displayBody?: MailDisplayBody;
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
	/** Server result count before malformed entries or duplicate IDs are removed. */
	rawCount: number;
	/** The emails, newest first. */
	messages: MailMessage[];
	/** Whether the mailbox holds more after them. */
	hasMore: boolean;
}
