import type { TimePeriod } from "./types";

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
	HOUR: "Per Hour",
	DAY: "Per Day",
	WEEK: "Per Week",
	MONTH: "Per Month",
	YEAR: "Per Year",
	ALL_TIME: "All Time",
};

export const UI_TIME_PERIODS: TimePeriod[] = [
	"DAY",
	"WEEK",
	"MONTH",
	"YEAR",
	"ALL_TIME",
];
