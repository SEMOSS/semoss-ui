import { dashboardTimeZone, eventStart } from "./dashboard-calendar";
import { dayKey } from "./dashboard-selectors";

it("groups meetings by local day around midnight and daylight saving boundaries", () => {
	expect(dayKey(new Date("2026-10-07T02:30:00Z"), "America/New_York")).toBe(
		"2026-10-06",
	);
	expect(dayKey(new Date("2026-11-01T05:30:00Z"), "America/New_York")).toBe(
		"2026-11-01",
	);
	expect(
		eventStart({
			id: "one",
			start: "2026-10-07T02:30:00Z",
			attendees: [],
		})?.toISOString(),
	).toBe("2026-10-07T02:30:00.000Z");
	expect(eventStart({ id: "bad", start: "bad", attendees: [] })).toBeNull();
	expect(() => dashboardTimeZone("invalid-zone")).not.toThrow();
});
