import { isRecord } from "@semoss/utility/object";
import { readNonBlankString } from "@semoss/utility/text";
import { parseEach, readBody, requireList } from "../core/connector-parse";
import type {
	CalendarAttendee,
	CalendarAvailability,
	CalendarBusyTime,
	CalendarEvent,
	CalendarEventPage,
	CalendarSchedules,
} from "./calendar.types";

/*
 * Every calendar reactor answers in the same shape, whichever calendar it
 * reads, so one set of parsers reads them all.
 */

const parseAttendee = (entry: unknown): CalendarAttendee | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const attendee = {
		address: readNonBlankString(entry.address),
		name: readNonBlankString(entry.name),
		type: readNonBlankString(entry.type),
		response: readNonBlankString(entry.response),
	};
	return attendee.address || attendee.name ? attendee : null;
};

const parseCalendarEvent = (entry: unknown): CalendarEvent | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readNonBlankString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		subject: readNonBlankString(entry.subject),
		start: readNonBlankString(entry.start),
		end: readNonBlankString(entry.end),
		timeZone: readNonBlankString(entry.timeZone),
		isAllDay: entry.isAllDay === true,
		location: readNonBlankString(entry.location),
		organizer: readNonBlankString(entry.organizer),
		organizerName: readNonBlankString(entry.organizerName),
		attendees: parseEach(entry.attendees, parseAttendee),
		webLink: readNonBlankString(entry.webLink),
		joinUrl: readNonBlankString(entry.joinUrl),
		isOnlineMeeting: entry.isOnlineMeeting === true,
		isCancelled: entry.isCancelled === true,
		isRecurring: entry.isRecurring === true,
		responseStatus: readNonBlankString(entry.responseStatus),
		body: readBody(entry.body, entry.bodyTruncated === true),
		isBodyTruncated: entry.bodyTruncated === true,
	};
};

/**
 * The events in a window, from `ListEvents`.
 *
 * @param raw - The reactor's output, `{ start, end, offset, count, hasMore, events }`.
 * @return The events, earliest first, and whether there are more.
 */
export const parseCalendarEvents = (raw: unknown): CalendarEventPage => ({
	events: parseEach(
		requireList(raw, "events", "any events"),
		parseCalendarEvent,
	),
	hasMore: isRecord(raw) && raw.hasMore === true,
});

const parseBusyTime = (entry: unknown): CalendarBusyTime | null => {
	if (!isRecord(entry)) {
		return null;
	}
	return {
		start: readNonBlankString(entry.start),
		end: readNonBlankString(entry.end),
		status: readNonBlankString(entry.status) ?? "busy",
		subject: readNonBlankString(entry.subject),
		location: readNonBlankString(entry.location),
	};
};

const parseAvailability = (entry: unknown): CalendarAvailability | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const address = readNonBlankString(entry.address);
	if (!address) {
		return null;
	}
	return {
		address: address,
		busy: parseEach(entry.busy, parseBusyTime),
		error: readNonBlankString(entry.error),
	};
};

/**
 * When each person asked about is taken, from `GetSchedule`.
 *
 * @param raw - The reactor's output, `{ start, end, schedules }`.
 * @return The window and each calendar's busy times.
 */
export const parseCalendarSchedules = (raw: unknown): CalendarSchedules => ({
	start: isRecord(raw) ? readNonBlankString(raw.start) : undefined,
	end: isRecord(raw) ? readNonBlankString(raw.end) : undefined,
	schedules: parseEach(
		requireList(raw, "schedules", "any schedules"),
		parseAvailability,
	),
});

/**
 * One event, from `GetEvent`.
 *
 * @param raw - The reactor's output.
 * @return The event with its body.
 * @throws Error when the response is not an event.
 */
export const parseCalendarEventDetail = (raw: unknown): CalendarEvent => {
	const event = parseCalendarEvent(raw);
	if (!event) {
		throw new Error("The response did not include the event.");
	}
	return event;
};
