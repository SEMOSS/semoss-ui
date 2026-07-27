import dayjs from "dayjs";

/**
 * Parse a Semoss timestamp into a dayjs instance, normalizing to UTC.
 *
 * Platform timestamps frequently arrive without a timezone suffix
 * (e.g. `2026-06-22 17:48:07`), which dayjs would otherwise interpret as
 * local time. This appends `Z` (and converts the date/time separator)
 * only when no zone is already present, so values that already carry a
 * `Z` or numeric offset are left untouched.
 */
export const normalizeTimestamp = (raw: string): dayjs.Dayjs => {
	const normalized = /Z|[+-]\d{2}:?\d{2}$/.test(raw)
		? raw
		: `${raw.replace(" ", "T")}Z`;
	return dayjs(normalized);
};

/** Date buckets used to group chat lists, most to least recent. */
export type DateBucket =
	| "today"
	| "yesterday"
	| "fewDaysAgo"
	| "lastWeek"
	| "thisMonth"
	| "lastMonth"
	| "older";

/** Buckets in the order they should be rendered (most to least recent). */
export const DATE_BUCKET_ORDER: DateBucket[] = [
	"today",
	"yesterday",
	"fewDaysAgo",
	"lastWeek",
	"thisMonth",
	"lastMonth",
	"older",
];

/**
 * Assign a date to one of the {@link DATE_BUCKET_ORDER} buckets, relative to
 * now. Matches playground's own bucketing (`packages/playground/src/utility/date.ts`)
 * exactly, so a room's group placement is identical between apps.
 */
export const getDateBucket = (date: dayjs.Dayjs): DateBucket => {
	const now = dayjs();
	if (now.isSame(date, "day")) return "today";
	if (now.subtract(1, "day").isSame(date, "day")) return "yesterday";
	if (date.isAfter(now.subtract(3, "day"))) return "fewDaysAgo";
	if (date.isAfter(now.subtract(7, "day"))) return "lastWeek";
	if (now.isSame(date, "month")) return "thisMonth";
	if (now.subtract(1, "month").isSame(date, "month")) return "lastMonth";
	return "older";
};
