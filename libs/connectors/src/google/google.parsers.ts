import { isRecord } from "@semoss/utility/object";
import { readNonBlankString } from "@semoss/utility/text";
import type {
	GmailMessage,
	GmailMessageSummary,
	GoogleCalendarAttendee,
	GoogleCalendarDay,
	GoogleCalendarEvent,
	GoogleCalendarEventSummary,
	GoogleDoc,
	GoogleDocContent,
	GoogleDriveFile,
} from "./google.types";

/*
 * The Google reactors pass Google's data through thinly, with null fields left
 * out. As with Microsoft, entries missing what the viewers need are dropped
 * and a response of the wrong shape is an error.
 */

/**
 * Parse each entry of a list the reactor returned bare, keeping those that
 * parse.
 *
 * @param raw - The reactor's output.
 * @param what - What the list should hold, for the error.
 * @param parse - Reads one entry, or returns null to drop it.
 * @return The parsed entries.
 * @throws Error when the output is not a list.
 */
const parseList = <T>(
	raw: unknown,
	what: string,
	parse: (entry: unknown) => T | null,
): T[] => {
	if (!Array.isArray(raw)) {
		throw new Error(`The response did not include ${what}.`);
	}
	const parsed: T[] = [];
	for (const entry of raw) {
		const item = parse(entry);
		if (item) {
			parsed.push(item);
		}
	}
	return parsed;
};

/**
 * The files `GoogleDriveList` returns, by name.
 *
 * @param raw - The reactor's output, a bare list.
 * @return The files.
 */
export const parseDriveFiles = (raw: unknown): GoogleDriveFile[] =>
	parseList(raw, "any files", (entry): GoogleDriveFile | null => {
		if (!isRecord(entry)) {
			return null;
		}
		const id = readNonBlankString(entry.id);
		if (!id) {
			return null;
		}
		return {
			id: id,
			name: readNonBlankString(entry.name) ?? id,
			mimeType: readNonBlankString(entry.mimeType),
		};
	}).sort((a, b) =>
		a.name.localeCompare(b.name, undefined, {
			numeric: true,
			sensitivity: "base",
		}),
	);

/**
 * The emails `GoogleGmailSummarizeTopKEmails` or `GoogleGmailGetUnreadEmails`
 * return, newest first.
 *
 * @param raw - The reactor's output, a bare list.
 * @return The emails.
 */
export const parseGmailList = (raw: unknown): GmailMessageSummary[] =>
	parseList(raw, "any emails", (entry): GmailMessageSummary | null => {
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
			from: readNonBlankString(entry.from),
			snippet: readNonBlankString(entry.pre_content),
		};
	});

/**
 * One email, from `GoogleGmailReadEmail`, which does not repeat its id.
 *
 * @param id - The email that was read.
 * @return A parser for the reactor's output.
 */
export const parseGmailMessage =
	(id: string) =>
	(raw: unknown): GmailMessage => {
		if (!isRecord(raw)) {
			throw new Error("The response did not include the email.");
		}
		return {
			id: id,
			from: readNonBlankString(raw.from),
			to: readNonBlankString(raw.to),
			subject: readNonBlankString(raw.subject),
			sentDate: readNonBlankString(raw.sentDate),
			content: typeof raw.content === "string" ? raw.content : undefined,
		};
	};

/**
 * The days `GoogleCalendarList` returns, each with its events.
 *
 * @param raw - The reactor's output, a bare list of days.
 * @return The days, earliest first.
 */
export const parseGoogleCalendarDays = (raw: unknown): GoogleCalendarDay[] =>
	parseList(raw, "any events", (entry): GoogleCalendarDay | null => {
		if (!isRecord(entry)) {
			return null;
		}
		const date = readNonBlankString(entry.date);
		if (!date || !Array.isArray(entry.events)) {
			return null;
		}
		const events: GoogleCalendarEventSummary[] = [];
		for (const event of entry.events) {
			if (!isRecord(event)) {
				continue;
			}
			const id = readNonBlankString(event.id);
			if (id) {
				events.push({
					id: id,
					summary: readNonBlankString(event.summary),
					recurringEventId: readNonBlankString(
						event.recurringEventId,
					),
				});
			}
		}
		return events.length > 0 ? { date: date, events: events } : null;
	}).sort((a, b) => a.date.localeCompare(b.date));

const parseAttendee = (entry: unknown): GoogleCalendarAttendee | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const email = readNonBlankString(entry.email);
	return email
		? {
				email: email,
				responseStatus: readNonBlankString(entry.responseStatus),
			}
		: null;
};

/**
 * One event, from `GoogleCalendarReadEvent`, which does not repeat its id.
 *
 * @param id - The event that was read.
 * @return A parser for the reactor's output.
 */
export const parseGoogleCalendarEvent =
	(id: string) =>
	(raw: unknown): GoogleCalendarEvent => {
		if (!isRecord(raw)) {
			throw new Error("The response did not include the event.");
		}
		const attendees: GoogleCalendarAttendee[] = [];
		if (Array.isArray(raw.attendees)) {
			for (const entry of raw.attendees) {
				const attendee = parseAttendee(entry);
				if (attendee) {
					attendees.push(attendee);
				}
			}
		}
		return {
			id: id,
			summary: readNonBlankString(raw.summary),
			description: readNonBlankString(raw.description),
			location: readNonBlankString(raw.location),
			attendees: attendees,
			startTime: readNonBlankString(raw.startTime),
			endTime: readNonBlankString(raw.endTime),
			organizer: readNonBlankString(raw.organizer),
			hangoutLink: readNonBlankString(raw.hangoutLink),
			htmlLink: readNonBlankString(raw.htmlLink),
			frequency: readNonBlankString(raw.frequency),
		};
	};

/**
 * The documents `GoogleDocsList` returns, by title.
 *
 * @param raw - The reactor's output, a bare list.
 * @return The documents.
 */
export const parseGoogleDocs = (raw: unknown): GoogleDoc[] =>
	parseList(raw, "any documents", (entry): GoogleDoc | null => {
		if (!isRecord(entry)) {
			return null;
		}
		const id = readNonBlankString(entry.id);
		if (!id) {
			return null;
		}
		return { id: id, title: readNonBlankString(entry.title) ?? id };
	}).sort((a, b) =>
		a.title.localeCompare(b.title, undefined, {
			numeric: true,
			sensitivity: "base",
		}),
	);

/**
 * A document's text, from `GoogleDocsRead`.
 *
 * @param raw - The reactor's output.
 * @return The title and text.
 * @throws Error when the response is not a document.
 */
export const parseGoogleDocContent = (raw: unknown): GoogleDocContent => {
	if (!isRecord(raw)) {
		throw new Error("The response did not include the document.");
	}
	return {
		title: readNonBlankString(raw.title) ?? "",
		content: typeof raw.content === "string" ? raw.content : "",
	};
};
