import { act, render, screen } from "@testing-library/react";
import { TimeOfDayGreeting } from "./time-of-day-greeting";

describe("TimeOfDayGreeting", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it.each([
		["00:00", "Good evening"],
		["04:59", "Good evening"],
		["05:00", "Good morning"],
		["11:59", "Good morning"],
		["12:00", "Good afternoon"],
		["16:59", "Good afternoon"],
		["17:00", "Good evening"],
		["23:59", "Good evening"],
	])("greets the user at %s with %s", (time, greeting) => {
		// No offset in the timestamp, so it is parsed as local time.
		vi.setSystemTime(new Date(`2026-09-24T${time}:00`));

		render(<TimeOfDayGreeting />);

		expect(screen.getByText(greeting)).toBeVisible();
	});

	it("updates the greeting when the clock crosses into the next period", () => {
		vi.setSystemTime(new Date("2026-09-24T11:59:30"));
		render(<TimeOfDayGreeting />);
		expect(screen.getByText("Good morning")).toBeVisible();

		act(() => {
			vi.advanceTimersByTime(60_000);
		});

		expect(screen.getByText("Good afternoon")).toBeVisible();
		expect(screen.queryByText("Good morning")).not.toBeInTheDocument();
	});
});
