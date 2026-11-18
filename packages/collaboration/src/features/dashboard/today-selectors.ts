import { dueDay } from "@/features/collaboration/live/live-state";
import { dashboardTimeZone } from "./dashboard-calendar";
import { dayKey } from "./dashboard-selectors";

/**
 * How many of the given work items are due today or overdue. Today's headline and the sidebar badge count the
 * same list the Work card shows, so the numbers agree with the rows below them.
 */
export function countDueToday(
	items: { due?: string }[],
	timeZone: string,
	now = new Date(),
): number {
	const zone = dashboardTimeZone(timeZone);
	const today = dayKey(now, zone);
	return items.filter((item) => {
		const day = dueDay(item.due);
		if (!day) return false;
		const due = new Date(day);
		if (!Number.isFinite(due.getTime())) return false;
		// a plain due day is already a day key; en-CA day keys sort as dates
		const key = /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : dayKey(due, zone);
		return key <= today;
	}).length;
}
