import {
	addLocalDays,
	formatLocalDateKey,
	startOfLocalDay,
} from "@semoss/utility/date";

/** One calendar day and the events shown under it. */
export interface ConnectorCalendarDay<T> {
	day: Date;
	events: T[];
}

/** Six complete Sunday-first weeks, including the visible adjacent-month days. */
export const calendarMonthRange = (month: Date): { start: Date; end: Date } => {
	const first = new Date(month.getFullYear(), month.getMonth(), 1);
	const start = addLocalDays(first, -first.getDay());
	return { start, end: addLocalDays(start, 42) };
};

/** Place an event on every day it overlaps, with an exclusive end date. */
export const groupCalendarEvents = <T>(
	events: T[],
	range: { start: Date; end: Date },
	getInterval: (event: T) => { start: Date | null; end: Date | null },
): ConnectorCalendarDay<T>[] => {
	const days = new Map<string, ConnectorCalendarDay<T>>();
	for (const event of events) {
		const { start, end } = getInterval(event);
		// Undated entries remain reachable in the first day's agenda.
		const first = start ?? range.start;
		const last = end && end > first ? end : new Date(first.getTime() + 1);
		let day = startOfLocalDay(first < range.start ? range.start : first);
		while (day < range.end && day < last) {
			const key = formatLocalDateKey(day);
			const group = days.get(key) ?? { day, events: [] };
			group.events.push(event);
			days.set(key, group);
			day = addLocalDays(day, 1);
		}
	}
	return [...days.values()].sort((a, b) => a.day.getTime() - b.day.getTime());
};

/** The calendar's visible date span. */
export type CalendarView = "week" | "day" | "threeDays" | "month";

/** Compute local-day boundaries, including daylight-saving transitions. */
export const calendarViewRange = (
	day: Date,
	view: CalendarView,
): { start: Date; end: Date } => {
	if (view === "month") return calendarMonthRange(day);
	const start =
		view === "week"
			? addLocalDays(startOfLocalDay(day), -day.getDay())
			: startOfLocalDay(day);
	return {
		start,
		end: addLocalDays(
			start,
			view === "week" ? 7 : view === "threeDays" ? 3 : 1,
		),
	};
};

/** Move by a complete view, clamping dates when the next month is shorter. */
export const moveCalendarDate = (
	day: Date,
	view: CalendarView,
	direction: number,
): Date => {
	if (view !== "month")
		return addLocalDays(
			day,
			direction * (view === "week" ? 7 : view === "threeDays" ? 3 : 1),
		);
	const first = new Date(day.getFullYear(), day.getMonth() + direction, 1);
	const last = new Date(
		first.getFullYear(),
		first.getMonth() + 1,
		0,
	).getDate();
	return new Date(
		first.getFullYear(),
		first.getMonth(),
		Math.min(day.getDate(), last),
	);
};

/** Times supplied by the provider; absent times must not be fabricated. */
export interface CalendarEventSchedule {
	start: Date | null;
	end: Date | null;
	isAllDay: boolean;
}
