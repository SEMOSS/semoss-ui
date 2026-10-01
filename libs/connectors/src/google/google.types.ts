/** A file in the user's Google Drive, as `GoogleDriveList` lists it. */
export interface GoogleDriveFile {
	id: string;
	name: string;
	/** Google's type, such as `application/vnd.google-apps.document`. */
	mimeType?: string;
}

/** An email as the Gmail listings show it. */
export interface GmailMessageSummary {
	id: string;
	subject?: string;
	/** The sender, as the header has it: `Name <address>`. */
	from?: string;
	/** Gmail's short preview of the text. */
	snippet?: string;
}

/** An email as `GoogleGmailReadEmail` reads it. */
export interface GmailMessage {
	id: string;
	from?: string;
	/** Recipients, joined with commas, as the header has them. */
	to?: string;
	subject?: string;
	/** The `Date` header, as the sender's client wrote it. */
	sentDate?: string;
	/** The text: plain, or HTML for emails sent only as HTML. */
	content?: string;
}

/** An event as `GoogleCalendarList` lists it, without its times. */
export interface GoogleCalendarEventSummary {
	id: string;
	summary?: string;
	/** Set on one occurrence of a repeating event. */
	recurringEventId?: string;
}

/** One day of `GoogleCalendarList`. */
export interface GoogleCalendarDay {
	/** The day, as `YYYY-MM-DD`. */
	date: string;
	events: GoogleCalendarEventSummary[];
}

/** An invited guest. */
export interface GoogleCalendarAttendee {
	email?: string;
	/** `accepted`, `declined`, `tentative`, or `needsAction`. */
	responseStatus?: string;
}

/** An event as `GoogleCalendarReadEvent` reads it. */
export interface GoogleCalendarEvent {
	id: string;
	summary?: string;
	description?: string;
	location?: string;
	attendees: GoogleCalendarAttendee[];
	/**
	 * The start as a wall clock time without a zone, `YYYY-MM-DDTHH:mm:ss`, or
	 * a day, `YYYY-MM-DD`, for an all day event.
	 */
	startTime?: string;
	endTime?: string;
	/** The organizer's address. */
	organizer?: string;
	/** Joins the event's Google Meet. */
	hangoutLink?: string;
	/** Opens the event in Google Calendar. */
	htmlLink?: string;
	/** How often it repeats, such as `WEEKLY`. */
	frequency?: string;
}

/** A Google Doc as `GoogleDocsList` lists it. */
export interface GoogleDoc {
	id: string;
	title: string;
}

/** A Google Doc's text, as `GoogleDocsRead` reads it. */
export interface GoogleDocContent {
	title: string;
	/** The document's paragraphs as plain text; tables and headers are left out. */
	content: string;
}
