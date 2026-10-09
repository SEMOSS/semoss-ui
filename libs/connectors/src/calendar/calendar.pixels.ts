import { call, id } from "../core/reactor-call";

/** The pixel for each calendar operation a viewer runs, against one calendar. */
export interface CalendarPixels {
	/**
	 * The events between two instants, earliest first.
	 *
	 * @param options - The window, as ISO instants, and how many events to read.
	 * @return The pixel.
	 */
	listEvents: (options: {
		start: string;
		end: string;
		limit: number;
	}) => string;
	/**
	 * One event with its body.
	 *
	 * @param eventId - The event.
	 * @return The pixel.
	 */
	getEvent: (eventId: string) => string;
}

/**
 * The calendar pixels for one calendar. Every calendar's reactors take the same
 * keys and are named after the calendar, such as `MicrosoftCalendarListEvents`
 * and `GoogleCalendarListEvents`.
 *
 * @param prefix - What the calendar's reactor names start with.
 * @return The pixels.
 */
export const calendarPixels = (prefix: string): CalendarPixels => ({
	listEvents: (options) =>
		call(`${prefix}ListEvents`, {
			start: options.start,
			end: options.end,
			limit: options.limit,
		}),
	getEvent: (eventId) => call(`${prefix}GetEvent`, { id: id(eventId) }),
});
