import type { TimePeriod } from "./types";

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
	DAY: "Per Day",
	WEEK: "Per Week",
	MONTH: "Per Month",
	YEAR: "Per Year",
	ALL_TIME: "All Time",
};

export const TIME_PERIODS: TimePeriod[] = [
	"DAY",
	"WEEK",
	"MONTH",
	"YEAR",
	"ALL_TIME",
];
