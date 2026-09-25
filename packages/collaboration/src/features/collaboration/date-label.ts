/** Formats real wire dates without treating invalid provider dates as the present. */
export function dateLabel(
	value: string | null | undefined,
	timeZone?: string,
): string {
	if (!value) return "Date unavailable";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: new Intl.DateTimeFormat(undefined, {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				...(timeZone
					? { timeZone, timeZoneName: "short" as const }
					: {}),
			}).format(date);
}
