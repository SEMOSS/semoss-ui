import { expect, it } from "vitest";
import { layoutCalendarEvents } from "./calendar-event-layout";

const day = new Date(2026, 8, 30);
const event = (id: string, hour: number, end: number) => ({
	id,
	start: new Date(2026, 8, 30, hour),
	end: new Date(2026, 8, 30, end),
	isAllDay: false,
});
it("separates overlaps and reuses the full width after a cluster ends", () => {
	const events = [event("a", 9, 11), event("b", 10, 12), event("c", 12, 13)];
	expect(
		layoutCalendarEvents(events, day, (item) => item).map(
			({ event, column, columns }) => [event.id, column, columns],
		),
	).toEqual([
		["a", 0, 2],
		["b", 1, 2],
		["c", 0, 1],
	]);
});
it("clips overnight events and leaves all-day or untimed events out of the time grid", () => {
	const overnight = {
		...event("overnight", 23, 24),
		start: new Date(2026, 8, 29, 23),
		end: new Date(2026, 8, 30, 1),
	};
	const result = layoutCalendarEvents(
		[
			overnight,
			{ ...event("all", 0, 24), isAllDay: true },
			{ ...event("unknown", 0, 1), start: null },
		],
		day,
		(item) => item,
	);
	expect(result).toHaveLength(1);
	expect([result[0].startMinute, result[0].endMinute]).toEqual([0, 60]);
});
it("keeps short events at least 24px tall within the day and avoids visual overlaps", () => {
	const late = {
		...event("late", 23, 24),
		start: new Date(2026, 8, 30, 23, 55),
	};
	const [result] = layoutCalendarEvents([late], day, (item) => item);
	expect([result.startMinute, result.endMinute]).toEqual([1410, 1440]);
});
