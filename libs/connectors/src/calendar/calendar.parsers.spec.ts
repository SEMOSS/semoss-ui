import { describe, expect, it } from "vitest";
import {
	parseCalendarEventDetail,
	parseCalendarEvents,
} from "./calendar.parsers";

describe("calendar", () => {
	it("reads the UTC start and end every calendar returns", () => {
		const page = parseCalendarEvents({
			start: "2026-09-27T00:00:00Z",
			end: "2026-10-04T00:00:00Z",
			offset: 0,
			count: 1,
			hasMore: false,
			events: [
				{
					id: "e1",
					subject: "Sync",
					start: "2026-09-27T13:00:00Z",
					end: "2026-09-27T13:30:00Z",
					timeZone: "America/New_York",
					isAllDay: false,
					attendees: [{ name: "Ada" }, {}],
					isOnlineMeeting: true,
					joinUrl: "https://teams.example/join",
					isRecurring: true,
				},
			],
		});

		expect(page.hasMore).toBe(false);
		expect(page.events[0]).toMatchObject({
			id: "e1",
			start: "2026-09-27T13:00:00Z",
			timeZone: "America/New_York",
			isOnlineMeeting: true,
			isCancelled: false,
			isRecurring: true,
		});
		expect(page.events[0].attendees).toHaveLength(1);
	});

	it("refuses an opened event without an id", () => {
		expect(() => parseCalendarEventDetail({ subject: "x" })).toThrow();
	});
});
