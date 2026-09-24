import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(utc);

/** Format a UTC date string in the browser's local timezone. */
export const formatDateToLocal = (
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

/** Normalize a SEMOSS timestamp without an explicit timezone to UTC. */
export const normalizeTimestamp = (raw: string): dayjs.Dayjs => {
	const normalized = /Z|[+-]\d{2}:?\d{2}$/.test(raw)
		? raw
		: `${raw.replace(" ", "T")}Z`;

	return dayjs(normalized);
};

/** Format a date/time value using the caller's format string. */
export const formatDateTime = (
	dateString: string | undefined,
	format = "MMM D, YYYY [at] h:mm A",
): string | null => formatDateToLocal(dateString, format);

/** Format a duration in milliseconds as a compact human-readable value. */
export const parseDuration = (milliseconds: number): string => {
	if (!Number.isFinite(milliseconds) || milliseconds < 0) return "0ms";
	if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
	const seconds = milliseconds / 1000;
	if (seconds < 60) return `${seconds.toFixed(1)}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.round(seconds % 60);
	return `${minutes}m ${remainingSeconds}s`;
};
