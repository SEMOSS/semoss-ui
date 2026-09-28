import type { ActivityRow } from "../types/activity";

export function formatUpdatedAt(row: ActivityRow) {
	if (row.updatedTime === null) return "Date unavailable";
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(row.updatedTime);
}
