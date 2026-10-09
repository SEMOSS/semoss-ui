import { describe, expect, it } from "vitest";
import { calendarEventToMarkdown } from "./calendar.markdown";
import type { CalendarEvent } from "./calendar.types";
import { CALENDAR_APPS } from "./calendar-apps";

/*
 * Times are written in the zone of whoever runs the tests, so they are set at
 * midday UTC, which is the same day in almost every zone, and only the day is
 * compared exactly.
 */

/** A time of day and its zone, such as `8:00 AM EDT`. */
const TIME = String.raw`\d{1,2}:\d{2} [AP]M \S+`;

describe("calendarEventToMarkdown", () => {
	it("says when and where, and links the meeting by its site", () => {
		const event: CalendarEvent = {
			id: "e",
			subject: "Sync",
			start: "2026-09-27T12:00:00Z",
			end: "2026-09-27T12:30:00Z",
			timeZone: "America/New_York",
			isAllDay: false,
			location: "Room 4",
			organizer: "ada@example.com",
			organizerName: "Ada",
			attendees: [
				{ name: "Lovelace, Ada", address: "ada@example.com" },
				{ name: "Grace", response: "accepted" },
			],
			joinUrl: "https://teams.example/join",
			isOnlineMeeting: true,
			isCancelled: false,
			isRecurring: false,
			body: `Agenda.\n${"_".repeat(40)}\nJoin<https://teams.example/join>`,
			isBodyTruncated: false,
		};
		const markdown = calendarEventToMarkdown(
			CALENDAR_APPS.microsoft,
			event,
		);
		expect(markdown).toMatch(
			new RegExp(
				String.raw`\*\*When:\*\* Sun, Sep 27, 2026, \d{1,2}:\d{2} [AP]M to ${TIME}  \n`,
			),
		);
		expect(markdown).toContain("**Organizer:** Ada (ada@example.com)");
		expect(markdown).toContain(
			"**Attendees:** Lovelace, Ada (ada@example.com); Grace (accepted)",
		);
		expect(markdown).toContain(
			"**Online meeting:** [teams.example](https://teams.example/join)",
		);
		expect(markdown).toContain(
			"Agenda.\n\n---\n\nJoin ([teams.example](https://teams.example/join))",
		);
	});

	it("names the day of an all day event, and that it repeats", () => {
		const markdown = calendarEventToMarkdown(CALENDAR_APPS.google, {
			id: "e",
			start: "2026-09-27",
			end: "2026-09-28",
			isAllDay: true,
			attendees: [],
			isOnlineMeeting: false,
			isCancelled: false,
			isRecurring: true,
			isBodyTruncated: false,
		});
		expect(markdown).toContain("**When:** Sun, Sep 27, 2026, all day");
		expect(markdown).toContain("**Repeats:** Yes");
		expect(markdown).toContain("**Source:** Google Calendar event");
	});
});
