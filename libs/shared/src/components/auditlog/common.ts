//Common place to keep and make changes for audit logs related common functions for enhancing reusablity
//event data object will have all the details about when the user clicks on table row
export interface EventData {
	requestId?: string;
	startTime: string;
	endTime: string;
	logTimestamp: string;
	request: string;
	response: string;
	tokens: string | null;
	latency: number;
	status: string | null;
	engineName: string;
	engineType: string;
	methodName?: string;
	userName?: string;
	userId: string;
	sessionId: string;
	spanId: string;
	guardrailAction?: string | null;
	cacheReadTokens?: number;
	cacheCreationTokens?: number;
	promptTokens?: number;
	responseTokens?: number;
}
/**
 * Format an audit-log timestamp into separate date and time strings for display.
 *
 * Audit-log timestamps are ISO-8601 UTC strings (e.g. "2026-06-22T17:48:07.123Z").
 * `new Date(...)` parses the trailing `Z` as a UTC instant, and the toLocale*
 * formatters render it in the viewer's local timezone (client-side display).
 *
 * @param {string|number|null|undefined} timeStamp - ISO-8601 UTC string (or epoch ms).
 * @returns {{date: string, time: string}} - Localized date ("MM/DD/YYYY") and time
 *   ("hh:mm:ss AM/PM"); both empty when the timestamp is missing or invalid.
 */
export const TimeDateFormatter = (
	timeStamp: string | number | null | undefined,
) => {
	if (!timeStamp) {
		return { date: "", time: "" };
	}

	const parsed = new Date(timeStamp);
	if (Number.isNaN(parsed.getTime())) {
		return { date: "", time: "" };
	}

	//Format date and time independently so we don't depend on the locale's
	//combined-format separator (the previous split on ", " was brittle).
	const date = parsed.toLocaleDateString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const time = parsed.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	});
	return { date, time };
};

/**
 * A function to format a date string into a standardised date string format of 'yyyy-mm-dd'
 * @param {string|undefined} dateString - The date string to be formatted.
 * @returns {string} - The formatted date string.
 * @returns {string} - An empty string when the date string is not valid.
 */
export const dateFormat = (dateString: string | undefined) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

//Engine types object for audit logs
export const ENGINE_TYPES = [
	"APP",
	"MODEL",
	"DATABASE",
	"VECTOR",
	"FUNCTION",
	"STORAGE",
];
