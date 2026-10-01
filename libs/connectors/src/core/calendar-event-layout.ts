import { addLocalDays } from "./connector.format";
import type { CalendarEventSchedule } from "./connector-calendar";

/** One event's position in a day's wall-clock time grid. */
export interface CalendarEventLayout<T> {
	event: T;
	startMinute: number;
	endMinute: number;
	column: number;
	columns: number;
}

/** Arrange overlaps side by side, including the minimum visible event height. */
export const layoutCalendarEvents = <T>(
	events: T[],
	day: Date,
	getSchedule: (event: T) => CalendarEventSchedule,
): CalendarEventLayout<T>[] => {
	const nextDay = addLocalDays(day, 1);
	const items = events
		.flatMap((event): CalendarEventLayout<T>[] => {
			const { start, end, isAllDay } = getSchedule(event);
			if (isAllDay || !start) return [];
			const finish =
				end && end > start
					? end
					: new Date(start.getTime() + 30 * 60000);
			if (start >= nextDay || finish <= day) return [];
			const from =
				start < day ? 0 : start.getHours() * 60 + start.getMinutes();
			const to =
				finish >= nextDay
					? 1440
					: finish.getHours() * 60 + finish.getMinutes();
			// Thirty minutes gives each event a 24px target at 48px per hour.
			const startMinute = Math.min(from, 1410);
			return [
				{
					event,
					startMinute,
					endMinute: Math.min(1440, Math.max(to, startMinute + 30)),
					column: 0,
					columns: 1,
				},
			];
		})
		.sort(
			(a, b) =>
				a.startMinute - b.startMinute || b.endMinute - a.endMinute,
		);
	let cluster: CalendarEventLayout<T>[] = [];
	let ends: number[] = [];
	let clusterEnd = -1;
	const finishCluster = () => {
		for (const item of cluster) item.columns = ends.length;
	};
	for (const item of items) {
		if (item.startMinute >= clusterEnd) {
			finishCluster();
			cluster = [];
			ends = [];
		}
		let column = ends.findIndex((end) => end <= item.startMinute);
		if (column === -1) column = ends.length;
		ends[column] = item.endMinute;
		item.column = column;
		cluster.push(item);
		clusterEnd = Math.max(...ends);
	}
	finishCluster();
	return items;
};
