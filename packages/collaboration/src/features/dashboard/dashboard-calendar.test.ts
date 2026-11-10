import { dashboardTimeZone } from "./dashboard-calendar";

it("recovers invalid zones", () => {
	expect(
		() =>
			new Intl.DateTimeFormat("en", {
				timeZone: dashboardTimeZone("bad-zone"),
			}),
	).not.toThrow();
});
