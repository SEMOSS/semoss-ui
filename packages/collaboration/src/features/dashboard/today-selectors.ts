import { dueDay } from "@/features/collaboration/live/live-state";
import { selectWorkItems } from "@/features/collaboration/state/collaboration.selectors";
import type {
	CollaborationState,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import { dashboardTimeZone } from "./dashboard-calendar";
import { dayKey, prioritizeItems } from "./dashboard-selectors";

const TODAY_LIMIT = 5;

interface TodaySelection {
	/** The short list shown on Today. */
	items: WorkItem[];
	/** Items due today or overdue. */
	due: number;
	/** Everything that needs the owner, shown behind See everything. */
	total: number;
}

/** Stopgap until the backend ranks today's tasks: due today or overdue first, then priority. */
export function selectToday(
	state: CollaborationState,
	now = new Date(),
): TodaySelection {
	const zone = dashboardTimeZone(state.profile.timezone);
	const today = dayKey(now, zone);
	const all = selectWorkItems(state, { view: "needs_me" }).items;
	const dueAt = (item: WorkItem): number | null => {
		const day = dueDay(item.due);
		if (!day) return null;
		const due = new Date(day);
		if (!Number.isFinite(due.getTime())) return null;
		// a plain due day is already a day key; en-CA day keys sort as dates
		const key = /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : dayKey(due, zone);
		return key <= today ? due.getTime() : null;
	};
	const due = all
		.filter((item) => dueAt(item) !== null)
		.sort((left, right) => (dueAt(left) ?? 0) - (dueAt(right) ?? 0));
	const rest = prioritizeItems(all.filter((item) => dueAt(item) === null));
	return {
		items: [...due, ...rest].slice(0, TODAY_LIMIT),
		due: due.length,
		total: all.length,
	};
}
