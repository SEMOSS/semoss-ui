import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(utc);
/**
 * Format a UTC date string to local timezone
 */
export const formatDateToLocal = (
	dateStr: string | undefined,
	format: string = "MMM D, YYYY [at] h:mm A",
): string | null => {
	if (!dateStr || !dayjs(dateStr).isValid()) {
		return null;
	}
	return dayjs.utc(dateStr).local().format(format);
};

/**
 * Format a UTC date string to relative time (e.g., "2 hours ago")
 */
export const formatDateToRelative = (
	dateStr: string | undefined,
): string | null => {
	if (!dateStr || !dayjs(dateStr).isValid()) {
		return null;
	}
	return dayjs.utc(dateStr).local().fromNow();
};
