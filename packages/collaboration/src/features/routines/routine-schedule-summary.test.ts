import { describe, expect, it } from "vitest";
import {
	describeDays,
	describeSchedule,
	formatRunTime,
	timezonePlace,
} from "./routine-schedule-summary";

describe("routine schedule summary", () => {
	it.each([
		[["MON", "TUE", "WED", "THU", "FRI"], "Weekdays"],
		[["SUN", "SAT"], "Weekends"],
		[["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], "Every day"],
		[["FRI"], "Fridays"],
		// week order, whatever order they were picked in
		[["FRI", "MON", "WED"], "Mon, Wed, and Fri"],
		[["MON", "TUE", "WED", "THU", "SAT"], "Mon, Tue, Wed, Thu, and Sat"],
		[[], "No days chosen"],
	] as const)("says %j as %s", (days, expected) => {
		expect(describeDays(days)).toBe(expected);
	});

	it("writes the run time in the owner's locale and the zone as its place", () => {
		expect(formatRunTime("08:00")).toMatch(/^8:00\sAM$/);
		expect(formatRunTime("16:30")).toMatch(/^4:30\sPM$/);
		expect(formatRunTime("not a time")).toBe("not a time");
		expect(timezonePlace("America/New_York")).toBe("New York");
		expect(timezonePlace("America/Argentina/Buenos_Aires")).toBe(
			"Buenos Aires",
		);
		expect(timezonePlace("UTC")).toBe("UTC");
		expect(
			describeSchedule({
				days: ["MON"],
				time: "07:30",
				timezone: "Europe/London",
			}),
		).toMatch(/^Mondays at 7:30\sAM, London time$/);
	});
});
