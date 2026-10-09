/** Calendar dates are grouped in the user's zone, not by slicing UTC timestamps. */
export function dayKey(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}
