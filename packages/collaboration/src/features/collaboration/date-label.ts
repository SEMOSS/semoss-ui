/** Formats real wire dates without treating invalid provider dates as the present. */
export function dateLabel(
	value: string | null | undefined,
	timeZone?: string,
	format: "date" | "date-time" = "date-time",
): string {
	if (!value) return "Date unavailable";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: new Intl.DateTimeFormat(undefined, {
				month: "short",
				day: "numeric",
				...(format === "date-time"
					? { hour: "numeric" as const, minute: "2-digit" as const }
					: {}),
				...(timeZone
					? { timeZone, timeZoneName: "short" as const }
					: {}),
			}).format(date);
}
