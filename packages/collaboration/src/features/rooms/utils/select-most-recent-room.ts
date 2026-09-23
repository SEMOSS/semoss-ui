import { parseTimestamp } from "@semoss/utility";
import type { Session } from "@/types/session";

export function selectMostRecentRoom(sessions: Session[], agentId: string) {
	return sessions
		.filter((session) => session.agentId === agentId)
		.reduce<Session | undefined>((latest, session) => {
			if (!latest) return session;
			return (parseTimestamp(session.updatedAt) ?? 0) >
				(parseTimestamp(latest.updatedAt) ?? 0)
				? session
				: latest;
		}, undefined);
}
