/** Formats real wire dates without treating invalid provider dates as the present. */
export function dateLabel(
	value: string | null | undefined,
	timeZone?: string,
	format: "date" | "date-time" = "date-time",
): string {
	if (!value) return "Date unavailable";
	// A due day is a calendar date, not an instant at UTC midnight.
	const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: new Intl.DateTimeFormat(undefined, {
				month: "short",
				day: "numeric",
				...(format === "date-time" && !isDateOnly
					? { hour: "numeric" as const, minute: "2-digit" as const }
					: {}),
				...(isDateOnly
					? { timeZone: "UTC" }
					: timeZone
						? { timeZone, timeZoneName: "short" as const }
						: {}),
			}).format(date);
}
