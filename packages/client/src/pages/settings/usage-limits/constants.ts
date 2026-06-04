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
	"HOUR",
	"DAY",
	"WEEK",
	"YEAR",
	"ALL_TIME",
];

let _idCounter = 0;
export const genId = () => `limit-${++_idCounter}-${Date.now()}`;
