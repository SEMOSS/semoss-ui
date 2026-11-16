import { expect, it } from "vitest";
import { countDueToday } from "./today-selectors";

const NOW = new Date("2026-11-05T15:00:00Z");

it("counts items due today or overdue, not the whole list", () => {
	const items = [
		{ due: "2026-11-04T00:00:00Z" },
		{ due: "2026-11-05T00:00:00Z" },
		{ due: "2026-11-06T00:00:00Z" },
		{ due: undefined },
		{},
	];
	expect(countDueToday(items, "America/New_York", NOW)).toBe(2);
});

it("reads today in the owner's time zone", () => {
	// 11 PM on the 5th in New York is already the 6th in UTC
	const late = new Date("2026-11-06T04:00:00Z");
	const items = [{ due: "2026-11-06T00:00:00Z" }];
	expect(countDueToday(items, "America/New_York", late)).toBe(0);
	expect(countDueToday(items, "UTC", late)).toBe(1);
});

it("counts a due day saved as midnight UTC on that day, not the evening before", () => {
	// 3 PM in New York, where Nov 6's due read as an instant would be 7 PM today
	const items = [
		{ due: "2026-11-06T00:00:00Z" },
		{ due: "2026-11-05T00:00:00Z" },
	];
	expect(countDueToday(items, "America/New_York", NOW)).toBe(1);
});
