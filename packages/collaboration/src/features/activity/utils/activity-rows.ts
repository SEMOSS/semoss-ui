import { parseTimestamp } from "@semoss/utility";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import type { ActivityRow } from "../types/activity";

export function createActivityRows(
	agents: readonly Agent[],
	sessions: readonly Session[],
): ActivityRow[] {
	const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
	return sessions.map((session) => {
		const agent = agentsById.get(session.agentId);
		return {
			agent,
			agentName: agent?.name ?? "Unknown agent",
			session,
			updatedTime: parseTimestamp(session.updatedAt),
		};
	});
}

export function compareUpdated(
	first: ActivityRow,
	second: ActivityRow,
	direction = -1,
) {
	if (first.updatedTime === null) return second.updatedTime === null ? 0 : 1;
	if (second.updatedTime === null) return -1;
	return (first.updatedTime - second.updatedTime) * direction;
}

export function compareId(first: ActivityRow, second: ActivityRow) {
	return first.session.id.localeCompare(second.session.id, "en");
}
