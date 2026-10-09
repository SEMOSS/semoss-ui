import { describe, expect, it } from "vitest";
import { formatLocalDateKey } from "@semoss/utility/date";
import { parseGraphDate, parseGraphDay } from "./connector.format";
import {
	calendarMonthRange,
	calendarViewRange,
	groupCalendarEvents,
	moveCalendarDate,
} from "./connector-calendar";

const day = (value: string) => parseGraphDay(value) ?? new Date(Number.NaN);
const interval = (event: { start: string; end: string }) => ({
	start: day(event.start),
	end: day(event.end),
});

describe("calendar windows", () => {
	it("includes all six Sunday-first weeks across a year boundary", () => {
		const range = calendarMonthRange(new Date(2026, 11, 15));
		expect(formatLocalDateKey(range.start)).toBe("2026-11-29");
		expect(formatLocalDateKey(range.end)).toBe("2027-01-10");
	});
	it("shows multi-day events on each day but excludes the ending midnight", () => {
		const event = { start: "2026-09-02", end: "2026-09-05" };
		const groups = groupCalendarEvents(
			[event],
			calendarMonthRange(day("2026-09-01")),
			interval,
		);
		expect(groups.map((group) => formatLocalDateKey(group.day))).toEqual([
			"2026-09-02",
			"2026-09-03",
			"2026-09-04",
		]);
		expect(groups.every((group) => group.events[0] === event)).toBe(true);
	});
	it("clips spanning events to the visible window and omits unrelated events", () => {
		const events = [
			{ start: "2026-08-01", end: "2026-09-02" },
			{ start: "2026-12-01", end: "2026-12-02" },
		];
		expect(
			groupCalendarEvents(
				events,
				calendarMonthRange(day("2026-09-01")),
				interval,
			).map((group) => formatLocalDateKey(group.day)),
		).toEqual(["2026-08-30", "2026-08-31", "2026-09-01"]);
	});
	it("keeps zero-duration and undated events reachable", () => {
		const groups = groupCalendarEvents(
			["zero", "unknown"],
			calendarMonthRange(day("2026-09-01")),
			(event) =>
				event === "zero"
					? { start: day("2026-09-02"), end: day("2026-09-02") }
					: { start: null, end: null },
		);
		expect(groups.map((group) => group.events)).toEqual([
			["unknown"],
			["zero"],
		]);
	});
	it("uses local calendar days when a timed event crosses midnight", () => {
		const start = new Date(2026, 8, 2, 23, 30);
		const end = new Date(2026, 8, 3, 1);
		const groups = groupCalendarEvents(
			["overnight"],
			calendarMonthRange(start),
			() => ({
				start: parseGraphDate(start.toISOString()),
				end: parseGraphDate(end.toISOString()),
			}),
		);
		expect(groups.map((group) => formatLocalDateKey(group.day))).toEqual([
			"2026-09-02",
			"2026-09-03",
		]);
	});
	it("walks DST days without skipping or duplicating dates", () => {
		const groups = groupCalendarEvents(
			[{ start: "2026-03-07", end: "2026-03-10" }],
			calendarMonthRange(day("2026-03-01")),
			interval,
		);
		expect(groups.map((group) => formatLocalDateKey(group.day))).toEqual([
			"2026-03-07",
			"2026-03-08",
			"2026-03-09",
		]);
	});
});

it("uses Sunday boundaries for weeks and exact local days for shorter views", () => {
	const date = new Date(2026, 8, 30);
	for (const [view, start, end] of [
		["week", "2026-09-27", "2026-10-04"],
		["day", "2026-09-30", "2026-10-01"],
		["threeDays", "2026-09-30", "2026-10-03"],
	] as const) {
		const range = calendarViewRange(date, view);
		expect([
			formatLocalDateKey(range.start),
			formatLocalDateKey(range.end),
		]).toEqual([start, end]);
	}
});
it("moves by the selected span and clamps short months", () => {
	const date = new Date(2026, 0, 31);
	expect(formatLocalDateKey(moveCalendarDate(date, "month", 1))).toBe(
		"2026-02-28",
	);
	expect(formatLocalDateKey(moveCalendarDate(date, "threeDays", 1))).toBe(
		"2026-02-03",
	);
	expect(formatLocalDateKey(moveCalendarDate(date, "week", -1))).toBe(
		"2026-01-24",
	);
});
