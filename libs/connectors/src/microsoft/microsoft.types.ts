/**
 * A file or folder in a Microsoft drive: OneDrive, or the files of a Teams
 * channel, which live in the team's SharePoint drive.
 */
export interface MicrosoftDriveItem {
	id: string;
	name: string;
	/** The drive holding the item. The download reactors need it. */
	driveId?: string;
	isFolder: boolean;
	/** Size in bytes. */
	size?: number;
	mimeType?: string;
	/** How many entries a folder holds. */
	childCount?: number;
	/** Opens the item in its own app. */
	webUrl?: string;
	/**
	 * Where the item sits in its drive, relative to the drive's top, such as
	 * `Reports/q3.xlsx`.
	 */
	path?: string;
	lastModifiedDateTime?: string;
	/** Display name of whoever changed the item last. */
	lastModifiedBy?: string;
	/** Display name of whoever shared the item, for items shared with the user. */
	sharedBy?: string;
}

/** Where a saved download landed. */
export interface MicrosoftDownload {
	/** Relative to the insight's folder, with no leading slash. */
	filePath: string;
	/** The item's name in Microsoft 365. */
	name?: string;
}

/** A top level Outlook mail folder. */
export interface OutlookMailFolder {
	/** What `MicrosoftOutlookListMail` takes as `folder`. */
	id: string;
	name: string;
	totalItemCount?: number;
}

/** A file attached to an email. */
export interface OutlookAttachment {
	id: string;
	name: string;
	contentType?: string;
	/** Size in bytes. */
	size?: number;
	isInline: boolean;
	/**
	 * Whether the attachment has bytes to save. Attached emails and links to
	 * drive files do not.
	 */
	isFile: boolean;
}

/** An email. */
export interface OutlookMessage {
	/** The Graph message id, which the other mail reactors take as `uid`. */
	uid: string;
	/** Ties the emails of one thread together, across folders. */
	conversationId?: string;
	/** The sender's address. */
	from?: string;
	/** The sender's display name. */
	fromName?: string;
	/** Recipients' addresses, joined with commas. */
	to?: string;
	cc?: string;
	subject?: string;
	receivedDate?: string;
	sentDate?: string;
	isUnread: boolean;
	hasAttachments: boolean;
	/** Plain text: the backend strips HTML bodies to text. */
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
	attachments: OutlookAttachment[];
}

/** Someone invited to an event. */
export interface CalendarAttendee {
	address?: string;
	name?: string;
	/** `required`, `optional`, or `resource`. */
	type?: string;
	/** How they answered, such as `accepted`. */
	response?: string;
}

/** An Outlook calendar event. */
export interface CalendarEvent {
	id: string;
	subject?: string;
	/** Start, as Graph's date and time without an offset. */
	start?: string;
	/** The zone `start` is in, `UTC` unless the request asked for another. */
	startTimeZone?: string;
	end?: string;
	endTimeZone?: string;
	isAllDay: boolean;
	location?: string;
	/** The organizer's address. */
	organizer?: string;
	organizerName?: string;
	attendees: CalendarAttendee[];
	/** Opens the event in Outlook. */
	webLink?: string;
	/** Joins the online meeting. */
	joinUrl?: string;
	isOnlineMeeting: boolean;
	isCancelled: boolean;
	/** The user's answer, such as `accepted` or `organizer`. */
	responseStatus?: string;
	/** Plain text, only read when the event is opened. */
	body?: string;
	isBodyTruncated: boolean;
}

/** A team the user belongs to. */
export interface TeamsTeam {
	id: string;
	displayName: string;
	description?: string;
}

/** A channel in a team. */
export interface TeamsChannel {
	id: string;
	displayName: string;
	description?: string;
	/** `standard`, `private`, or `shared`. */
	membershipType?: string;
	webUrl?: string;
}

/** Something attached to a Teams message. */
export interface TeamsAttachment {
	id?: string;
	name?: string;
	contentType?: string;
	/** Whether it is a file that can be saved, rather than a card. */
	isFile: boolean;
}

/** A Teams message, in a channel or a chat. */
export interface TeamsMessage {
	id: string;
	/** The thread's first message, for a reply. */
	replyToId?: string;
	/** `message`, or a system event such as a member joining. */
	messageType?: string;
	subject?: string;
	createdDateTime?: string;
	isDeleted: boolean;
	fromName?: string;
	/** Opens the message in Teams. */
	webUrl?: string;
	/** Plain text: the backend strips HTML bodies to text. */
	body: string;
	isBodyTruncated: boolean;
	attachments: TeamsAttachment[];
	/** How many replies the thread has, when replies were read. */
	replyCount?: number;
	/** The thread's replies, oldest first, when they were read. */
	replies: TeamsMessage[];
}

/** A Teams chat: one on one, a group, or a meeting's chat. */
export interface TeamsChat {
	id: string;
	/** `oneOnOne`, `group`, or `meeting`. */
	chatType?: string;
	/** The topic, or else the other members' names. */
	displayName?: string;
	lastUpdatedDateTime?: string;
	/** Opens the chat in Teams. */
	webUrl?: string;
	hasUnread: boolean;
	/** A short copy of the newest message. */
	lastMessage?: TeamsMessage;
}
