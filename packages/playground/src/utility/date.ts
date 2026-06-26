import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

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
 * Human day-bucket label for a start-of-day timestamp: "Today",
 * "Yesterday", "N days ago", or an absolute date once older than a month.
 *
 * Expects a `t` whose default namespace is `workspace` (uses the unprefixed
 * `chat.*` keys).
 */
export const getDayLabel = (
	startOfDay: dayjs.Dayjs,
	t: TranslateFn,
): string => {
	const today = dayjs().startOf("day");
	const days = today.diff(startOfDay, "day");
	if (days <= 0) return t("chat.dayToday", { defaultValue: "Today" });
	if (days === 1)
		return t("chat.dayYesterday", { defaultValue: "Yesterday" });
	if (days < 30)
		return t("chat.daysAgo", {
			count: days,
			defaultValue: "{{count}} days ago",
		});
	return startOfDay.format("MMM D, YYYY");
};
