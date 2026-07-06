import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

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

/**
 * Date buckets used to group chat lists. Values double as the `buckets.*`
 * i18n keys in the `sidebar` namespace, so callers can label a bucket with
 * `t(\`buckets.${bucket}\`)`.
 */
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
 * now. Shared by the sidebar and the chat-list pages so they group dates
 * identically.
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
