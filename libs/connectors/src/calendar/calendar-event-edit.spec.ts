import { describe, expect, it } from "vitest";
import {
	createCalendarEventSchema,
	toCalendarEventArguments,
	toCalendarEventValues,
} from "./calendar-event-edit";

const MESSAGES = {
	timeRequired: "timeRequired",
	timeInvalid: "timeInvalid",
	addresses: "addresses",
};

describe("calendar event edit", () => {
	it("starts from the model's arguments and keeps what the form leaves alone", () => {
		const args = {
			subject: "Review",
			start: "2026-10-08T14:00:00",
			end: "2026-10-08T15:00:00",
			timeZone: "America/New_York",
			attendees: "ada@example.com; grace@example.com",
			reminderMinutesBeforeStart: 15,
			importance: "high",
		};
		const values = toCalendarEventValues(args);
		expect(values).toMatchObject({
			attendees: "ada@example.com, grace@example.com",
			isAllDay: false,
		});
		expect(
			toCalendarEventArguments(
				"create",
				{ ...values, location: " Room 4 " },
				args,
				{},
			),
		).toEqual({
			...args,
			attendees: ["ada@example.com", "grace@example.com"],
			location: "Room 4",
			isAllDay: false,
			isOnlineMeeting: false,
		});
	});

	it("changes only what an update fills in or the user changed", () => {
		const args = { id: "e", subject: "Review", isOnlineMeeting: true };
		const values = toCalendarEventValues(args);
		expect(toCalendarEventArguments("update", values, args, {})).toEqual(
			args,
		);
		expect(
			toCalendarEventArguments(
				"update",
				{ ...values, subject: "", isAllDay: true },
				args,
				{ isAllDay: true },
			),
		).toEqual({ id: "e", isOnlineMeeting: true, isAllDay: true });
	});

	it("needs a created event's times, and reads only times it can", () => {
		const values = toCalendarEventValues({});
		const issues = (intent: "create" | "update", value: typeof values) =>
			createCalendarEventSchema(intent, MESSAGES)
				.safeParse(value)
				.error?.issues.map((issue) => issue.message) ?? [];
		expect(issues("create", values)).toEqual([
			"timeRequired",
			"timeRequired",
		]);
		expect(issues("update", values)).toEqual([]);
		expect(
			issues("create", {
				...values,
				start: "2026-10-08",
				end: "2026-10-08T15:00:00Z",
			}),
		).toEqual([]);
		expect(
			issues("update", {
				...values,
				start: "tomorrow at 3",
				attendees: "x",
			}),
		).toEqual(["timeInvalid", "addresses"]);
	});
});
