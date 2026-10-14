/** Someone invited to an event. */
export interface CalendarAttendee {
	address?: string;
	name?: string;
	/** `required`, `optional`, or `resource`. */
	type?: string;
	/** How they answered, such as `accepted`. */
	response?: string;
}

/** A calendar event, the same whichever calendar it was read from. */
export interface CalendarEvent {
	id: string;
	subject?: string;
	/** Start: an instant in UTC, or the date of a whole day event. */
	start?: string;
	/** End: an instant in UTC, or the day after the last day of a whole day event. */
	end?: string;
	/** The zone the calendar keeps the event in. */
	timeZone?: string;
	isAllDay: boolean;
	location?: string;
	/** The organizer's address. */
	organizer?: string;
	organizerName?: string;
	attendees: CalendarAttendee[];
	/** Opens the event in its own app. */
	webLink?: string;
	/** Joins the online meeting. */
	joinUrl?: string;
	isOnlineMeeting: boolean;
	isCancelled: boolean;
	/** Whether it is one occurrence of a repeating series. */
	isRecurring: boolean;
	/** The user's answer, such as `accepted` or `organizer`. */
	responseStatus?: string;
	/** Plain text, only read when the event is opened. */
	body?: string;
	isBodyTruncated: boolean;
}

/** A time someone is not free. */
export interface CalendarBusyTime {
	/** An instant in UTC. */
	start?: string;
	/** An instant in UTC. */
	end?: string;
	/** How they are taken, such as `busy` or `tentative`. */
	status: string;
	/** The event's title, when the calendar shares it. */
	subject?: string;
	location?: string;
}

/** When one person or room is not free. */
export interface CalendarAvailability {
	/** Whose calendar it is. */
	address: string;
	/** The times they are taken, earliest first. */
	busy: CalendarBusyTime[];
	/** Why their calendar could not be read, when it could not. */
	error?: string;
}

/** What `GetSchedule` found. */
export interface CalendarSchedules {
	/** The start of the window, in UTC. */
	start?: string;
	/** The end of the window, in UTC. */
	end?: string;
	/** Each calendar asked about. */
	schedules: CalendarAvailability[];
}

/** One page of a calendar listing. */
export interface CalendarEventPage {
	/** The events, earliest first. */
	events: CalendarEvent[];
	/** Whether the window holds more after them. */
	hasMore: boolean;
}
