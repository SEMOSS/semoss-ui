import { parseGraphDate } from "../core/connector.format";
import {
	escapeInline,
	toDocument,
	toFieldLines,
	toPerson,
	toTitle,
	toWhenText,
} from "../core/connector-markdown";
import { toMarkdownText } from "../core/connector-rich-text";
import type { CalendarEvent } from "./calendar.types";
import type { CalendarApp } from "./calendar-apps";

/**
 * A calendar event as Markdown.
 *
 * @param app - The calendar it was read from.
 * @param event - The event, read with its body.
 * @return The document.
 */
export const calendarEventToMarkdown = (
	app: CalendarApp,
	event: CalendarEvent,
): string => {
	const attendees = event.attendees
		.map((attendee) =>
			toPerson(
				attendee.name,
				attendee.address,
				attendee.response && attendee.response !== "none"
					? attendee.response
					: undefined,
			),
		)
		.filter(Boolean)
		// names can hold commas, such as `Lovelace, Ada`
		.join("; ");

	return toDocument([
		`# ${escapeInline(toTitle(event.subject, "(no title)"))}`,
		toFieldLines([
			["Source", `${app.sourceName} event`],
			["Status", event.isCancelled ? "Cancelled" : undefined],
			[
				"When",
				// the reactors answer in UTC, so a time reads the same anywhere
				toWhenText(event.start, event.end, {
					read: (value) => parseGraphDate(value),
					isAllDay: event.isAllDay,
				}),
			],
			["Repeats", event.isRecurring ? "Yes" : undefined],
			["Location", event.location],
			["Organizer", toPerson(event.organizerName, event.organizer)],
			["Attendees", attendees],
			["Online meeting", { link: event.joinUrl }],
			["Link", { link: event.webLink }],
		]),
		event.body ? toMarkdownText(event.body) : undefined,
		event.isBodyTruncated
			? `_The text above was cut short when it was read from ${app.sourceName}._`
			: undefined,
	]);
};

/**
 * The file name an event is saved under.
 *
 * @param event - The event.
 * @return A Markdown file name.
 */
export const calendarEventFileName = (event: CalendarEvent): string =>
	`Event - ${toTitle(event.subject, "No title")}.md`;
