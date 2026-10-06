import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(utc);

/** Format a UTC date string in the browser's local timezone. */
export const formatLocalDateTime = (
	dateString: string | undefined,
	format = "MMM D, YYYY [at] h:mm A",
): string | null => {
	if (!dateString || !dayjs(dateString).isValid()) {
		return null;
	}

	return dayjs.utc(dateString).local().format(format);
};

/** Format a UTC date string as relative time, such as "2 hours ago". */
export const formatDateToRelative = (
	dateString: string | undefined,
): string | null => {
	if (!dateString || !dayjs(dateString).isValid()) {
		return null;
	}

	return dayjs.utc(dateString).local().fromNow();
};

/** Parse a timestamp, treating a missing timezone as UTC. */
export const parseTimestampWithUtcDefault = (raw: string): dayjs.Dayjs => {
	const normalized = /Z|[+-]\d{2}:?\d{2}$/.test(raw)
		? raw
		: `${raw.replace(" ", "T")}Z`;

	return dayjs(normalized);
};

/** Relative date groups; consumers supply their own display labels. */
export type DateBucket =
	| "today"
	| "yesterday"
	| "fewDaysAgo"
	| "lastWeek"
	| "thisMonth"
	| "lastMonth"
	| "older";

/** Relative date groups in display order, from most to least recent. */
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
 * Group a date relative to now. Today and yesterday use local calendar days;
 * the three- and seven-day cutoffs retain the current time of day. Recent-day
 * groups take precedence over months, and invalid dates fall through to older.
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

/** Format a duration in milliseconds as a compact human-readable value. */
export const formatRoundedDurationMs = (milliseconds: number): string => {
	if (!Number.isFinite(milliseconds) || milliseconds < 0) return "0ms";
	if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
	const seconds = milliseconds / 1000;
	if (seconds < 60) return `${seconds.toFixed(1)}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.round(seconds % 60);
	return `${minutes}m ${remainingSeconds}s`;
};

/** Parse a timestamp into epoch milliseconds, returning null when invalid. */
export const parseTimestamp = (value?: string): number | null => {
	if (!value) return null;
	const timestamp = Date.parse(value);
	return Number.isNaN(timestamp) ? null : timestamp;
};

function parseAsUTC(input: string): Date | null {
	const m = input.match(
		/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
	);
	if (!m) {
		const d = new Date(input);
		return Number.isNaN(d.getTime()) ? null : d; // fallback
	}
	const [, y, mo, d, h, mi, s] = m;
	const ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s ?? "0"));
	return new Date(ms);
}

/** Format a UTC timestamp with the existing English Today/Yesterday labels. */
export function formatDateTimeWithRelativeDay(createdAt: string): string {
	const dateUTC = parseAsUTC(createdAt);
	if (!dateUTC) return "";

	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

	const dayKey = (d: Date) =>
		new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(d);

	const now = new Date();
	const todayKey = dayKey(now);
	const yesterdayKey = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
	const itemKey = dayKey(dateUTC);

	const timeStr = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(dateUTC);

	if (itemKey === todayKey) return `Today, ${timeStr}`;
	if (itemKey === yesterdayKey) return `Yesterday, ${timeStr}`;

	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(dateUTC);
}

/** Format elapsed milliseconds with optional precision and a missing-value dash. */
export function formatDurationMs(
	ms?: number | null,
	fractionDigits = 1,
): string {
	if (ms == null) return "—";
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(fractionDigits)}s`;
	return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Whether two dates fall on the same local day.
 *
 * @param a - A date.
 * @param b - Another date.
 * @return True when the year, month, and day match.
 */
export const isSameLocalDay = (a: Date, b: Date): boolean =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();

/**
 * Local midnight of a date's day.
 *
 * @param date - Any time on the day.
 * @return A new date at the start of that day.
 */
export const startOfLocalDay = (date: Date): Date =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * A date some whole days away, keeping local midnight across clock changes.
 *
 * @param date - The starting day.
 * @param days - How many days to move; negative moves back.
 * @return A new date.
 */
export const addLocalDays = (date: Date, days: number): Date =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/**
 * A local wall clock time as `YYYY-MM-DDTHH:mm:ss`, the form the Google
 * Calendar reactors read in the user's zone.
 *
 * @param date - The time.
 * @return The formatted time, without a zone.
 */
export const formatLocalWallClock = (date: Date): string => {
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${formatLocalDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/**
 * Read a wall clock time without a zone, `YYYY-MM-DDTHH:mm[:ss]`, or a day,
 * `YYYY-MM-DD`, as local time.
 *
 * @param value - The time or day.
 * @return The local time, or null when the value is neither.
 */
export const parseLocalWallClock = (value: string | undefined): Date | null => {
	const match = value
		? /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(
				value,
			)
		: null;
	if (!match) {
		return null;
	}
	return new Date(
		Number(match[1]),
		Number(match[2]) - 1,
		Number(match[3]),
		Number(match[4] ?? 0),
		Number(match[5] ?? 0),
		Number(match[6] ?? 0),
	);
};

/** A stable local date key; UTC conversion would move all-day events. */
export const formatLocalDateKey = (date: Date): string =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
