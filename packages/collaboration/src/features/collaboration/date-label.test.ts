import { dateLabel } from "./date-label";

it("keeps a due day on its calendar date in either direction from UTC", () => {
	for (const zone of ["America/Los_Angeles", "Asia/Tokyo"]) {
		expect(dateLabel("2026-11-06", zone, "date")).toBe("Nov 6");
		expect(dateLabel("2026-11-06", zone)).toBe("Nov 6");
	}
});

it("retains timezone conversion for instants and missing-date behavior", () => {
	expect(
		dateLabel("2026-11-06T01:00:00Z", "America/Los_Angeles", "date"),
	).toContain("Nov 5");
	expect(dateLabel(null)).toBe("Date unavailable");
	expect(dateLabel("unavailable date")).toBe("unavailable date");
});
