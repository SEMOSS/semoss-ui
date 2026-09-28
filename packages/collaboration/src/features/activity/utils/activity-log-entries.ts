import { parseTimestamp } from "@semoss/utility";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import type { ActivityLogEntry } from "../types/activity-log";
import { createActivityRows } from "./activity-rows";

const sessionStatuses = {
	"Your review": "needs-review",
	Stopped: "needs-attention",
	"In progress": "in-progress",
	Ready: "recorded",
} as const satisfies Record<Session["status"], ActivityLogEntry["status"]>;

/** Adapt known room data without inventing message IDs, senders or timestamps. */
export function activityEntriesFromSessions(
	agents: readonly Agent[],
	sessions: readonly Session[],
): ActivityLogEntry[] {
	return createActivityRows(agents, sessions).map(
		({ session, agentName }) => ({
			key: `room:${session.id}`,
			id: null,
			topic: session.title,
			preview: session.preview,
			source: session.origin === "You" ? "Room" : session.origin,
			sender: null,
			agent: session.agentId
				? { id: session.agentId, name: agentName }
				: null,
			receivedAt: null,
			updatedAt: session.updatedAt,
			threadId: null,
			processedAt: null,
			isHibernating: null,
			isDeleted: null,
			roomId: session.id,
			status: sessionStatuses[session.status],
		}),
	);
}

/** Unread alone does not establish an obligation to reply. */
export function activityNeedsUser(entry: ActivityLogEntry): boolean {
	return (
		!entry.isDeleted &&
		!entry.isHibernating &&
		(entry.status === "needs-response" ||
			entry.status === "needs-review" ||
			entry.status === "needs-attention")
	);
}

/** A human-readable state, including suppression and completed states. */
export function activityStatusLabel(entry: ActivityLogEntry): string {
	if (entry.isDeleted) return "Deleted";
	if (entry.isHibernating) return "Hibernating";
	const labels = {
		"needs-response": "Reply needed",
		"needs-review": "Review needed",
		"needs-attention": "Needs attention",
		"in-progress": "In progress",
		recorded: "Ready",
		completed: "Completed",
	} satisfies Record<ActivityLogEntry["status"], string>;
	return labels[entry.status];
}

/** Format an available timestamp without substituting a different lifecycle date. */
export function formatActivityDate(value: string | null): string {
	const timestamp = value ? parseTimestamp(value) : null;
	return timestamp === null
		? "Not provided"
		: new Intl.DateTimeFormat("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
				hour: "numeric",
				minute: "2-digit",
			}).format(timestamp);
}

/** Newest known activity first, with stable ordering for missing dates. */
export function compareActivityEntries(
	first: ActivityLogEntry,
	second: ActivityLogEntry,
): number {
	const firstTime = parseTimestamp(first.receivedAt ?? first.updatedAt ?? "");
	const secondTime = parseTimestamp(
		second.receivedAt ?? second.updatedAt ?? "",
	);
	if (firstTime === null && secondTime !== null) return 1;
	if (secondTime === null && firstTime !== null) return -1;
	return (
		(secondTime ?? 0) - (firstTime ?? 0) ||
		first.key.localeCompare(second.key)
	);
}
