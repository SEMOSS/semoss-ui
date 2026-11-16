import { ROUTINE_DAY_NAMES, ROUTINE_DAYS } from "./routine-schema";

type RoutineDay = (typeof ROUTINE_DAYS)[number];

const WEEKDAYS: readonly RoutineDay[] = ["MON", "TUE", "WED", "THU", "FRI"];
const WEEKEND: readonly RoutineDay[] = ["SAT", "SUN"];

function isExactly(
	days: readonly RoutineDay[],
	expected: readonly RoutineDay[],
): boolean {
	return (
		new Set(days).size === expected.length &&
		expected.every((day) => days.includes(day))
	);
}

/** The days a routine runs as a person would say them: "Weekdays", "Every day", "Mondays", or "Mon, Wed, and Fri". */
export function describeDays(days: readonly RoutineDay[]): string {
	const ordered = ROUTINE_DAYS.filter((day) => days.includes(day));
	const [onlyDay] = ordered;
	if (!onlyDay) return "No days chosen";
	if (ordered.length === ROUTINE_DAYS.length) return "Every day";
	if (isExactly(ordered, WEEKDAYS)) return "Weekdays";
	if (isExactly(ordered, WEEKEND)) return "Weekends";
	if (ordered.length === 1) return `${ROUTINE_DAY_NAMES[onlyDay]}s`;
	return new Intl.ListFormat("en", { type: "conjunction" }).format(
		ordered.map((day) => ROUTINE_DAY_NAMES[day].slice(0, 3)),
	);
}

/** A routine's HH:mm run time as the owner's locale writes it, such as "8:00 AM". */
export function formatRunTime(time: string): string {
	const [hours, minutes] = time.split(":").map(Number);
	if (
		hours === undefined ||
		minutes === undefined ||
		Number.isNaN(hours) ||
		Number.isNaN(minutes)
	) {
		return time;
	}
	return new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(2000, 0, 1, hours, minutes));
}

/** The place an IANA time zone is named for, such as "New York" for America/New_York. */
export function timezonePlace(timezone: string): string {
	return (timezone.split("/").pop() || timezone).replaceAll("_", " ");
}

/** When a routine runs, such as "Weekdays at 8:00 AM, New York time". */
export function describeSchedule(schedule: {
	days: readonly RoutineDay[];
	time: string;
	timezone: string;
}): string {
	return `${describeDays(schedule.days)} at ${formatRunTime(schedule.time)}, ${timezonePlace(schedule.timezone)} time`;
}
