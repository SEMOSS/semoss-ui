import type { WorkItem } from "@/features/collaboration/state/collaboration.types";

/** Calendar dates are grouped in the user's zone, not by slicing UTC timestamps. */
export function dayKey(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

/** Keep actual priority ahead of classifier confidence and recency. */
export function prioritizeItems(items: WorkItem[], latest = false): WorkItem[] {
	return [...items].sort((left, right) =>
		latest
			? right.received.localeCompare(left.received)
			: (left.priority ?? "P4").localeCompare(right.priority ?? "P4") ||
				(right.score ?? -1) - (left.score ?? -1) ||
				right.received.localeCompare(left.received),
	);
}
