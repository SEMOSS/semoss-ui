import { agendaDays, dashboardTimeZone } from "./dashboard-calendar";
import { dayKey } from "./dashboard-selectors";

it.each(["2026-03-08T04:30:00Z", "2026-11-01T04:30:00Z"])(
	"keeps seven distinct civil dates across DST at %s",
	(value) => {
		const now = new Date(value);
		const dates = agendaDays(now, "America/New_York").map((date) =>
			dayKey(date, "UTC"),
		);
		expect(dates[0]).toBe(dayKey(now, "America/New_York"));
		expect(new Set(dates).size).toBe(7);
		for (let index = 1; index < dates.length; index++)
			expect(
				Date.parse(dates[index]) - Date.parse(dates[index - 1]),
			).toBe(86_400_000);
	},
);

it("uses the account's local date when UTC is already tomorrow and recovers invalid zones", () => {
	expect(
		dayKey(
			agendaDays(new Date("2026-10-07T02:00:00Z"), "America/New_York")[0],
			"UTC",
		),
	).toBe("2026-10-06");
	expect(
		() =>
			new Intl.DateTimeFormat("en", {
				timeZone: dashboardTimeZone("bad-zone"),
			}),
	).not.toThrow();
});
