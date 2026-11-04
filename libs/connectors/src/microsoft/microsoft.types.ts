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
	 * The folder holding the item, relative to the drive's top, such as
	 * `Reports/2026`. Absent for an item at the top.
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
	/** When the chat was renamed or its members changed, not its last message. */
	lastUpdatedDateTime?: string;
	/** Opens the chat in Teams. */
	webUrl?: string;
	hasUnread: boolean;
	/** A short copy of the newest message. */
	lastMessage?: TeamsMessage;
}

/** A Teams message a search found, in a chat or a channel. */
export interface TeamsMessageSearchHit {
	id: string;
	/** Where it was posted: `chat` or `channel`. */
	kind: "chat" | "channel";
	/** The chat holding it, for a chat message. */
	chatId?: string;
	/** The team and channel holding it, for a channel post. */
	teamId?: string;
	channelId?: string;
	fromName?: string;
	fromEmail?: string;
	createdDateTime?: string;
	subject?: string;
	/** Plain text around what the search matched, not the whole message. */
	summary: string;
	/** Opens the message in Teams, when Microsoft gives a link. */
	webUrl?: string;
}

/** One read of `MicrosoftTeamsSearchMessages`. */
export interface TeamsMessageSearchPage {
	/** The messages found, newest first. */
	hits: TeamsMessageSearchHit[];
	/** Whether Microsoft holds more matches than were read. */
	hasMore: boolean;
}
