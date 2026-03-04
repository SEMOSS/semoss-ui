//Common place to keep and make changes for audit logs related common functions for enhancing reusablity
//event data object will have all the details about when the user clicks on table row
export interface EventData {
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
	userId: string;
	sessionId: string;
	spanId: string;
}
/**
 * A function to format a timestamp into a date and time string.
 * @param {string|number|null|undefined} timeStamp - The timestamp to be formatted.
 * @returns {{date: string, time: string}} - An object containing the date and time strings.
 * @return  {{date : "", time: ""}} when the date is not valid
 */
export const TimeDateFormatter = (
	timeStamp: string | number | null | undefined,
) => {
	if (!timeStamp) {
		return { date: "", time: "" };
	}

	try {
		const tempDate = new Date(timeStamp);

		// Check if date is invalid
		if (Number.isNaN(tempDate.getTime())) {
			return { date: "", time: "" };
		}

		const formattedDate = tempDate.toLocaleTimeString("en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});

		try {
			const [datePart, timePart] = formattedDate.split(", ");
			const date = datePart || "";
			const time = timePart ? timePart.split(" ")[0] : "";
			return { date, time };
		} catch (_formatError) {
			// Handle string parsing errors
			return { date: "", time: "" };
		}
	} catch (_dateError) {
		// Handle date creation errors
		return { date: "", time: "" };
	}
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
